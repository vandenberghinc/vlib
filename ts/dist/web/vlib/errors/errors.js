/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { format_error } from "./format.js";
/**
 * The base error.
 */
export class VlibError extends globalThis.Error {
    /** The error message. */
    message;
    /** The cause of the error. */
    cause;
    /** Create a VlibError. */
    constructor(args) {
        if (typeof args === "string") {
            super(args);
            this.message = args;
        }
        else {
            super(args.message);
            this.message = args.message;
            this.cause = args.cause;
        }
        this.name = "VlibError";
    }
    /** Format this error. */
    format(options) {
        return format_error(this, options);
    }
}
/**
 * Error thrown when the user incorrectly utilizes a library feature.
 * @nav Errors
 * @docs
 */
export class InvalidUsageError extends VlibError {
    constructor(msg) {
        super(msg);
        this.name = "InvalidUsageError";
    }
}
/**
 * Error thrown when an operation is timed out.
 * @nav Errors
 * @docs
 */
export class TimeoutError extends VlibError {
    constructor(msg) {
        super(msg);
        this.name = "TimeoutError";
    }
}
//# sourceMappingURL=errors.js.map