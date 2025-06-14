/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ActiveLogLevel } from "../uni/directives.js";
import { Logger } from "../uni/logger.js";
import { FilePipe } from "./file_pipe.js";
/**
 * Extension of the Logger class providing file logging capabilities,
 * while still printing to the console.
 */
export declare class FileLogger extends Logger<false, false, FilePipe> {
    /**
     * Construct a file logger instance.
     * See ${@link Logger} for more info about the constructor options.
     */
    constructor(opts: {
        /** The log level. */
        level?: number | ActiveLogLevel;
        /** The log file path. */
        log_path?: string;
        /** The error file path. */
        error_path?: string;
    });
    /**
     * Stop the logger and close the file streams.
     */
    stop(): void;
    /**
     * Assign paths for the logger class.
     * @param log_path The optional log path.
     * @param error_path The optional error path.
     */
    assign_paths(log_path: string, error_path?: string): void;
}
