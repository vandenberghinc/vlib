/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as fs from 'fs';
import { Path } from "../generic/path.js";
import { Directive } from '../debugging/directives.js';
import { Pipe } from '../debugging/pipe.js';
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
/**
 *  The logger object.
 *
 *  @param {number} log_level The active log level.
 *  @param {string} log_path The optional log path.
 *  @param {string} error_path The optional error path.
 *  @param {number} max_mb The max mb to keep for the log files, when defined the log files will automatically be truncated.
 *  @param {boolean} threading Enable threading behaviour, when enabled messages are prefixed with the thread id.
*/
export declare class Logger extends Pipe {
    log_path?: Path;
    error_path?: Path;
    log_stream?: fs.WriteStream;
    error_stream?: fs.WriteStream;
    max_mb?: number;
    thread: string;
    private debug_filename?;
    /**
     * The inherited `pipe` attribute is never used since this class overrides the `log` method, which is the only place where `pipe` is used.
     * @ts-expect-error */
    _out: never;
    _err: never;
    /** Constructor. */
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
    /**
     * Stop the logger and close the file streams.
     */
    stop(): void;
    /**
     * Assign paths for the logger class.
     * @param log_path The optional log path.
     * @param error_path The optional error path.
     */
    assign_paths(log_path: string, error_path: string): void;
    /** The log file pattern. */
    private static readonly log_file_pattern;
    /**
     * Parse a log file.
     */
    _parse_log_file(path: Path): Promise<Log[]>;
    /** @docs:
     * Log data to the console and file streams when defined.
     * See {@link Pipe.log} for more details.
     *
     * @param args
     *      The data to log.
     *      The first number is treated as the local log level.
     *      Any other directives are allowed before the first non-directive / local log level argument.
     */
    log(...args: (Directive | Error | any)[]): void;
}
export declare const logger: Logger;
