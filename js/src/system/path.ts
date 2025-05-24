/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import * as fs from 'fs';
import * as fs_extra from 'fs-extra';
import * as os from 'os';
import * as pathlib from 'path';
import * as diskusage from 'diskusage';
import * as readline from 'readline';
import { Minimatch } from 'minimatch';
import JSON5 from 'json5';
import { JSONC } from '../jsonc/jsonc.js';

import { Utils } from "../utils.js"

/** 
 * The path class.
 * @libris
 */
export class Path {

    // Attributes.
    data: string; // keep public.
    private _stat?: fs.Stats;
    private _name?: string;
    private _extension?: string;
    private _base?: Path;
    private _abs?: Path;

    constructor(path: string | Path, clean: boolean = true) {
        if (path == null) {
            throw Error(`Invalid path "${path}".`);
        }
        else if (path instanceof Path) {
            this.data = path.data;
        } else {
            path = path.toString();
            if (clean && path.length > 0) {
                this.data = "";
                const max_i = path.length - 1;
                for (let i = 0; i < path.length; i++) {
                    const c = path.charAt(i);
                    if (c === "/" && (this.data.charAt(this.data.length - 1) === "/" || i == max_i)) {
                        continue;
                    }
                    else if (c === "." && path.charAt(i - 1) === "/" && path.charAt(i + 1) === "/") {
                        continue;
                    } else {
                        this.data += c;
                    }
                }
            } else {
                this.data = path;
            }
        }
    }

    // ---------------------------------------------------------
    // Utils.

    trim(): void {
        let start = 0, end = this.data.length;
        for (let i = 0; i < this.data.length; i++) {
            const c = this.data.charAt(i);
            if (c == " " || c == "\t") {
                ++start;
            } else {
                break;
            }
        }
        for (let i = end - 1; i >= 0; i--) {
            const c = this.data.charAt(i);
            if (c == " " || c == "\t") {
                --end;
            } else {
                break;
            }
        }
        if (start != 0 || end != this.data.length) {
            this.data = this.data.substring(start, end - start);
        }
        if (this.data.length === 0) {
            throw Error(`Invalid path "${this.data}".`);
        }
    }

    /** To string. */
    toString(): string {
        return this.data;
    }
    str(): string {
        return this.data;
    }

    /** Cast to primitives. */
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number {
        if (hint === 'number') {
            return this.data.length;
        }
        // 'string' or 'default'
        return this.data;
    }

    // ---------------------------------------------------------
    // Static functions.

    /** @docs
     *  @title home
     *  @desc Get the user's home directory path
     *  @static true
     *  @returns
     *      @type Path
     *      @desc A new Path instance pointing to the user's home directory
     */
    static home(): Path {
        return new Path(os.homedir());
    }

    // ---------------------------------------------------------
    // Properties.

    /** @docs
     *  @title length
     *  @desc Get the length of the current path string
     *  @property true
     *  @returns
     *      @type number
     *      @desc The number of characters in the path string
     *  @funcs 2
     */
    get length(): number {
        return this.data.length;
    }
    get len(): number {
        return this.data.length;
    }

    /** @docs
     *  @title stat
     *  @desc Get the file system stats for the current path
     *  @property true
     *  @returns
     *      @type fs.Stats
     *      @desc The file system stats object with modified time properties
     */
    get stat(): fs.Stats {
        if (this._stat !== undefined) {
            return this._stat as fs.Stats;
        }
        // @ts-ignore - edit_obj_keys is from a utility module
        this._stat = Utils.rename_attributes(
            fs.statSync(this.data),
            [
                ["atimeMs", "atime"],
                ["mtimeMs", "mtime"],
                ["ctimeMs", "ctime"],
                ["birthtimeMs", "birthtime"],
            ],
            [
                "atime",
                "mtime",
                "ctime",
                "birthtime",
            ]
        );
        return this._stat as fs.Stats;
    }

    /** @docs
     *  @title Device ID
     *  @desc Get the device identifier where the file resides
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric device identifier
     */
    get dev(): number {
        return this.stat.dev;
    }

    /** @docs
     *  @title Inode number
     *  @desc Get the file system specific inode number
     *  @property true
     *  @returns
     *      @type number
     *      @desc The inode number of the file
     */
    get ino(): number {
        return this.stat.ino;
    }

