/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Logger } from "../uni/logger.js";
import { FilePipe } from "./file_pipe.js";
/**
 * Extension of the Logger class providing file logging capabilities,
 * while still printing to the console.
 *
 * @nav Logging
 * @docs
 */
export class FileLogger extends Logger {
    /**
     * Construct a file logger instance.
     * See ${@link Logger} for more info about the constructor options.
     */
    constructor(opts) {
        super({
            level: opts.level,
            debug: false,
            raw: false,
            pipe: new FilePipe({
                log_path: opts.log_path,
                error_path: opts.error_path
            })
        });
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
// Tests.
// const logger = new FileLogger({
//     level: 0,
// });
// const err_1 = new Error("This is test error 1.");
// err_1.cause = new Error("This is test error 2.");
// (err_1 as any).somevalue = 42;
// logger.error("Test error log: ", err_1);
//# sourceMappingURL=file_logger.js.map