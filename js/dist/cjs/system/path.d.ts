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
    data: string;
    private _stat?;
    private _name?;
    private _extension?;
    private _base?;
    private _abs?;
    constructor(path: string | Path, clean?: boolean);
    trim(): void;
    /** To string. */
    toString(): string;
    str(): string;
    /** Cast to primitives. */
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number;
    /** @docs
     *  @title home
     *  @desc Get the user's home directory path
     *  @static true
     *  @returns
     *      @type Path
     *      @desc A new Path instance pointing to the user's home directory
     */
    static home(): Path;
    /** @docs
     *  @title length
     *  @desc Get the length of the current path string
     *  @property true
     *  @returns
     *      @type number
     *      @desc The number of characters in the path string
     *  @funcs 2
     */
    get length(): number;
    get len(): number;
    /** @docs
     *  @title stat
     *  @desc Get the file system stats for the current path
     *  @property true
     *  @returns
     *      @type fs.Stats
     *      @desc The file system stats object with modified time properties
     */
    get stat(): fs.Stats;
    /** @docs
     *  @title Device ID
     *  @desc Get the device identifier where the file resides
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric device identifier
     */
    get dev(): number;
    /** @docs
     *  @title Inode number
     *  @desc Get the file system specific inode number
     *  @property true
     *  @returns
     *      @type number
     *      @desc The inode number of the file
     */
    get ino(): number;
    /** @docs
     *  @title File mode
     *  @desc Get the file mode bits
     *  @property true
     *  @returns
     *      @type number
     *      @desc The file mode containing permission bits and file type
     */
    get mode(): number;
    /** @docs
     *  @title Hard links
     *  @desc Get the number of hard links to the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Number of hard links
     */
    get nlink(): number;
    /** @docs
     *  @title User ID
     *  @desc Get the user identifier of the file's owner
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric user ID
     */
    get uid(): number;
    /** @docs
     *  @title Group ID
     *  @desc Get the group identifier of the file's group
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric group ID
     */
    get gid(): number;
    /** @docs
     *  @title Device ID (if special file)
     *  @desc Get the device identifier for special files
     *  @property true
     *  @returns
     *      @type number
     *      @desc The numeric device identifier for special files
     */
    get rdev(): number;
    /** @docs
     *  @title Size
     *  @desc Get the total size in bytes. For directories, calculates total size recursively
     *  @property true
     *  @returns
     *      @type number
     *      @desc Total size in bytes
     */
    get size(): number;
    /** @docs
     *  @title Block size
     *  @desc Get the file system block size for I/O operations
     *  @property true
     *  @returns
     *      @type number
     *      @desc Block size in bytes
     */
    get blksize(): number;
    /** @docs
     *  @title Blocks
     *  @desc Get the number of blocks allocated to the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Number of allocated blocks
     */
    get blocks(): number;
    /** @docs
     *  @title Access time
     *  @desc Get the last access time of the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the last access time
     */
    get atime(): number;
    /** @docs
     *  @title Modification time
     *  @desc Get the last modification time of the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the last modification time
     */
    get mtime(): number;
    /** @docs
     *  @title Change time
     *  @desc Get the last change time of the file (metadata changes)
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the last change time
     */
    get ctime(): number;
    /** @docs
     *  @title Creation time
     *  @desc Get the creation time of the file
     *  @property true
     *  @returns
     *      @type number
     *      @desc Millisecods number representing the file creation time
     */
    get birthtime(): number;
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
    disk_usage(): Promise<undefined | {
        available: number;
        free: number;
        total: number;
    }>;
    /** @docs
     *  @title Available space
     *  @desc Get available disk space for the directory
     *  @throws Error if path is not a directory
     *  @returns
     *      @type Promise<number>
     *      @desc Number of bytes available to the current user
     */
    available_space(): Promise<number | undefined>;
    /**
     * Equals another string or path.
     */
    eq(path: string | Path): boolean;
    /** @docs
     *  @title Reset
     *  @desc Reset the path attribute's except the path name
     *  @note Should be called when the operating system's path has changed
     */
    reset(): this;
    refresh(): this;
    /** @docs
     *  @title Is directory
     *  @desc Check if the path is a directory
     */
    is_dir(): boolean;
    /** @docs
     *  @title Exists
     *  @desc Check if the path exists
     */
    exists(): boolean;
    static exists(path: string): boolean;
    /** @docs
     *  @title Ensure Exists
     *  @desc Ensure a path exists, if not throw an error.
     */
    static ensure_exists_err(path: string | Path, err_prefix?: string): void;
    /** @docs
     *  @title Get name
     *  @desc Get the (full) name of the path
     */
    name(with_extension?: boolean): string;
    /** @docs
     *  @title Get extension
     *  @desc Get the extension of the path
     */
    extension(): string;
    /** @docs
     *  @title Get base
     *  @desc Get the base path of the path
     *  @note Returns `null` when the path does not have a base path
     */
    base(back?: number): Path | undefined;
    /** @docs
     *  @title Get absolute
     *  @desc Get the absolute path of the path
     */
    abs(): Path;
    static abs(path: string | Path): Path;
    /** @docs
     *  @title Join
     *  @desc Join the path with another name or subpath
     */
    join(subpath: string | Path, clean?: boolean): Path;
    /** @docs
     *  @title Copy
     *  @desc Copy the path to another location
     *  @funcs 2
     */
    cp(destination: string | Path): Promise<void>;
    cp_sync(destination: string | Path): void;
    /** @docs
     *  @title Move
     *  @desc Move the path to another location
     */
    mv(destination: string | Path): Promise<void>;
    /** @docs
     *  @title Delete
     *  @desc Delete the path
     *  @funcs 2
     */
    del({ recursive }?: {
        recursive?: boolean | undefined;
    }): Promise<void>;
    del_sync({ recursive }?: {
        recursive?: boolean | undefined;
    }): this;
    /** @docs
     *  @title Trash
     *  @desc Move the path to the trash directory
     */
    trash(): Promise<void>;
    /** @docs
     *  @title Mkdir
     *  @desc Create a directory
     */
    mkdir(): Promise<void>;
    mkdir_sync(): this;
    /** @docs
     *  @title Touch
     *  @desc Create a file
     */
    touch(): Promise<void>;
    /** @docs
     *  @title Load
     *  @desc Load the data from the path
     *  @funcs 2
     */
    load<R extends Buffer = Buffer>(opts: {
        type: undefined | "buffer";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load<R extends boolean = boolean>(opts: {
        type: "boolean";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load<R extends number = number>(opts: {
        type: "number";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load<R extends string = string>(opts?: {
        type?: "string";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load<R extends any[] = any[]>(opts: {
        type: "array";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load<R extends Record<any, any> = Record<any, any>>(opts: {
        type: "object";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load<R extends any[] | Record<any, any> = any[] | Record<any, any>>(opts: {
        type: "json" | "json5" | "jsonc";
        encoding?: BufferEncoding;
    }): Promise<R>;
    load_sync<R extends Buffer = Buffer>(opts: {
        type: undefined | "buffer";
        encoding?: BufferEncoding;
    }): R;
    load_sync<R extends boolean = boolean>(opts: {
        type: "boolean";
        encoding?: BufferEncoding;
    }): R;
    load_sync<R extends number = number>(opts: {
        type: "number";
        encoding?: BufferEncoding;
    }): R;
    load_sync<R extends string = string>(opts?: {
        type?: "string";
        encoding?: BufferEncoding;
    }): R;
    load_sync<R extends any[] = any[]>(opts: {
        type: "array";
        encoding?: BufferEncoding;
    }): R;
    load_sync<R extends Record<string, any> = Record<string, any>>(opts: {
        type: "object";
        encoding?: BufferEncoding;
    }): R;
    load_sync<R extends any[] | Record<string, any> = any[] | Record<string, any>>(opts: {
        type: "json" | "json5" | "jsonc";
        encoding?: BufferEncoding;
    }): R;
    /** @docs
     *  @title Save
     *  @desc Save data to the path
     *  @funcs 2
     */
    save(data: any, opts: {
        type: Path.LoadSaveTypeName;
    }): Promise<void>;
    save(data: string | Buffer, opts?: {
        type?: Path.LoadSaveTypeName;
    }): Promise<void>;
    save_sync(data: any, opts: {
        type: Exclude<Path.LoadSaveTypeName, "jsonc">;
    }): this;
    save_sync(data: string | Buffer, opts?: {
        type?: Exclude<Path.LoadSaveTypeName, "jsonc">;
    }): this;
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
    /** @docs
     *  @title Truncate
     *  @desc Truncate the file
     */
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
    static find_common_base_path(paths: string[]): string | undefined;
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
     * Relative.
     */
    relative(child: string | Path): Path;
}
/**
 * Path types.
 */
export declare namespace Path {
    /**
     * The valid types for `load` `save` methods.
     */
    type LoadSaveTypeName = undefined | "boolean" | "number" | "string" | "buffer" | "array" | "object" | "json" | "json5" | "jsonc";
    type LoadSaveType = undefined | boolean | number | string | Buffer | any[] | Record<string, any>;
    /**
     * A glob / regex path exclude list class.
     * @libris
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
        /** Normalize a path. */
        normalize(input: string): string;
        /**
         * Check if a path is excluded.
         * @returns True if the path is matched by the exclude list.
         * @libris
         */
        has(input: string): boolean;
    }
}
