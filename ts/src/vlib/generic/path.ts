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
import { String as StringUtils } from "../primitives/string.js";
import fg from 'fast-glob';

/**
 * A list of all multi dotted file extensions.
 * Used to identify multi-dot file extensions.
 * @note Ensure we include `.` as the first character, or update `Path.full_name()` to handle multi-dot extensions correctly.
 * @note Ensure we only include a charset of `[\w.]` characters, or update the replacement for the regex creation of `multi_dot_extensions_regex` to handle other characters.
 */
const multi_dot_extensions: Set<string> = new Set<string>([
    // Compressed archives
    '.tar.gz',
    '.tar.bz2',
    '.tar.bz',
    '.tar.xz',
    '.tar.Z',
    '.tar.lz',
    '.tar.lzma',
    '.tar.zst',
    '.tar.lz4',
    '.cpio.gz',
    '.cpio.bz2',
    '.cpio.xz',
    '.iso.gz',
    '.iso.bz2',
    '.iso.xz',
    '.jar.gz',
    '.war.gz',
    '.ear.gz',

    // Source‐map files
    '.js.map',
    '.css.map',
    '.html.map',
    '.mjs.map',
    '.cjs.map',

    // Minified assets
    '.min.js',
    '.min.css',
    '.min.html',
    '.min.json',
    '.min.svg',

    // Testing/spec conventions
    '.spec.ts',
    '.spec.tsx',
    '.spec.js',
    '.spec.jsx',
    '.test.ts',
    '.test.tsx',
    '.test.js',
    '.test.jsx',

    // User scripts/styles
    '.user.js',
    '.user.css',

    // Flow-typed JS files
    '.js.flow',
    '.jsx.flow',

    // TypeScript declaration files
    '.d.ts',

    // Rails/ERB templates
    '.html.erb',
    '.js.erb',
    '.css.erb',
    '.scss.erb',
    '.sass.erb',
    '.coffee.erb',
    '.xml.erb',
    '.json.erb',
    '.yml.erb',
    '.md.erb',

    // Haml templates
    '.html.haml',
    '.js.haml',
    '.css.haml',

    // Slim templates
    '.html.slim',
    '.js.slim',
    '.css.slim',

    // Liquid templates (Jekyll, Shopify, etc.)
    '.html.liquid',
    '.md.liquid',
    '.xml.liquid',
    '.yml.liquid',

    // Laravel Blade
    '.blade.php',

    // “CSS Modules” conventions
    '.module.css',
    '.module.scss',
    '.module.sass',
    '.module.less',

    // “Global” styles conventions
    '.global.css',
    '.global.scss',
]);
const multi_dot_extensions_suffixes: Set<string> = new Set<string>(
    Array.from(multi_dot_extensions)
    .reduce((acc, ext) => {
        const parts = ext.split('.');
        if (parts.length < 2) return acc;
        const add = `.${parts[parts.length - 1]}`;
        if (!acc.includes(add)) acc.push(add);
        return acc;
    }, [] as string[])
);
const multi_dot_extensions_regex = new RegExp(
    `(${Array.from(multi_dot_extensions_suffixes).map(ext => ext.replaceAll(".", "\\.")).join('|')})$`,
    "g",
);
  

/** 
 * The path class.
 * @nav System
 * @docs
 */
export class Path {

    // Attributes.
    path: string; // internal file path, keep public.
    private _stat?: fs.Stats;
    private _full_name?: string; 
    private _name?: string;
    private _extension?: string;
    private _base?: Path;
    private _abs?: Path;

    /**
     * Construct a new path instance.
     * @param path The file path as a string or another Path instance.
     * @param clean Whether to clean the path by removing redundant slashes and dots.
     * @param stats Optional file system stats associated with the path.
     * @docs
     */
    constructor(
        path: string | Path,
        clean: boolean = true,
        stats?: fs.Stats
    ) {
        if (path == null) {
            throw Error(`Invalid path "${path}".`);
        }
        else if (path instanceof Path) {
            this.path = path.path;
        } else if (typeof path !== "string") {
            throw Error(`Invalid path "${path}". Expected a string or Path instance.`);
        } else {
            if (path.length === 0) {
                throw Error(`Invalid path, cannot create a path from an empty string.`);
            }
            if (clean) {
                this.path = "";
                const max_i = path.length - 1;
                for (let i = 0; i < path.length; i++) {
                    const c = path.charAt(i);
                    if (c === "/" && (this.path.charAt(this.path.length - 1) === "/" || i == max_i)) {
                        continue;
                    }
                    else if (c === "." && path.charAt(i - 1) === "/" && path.charAt(i + 1) === "/") {
                        continue;
                    } else {
                        this.path += c;
                    }
                }
            } else {
                this.path = path;
            }
        }
        if (stats !== undefined) {
            this._stat = stats;
        }
    }

