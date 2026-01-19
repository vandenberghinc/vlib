/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as crypto from 'crypto';
/**
 * The utilities module.
 *
 * @nav Utilities
 * @docs
 */
export declare namespace Utils {
    /**
     * Sleep for an amount of milliseconds.
     * @param msec The amount of milliseconds
     * @docs
     */
    function sleep(msec: number): Promise<void>;
    /**
     * Create a debounced version of a function.
     * @param delay Delay in milliseconds
     * @param func Function to debounce
     * @docs
     */
    function debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void;
    /**
     * Format a byte size to human readable string.
     * @param value The value in bytes or a string to get byte length of
     * @returns Formatted string (e.g., "1.5MB")
     * @deprecated use System.format_bytes instead.
     */
    function format_bytes(value: string | number): string;
    /**
     * Wrapper function to create hashes.
     * @docs
     */
    function hash(data: string | Buffer, algo?: string, format?: crypto.BinaryToTextEncoding): string;
    function hash(data: string | Buffer, algo?: string, format?: false): crypto.Hash;
    /**
     * Load the version from a npm package.json or any other json file that has a `version: string` attribute.
     * @docs
     */
    function load_npm_package_version(package_json_path: string, def?: string): any;
    /**
     * Get __dirname from `import` for ESM modules.
     * @warning This function should only be used in ESM modules.
     * @param import_meta The default `import` variable for ESM modules.
     * @example
     * ```ts
     * const __dirname = vlib.Utils.__dirname(import.meta);
     * ```
     * @deprecated use import.meta.dirname node20+.
     */
    function __dirname(import_meta: {
        url: string;
    }): string;
    /**
     * Get __filename from `import` for ESM modules.
     * @warning This function should only be used in ESM modules.
     * @param import_meta The default `import` variable for ESM modules.
     * @deprecated use import.meta.filename node20+.
     */
    function __filename(import_meta: {
        url: string;
    }): string;
    /**
     * Safe exit with a traceable log message and status code
     * @docs
     */
    function safe_exit(code?: number, message?: string): void;
    /**
     * Print arguments to console without inserting spaces.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    function print(...args: any[]): void;
    /**
     * Print arguments to console error without inserting spaces.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    function printe(...args: any[]): void;
    /**
     * Print text with a blue marker prefix.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    function print_marker(...args: any[]): void;
    /**
     * Print text with a yellow warning prefix.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    function print_warning(...args: any[]): void;
    /**
     * Print text with a red error prefix to stderr.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    function print_error(...args: any[]): void;
}
export { Utils as utils };
