/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as fs from 'fs';
import { Path } from "../../generic/path.js";
import { Directive } from '../uni/directives.js';
import { Pipe } from '../uni/pipe.js';
/**
 * The file pipe, similar to the `Pipe` class but with file logging capabilities.
 * It logs messages to both the console and specified log files.
 * Also streams different, parseable messages to the files.
 * Later these can be extracted into a structured list of log messages.
 * This could be used to extract or search for specific log messages,
 * @docs
 */
export declare class FilePipe extends Pipe<false, true> {
    log_path?: Path;
    error_path?: Path;
    log_stream?: fs.WriteStream;
    err_stream?: fs.WriteStream;
    max_mb?: number;
    thread: string;
    /**
     * The inherited `pipe` attribute is never used since this class overrides the `log` method, which is the only place where `pipe` is used.
     * @ts-expect-error */
    _out: never;
    _err: never;
    /**
     * Constructor.
     * @docs
     */
    constructor({ log_level, log_path, error_path, max_mb, }?: {
        log_level?: number;
        log_path?: string;
        error_path?: string;
        max_mb?: number;
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
     *
     * @docs
     */
    private truncate_log_file;
    /** The log file pattern. */
    private static readonly log_file_pattern;
    /**
     * Parse a log file.
     * @docs
     */
    private _parse_log_file;
    /**
     * Stop the logger and close the file streams.
     * @docs
     */
    stop(): void;
    /**
     * Assign paths for the logger class.
     * @param log_path The path to a new log path, or `undefined` to reset the log stream.
     * @param error_path The path to a new error path, or `undefined` to reset the error stream.
     * @docs
     */
    assign_paths(log_path?: string, error_path?: string): void;
    /**
     * Log data to the console and file streams when defined.
     * See {@link Pipe.log} for more details.
     *
     * @param args
     *      The data to log.
     *      The first number is treated as the local log level.
     *      Any other directives are allowed before the first non-directive / local log level argument.
     * @docs
     */
    log(...args: (Directive | Error | any)[]): void;
}
/** File pipe types. */
export declare namespace FilePipe {
    /** Parsed log message. */
    interface Log {
        date: string;
        loc?: string;
        thread?: string;
        level: number | undefined;
        type: "error" | "warning" | "log";
        message: string;
    }
}
