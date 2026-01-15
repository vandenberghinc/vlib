/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { format_error, FormatErrorOpts } from "./format.js";

/**
 * The base error.
 */
export class VlibError extends globalThis.Error {

    /** The error message. */
    override message: string;

    /** The cause of the error. */
    override cause?: unknown;

    /** Create a VlibError. */
    constructor(args: string | VlibError.Opts) {
        if (typeof args === "string") {
            super(args);
            this.message = args;
        } else {
            super(args.message);
            this.message = args.message;
            this.cause = args.cause;
        }
        this.name = "VlibError";
    }
    
    /** Format this error. */
    format(options?: FormatErrorOpts): string {
        return format_error(this, options);
    }
}

/** Nested types for the VlibError. */
export namespace VlibError {
    
    /** The options for creating a VlibError. */
    export interface Opts {
        /** The error message. */
        message: string;
        /** The cause of the error. */
        cause?: unknown;
    }

}

/**
 * Error thrown when the user incorrectly utilizes a library feature.
 * @nav Errors
 * @docs
 */
export class InvalidUsageError extends VlibError {
    constructor(msg: string | VlibError.Opts) {
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
    constructor(msg: string | VlibError.Opts) {
        super(msg);
        this.name = "TimeoutError";
    }
}