    /** @docs
     *  @title File mode
     *  @desc Get the file mode bits
     *  @property true
     *  @returns
     *      @type number
     *      @desc The file mode containing permission bits and file type
     */
    get mode(): number {
        return this.stat.mode;
    }

    /** @docs
     *  @title Hard links
     *  @desc Get the number of hard links to the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Number of hard links
     */
    get nlink(): number {
        return this.stat.nlink;
    }

    /** @docs
     *  @title User ID
     *  @desc Get the user identifier of the file's owner
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric user ID
     */
    get uid(): number {
        return this.stat.uid;
    }

    /** @docs
     *  @title Group ID
     *  @desc Get the group identifier of the file's group
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric group ID
     */
    get gid(): number {
        return this.stat.gid;
    }

    /** @docs
     *  @title Device ID (if special file)
     *  @desc Get the device identifier for special files
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric device identifier for special files
     */
    get rdev(): number {
        return this.stat.rdev;
    }

    /** @docs
     *  @title Size
     *  @desc Get the total size in bytes. For directories, calculates total size recursively
     *  @property true
     *  @returns
     *      @type number
     *      @desc Total size in bytes
     */
    get size(): number {
        if (this.stat.isDirectory()) {
            let size = 0;
            function calc(path: string) {
                const stat = fs.statSync(path);
                if (stat.isFile()) {
                    size += stat.size;
                } else if (stat.isDirectory()) {
                    fs.readdirSync(path).forEach(file => calc(`${path}/${file}`));
                }
            }
            calc(this.data);
            return size;
        } else {
            return this.stat.size;
        }
    }

    /** @docs
     *  @title Block size
     *  @desc Get the file system block size for I/O operations
     *  @property true
     *  @returns
     *      @type number
     *      @desc Block size in bytes
     */
    get blksize(): number {
        return this.stat.blksize;
    }

    /** @docs
     *  @title Blocks
     *  @desc Get the number of blocks allocated to the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Number of allocated blocks
     */
    get blocks(): number {
        return this.stat.blocks;
    }

    /** @docs
     *  @title Access time
     *  @desc Get the last access time of the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the last access time
     */
    get atime(): number {
        return this.stat.atime as unknown as number; // its converted by this.stat()
    }

    /** @docs
     *  @title Modification time
     *  @desc Get the last modification time of the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the last modification time
     */
    get mtime(): number {
        return this.stat.mtime as unknown as number; // its converted by this.stat()
    }

    /** @docs
     *  @title Change time
     *  @desc Get the last change time of the file (metadata changes)
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the last change time
     */
    get ctime(): number {
        return this.stat.ctime as unknown as number; // its converted by this.stat()
    }

    /** @docs
     *  @title Creation time
     *  @desc Get the creation time of the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the file creation time
     */
    get birthtime(): number {
        return this.stat.birthtime as unknown as number; // its converted by this.stat()
    }