    // ---------------------------------------------------------
    // Utils.

    /**
     * Trim the file path in place.
     * @docs
     */
    trim(): void {
        let start = 0, end = this.path.length;
        for (let i = 0; i < this.path.length; i++) {
            const c = this.path.charAt(i);
            if (c == " " || c == "\t") {
                ++start;
            } else {
                break;
            }
        }
        for (let i = end - 1; i >= 0; i--) {
            const c = this.path.charAt(i);
            if (c == " " || c == "\t") {
                --end;
            } else {
                break;
            }
        }
        if (start != 0 || end != this.path.length) {
            this.path = this.path.substring(start, end - start);
        }
        if (this.path.length === 0) {
            throw Error(`Invalid path "${this.path}".`);
        }
    }

    /**
     * Cast the file path to a string.
     * @docs
     */
    toString(): string {
        return this.path;
    }
    /**
     * Cast the file path to a string.
     * @docs
     */
    str(): string {
        return this.path;
    }

    /** Cast to primitives. */
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number {
        if (hint === 'number') {
            return this.path.length;
        }
        // 'string' or 'default'
        return this.path;
    }

    // ---------------------------------------------------------
    // Static method.

    /**
     * Get the user's home directory path.
     * @returns {Path} A new Path instance pointing to the user's home directory.
     * @docs
     */
    static home(): Path {
        return new Path(os.homedir());
    }

    /**
     * Get the current working directory path.
     * @returns {Path} A new Path instance pointing to the current working directory.
     * @docs
     */
    static cwd(): Path {
        return new Path(process.cwd());
    }

    /**
     * Get the temporary directory path.
     * @returns {Path} A new Path instance pointing to the system's temporary directory.
     * @docs
     */
    static tmp(): Path {
        return new Path(os.tmpdir());
    }

    // /**
    //  * Get the system's root directory path.
    //  * @returns {Path} A new Path instance pointing to the system's root directory.
    //  */
    // static root(): Path {
    //     // On Windows, the root is the drive letter with a trailing backslash.
    //     // On Unix-like systems, it is simply "/".
    //     return new Path(pathlib.parse(pathlib.resolve('/')).root);
    // }

    /**
     * Get the current operating system's path separator.
     * @returns {string} The path separator used by the current operating system ('/' for Unix-like, '\\' for Windows).
     * @docs
     */
    static sep(): string {
        return pathlib.sep;
    }

    /**
     * Find the common base path between an array of paths.
     * @param {string[]} paths - Array of path strings to analyze.
     * @returns {string|undefined} Returns a string when a common base path has been found, or undefined otherwise.
     * @docs
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
     * Check if a path exists.
     * @docs
     */
    static exists(path: string): boolean {
        return fs.existsSync(path);
    }

    /**
     * Ensure a path exists; throw an error if not.
     * @param path Path to check.
     * @param err_prefix Optional prefix for the error message.
     * @docs
     */
    static ensure_exists_err(path: string | Path, err_prefix = ""): void {
        path = new Path(path);
        if (!path.exists()) {
            throw new Error(`${err_prefix}Path "${path.str()}" does not exist.`);
        }
    }

    // ---------------------------------------------------------
    // Properties.

    /**
     * Get the length of the current path string.
     * @returns {number} The number of characters in the path string.
     * @docs
     */
    get length(): number {
        return this.path.length;
    }
    /**
     * Get the length of the current path string.
     * @returns {number} The number of characters in the path string.
     * @docs
     */
    get len(): number {
        return this.path.length;
    }

