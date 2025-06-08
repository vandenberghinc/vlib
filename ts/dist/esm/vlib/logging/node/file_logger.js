/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Logger } from "../uni/logger.js";
/**
 * Extension of the Logger class providing file logging capabilities,
 * while still printing to the console.
 */
export class FileLogger extends Logger {
    /**
     * Construct a file logger instance.
     * See ${@link Logger} for more info about the constructor options.
     */
    constructor(opts) {
        super({ level: opts.level, debug: false });
        if (opts.log_path || opts.error_path) {
            this.pipe.assign_paths(opts.log_path, opts.error_path);
        }
    }
    /**
     * Stop the logger and close the file streams.
     */
    stop() {
        this.pipe.stop();
    }
    /**
     * Assign paths for the logger class.
     * @param log_path The optional log path.
     * @param error_path The optional error path.
     */
    assign_paths(log_path, error_path) {
        this.pipe.assign_paths(log_path, error_path);
    }
}
//# sourceMappingURL=file_logger.js.map