    // Disk usage.
    /** @docs
     *  @title Disk usage
     *  @desc Get disk usage information for the directory
     *  @throws Error if path is not a directory
     *  @returns
     *      @type Promise<{available: number; free: number; total: number}>
     *      @desc Object containing disk space information in bytes.
     *      @attr
     *          @name available
     *          @descr: Space available to the current user
     *          @type: number
     *      @attr
     *          @name free
     *          @descr: Total free space
     *          @type: number
     *      @attr
     *          @name total
     *          @descr: Total disk space
     *          @type: number
     */
    async disk_usage(): Promise<undefined | { available: number; free: number; total: number }> {
        if (!this.is_dir()) {
            throw new Error(`File path "${this.data}" is not a directory.`);
        }
        return new Promise((resolve, reject) => {
            diskusage.check(this.data, (err, info) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(info);
            });
        });
    }

    /** @docs
     *  @title Available space
     *  @desc Get available disk space for the directory
     *  @throws Error if path is not a directory
     *  @returns
     *      @type Promise<number>
     *      @desc Number of bytes available to the current user
     */
    async available_space(): Promise<number | undefined> {
        if (!this.is_dir()) {
            throw new Error(`File path "${this.data}" is not a directory.`);
        }
        return new Promise((resolve, reject) => {
            diskusage.check(this.data, (err, info) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(info?.available);
            });
        });
    }

    // ---------------------------------------------------------
    // Functions.

    // Reset.
    // Should be called when the operating system's path has changed.
    // This does not reset the assigned path.
    
    /**
     * Equals another string or path.
     */
    eq(path: string | Path): boolean {
        if (path instanceof Path) {
            return this.data === path.data;
        }
        return this.data === path;
    }
    
    /** @docs
     *  @title Reset
     *  @desc Reset the path attribute's except the path name
     *  @note Should be called when the operating system's path has changed
     */
    reset(): this {
        this._stat = undefined;
        this._name = undefined;
        this._extension = undefined;
        this._base = undefined;
        this._abs = undefined;
        return this;
    }

    refresh(): this {
        return this.reset();
    }

    /** @docs
     *  @title Is directory
     *  @desc Check if the path is a directory
     */
    is_dir(): boolean {
        return this.stat.isDirectory();
    }

    /** @docs
     *  @title Exists
     *  @desc Check if the path exists
     */
    exists(): boolean {
        return fs.existsSync(this.data);
    }
    static exists(path: string): boolean {
        return fs.existsSync(path);
    }

    /** @docs
     *  @title Ensure Exists
     *  @desc Ensure a path exists, if not throw an error.
     */
    static ensure_exists_err(path: string | Path, err_prefix = ""): void {
        path = new Path(path);
        if (!path.exists()) {
            throw new Error(`${err_prefix}Path "${path.str()}" does not exist.`);
        }
    }

    /** @docs
     *  @title Get name
     *  @desc Get the (full) name of the path
     */
    name(with_extension: boolean = true): string {
        if (with_extension === false) {
            const name = this.name();
            const ext = this.extension();
            if (!ext) {
                return name;
            }
            return name.substr(0, name.length - ext.length);
        }
        if (this._name !== undefined) { return this._name; }
        this._name = "";
        for (let i = this.data.length - 1; i >= 0; i--) {
            const c = this.data.charAt(i);
            if (c === "/") {
                break;
            }
            this._name = c + this._name;
        }
        return this._name;
    }

    /** @docs
     *  @title Get extension
     *  @desc Get the extension of the path
     */
    extension(): string {
        if (this._extension !== undefined) { return this._extension; }
        if (this._name == null) { this.name(); }
        this._extension = "";
        for (let i = this._name!.length - 1; i >= 0; i--) {
            const c = this._name!.charAt(i);
            this._extension = c + this._extension;
            if (c === ".") {
                return this._extension;
            }
        }
        this._extension = "";
        return this._extension;
    }

    /** @docs
     *  @title Get base
     *  @desc Get the base path of the path
     *  @note Returns `null` when the path does not have a base path
     */
    base(back: number = 1): Path | undefined {
        if (back === 1 && this._base != null) { return this._base; }
        let count = 0, end = 0;
        for (end = this.data.length - 1; end >= 0; end--) {
            const c = this.data.charAt(end);
            if (c === "/") {
                ++count;
                if (back === count) {
                    break;
                }
            }
        }
        if (end === 0) {
            return ;
        }
        if (back === 1) {
            this._base = new Path(this.data.substr(0, end));
            return this._base;
        } else {
            return new Path(this.data.substr(0, end));
        }
    }

    /** @docs
     *  @title Get absolute
     *  @desc Get the absolute path of the path
     */
    abs(): Path {
        if (this._abs !== undefined) { return this._abs; }
        this._abs = new Path(pathlib.resolve(this.data));
        return this._abs;
    }
    static abs(path: string | Path): Path {
        return new Path(path).abs();
    }

    /** @docs
     *  @title Join
     *  @desc Join the path with another name or subpath
     */
    join(subpath: string | Path, clean: boolean = true): Path {
        if (subpath instanceof Path) {
            return new Path(`${this.data}/${subpath.data}`, clean);    
        }
        return new Path(`${this.data}/${subpath}`, clean);
    }

    /** @docs
     *  @title Copy
     *  @desc Copy the path to another location
     *  @funcs 2
     */
    async cp(destination: string | Path): Promise<void> {
        return new Promise((resolve, reject) => {
            if (destination == null) {
                return reject("Define parameter \"destination\".");
            }
            if (destination instanceof Path) {
                destination = destination.data;
            }
            
            fs_extra.copy(this.data, destination, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    cp_sync(destination: string | Path): void {
        if (destination == null) {
            throw new Error("Define parameter \"destination\".");
        }
        if (destination instanceof Path) {
            destination = destination.data;
        }
        fs_extra.copySync(this.data, destination);
    }

    /** @docs
     *  @title Move
     *  @desc Move the path to another location
     */
    async mv(destination: string | Path): Promise<void> {
        return new Promise((resolve, reject) => {
            if (destination instanceof Path) {
                destination = destination.data;
            }
            if (fs.existsSync(destination)) {
                return reject("Destination path already exists.");
            }
            fs_extra.move(this.data, destination, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }

    /** @docs
     *  @title Delete
     *  @desc Delete the path
     *  @funcs 2
     */
    async del({ recursive = false } = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                if (this.is_dir()) {
                    fs.rm(this.data, {recursive}, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                } else {
                    fs.unlink(this.data, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                }
            }
        });
    }
    del_sync({ recursive = false } = {}): this {
        if (this.exists()) {
            if (this.is_dir()) {
                fs.rmSync(this.data, {recursive});
            } else {
                fs.unlinkSync(this.data);
            }
        }
        return this;
    }

    /** @docs
     *  @title Trash
     *  @desc Move the path to the trash directory
     */
    async trash(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const name = this.name();
            let trash: string | undefined;
            switch (os.platform()) {
                case 'darwin': // macOS
                    trash = pathlib.join(os.homedir(), '.Trash');
                    break;
                case 'linux':
                    const xdg_data_home = process.env.XDG_DATA_HOME || pathlib.join(os.homedir(), '.local', 'share');
                    trash = pathlib.join(xdg_data_home, 'Trash');
                    break;
                default:
                    return reject("Unsupported platform.");
            }
            if (trash == null) {
                return reject("Unsupported platform.");
            }
            let destination: string;
            try {
                destination = `${trash}/${name}`;
                let counts = 0;
                while (fs.existsSync(destination)) {
                    ++counts;
                    destination = `${trash}/${name}-${counts}`;
                }
                await this.mv(destination);
            } catch (err) {
                return reject(err);
            }
            resolve();
        });
    }

    /** @docs
     *  @title Mkdir
     *  @desc Create a directory
     */
    async mkdir(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                return resolve();
            }
            fs.mkdir(this.data, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    mkdir_sync(): this {
        if (this.exists()) {
            return this;
        }
        fs.mkdirSync(this.data, { recursive: true });
        return this;
    }

    /** @docs
     *  @title Touch
     *  @desc Create a file
     */
    async touch(): Promise<void> {
        return this.save("");
    }

    /** @docs
     *  @title Load
     *  @desc Load the data from the path
     *  @funcs 2
     */
    async load<R extends Buffer = Buffer>(opts: { type: undefined | "buffer", encoding?: BufferEncoding }): Promise<R>;
    async load<R extends boolean = boolean>(opts: { type: "boolean", encoding?: BufferEncoding }): Promise<R>;
    async load<R extends number = number>(opts: { type: "number", encoding?: BufferEncoding }): Promise<R>;
    async load<R extends string = string>(opts?: { type?: "string", encoding?: BufferEncoding }): Promise<R>;
    async load<R extends any[] = any[]>(opts: { type: "array", encoding?: BufferEncoding }): Promise<R>;
    async load<R extends Record<any, any> = Record<any, any>>(opts: { type: "object", encoding?: BufferEncoding }): Promise<R>;
    async load<R extends any[] | Record<any, any> = any[] | Record<any, any>>(opts: { type: "json" | "json5" | "jsonc", encoding?: BufferEncoding }): Promise<R>;
    async load({
        type = "string",
        encoding = undefined
    }: {
        type?: Path.LoadSaveTypeName,
        encoding?: BufferEncoding
    } = {}): Promise<Path.LoadSaveType> {
        return new Promise<Path.LoadSaveType>((resolve, reject) => {
            fs.readFile(this.data, encoding, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    if (type == null || type === "buffer") {
                        resolve(data);
                    } else if (type === "string") {
                        resolve(data.toString());
                    } else if (type === "array" || type === "object" || type === "json") {
                        resolve(JSON.parse(typeof data === "string" ? data : data.toString()));
                    } else if (type === "json5") {
                        resolve(JSON5.parse(typeof data === "string" ? data : data.toString()));
                    } else if (type === "jsonc") {
                        resolve(JSONC.parse(typeof data === "string" ? data : data.toString()));
                    } else if (type === "number") {
                        resolve(parseFloat(data.toString()));
                    } else if (type === "boolean") {
                        const str = data.toString();
                        resolve(str === "1" || str === "true" || str === "TRUE" || str === "True");
                    } else {
                        // @ts-expect-error
                        throw Error(`Invalid type "${type.toString()}".`);
                    }
                }
            });
        });
    }
    load_sync<R extends Buffer = Buffer>(opts: { type: undefined | "buffer", encoding?: BufferEncoding }): R;
    load_sync<R extends boolean = boolean>(opts: { type: "boolean", encoding?: BufferEncoding }): R;
    load_sync<R extends number = number>(opts: { type: "number", encoding?: BufferEncoding }): R;
    load_sync<R extends string = string>(opts?: { type?: "string", encoding?: BufferEncoding }): R;
    load_sync<R extends any[] = any[]>(opts: { type: "array", encoding?: BufferEncoding }): R;
    load_sync<R extends Record<string, any> = Record<string, any>>(opts: { type: "object", encoding?: BufferEncoding }): R;
    load_sync<R extends any[] | Record<string, any> = any[] | Record<string, any>>(opts: { type: "json" | "json5" | "jsonc", encoding?: BufferEncoding }): R;
    load_sync({
        type = "string",
        encoding = undefined,
    }: {
        type?: Path.LoadSaveTypeName,
        encoding?: BufferEncoding
    } = {}): Path.LoadSaveType {
        const data = fs.readFileSync(this.data, encoding);
        if (type == null || type === "buffer") {
            return data;
        } else if (type === "string") {
            return data.toString();
        } else if (type === "array" || type === "object" || type === "json") {
            return JSON.parse(typeof data === "string" ? data : data.toString());
        } else if (type === "json5") {
            return JSON5.parse(typeof data === "string" ? data : data.toString());
        } else if (type === "jsonc") {
            return JSONC.parse(typeof data === "string" ? data : data.toString());
        } else if (type === "number") {
            return parseFloat(data.toString());
        } else if (type === "boolean") {
            const str = data.toString();
            return str === "1" || str === "true" || str === "TRUE" || str === "True";
        } else {
            // @ts-expect-error
            throw Error(`Invalid type "${type.toString()}".`);
        }
    }

    /** @docs
     *  @title Save
     *  @desc Save data to the path
     *  @funcs 2
     */
    async save(data: any, opts: { type: Path.LoadSaveTypeName }): Promise<void>
    async save(data: string | Buffer, opts?: { type?: Path.LoadSaveTypeName }): Promise<void>
    async save(data: any, opts?: { type?: Path.LoadSaveTypeName }): Promise<void> {
        if (opts?.type) {
            if (opts.type == null || opts.type === "buffer") {
                // skip
            } else if (opts.type === "string") {
                // skip
            } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
                data = JSON.stringify(data);
            } else if (opts.type === "jsonc") {
                await JSONC.save(this.data, data);
                return ;
            } else if (opts.type === "number") {
                data = data.toString();
            } else if (opts.type === "boolean") {
                data = data.toString();
            } else {
                // @ts-expect-error
                throw Error(`Invalid type parameter "${opts.type.toString()}".`);
            }
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(this.data, data, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    save_sync(data: any, opts: { type: Exclude<Path.LoadSaveTypeName, "jsonc"> }): this
    save_sync(data: string | Buffer, opts?: { type?: Exclude<Path.LoadSaveTypeName, "jsonc"> }): this
    save_sync(data: any, opts?: { type?: Exclude<Path.LoadSaveTypeName, "jsonc"> }): this {
        if (opts?.type) {
            if (opts.type == null || opts.type === "buffer") {
                // skip
            } else if (opts.type === "string") {
                // skip
            } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
                data = JSON.stringify(data);
            } else if ((opts.type as Path.LoadSaveTypeName) === "jsonc") {
                throw new Error("JSONC is not supported in sync mode.");
            } else if (opts.type === "number") {
                data = data.toString();
            } else if (opts.type === "boolean") {
                data = data.toString();
            } else {
                // @ts-expect-error
                throw Error(`Invalid type parameter "${opts.type.toString()}".`);
            }
        }
        fs.writeFileSync(this.data, data);
        return this;
    }

    /** 
     * Get the child paths of a directory
     * @throws An error when the path is not a directory
     * @param recursive Get all paths recursively.
     * @param exclude A list of exclude paths, an exact match will be checked when a `string[]` array is provided.
     *                However, glob- and regex patterns can be utilized as well by providing an `ExcludeList` class.
     * @param absolute Get the absolute paths instead of relative paths.
     * @param string Get all paths as raw strings instead of Path objects
     */
    async paths(opts?: {
        recursive?: boolean;
        absolute?: boolean;
        exclude?: Path.ExcludeList | string[]
        string?: false;
    }): Promise<Path[]>;
    async paths(opts: {
        recursive?: boolean;
        absolute?: boolean;
        exclude?: Path.ExcludeList | string[]
        string: true;
    }): Promise<string[]>;
    async paths({ 
        recursive = false, 
        absolute = true, 
        exclude,
        string = false,
    }: { 
        recursive?: boolean; 
        absolute?: boolean; 
        exclude?: Path.ExcludeList | string[] 
        string?: boolean;
    } = {}): Promise<string[] | Path[]> {

        const exclude_list = exclude instanceof Path.ExcludeList
            ? exclude
            : Array.isArray(exclude)
                ? new Set<string>()
                : undefined;

        // Handle legacy argument style
        if (typeof arguments[0] === "boolean") {
            recursive = arguments[0];
            absolute = true;
        }

        // Initialize exact exclude list set.
        if (exclude_list instanceof Set && Array.isArray(exclude)) { 
            for (let i = 0; i < exclude.length; i++) {
                let path = new Path(exclude[i]);
                if (path.exists()) {
                    path = path.abs();
                } else {
                    if (this.join(exclude[i], false).exists()) {
                        path = this.join(exclude[i], false).abs();
                    }
                }
                exclude_list.add(path.str());
            }
        }

        return new Promise<Path[] | string[]>(async (resolve, reject) => {
            if (!this.is_dir()) {
                return reject(`Path "${this.data}" is not a directory.`);
            }
            if (!recursive) {
                fs.readdir(this.data, (err, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        const list: (Path | string)[] = [];
                        files.forEach(name => {
                            const path = this.join(name);
                            if (exclude_list == null || exclude_list.size === 0 || !exclude_list.has(path.str())) {
                                list.push(
                                    absolute
                                    ? string ? path.str() : path
                                    : string ? name : new Path(name)
                                );
                            }
                        });
                        resolve(list as Path[] | string[]);
                    }
                });
            } else {
                const files: (Path | string)[] = [];
                const traverse = (path: Path, relative_path: Path | null): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        fs.readdir(path.data, async (err, children) => {
                            if (err) {
                                reject(err);
                            } else {
                                try {
                                    for (const child of children) {
                                        const child_path = path.join(child);
                                        if (exclude_list != null && (exclude_list.size === 0 || !exclude_list.has(path.str()))) {
                                            continue;
                                        }
                                        const relative_child = absolute ? null : relative_path!.join(child);
                                        files.push(absolute
                                            ? string ? child_path.str() : child_path
                                            : string ? relative_child?.str()! : relative_child!
                                        );
                                        if (child_path.is_dir()) {
                                            await traverse(child_path, relative_child);
                                        }
                                    }
                                    resolve();
                                } catch (e) {
                                    reject(e);
                                }
                            }
                        });
                    });
                };

                try {
                    await traverse(this, absolute ? null : new Path(""));
                    resolve(files as Path[] | string[]);
                } catch (err) {
                    reject(err);
                }
            }
        });
    }

    // Truncate.
    /** @docs
     *  @title Truncate
     *  @desc Truncate the file
     */
    // async truncate(): Promise<void> {
    //     return new Promise((resolve, reject) => {
    //         fs.truncate(this._path, (err) => {
    //             if (err) {
    //                 return reject(err);
    //             }
    //             resolve();
    //         });
    //     });
    // }

    /** @docs
     *  @title Common Base Path
     *  @descr Find the common base path between an array of paths
     *  @param
     *      @name paths
     *      @desc Array of path strings to analyze
     *      @type string[]
     *  @return
     *      @type string | undefined
     *      @descr Returns a string when a common base path has been found, when no common base path was found `undefined` will be returned
     */
    static find_common_base_path(paths: string[]): string | undefined {
        if (!Array.isArray(paths) || paths.length === 0) {
            return ''; // Return empty if input is invalid or empty
        }

        if (paths.length === 1) {
            return new Path(paths[0]).base()?.toString(); // If only one path, return its base
        }

        // Detect platform-specific path separators (handles both '/' and '\\')
        const separator = paths[0].includes('\\\\') ? '\\\\' : '/';

        // Split the first path into components to use as a reference
        const split_first_path = paths[0].split(separator);

        let common_length = split_first_path.length;

        // Iterate over the remaining paths
        for (let i = 1; i < paths.length; i++) {
            const split = paths[i].split(separator);
            const min_length = Math.min(common_length, split.length); // Only compare up to the shortest path

            // Compare components one by one until mismatch
            let j = 0;
            while (j < min_length && split_first_path[j] === split[j]) {
                j++;
            }

            // Update the common length up to the point of the last match
            common_length = j;

            // Early exit if no common base path
            if (common_length === 0) {
                return undefined; // No common base path
            }
        }

        // Join the common components into a path string
        return split_first_path.slice(0, common_length).join(separator);
    }

    /**
     * Asynchronously reads the file at this._path using a streaming interface.
     * Calls the optional `processLine` callback for each line as it is read,
     * and always returns an array of all lines once complete.
     * This approach is memory-efficient for large files while allowing
     * custom per-line processing.
     *
     * @param callback Optional callback invoked with each line and its index.
     * @returns Promise resolving to an array of all lines in the file.
     */
    public async read_lines(
        callback?: (line: string, index: number) => void
    ): Promise<string[]> {
        const lines: string[] = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(this.data),
            crlfDelay: Infinity,
        });
        let index = 0;
        for await (const line of rl) {
            if (callback) {
                callback(line, index);
            }
            lines.push(line);
            index++;
        }
        return lines;
    }

    /**
     * Relative.
     */
    relative(child: string | Path): Path {
        if (child instanceof Path) {
            return new Path(pathlib.relative(this.data, child.data), false);
        }
        return new Path(pathlib.relative(this.data, child), false);
    }
}