    /**
     * Get the file system stats for the current path.
     * @returns {fs.Stats} The file system stats object with modified time properties.
     * @throws Error if the path does not exist or cannot be accessed.
     * @docs
     */
    get stat(): fs.Stats {
        if (this._stat !== undefined) {
            return this._stat;
        }
        // @ts-ignore - edit_obj_keys is from a utility module
        this._stat = fs.statSync(this.path);
        if (this._stat == null) {
            throw new Error(`Path "${this.path}" does not exist or cannot be accessed.`);
        }
        return this._stat;
    }

    /**
     * Get the device identifier where the file resides.
     * @returns {number} The numeric device identifier.
     * @docs
     */
    get dev(): number {
        return this.stat.dev;
    }

    /**
     * Get the file system specific inode number.
     * @returns {number} The inode number of the file.
     * @docs
     */
    get ino(): number {
        return this.stat.ino;
    }

    /**
     * Get the file mode bits (permission and type).
     * @returns {number} The file mode bits.
     * @docs
     */
    get mode(): number {
        return this.stat.mode;
    }

    /**
     * Get the number of hard links to the file.
     * @returns {number} The number of hard links.
     * @docs
     */
    get nlink(): number {
        return this.stat.nlink;
    }

    /**
     * Get the user identifier of the file's owner.
     * @returns {number} The numeric user ID.
     * @docs
     */
    get uid(): number {
        return this.stat.uid;
    }

    /**
     * Get the group identifier of the file's group.
     * @returns {number} The numeric group ID.
     * @docs
     */
    get gid(): number {
        return this.stat.gid;
    }

    /**
     * Get the device identifier for special files.
     * @returns {number} The device identifier for special files.
     * @docs
     */
    get rdev(): number {
        return this.stat.rdev;
    }

    /**
     * Get the total size in bytes. For directories, calculates size recursively.
     * @returns {number} Total size in bytes.
     * @docs
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
            calc(this.path);
            return size;
        } else {
            return this.stat.size;
        }
    }

    /**
     * Get the file system block size for I/O operations.
     * @returns {number} Block size in bytes.
     * @docs
     */
    get blksize(): number {
        return this.stat.blksize;
    }

    /**
     * Get the number of blocks allocated to the file.
     * @returns {number} Number of allocated blocks.
     * @docs
     */
    get blocks(): number {
        return this.stat.blocks;
    }

    /**
     * Get the last access time of the file (in milliseconds).
     * @returns {number} Milliseconds representing the last access time.
     * @docs
     */
    get atime(): number {
        return this.stat.atimeMs;
    }

    /**
     * Get the last modification time of the file (in milliseconds).
     * @returns {number} Milliseconds representing the last modification time.
     * @docs
     */
    get mtime(): number {
        return this.stat.mtimeMs;
    }

    /**
     * Get the last change time of the file metadata (in milliseconds).
     * @returns {number} Milliseconds representing the last change time.
     * @docs
     */
    get ctime(): number {
        return this.stat.ctimeMs;
    }

    /**
     * Get the creation time of the file (in milliseconds).
     * @returns {number} Milliseconds representing the file creation time.
     * @docs
     */
    get birthtime(): number {
        return this.stat.birthtimeMs;
    }

