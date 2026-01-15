/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Format error options.
 *
 * @nav Errors
 * @docs
 */
export interface FormatErrorOpts {
    /** Color mode. */
    colored?: boolean;
    /** The max depth for objects and causes. */
    depth?: number;
    /** The current depth. */
    current_depth?: number;
    /** The indent size. */
    indent?: number;
    /** The console type, warning or error. */
    type?: "warning" | "error";
    /** The start indent level. */
    start_indent?: number;
}
/**
 * Format an error into a string with optional colors and depth.
 * Similar to node utils, but for node and browser.
 *
 * @nav Errors
 * @docs
 */
export declare function format_error(err: Error, options?: FormatErrorOpts): string;
