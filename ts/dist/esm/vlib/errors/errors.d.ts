/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { FormatErrorOpts } from "./format.js";
/**
 * The base error.
 */
export declare class VlibError extends globalThis.Error {
    /** The error message. */
    message: string;
    /** The cause of the error. */
    cause?: unknown;
    /** Create a VlibError. */
    constructor(args: string | VlibError.Opts);
    /** Format this error. */
    format(options?: FormatErrorOpts): string;
}
/** Nested types for the VlibError. */
export declare namespace VlibError {
    /** The options for creating a VlibError. */
    interface Opts {
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
export declare class InvalidUsageError extends VlibError {
    constructor(msg: string | VlibError.Opts);
}
/**
 * Error thrown when an operation is timed out.
 * @nav Errors
 * @docs
 */
export declare class TimeoutError extends VlibError {
    constructor(msg: string | VlibError.Opts);
}
