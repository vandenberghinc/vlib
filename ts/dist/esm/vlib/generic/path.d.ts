/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as fs from 'fs';
/**
 * The path class.
 * @libris
 */
export declare class Path {
    path: string;
    private _stat?;
    private _full_name?;
    private _name?;
    private _extension?;
    private _base?;
    private _abs?;
    constructor(path: string | Path, clean?: boolean, stats?: fs.Stats);
    trim(): void;
    /** To string. */
    toString(): string;
    str(): string;
    /** Cast to primitives. */
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number;
    /**
     * Get the user's home directory path.
     * @returns {Path} A new Path instance pointing to the user's home directory.
     */
    static home(): Path;
    /**
     * Get the current working directory path.
     * @returns {Path} A new Path instance pointing to the current working directory.
     */
    static cwd(): Path;
    /**
     * Get the temporary directory path.
     * @returns {Path} A new Path instance pointing to the system's temporary directory.
     */
    static tmp(): Path;
    /**
     * Get the current operating system's path separator.
     * @returns {string} The path separator used by the current operating system ('/' for Unix-like, '\\' for Windows).
     */
    static sep(): string;
    /**
     * Find the common base path between an array of paths.
     * @param {string[]} paths - Array of path strings to analyze.
     * @returns {string|undefined} Returns a string when a common base path has been found, or undefined otherwise.
     */
    static find_common_base_path(paths: string[]): string | undefined;
    /** Check if a path exists. */
    static exists(path: string): boolean;
    /**
     * Ensure a path exists; throw an error if not.
     * @param path Path to check.
     * @param err_prefix Optional prefix for the error message.
     */
    static ensure_exists_err(path: string | Path, err_prefix?: string): void;
    /**
     * Get the length of the current path string.
     * @returns {number} The number of characters in the path string.
     */
    get length(): number;
    get len(): number;
    /**
     * Get the file system stats for the current path.
     * @returns {fs.Stats} The file system stats object with modified time properties.
     * @throws Error if the path does not exist or cannot be accessed.
     */
    get stat(): fs.Stats;
    /**
     * Get the device identifier where the file resides.
     * @returns {number} The numeric device identifier.
     */
    get dev(): number;
    /**
     * Get the file system specific inode number.
     * @returns {number} The inode number of the file.
     */
    get ino(): number;
    /**
     * Get the file mode bits (permission and type).
     * @returns {number} The file mode bits.
     */
    get mode(): number;
    /**
     * Get the number of hard links to the file.
     * @returns {number} The number of hard links.
     */
    get nlink(): number;
    /**
     * Get the user identifier of the file's owner.
     * @returns {number} The numeric user ID.
     */
    get uid(): number;
    /**
     * Get the group identifier of the file's group.
     * @returns {number} The numeric group ID.
     */
    get gid(): number;
    /**
     * Get the device identifier for special files.
     * @returns {number} The device identifier for special files.
     */
    get rdev(): number;
    /**
     * Get the total size in bytes. For directories, calculates size recursively.
     * @returns {number} Total size in bytes.
     */
    get size(): number;
    /**
     * Get the file system block size for I/O operations.
     * @returns {number} Block size in bytes.
     */
    get blksize(): number;
    /**
     * Get the number of blocks allocated to the file.
     * @returns {number} Number of allocated blocks.
     */
    get blocks(): number;
    /**
     * Get the last access time of the file (in milliseconds).
     * @returns {number} Milliseconds representing the last access time.
     */
    get atime(): number;
    /**
     * Get the last modification time of the file (in milliseconds).
     * @returns {number} Milliseconds representing the last modification time.
     */
    get mtime(): number;
    /**
     * Get the last change time of the file metadata (in milliseconds).
     * @returns {number} Milliseconds representing the last change time.
     */
    get ctime(): number;
    /**
     * Get the creation time of the file (in milliseconds).
     * @returns {number} Milliseconds representing the file creation time.
     */
    get birthtime(): number;
    /**
     * Get disk usage information for the directory.
     * @throws {Error} If the path is not a directory.
     * @returns {Promise<{available: number; free: number; total: number}>} Object containing disk space information in bytes.
     */
    disk_usage(): Promise<undefined | {
        available: number;
        free: number;
        total: number;
    }>;
    /**
     * Get available disk space for the directory.
     * @throws {Error} If the path is not a directory.
     * @returns {Promise<number>} Number of bytes available to the current user.
     */
    available_space(): Promise<number | undefined>;
    /**
     * Equals another string or path.
     */
    eq(path: string | Path): boolean;
    /**
     * Reset internal caches except path string.
     * @returns {this} The Path instance for chaining.
     */
    reset(): this;
    refresh(): this;
    /**
     * Check if the path is a directory
     */
    is_file(): boolean;
    static is_file(path: string | Path): boolean;
    /**
     * Check if the path is a directory
     */
    is_dir(): boolean;
    /**
     * Check if the path exists
     * @docs
     */
    exists(): boolean;
    /**
     * Get the base path of this path, correctly handling escaped separators.
     * @param back - Number of directory levels to traverse up (default: 1).
     * @returns The parent Path instance, or undefined if at root.
     */
    base(back?: number): Path | undefined;
    /** Convert to a POSIX-style Path. */
    posix(): Path;
    /** Static: convert `path` to a POSIX-style Path. */
    static posix(path: string | Path): Path;
    /** Static: return `path` as a POSIX-style string. */
    static posix_str(path: string | Path): string;
    /**
     * Get the full name of the path, including the file extension.
     * @param with_ext - Whether to include the file extension in the returned name (default: true).
     * @returns The full name of the path, with or without the extension.
     */
    full_name(with_ext?: boolean): string;
    /** Get the name of the file path without the extension. */
    name(): string;
    /**
     * Get the extension of the path, with correct multi-dot extension support.
     * @returns The file extension, including leading dot, or empty string if none.
     */
    extension(): string;
    /**
     * Get the absolute path of the path
     * @docs
     */
    abs(): Path;
    static abs(path: string | Path): Path;
    /**
     * Join the path with another name or subpath
     * @docs
     */
    join(subpath: string | Path, clean?: boolean): Path;
    /**
     * Copy the path to another location
     * @funcs 2
     * @docs
     */
    cp(destination: string | Path): Promise<void>;
    cp_sync(destination: string | Path): void;
    /**
     * Move the path to another location
     * @docs
     */
    mv(destination: string | Path): Promise<void>;
    /**
     * Delete the path
     * @funcs 2
     * @docs
     */
    del({ recursive }?: {
        recursive?: boolean | undefined;
    }): Promise<void>;
    del_sync({ recursive }?: {
        recursive?: boolean | undefined;
    }): this;
    /**
     * Move the path to the trash directory
     * @docs
     */
    trash(): Promise<void>;
    /**
     * Create a directory
     * @param opts.recursive Whether to create parent directories if they do not exist, defaults to `false`
     *        Note that using `recursive: false` has slight performance benefits.
     * @docs
     */
    mkdir(opts?: {
        recursive?: boolean;
    }): Promise<void>;
    mkdir_sync(opts?: {
        recursive?: boolean;
    }): this;
    /**
     * Create a file
     * @docs
     */
    touch(): Promise<void>;
    /**
     * Relative.
     */
    relative(child: string | Path): Path;
    /**
     * Return the quoted representation of the path.
     * @param def The default value to return when the path is undefined.
     *            See {@link StringUtils.quote} for more information.
     */
    quote(def: undefined): undefined | Path;
    quote(def?: string | String | Path): Path;
    /**
     * Return the unquoted representation of the path.
     */
    unquote(): Path;
    /**
     * Load the data from the path
     * @funcs 2
     * @docs
     */
    load<T extends LoadSaveTypeName = "string">({ type, encoding }?: {
        type?: T;
        encoding?: BufferEncoding;
    }): Promise<CastLoadSaveType<T>>;
    load_sync<T extends LoadSaveTypeName = "string">({ type, encoding, }?: {
        type?: T;
        encoding?: BufferEncoding;
    }): CastLoadSaveType<T>;
    /**
     * Save data to the path
     * @funcs 2
     * @docs
     */
    save(data: any, opts: {
        type: LoadSaveTypeName;
    }): Promise<void>;
    save(data: string | Buffer, opts?: {
        type?: LoadSaveTypeName;
    }): Promise<void>;
    save_sync(data: any, opts: {
        type: Exclude<LoadSaveTypeName, "jsonc">;
    }): this;
    save_sync(data: string | Buffer, opts?: {
        type?: Exclude<LoadSaveTypeName, "jsonc">;
    }): this;
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
    read_lines(callback?: (line: string, index: number) => void): Promise<string[]>;
    /**
    * Get the child paths of a directory
    * @throws An error when the path is not a directory
    * @param recursive Get all paths recursively.
    * @param exclude A list of exclude paths, an exact match will be checked when a `string[]` array is provided.
    *                However, glob- and regex patterns can be utilized as well by providing an `ExcludeList` class.
    * @param absolute Get the absolute paths instead of relative paths.
    * @param string Get all paths as raw strings instead of Path objects
    */
    paths(opts?: {
        recursive?: boolean;
        absolute?: boolean;
        exclude?: Path.ExcludeList | string[];
        string?: false;
    }): Promise<Path[]>;
    paths(opts: {
        recursive?: boolean;
        absolute?: boolean;
        exclude?: Path.ExcludeList | string[];
        string: true;
    }): Promise<string[]>;
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
    static glob<O extends Path.glob.Opts = Path.glob.Opts>(patterns: string | string[], opts?: O): Promise<O extends {
        string: true;
    } ? string[] : O extends {
        string?: false;
    } ? Path[] : never>;
    /**
     * Synchronously match file paths using glob patterns.
     */
    static glob_sync<O extends Path.glob.Opts = Path.glob.Opts>(patterns: string | string[], opts?: O): O extends {
        string: true;
    } ? string[] : O extends {
        string?: false;
    } ? Path[] : never;
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
};
type LoadSaveTypeName = keyof LoadSaveTypeMap;
type CastLoadSaveType<T extends LoadSaveTypeName, Never = never> = T extends keyof LoadSaveTypeMap ? LoadSaveTypeMap[T] : Never;
/**
 * Path types.
 */
export declare namespace Path {
    /**
     * Types for glob methods.
     */
    namespace glob {
        /**
         * Options for the `Path.glob` and `Path.glob_sync` methods.
         */
        type Opts = {
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
        };
    }
    /**
     * A glob / regex path exclude list class.
     * @deprecated Use {@link GlobPattern} and {@link GlobPatternList} instead.
     */
    class ExcludeList {
        /** Size to keep uniform with `Set`. */
        size: number;
        /** The internal exclude list. */
        private exclude_list;
        /** An internal cache. */
        private cache;
        /** The constructor. */
        constructor(...exclude_list: (string | RegExp)[]);
        /**
         * Normalize a path.
         * @deprecated Use {@link GlobPattern} and {@link GlobPatternList} instead.
         */
        normalize(input: string): string;
        /**
         * Check if a path is excluded.
         * @returns True if the path is matched by the exclude list.
         * @deprecated Use {@link GlobPattern} and {@link GlobPatternList} instead.
         */
        has(input: string): boolean;
    }
}
export {};
