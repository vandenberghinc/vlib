/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * An CLI error.
 */
export declare class CLIError extends globalThis.Error {
    /** The error name. */
    name: string;
    /** The message string. */
    message: string;
    /** The attached docs from `CLI.docs()`. */
    docs?: string;
    /** The cli identifier where this error is attached to. */
    id?: string;
    /** An optionally nested error rethrown as a CLI error. */
    error?: globalThis.Error;
    /** Constructor. */
    constructor(message: string, opts?: {
        docs?: string;
        id?: string;
        error?: globalThis.Error;
    });
    /** Dump an `Error` stack */
    private add_error_stack;
    /** Dump to console. */
    dump(): void;
}