/**
 * Path types.
 */
export namespace Path {

    /**
     * The valid types for `load` `save` methods.
     */
    export type LoadSaveTypeName = undefined | "boolean" | "number" | "string" | "buffer" | "array" | "object" | "json" | "json5" | "jsonc";
    export type LoadSaveType = undefined | boolean | number | string | Buffer | any[] | Record<string, any>;

    /**
     * A glob / regex path exclude list class.
     * @libris
     */
    export class ExcludeList {
        
        /** Size to keep uniform with `Set`. */
        size: number = 0;
        
        /** The internal exclude list. */
        private exclude_list: (Minimatch | RegExp)[] = [];
        
        /** An internal cache. */
        private cache = new Map<string, boolean>();

        /** The constructor. */
        constructor(...exclude_list: (string | RegExp)[]) {
            for (const item of exclude_list) {
                if (item instanceof RegExp) {
                    this.exclude_list.push(item);
                } else {
                    this.exclude_list.push(new Minimatch(this.normalize(item), {
                        dot: true,    // allow matches on dot-files/dirs
                        matchBase: false,
                    }));
                }
            }
            this.size = this.exclude_list.length;
        }
        
        /** Normalize a path. */
        normalize(input: string): string {
            let normalized = pathlib.normalize(input);
            if (normalized.indexOf("\\") !== -1) {
                normalized = normalized.split(pathlib.sep).join('/');
            }
            return normalized;
        }
        
        /**
         * Check if a path is excluded.
         * @returns True if the path is matched by the exclude list.
         * @libris
         */
        has(
            input: string
        ): boolean {
            if (this.cache.has(input)) {
                return this.cache.get(input)!;
            }
            const normalized = this.normalize(input);
            const res = this.exclude_list.some(item => (
                (item instanceof RegExp && item.test(normalized))
                || (item instanceof Minimatch && item.match(normalized))
            ));
            this.cache.set(input, res);
            return res;
        }
    }

}