    /**
     * Get disk usage information for the directory.
     * @throws {Error} If the path is not a directory.
     * @returns {Promise<{available: number; free: number; total: number}>} Object containing disk space information in bytes.
     * @docs
     */
    async disk_usage(): Promise<undefined | { available: number; free: number; total: number }> {
        if (!this.is_dir()) {
            throw new Error(`File path "${this.path}" is not a directory.`);
        }
        return new Promise((resolve, reject) => {
            diskusage.check(this.path, (err, info) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(info);
            });
        });
    }

    /**
     * Get available disk space for the directory.
     * @throws {Error} If the path is not a directory.
     * @returns {Promise<number>} Number of bytes available to the current user.
     * @docs
     */
    async available_space(): Promise<number | undefined> {
        if (!this.is_dir()) {
            throw new Error(`File path "${this.path}" is not a directory.`);
        }
        return new Promise((resolve, reject) => {
            diskusage.check(this.path, (err, info) => {
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
     * @docs
     */
    eq(path: string | Path): boolean {
        if (path instanceof Path) {
            return this.path === path.path;
        }
        return this.path === path;
    }
    
    /**
     * Reset internal caches except path string.
     * @returns {this} The Path instance for chaining.
     * @docs
     */
    reset(): this {
        this._stat = undefined;
        this._full_name = undefined;
        this._name = undefined;
        this._extension = undefined;
        this._base = undefined;
        this._abs = undefined;
        return this;
    }
    refresh(): this {
        return this.reset();
    }

    /** 
     * Check if the path is a file.
     * @docs
     */
    is_file(): boolean {
        return this.stat.isFile();
    }
    static is_file(path: string | Path): boolean {
        if (path instanceof Path) {
            return path.is_file();
        }
        return fs.statSync(path).isFile();
    }

    /** 
     * Check if the path is a directory.
     * @docs
     */
    is_dir(): boolean {
        return this.stat.isDirectory();
    }

    /** 
     * Check if the path exists
     * @docs
     */
    exists(): boolean {
        return fs.existsSync(this.path);
    }

    /**
     * Get the base path of this path, correctly handling escaped separators.
     * @param back - Number of directory levels to traverse up (default: 1).
     * @returns The parent Path instance, or undefined if at root.
     * @docs
     */
    base(back: number = 1): Path | undefined {
        const data = this.path;
        const len = data.length;
        if (back !== 1) {
            let count = 0;
            for (let i = len - 1; i >= 0; i--) {
                if (data.charAt(i) === '/' && data.charAt(i - 1) !== '\\') {
                    count++;
                    if (count === back) {
                        return new Path(data.substring(0, i));
                    }
                }
            }
            return undefined;
        }
        if (this._base !== undefined) {
            return this._base;
        }
        // Find last unescaped slash
        for (let i = len - 1; i > 0; i--) {
            if (data.charAt(i) === '/' && data.charAt(i - 1) !== '\\') {
                this._base = new Path(data.substring(0, i));
                return this._base;
            }
        }
        return undefined;
    }

    /**
     * Convert to a POSIX-style Path.
     * @docs
     */
    posix(): Path {
        return new Path(this.path.split(pathlib.sep).join('/'), false);
    }
    /**
     * Convert `path` to a POSIX-style Path.
     * @docs
     */
    static posix(path: string | Path): Path {
        if (path instanceof Path) {
            return new Path(path.path.split(pathlib.sep).join('/'), false);
        }
        return new Path(path.split(pathlib.sep).join('/'), false);
    }
    /**
     * Return `path` as a POSIX-style string.
     * @docs
     */
    static posix_str(path: string | Path): string {
        if (path instanceof Path) {
            return path.path.split(pathlib.sep).join('/');
        }
        return path.split(pathlib.sep).join('/');
    }

    /**
     * Get the full name of the path, including the file extension.
     * @param with_ext - Whether to include the file extension in the returned name (default: true).
     * @returns The full name of the path, with or without the extension.
     * @docs
     */
    full_name(with_ext: boolean = true): string {
        if (with_ext && this._full_name !== undefined) {
            return this._full_name;
        }
        if (!with_ext && this._name !== undefined) {
            return this._name;
        }

        const data = this.path;
        // Determine start after base()
        const base_path = this.base();
        const start = base_path ? base_path.path.length + 1 : 0;
        const basename = data.substring(start);

        // Get extension and name while supporting the set of multi-dot extensions.
        const last_dot = basename.lastIndexOf('.');
        if (last_dot !== -1) {
            this._extension = basename.substring(last_dot);
            if (multi_dot_extensions_suffixes.has(this._extension)) {
                const m = multi_dot_extensions_regex.exec(basename);
                if (m) this._extension = m[0];
            }
            this._name = basename.substring(0, last_dot);
        }
        else {
            // No dot
            this._name = basename;
            this._extension = '';
        }

        // Set full name
        this._full_name = this._name + this._extension;

        return with_ext ? this._full_name : this._name;
    }

    /**
     * Get the name of the file path without the extension.
     * @docs
     */
    name(): string {
        if (this._name !== undefined) {
            return this._name;
        }
        this.full_name();
        return this._name!;
    }

    /**
     * Get the extension of the path, with correct multi-dot extension support.
     * @returns The file extension, including leading dot, or empty string if none.
     * @docs
     */
    extension(): string {
        if (this._extension !== undefined) {
            return this._extension;
        }
        this.full_name();
        return this._extension!;
    }

    /** 
     * Get the absolute path of the path
     * @docs
     */
    abs(): Path {
        if (this._abs !== undefined) { return this._abs; }
        this._abs = new Path(pathlib.resolve(this.path));
        return this._abs;
    }
    static abs(path: string | Path): Path {
        return new Path(path).abs();
    }

    /**
     * Join the path with another name or subpath
     * @docs
     */
    join(subpath: string | Path, clean: boolean = true): Path {
        if (subpath instanceof Path) {
            return new Path(`${this.path}/${subpath.path}`, clean);    
        }
        return new Path(`${this.path}/${subpath}`, clean);
    }

    /**
     * Copy the path to another location
     * @docs
     */
    async cp(destination: string | Path): Promise<void> {
        return new Promise((resolve, reject) => {
            if (destination == null) {
                return reject(new Error("Define parameter \"destination\"."));
            }
            if (destination instanceof Path) {
                destination = destination.path;
            }
            
            fs_extra.copy(this.path, destination, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    /**
     * Copy the path to another location synchronously.
     * @docs
     */
    cp_sync(destination: string | Path): void {
        if (destination == null) {
            throw new Error("Define parameter \"destination\".");
        }
        if (destination instanceof Path) {
            destination = destination.path;
        }
        fs_extra.copySync(this.path, destination);
    }

    /**
     * Move the path to another location
     * @docs
     */
    async mv(destination: string | Path): Promise<void> {
        return new Promise((resolve, reject) => {
            if (destination instanceof Path) {
                destination = destination.path;
            }
            if (fs.existsSync(destination)) {
                return reject(new Error("Destination path already exists."));
            }
            fs_extra.move(this.path, destination, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }

    /**
     * Delete the path
     * @docs
     */
    async del({ recursive = false } = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                if (this.is_dir()) {
                    fs.rm(this.path, {recursive}, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                } else {
                    fs.unlink(this.path, (err) => {
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
    /**
     * Delete the path synchronously.
     * @docs
     */
    del_sync({ recursive = false } = {}): this {
        if (this.exists()) {
            if (this.is_dir()) {
                fs.rmSync(this.path, {recursive});
            } else {
                fs.unlinkSync(this.path);
            }
        }
        return this;
    }

    /**
     * Move the path to the trash directory
     * @docs
     */
    async trash(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const full_name = this.full_name();
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
                    return reject(new Error("Unsupported platform."));
            }
            if (trash == null) {
                return reject(new Error("Unsupported platform."));
            }
            let destination: string;
            try {
                destination = `${trash}/${full_name}`;
                let counts = 0;
                while (fs.existsSync(destination)) {
                    ++counts;
                    destination = `${trash}/${full_name}-${counts}`;
                }
                await this.mv(destination);
            } catch (err) {
                return reject(err);
            }
            resolve();
        });
    }

    /**
     * Create a directory
     * @param opts.recursive Whether to create parent directories if they do not exist, defaults to `false`
     *        Note that using `recursive: false` has slight performance benefits.
     * @docs
     */
    async mkdir(opts?: { recursive?: boolean }): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                return resolve();
            }
            fs.mkdir(this.path, { recursive: opts?.recursive }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    /**
     * Create a directory synchronously.
     * @param opts.recursive Whether to create parent directories if they do not exist, defaults to `false`
     *        Note that using `recursive: false` has slight performance benefits.
     * @docs
     */
    mkdir_sync(opts?: { recursive?: boolean }): this {
        if (this.exists()) {
            return this;
        }
        fs.mkdirSync(this.path, { recursive: opts?.recursive });
        return this;
    }

    /**
     * Create a file
     * @docs
     */
    async touch(): Promise<void> {
        return this.save("");
    }

    /**
     * Relative.
     * @docs
     */
    relative(child: string | Path): Path {
        if (child instanceof Path) {
            return new Path(pathlib.relative(this.path, child.path), false);
        }
        return new Path(pathlib.relative(this.path, child), false);
    }

    /**
     * Return the quoted representation of the path.
     * @param def The default value to return when the path is undefined.
     *            See {@link StringUtils.quote} for more information.
     * @docs
     */
    quote(def: undefined): undefined | Path
    quote(def?: string | String | Path): Path
    quote(def: string | String | Path = '""'): undefined | Path {
        const res = StringUtils.quote(this.path, def instanceof Path ? def.path : def);
        if (res === undefined) {
            return undefined;
        }
        if (def === "") {
            throw new Error("Default value cannot be an empty string.");
        }
        if (res === "") {
            throw new Error("Operation resulted in an empty string, which is not allowed.");
        }
        return new Path(res, false);
    }

    /**
     * Return the unquoted representation of the path.
     * @docs
     */
    unquote(): Path {
        return new Path(StringUtils.unquote(this.path), false);
    }

    // async load<R extends Buffer = Buffer>(opts: { type: undefined | "buffer", encoding?: BufferEncoding }): Promise<R>;
    // async load<R extends boolean = boolean>(opts: { type: "boolean", encoding?: BufferEncoding }): Promise<R>;
    // async load<R extends number = number>(opts: { type: "number", encoding?: BufferEncoding }): Promise<R>;
    // async load<R extends string = string>(opts?: { type?: "string", encoding?: BufferEncoding }): Promise<R>;
    // async load<R extends any[] = any[]>(opts: { type: "array", encoding?: BufferEncoding }): Promise<R>;
    // async load<R extends Record<any, any> = Record<any, any>>(opts: { type: "object", encoding?: BufferEncoding }): Promise<R>;
    // async load<R extends any[] | Record<any, any> = any[] | Record<any, any>>(opts: { type: "json" | "json5" | "jsonc", encoding?: BufferEncoding }): Promise<R>;
    /**
     * Load the data from the path.
     * @docs
     */
    async load<T extends LoadSaveTypeName = "string">({
        type = "string" as T,
        encoding = undefined
    }: {
        type?: T,
        encoding?: BufferEncoding
    } = {}): Promise<CastLoadSaveType<T>> {
        return new Promise<any>((resolve, reject) => {
            fs.readFile(this.path, encoding, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    if (type == null || type === "buffer" || type === "undefined") {
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
    // load_sync<R extends Buffer = Buffer>(opts: { type: undefined | "buffer", encoding?: BufferEncoding }): R;
    // load_sync<R extends boolean = boolean>(opts: { type: "boolean", encoding?: BufferEncoding }): R;
    // load_sync<R extends number = number>(opts: { type: "number", encoding?: BufferEncoding }): R;
    // load_sync<R extends string = string>(opts?: { type?: "string", encoding?: BufferEncoding }): R;
    // load_sync<R extends any[] = any[]>(opts: { type: "array", encoding?: BufferEncoding }): R;
    // load_sync<R extends Record<string, any> = Record<string, any>>(opts: { type: "object", encoding?: BufferEncoding }): R;
    // load_sync<R extends any[] | Record<string, any> = any[] | Record<string, any>>(opts: { type: "json" | "json5" | "jsonc", encoding?: BufferEncoding }): R;

    /**
     * Load the data from the path synchronously.
     * @docs
     */
    load_sync<T extends LoadSaveTypeName = "string">({
        type = "string" as T,
        encoding = undefined,
    }: {
        type?: T,
        encoding?: BufferEncoding
    } = {}): CastLoadSaveType<T> {
        const data = fs.readFileSync(this.path, encoding);
        if (type == null || type === "buffer" || type === "undefined") {
            return data as CastLoadSaveType<T>;
        } else if (type === "string") {
            return data.toString() as CastLoadSaveType<T>;
        } else if (type === "array" || type === "object" || type === "json") {
            return JSON.parse(typeof data === "string" ? data : data.toString());
        } else if (type === "json5") {
            return JSON5.parse(typeof data === "string" ? data : data.toString());
        } else if (type === "jsonc") {
            return JSONC.parse(typeof data === "string" ? data : data.toString()) as CastLoadSaveType<T>;
        } else if (type === "number") {
            return parseFloat(data.toString()) as CastLoadSaveType<T>;
        } else if (type === "boolean") {
            const str = data.toString();
            return (str === "1" || str === "true" || str === "TRUE" || str === "True") as CastLoadSaveType<T>;
        } else {
            // @ts-expect-error
            throw Error(`Invalid type "${type.toString()}".`);
        }
    }

    async save(data: any, opts: { type: LoadSaveTypeName }): Promise<void>
    async save(data: string | Buffer, opts?: { type?: LoadSaveTypeName }): Promise<void>
    /**
     * Save data to the path.
     * @docs
     */
    async save(data: any, opts?: { type?: LoadSaveTypeName }): Promise<void> {
        if (opts?.type) {
            if (opts.type == null || opts.type === "buffer" || opts.type === "undefined") {
                // skip
            } else if (opts.type === "string") {
                // skip
            } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
                data = JSON.stringify(data);
            } else if (opts.type === "jsonc") {
                await JSONC.save(this.path, data);
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
            fs.writeFile(this.path, data, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    save_sync(data: any, opts: { type: Exclude<LoadSaveTypeName, "jsonc"> }): this
    save_sync(data: string | Buffer, opts?: { type?: Exclude<LoadSaveTypeName, "jsonc"> }): this
    /**
     * Save data to the path synchronously.
     * @docs
     */
    save_sync(data: any, opts?: { type?: Exclude<LoadSaveTypeName, "jsonc"> }): this {
        if (opts?.type) {
            if (opts.type == null || opts.type === "buffer" || opts.type === "undefined") {
                // skip
            } else if (opts.type === "string") {
                // skip
            } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
                data = JSON.stringify(data);
            } else if ((opts.type as LoadSaveTypeName) === "jsonc") {
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
        fs.writeFileSync(this.path, data);
        return this;
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
     * 
     * @docs
     */
    public async read_lines(
        callback?: (line: string, index: number) => void
    ): Promise<string[]> {
        const lines: string[] = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(this.path),
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
    /** 
    * Get the child paths of a directory
    * @throws An error when the path is not a directory
    * @param recursive Get all paths recursively.
    * @param exclude A list of exclude paths, an exact match will be checked when a `string[]` array is provided.
    *                However, glob- and regex patterns can be utilized as well by providing an `ExcludeList` class.
    * @param absolute Get the absolute paths instead of relative paths.
    * @param string Get all paths as raw strings instead of Path objects
    * 
    * @docs
    */
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
                return reject(new Error(`Path "${this.path}" is not a directory.`));
            }
            if (!recursive) {
                fs.readdir(this.path, (err, files) => {
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
                                        : string ? name : new Path(name, false)
                                );
                            }
                        });
                        resolve(list as Path[] | string[]);
                    }
                });
            } else {
                const files: (Path | string)[] = [];
                const traverse = (path: Path, relative_path: Path | undefined): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        fs.readdir(path.path, async (err, children) => {
                            if (err) {
                                reject(err);
                            } else {
                                try {
                                    for (const child of children) {
                                        const child_path = path.join(child);
                                        if (exclude_list != null && (exclude_list.size === 0 || !exclude_list.has(path.str()))) {
                                            continue;
                                        }
                                        const relative_child = absolute ? undefined : relative_path ? relative_path.join(child) : new Path(child, false);
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
                    await traverse(this, undefined);
                    resolve(files as Path[] | string[]);
                } catch (err) {
                    reject(err);
                }
            }
        });
    }

    /**
     * Asynchronously match file paths using glob patterns.
     * Uses fast-glob when `opts.fast` is true, otherwise falls back to a native implementation.
     *
     * @param patterns
     *      A glob pattern or an array of patterns to match.
     *      By default all paths are treated as subpaths of the current path or the `cwd` option.
     * @param opts Optional settings.
     * @param opts.exclude A list of glob or regex patterns to exclude from the results.
     * @param opts.cwd Base directory for matching (string or Path). Defaults to this path.
     * @param opts.absolute Return absolute paths. Defaults to true.
     * @param opts.string Return raw string paths instead of Path objects.
     * @param opts.dot Include dotfiles. Defaults to true.
     * @param opts.only_files Match only files. Defaults to false.
     * @param opts.only_directories Match only directories. Defaults to false.
     * @param opts.unique Remove duplicate results. Defaults to true.
     * @param opts.stats Get the file stats for each matched path. Defaults to false.
     * 
     * @docs
     */
    static async glob<O extends Path.glob.Opts = Path.glob.Opts>(
        patterns: string | string[],
        opts?: O
    ): Promise<
        O extends { string: true } ? string[] :
        O extends { string?: false } ? Path[] :
        never
    > {
        const as_string = opts?.string ?? false;
        return (await fg(Array.isArray(patterns) ? patterns : [patterns], {
            cwd: opts?.cwd instanceof Path ? opts?.cwd.path : opts?.cwd,
            dot: opts?.dot ?? true,
            onlyFiles: opts?.only_files ?? false,
            onlyDirectories: opts?.only_directories ?? false,
            unique: opts?.unique ?? true,
            absolute: opts?.absolute ?? true,
            stats: (opts?.stats ?? false) as true, // set as true to statisfy type requirements
            ignore: opts?.exclude,
        }))
        .map(p => typeof p === "string" // ensure we check for string type for when `opts.stats` is false.
            ? as_string ? p : new Path(p, false)
            : as_string ? p.path : new Path(p.path, false, p.stats)
        ) as any;
    }

    /**
     * Synchronously match file paths using glob patterns.
     * @docs
     */
    static glob_sync<O extends Path.glob.Opts = Path.glob.Opts>(
        patterns: string | string[],
        opts?: O
    ):
    O extends { string: true } ? string[] :
    O extends { string?: false } ? Path[] :
    never
    {
        const as_string = opts?.string ?? false;
        return fg.sync(Array.isArray(patterns) ? patterns : [patterns], {
            cwd: opts?.cwd instanceof Path ? opts?.cwd.path : opts?.cwd,
            dot: opts?.dot ?? true,
            onlyFiles: opts?.only_files ?? false,
            onlyDirectories: opts?.only_directories ?? false,
            unique: opts?.unique ?? true,
            absolute: opts?.absolute ?? true,
            stats: (opts?.stats ?? false) as true, // set as true to statisfy type requirements
            ignore: opts?.exclude,
        })
        .map(p => typeof p === "string" // ensure we check for string type for when `opts.stats` is false.
            ? as_string ? p : new Path(p, false)
            : as_string ? p.path : new Path(p.path, false, p.stats)
        ) as any;
    }

}

/**
 * Casting `load` and `save` types.
 */
type LoadSaveTypeMap = {
    undefined: Buffer; 
    "buffer": Buffer;
    "boolean": boolean;
    "number": number;
    "string": string;
    "array": any[];
    "object": Record<string, any>;
    "json": any[] | Record<string, any>;
    "json5": any[] | Record<string, any>;
    "jsonc": any[] | Record<string, any>;
}
type LoadSaveTypeName = keyof LoadSaveTypeMap;
type LoadSaveType = LoadSaveTypeMap[LoadSaveTypeName];
type CastLoadSaveType<T extends LoadSaveTypeName, Never = never> =
    T extends keyof LoadSaveTypeMap ? LoadSaveTypeMap[T] : Never;

/**
 * Path types.
 */
export namespace Path {

    /**
     * Types for glob methods.
     */
    export namespace glob {
        /**
         * Options for the `Path.glob` and `Path.glob_sync` methods.
         */
        export type Opts = {
            exclude?: string[];
            fast?: boolean;
            cwd?: string | Path;
            absolute?: boolean;
            dot?: boolean;
            only_files?: boolean;
            only_directories?: boolean;
            unique?: boolean;
            stats?: boolean;
            string?: boolean;
        }
        // <Flags extends "string" | "path" = "string" | "path" > 
        // & (
        //     "path" extends Flags
        //     ? { string: true }
        //     : { string?: false }
        // )
    }


    /**
     * A glob / regex path exclude list class.
     * @deprecated Use {@link GlobPattern} and {@link GlobPatternList} instead.
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

        /**
         * Normalize a path.
         * @deprecated Use {@link GlobPattern} and {@link GlobPatternList} instead.
         */
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
         * @deprecated Use {@link GlobPattern} and {@link GlobPatternList} instead.
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