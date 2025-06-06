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
const multi_dot_extensions = new Set([
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
const multi_dot_extensions_suffixes = new Set(Array.from(multi_dot_extensions)
    .reduce((acc, ext) => {
    const parts = ext.split('.');
    if (parts.length < 2)
        return acc;
    const add = `.${parts.last()}`;
    if (!acc.includes(add))
        acc.push(add);
    return acc;
}, []));
const multi_dot_extensions_regex = new RegExp(`(${Array.from(multi_dot_extensions_suffixes).map(ext => ext.replaceAll(".", "\\.")).join('|')})$`, "g");
/**
 * The path class.
 * @libris
 */
export class Path {
    // Attributes.
    path; // internal file path, keep public.
    _stat;
    _full_name;
    _name;
    _extension;
    _base;
    _abs;
    constructor(path, clean = true, stats) {
        if (path == null) {
            throw Error(`Invalid path "${path}".`);
        }
        else if (path instanceof Path) {
            this.path = path.path;
        }
        else if (typeof path !== "string") {
            throw Error(`Invalid path "${path}". Expected a string or Path instance.`);
        }
        else {
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
                    }
                    else {
                        this.path += c;
                    }
                }
            }
            else {
                this.path = path;
            }
        }
        if (stats !== undefined) {
            this._stat = stats;
        }
    }
    // ---------------------------------------------------------
    // Utils.
    trim() {
        let start = 0, end = this.path.length;
        for (let i = 0; i < this.path.length; i++) {
            const c = this.path.charAt(i);
            if (c == " " || c == "\t") {
                ++start;
            }
            else {
                break;
            }
        }
        for (let i = end - 1; i >= 0; i--) {
            const c = this.path.charAt(i);
            if (c == " " || c == "\t") {
                --end;
            }
            else {
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
    /** To string. */
    toString() {
        return this.path;
    }
    str() {
        return this.path;
    }
    /** Cast to primitives. */
    [Symbol.toPrimitive](hint) {
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
     * @static
     * @returns {Path} A new Path instance pointing to the user's home directory.
     */
    static home() {
        return new Path(os.homedir());
    }
    /**
     * Find the common base path between an array of paths.
     * @param {string[]} paths - Array of path strings to analyze.
     * @returns {string|undefined} Returns a string when a common base path has been found, or undefined otherwise.
     */
    static find_common_base_path(paths) {
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
    /** Check if a path exists. */
    static exists(path) {
        return fs.existsSync(path);
    }
    /**
     * Ensure a path exists; throw an error if not.
     * @param {string|Path} path - Path to check.
     * @param {string} [err_prefix] - Optional prefix for the error message.
     */
    static ensure_exists_err(path, err_prefix = "") {
        path = new Path(path);
        if (!path.exists()) {
            throw new Error(`${err_prefix}Path "${path.str()}" does not exist.`);
        }
    }
    // ---------------------------------------------------------
    // Properties.
    /**
     * Get the length of the current path string.
     * @readonly
     * @returns {number} The number of characters in the path string.
     */
    get length() {
        return this.path.length;
    }
    get len() {
        return this.path.length;
    }
    /**
     * Get the file system stats for the current path.
     * @readonly
     * @returns {fs.Stats} The file system stats object with modified time properties.
     * @throws Error if the path does not exist or cannot be accessed.
     */
    get stat() {
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
     * @readonly
     * @returns {number} The numeric device identifier.
     */
    get dev() {
        return this.stat.dev;
    }
    /**
     * Get the file system specific inode number.
     * @readonly
     * @returns {number} The inode number of the file.
     */
    get ino() {
        return this.stat.ino;
    }
    /**
     * Get the file mode bits (permission and type).
     * @readonly
     * @returns {number} The file mode bits.
     */
    get mode() {
        return this.stat.mode;
    }
    /**
     * Get the number of hard links to the file.
     * @readonly
     * @returns {number} The number of hard links.
     */
    get nlink() {
        return this.stat.nlink;
    }
    /**
     * Get the user identifier of the file's owner.
     * @readonly
     * @returns {number} The numeric user ID.
     */
    get uid() {
        return this.stat.uid;
    }
    /**
     * Get the group identifier of the file's group.
     * @readonly
     * @returns {number} The numeric group ID.
     */
    get gid() {
        return this.stat.gid;
    }
    /**
     * Get the device identifier for special files.
     * @readonly
     * @returns {number} The device identifier for special files.
     */
    get rdev() {
        return this.stat.rdev;
    }
    /**
     * Get the total size in bytes. For directories, calculates size recursively.
     * @readonly
     * @returns {number} Total size in bytes.
     */
    get size() {
        if (this.stat.isDirectory()) {
            let size = 0;
            function calc(path) {
                const stat = fs.statSync(path);
                if (stat.isFile()) {
                    size += stat.size;
                }
                else if (stat.isDirectory()) {
                    fs.readdirSync(path).forEach(file => calc(`${path}/${file}`));
                }
            }
            calc(this.path);
            return size;
        }
        else {
            return this.stat.size;
        }
    }
    /**
     * Get the file system block size for I/O operations.
     * @readonly
     * @returns {number} Block size in bytes.
     */
    get blksize() {
        return this.stat.blksize;
    }
    /**
     * Get the number of blocks allocated to the file.
     * @readonly
     * @returns {number} Number of allocated blocks.
     */
    get blocks() {
        return this.stat.blocks;
    }
    /**
     * Get the last access time of the file (in milliseconds).
     * @readonly
     * @returns {number} Milliseconds representing the last access time.
     */
    get atime() {
        return this.stat.atimeMs;
    }
    /**
     * Get the last modification time of the file (in milliseconds).
     * @readonly
     * @returns {number} Milliseconds representing the last modification time.
     */
    get mtime() {
        return this.stat.mtimeMs;
    }
    /**
     * Get the last change time of the file metadata (in milliseconds).
     * @readonly
     * @returns {number} Milliseconds representing the last change time.
     */
    get ctime() {
        return this.stat.ctimeMs;
    }
    /**
     * Get the creation time of the file (in milliseconds).
     * @readonly
     * @returns {number} Milliseconds representing the file creation time.
     */
    get birthtime() {
        return this.stat.birthtimeMs;
    }
    /**
     * Get disk usage information for the directory.
     * @async
     * @throws {Error} If the path is not a directory.
     * @returns {Promise<{available: number; free: number; total: number}>} Object containing disk space information in bytes.
     */
    async disk_usage() {
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
     * @async
     * @throws {Error} If the path is not a directory.
     * @returns {Promise<number>} Number of bytes available to the current user.
     */
    async available_space() {
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
     */
    eq(path) {
        if (path instanceof Path) {
            return this.path === path.path;
        }
        return this.path === path;
    }
    /**
     * Reset internal caches except path string.
     * @returns {this} The Path instance for chaining.
     */
    reset() {
        this._stat = undefined;
        this._full_name = undefined;
        this._name = undefined;
        this._extension = undefined;
        this._base = undefined;
        this._abs = undefined;
        return this;
    }
    refresh() {
        return this.reset();
    }
    /**
     * {Is file}
     * Check if the path is a directory
     */
    is_file() {
        return this.stat.isFile();
    }
    /**
     * {Is directory}
     * Check if the path is a directory
     */
    is_dir() {
        return this.stat.isDirectory();
    }
    /** @docs
     *  @title Exists
     *  @desc Check if the path exists
     */
    exists() {
        return fs.existsSync(this.path);
    }
    /**
     * Get the base path of this path, correctly handling escaped separators.
     * @param back - Number of directory levels to traverse up (default: 1).
     * @returns The parent Path instance, or undefined if at root.
     */
    base(back = 1) {
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
    /** Convert to a unix based path. */
    unix() {
        return new Path(this.path.split(pathlib.sep).join('/'), false);
    }
    /**
     * Get the full name of the path, including the file extension.
     * @param with_ext - Whether to include the file extension in the returned name (default: true).
     * @returns The full name of the path, with or without the extension.
     */
    full_name(with_ext = true) {
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
                if (m)
                    this._extension = m[0];
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
    /** Get the name of the file path without the extension. */
    name() {
        if (this._name !== undefined) {
            return this._name;
        }
        this.full_name();
        return this._name;
    }
    /**
     * Get the extension of the path, with correct multi-dot extension support.
     * @returns The file extension, including leading dot, or empty string if none.
     */
    extension() {
        if (this._extension !== undefined) {
            return this._extension;
        }
        this.full_name();
        return this._extension;
    }
    /** @docs
     *  @title Get absolute
     *  @desc Get the absolute path of the path
     */
    abs() {
        if (this._abs !== undefined) {
            return this._abs;
        }
        this._abs = new Path(pathlib.resolve(this.path));
        return this._abs;
    }
    static abs(path) {
        return new Path(path).abs();
    }
    /** @docs
     *  @title Join
     *  @desc Join the path with another name or subpath
     */
    join(subpath, clean = true) {
        if (subpath instanceof Path) {
            return new Path(`${this.path}/${subpath.path}`, clean);
        }
        return new Path(`${this.path}/${subpath}`, clean);
    }
    /** @docs
     *  @title Copy
     *  @desc Copy the path to another location
     *  @funcs 2
     */
    async cp(destination) {
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
                }
                else {
                    resolve();
                }
            });
        });
    }
    cp_sync(destination) {
        if (destination == null) {
            throw new Error("Define parameter \"destination\".");
        }
        if (destination instanceof Path) {
            destination = destination.path;
        }
        fs_extra.copySync(this.path, destination);
    }
    /** @docs
     *  @title Move
     *  @desc Move the path to another location
     */
    async mv(destination) {
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
                }
                else {
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
    async del({ recursive = false } = {}) {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                if (this.is_dir()) {
                    fs.rm(this.path, { recursive }, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                }
                else {
                    fs.unlink(this.path, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                }
            }
        });
    }
    del_sync({ recursive = false } = {}) {
        if (this.exists()) {
            if (this.is_dir()) {
                fs.rmSync(this.path, { recursive });
            }
            else {
                fs.unlinkSync(this.path);
            }
        }
        return this;
    }
    /** @docs
     *  @title Trash
     *  @desc Move the path to the trash directory
     */
    async trash() {
        return new Promise(async (resolve, reject) => {
            const full_name = this.full_name();
            let trash;
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
            let destination;
            try {
                destination = `${trash}/${full_name}`;
                let counts = 0;
                while (fs.existsSync(destination)) {
                    ++counts;
                    destination = `${trash}/${full_name}-${counts}`;
                }
                await this.mv(destination);
            }
            catch (err) {
                return reject(err);
            }
            resolve();
        });
    }
    /** @docs
     *  @title Mkdir
     *  @desc Create a directory
     */
    async mkdir() {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                return resolve();
            }
            fs.mkdir(this.path, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    mkdir_sync() {
        if (this.exists()) {
            return this;
        }
        fs.mkdirSync(this.path, { recursive: true });
        return this;
    }
    /** @docs
     *  @title Touch
     *  @desc Create a file
     */
    async touch() {
        return this.save("");
    }
    /**
     * Relative.
     */
    relative(child) {
        if (child instanceof Path) {
            return new Path(pathlib.relative(this.path, child.path), false);
        }
        return new Path(pathlib.relative(this.path, child), false);
    }
    quote(def = '""') {
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
     */
    unquote() {
        return new Path(StringUtils.unquote(this.path), false);
    }
    async load({ type = "string", encoding = undefined } = {}) {
        return new Promise((resolve, reject) => {
            fs.readFile(this.path, encoding, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (type == null || type === "buffer") {
                        resolve(data);
                    }
                    else if (type === "string") {
                        resolve(data.toString());
                    }
                    else if (type === "array" || type === "object" || type === "json") {
                        resolve(JSON.parse(typeof data === "string" ? data : data.toString()));
                    }
                    else if (type === "json5") {
                        resolve(JSON5.parse(typeof data === "string" ? data : data.toString()));
                    }
                    else if (type === "jsonc") {
                        resolve(JSONC.parse(typeof data === "string" ? data : data.toString()));
                    }
                    else if (type === "number") {
                        resolve(parseFloat(data.toString()));
                    }
                    else if (type === "boolean") {
                        const str = data.toString();
                        resolve(str === "1" || str === "true" || str === "TRUE" || str === "True");
                    }
                    else {
                        // @ts-expect-error
                        throw Error(`Invalid type "${type.toString()}".`);
                    }
                }
            });
        });
    }
    load_sync({ type = "string", encoding = undefined, } = {}) {
        const data = fs.readFileSync(this.path, encoding);
        if (type == null || type === "buffer") {
            return data;
        }
        else if (type === "string") {
            return data.toString();
        }
        else if (type === "array" || type === "object" || type === "json") {
            return JSON.parse(typeof data === "string" ? data : data.toString());
        }
        else if (type === "json5") {
            return JSON5.parse(typeof data === "string" ? data : data.toString());
        }
        else if (type === "jsonc") {
            return JSONC.parse(typeof data === "string" ? data : data.toString());
        }
        else if (type === "number") {
            return parseFloat(data.toString());
        }
        else if (type === "boolean") {
            const str = data.toString();
            return str === "1" || str === "true" || str === "TRUE" || str === "True";
        }
        else {
            // @ts-expect-error
            throw Error(`Invalid type "${type.toString()}".`);
        }
    }
    async save(data, opts) {
        if (opts?.type) {
            if (opts.type == null || opts.type === "buffer") {
                // skip
            }
            else if (opts.type === "string") {
                // skip
            }
            else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
                data = JSON.stringify(data);
            }
            else if (opts.type === "jsonc") {
                await JSONC.save(this.path, data);
                return;
            }
            else if (opts.type === "number") {
                data = data.toString();
            }
            else if (opts.type === "boolean") {
                data = data.toString();
            }
            else {
                // @ts-expect-error
                throw Error(`Invalid type parameter "${opts.type.toString()}".`);
            }
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(this.path, data, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    save_sync(data, opts) {
        if (opts?.type) {
            if (opts.type == null || opts.type === "buffer") {
                // skip
            }
            else if (opts.type === "string") {
                // skip
            }
            else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
                data = JSON.stringify(data);
            }
            else if (opts.type === "jsonc") {
                throw new Error("JSONC is not supported in sync mode.");
            }
            else if (opts.type === "number") {
                data = data.toString();
            }
            else if (opts.type === "boolean") {
                data = data.toString();
            }
            else {
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
     */
    async read_lines(callback) {
        const lines = [];
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
    async paths({ recursive = false, absolute = true, exclude, string = false, } = {}) {
        const exclude_list = exclude instanceof Path.ExcludeList
            ? exclude
            : Array.isArray(exclude)
                ? new Set()
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
                }
                else {
                    if (this.join(exclude[i], false).exists()) {
                        path = this.join(exclude[i], false).abs();
                    }
                }
                exclude_list.add(path.str());
            }
        }
        return new Promise(async (resolve, reject) => {
            if (!this.is_dir()) {
                return reject(new Error(`Path "${this.path}" is not a directory.`));
            }
            if (!recursive) {
                fs.readdir(this.path, (err, files) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const list = [];
                        files.forEach(name => {
                            const path = this.join(name);
                            if (exclude_list == null || exclude_list.size === 0 || !exclude_list.has(path.str())) {
                                list.push(absolute
                                    ? string ? path.str() : path
                                    : string ? name : new Path(name, false));
                            }
                        });
                        resolve(list);
                    }
                });
            }
            else {
                const files = [];
                const traverse = (path, relative_path) => {
                    return new Promise((resolve, reject) => {
                        fs.readdir(path.path, async (err, children) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                try {
                                    for (const child of children) {
                                        const child_path = path.join(child);
                                        if (exclude_list != null && (exclude_list.size === 0 || !exclude_list.has(path.str()))) {
                                            continue;
                                        }
                                        const relative_child = absolute ? undefined : relative_path ? relative_path.join(child) : new Path(child, false);
                                        files.push(absolute
                                            ? string ? child_path.str() : child_path
                                            : string ? relative_child?.str() : relative_child);
                                        if (child_path.is_dir()) {
                                            await traverse(child_path, relative_child);
                                        }
                                    }
                                    resolve();
                                }
                                catch (e) {
                                    reject(e);
                                }
                            }
                        });
                    });
                };
                try {
                    await traverse(this, undefined);
                    resolve(files);
                }
                catch (err) {
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
     */
    static async glob(patterns, opts) {
        const as_string = opts?.string ?? false;
        return (await fg(Array.isArray(patterns) ? patterns : [patterns], {
            cwd: opts?.cwd instanceof Path ? opts?.cwd.path : opts?.cwd,
            dot: opts?.dot ?? true,
            onlyFiles: opts?.only_files ?? false,
            onlyDirectories: opts?.only_directories ?? false,
            unique: opts?.unique ?? true,
            absolute: opts?.absolute ?? true,
            stats: (opts?.stats ?? false), // set as true to statisfy type requirements
            ignore: opts?.exclude,
        }))
            .map(p => typeof p === "string" // ensure we check for string type for when `opts.stats` is false.
            ? as_string ? p : new Path(p, false)
            : as_string ? p.path : new Path(p.path, false, p.stats));
    }
    /**
     * Synchronously match file paths using glob patterns.
     */
    static glob_sync(patterns, opts) {
        const as_string = opts?.string ?? false;
        return fg.sync(Array.isArray(patterns) ? patterns : [patterns], {
            cwd: opts?.cwd instanceof Path ? opts?.cwd.path : opts?.cwd,
            dot: opts?.dot ?? true,
            onlyFiles: opts?.only_files ?? false,
            onlyDirectories: opts?.only_directories ?? false,
            unique: opts?.unique ?? true,
            absolute: opts?.absolute ?? true,
            stats: (opts?.stats ?? false), // set as true to statisfy type requirements
            ignore: opts?.exclude,
        })
            .map(p => typeof p === "string" // ensure we check for string type for when `opts.stats` is false.
            ? as_string ? p : new Path(p, false)
            : as_string ? p.path : new Path(p.path, false, p.stats));
    }
}
/**
 * Path types.
 */
(function (Path) {
    /**
     * A glob / regex path exclude list class.
     * @libris
     */
    class ExcludeList {
        /** Size to keep uniform with `Set`. */
        size = 0;
        /** The internal exclude list. */
        exclude_list = [];
        /** An internal cache. */
        cache = new Map();
        /** The constructor. */
        constructor(...exclude_list) {
            for (const item of exclude_list) {
                if (item instanceof RegExp) {
                    this.exclude_list.push(item);
                }
                else {
                    this.exclude_list.push(new Minimatch(this.normalize(item), {
                        dot: true, // allow matches on dot-files/dirs
                        matchBase: false,
                    }));
                }
            }
            this.size = this.exclude_list.length;
        }
        /** Normalize a path. */
        normalize(input) {
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
        has(input) {
            if (this.cache.has(input)) {
                return this.cache.get(input);
            }
            const normalized = this.normalize(input);
            const res = this.exclude_list.some(item => ((item instanceof RegExp && item.test(normalized))
                || (item instanceof Minimatch && item.match(normalized))));
            this.cache.set(input, res);
            return res;
        }
    }
    Path.ExcludeList = ExcludeList;
})(Path || (Path = {}));
//# sourceMappingURL=path.js.map