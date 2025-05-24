/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as fs from 'fs';
import { Path } from "../system/path.js";
import { SourceLoc } from './source_loc.js';
import Pipe, { DebuggerFunc } from './pipe.js';
/** Log directives */
declare const IsError: unique symbol;
type IsError = typeof IsError;
declare const IsWarning: unique symbol;
type IsWarning = typeof IsWarning;
declare const IsDebug: unique symbol;
type IsDebug = typeof IsDebug;
declare class UseActiveLogLevel extends Number {
    constructor(value: number);
}
/**
 * Parsed log message.
 */
export interface Log {
    date: string;
    loc?: string;
    thread?: string;
    level: number | undefined;
    type: "error" | "warning" | "log";
    message: string;
}
/** @docs:
 *  @chapter: System
 *  @title: Logger
 *  @descr:
 *      The logger object.
 *  @param:
 *      @name: log_level
 *      @descr: The active log level.
 *      @type: number
 *  @param:
 *      @name: log_path
 *      @descr: The optional log path.
 *      @type: string
 *  @param:
 *      @name: error_path
 *      @descr: The optional error path.
 *      @type: string
 *  @param:
 *      @name: max_mb
 *      @descr: The max mb to keep for the log files, when defined the log files will automatically be truncated.
 *      @type: number
 *  @param:
 *      @name: threading
 *      @descr: Enable threading behaviour, when enabled messages are prefixed with the thread id.
 *      @type: boolean
*/
export declare class Logger extends Pipe {
    log_path?: Path;
    error_path?: Path;
    log_stream?: fs.WriteStream;
    error_stream?: fs.WriteStream;
    max_mb?: number;
    thread: string;
    private debug_filename?;
    constructor({ log_level, debug_filename, log_path, error_path, max_mb, }?: {
        log_level?: number;
        log_path?: string;
        error_path?: string;
        max_mb?: number;
        /** When defined only debug statements from this filename will be shown */
        debug_filename?: string;
    });
    private _write_count;
    private readonly _truncate_interval;
    /**
     * Truncates the given file by removing lines at the start until its size is under max_bytes.
     * Closes and reopens the associated write stream to ensure subsequent writes go to the truncated file.
     *
     * @param path      The Path instance for the log or error file.
     * @param type Either 'log' or 'error' indicating which stream property to refresh.
     * @param max_bytes Maximum allowed file size in bytes.
     */
    private truncate_log_file;
    /** @docs:
     *  @title: Stop
     *  @descr: Stop the logger and close the file streams.
     */
    stop(): void;
    /** @docs:
     *  @title: Assign Paths
     *  @descr: Assign paths for the logger class.
     *  @param:
     *      @name: log_path
     *      @descr: The optional log path.
     *      @type: string
     *  @param:
     *      @name: error_path
     *      @descr: The optional error path.
     *      @type: string
     */
    assign_paths(log_path: string, error_path: string): void;
    /** The log file pattern. */
    private static readonly log_file_pattern;
    /**
     * Parse a log file.
     */
    _parse_log_file(path: Path): Promise<Log[]>;
    /** @docs:
     *  @title: Log
     *  @descr: Log data to the console and file streams when defined.
     *  @param:
     *      @name: level
     *      @descr: The log level of the message.
     *      @type: number
     *  @param:
     *      @name: args
     *      @descr:
     *          The data to log.
     *      @type: any[]
     */
    log(level: number | any, ...args: (SourceLoc | IsWarning | IsError | IsDebug | UseActiveLogLevel | Error | any)[]): void;
    /** Initialize a debugger / debug func with a predefined active log level */
    debugger(active_log_level: number): DebuggerFunc;
}
export default Logger;
export declare const logger: Logger;
