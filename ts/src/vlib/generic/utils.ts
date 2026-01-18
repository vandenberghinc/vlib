/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { Color, Colors } from './colors.js';
import { Path } from './path.js';
import { SourceLoc } from '../logging/uni/source_loc.js';

/**
 * The utilities module.
 * 
 * @nav Utilities
 * @docs
 */
export namespace Utils {

    /**
     * Sleep for an amount of milliseconds.
     * @param msec The amount of milliseconds
     * @docs
     */
    export async function sleep(msec: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, msec))
    }

    /**
     * Create a debounced version of a function.
     * @param delay Delay in milliseconds
     * @param func Function to debounce
     * @docs
     */
    export function debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void {
        let timeout: NodeJS.Timeout;
        return function (...args) {
            clearTimeout(timeout);
            // timeout = setTimeout(() => func.apply(this, args), delay);
            timeout = setTimeout(() => func(args), delay);
        };
    }

    /**
     * Format a byte size to human readable string.
     * @param value The value in bytes or a string to get byte length of
     * @returns Formatted string (e.g., "1.5MB")
     * @deprecated use System.format_bytes instead.
     */
    export function format_bytes(value: string | number): string {
        if (typeof value === "string") {
            value = Buffer.byteLength(value, "utf-8");
        }
        if (value > 1024 * 1024 * 1024 * 1024) {
            return `${(value / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
        }
        else if (value > 1024 * 1024 * 1024) {
            return `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;
        }
        else if (value > 1024 * 1024) {
            return `${(value / (1024 * 1024)).toFixed(2)}MB`;
        }
        else if (value > 1024) {
            return `${(value / 1024).toFixed(2)}KB`;
        }
        return `${Math.floor(value as number)}B`;
    }

    /**
     * Wrapper function to create hashes.
     * @docs
     */
    export function hash(data: string | Buffer, algo?: string, format?: crypto.BinaryToTextEncoding): string
    export function hash(data: string | Buffer, algo?: string, format?: false): crypto.Hash
    export function hash(data: string | Buffer, algo: string = "sha256", format: crypto.BinaryToTextEncoding | false = "hex"): string | crypto.Hash {
        const hash = crypto.createHash(algo);
        hash.update(data)
        if (format) {
            return hash.digest(format);
        }
        return hash;
    }

    const _npm_package_version_cache = new Map<string, string>();
    
    /**
     * Load the version from a npm package.json or any other json file that has a `version: string` attribute.
     * @docs
     */
    export function load_npm_package_version(package_json_path: string, def: string = "1.0.0") {
        if (_npm_package_version_cache.has(package_json_path)) {
            return _npm_package_version_cache.get(package_json_path);
        }
        const p = new Path(package_json_path);
        if (!p.exists()) {
            throw new Error(`Version file "${p.abs().str()}" does not exist.`);
        }
        const version = p.load_sync({ type: "object" }).version ?? def;
        _npm_package_version_cache.set(package_json_path, version);
        return version;
    }

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
    export function __dirname(import_meta: { url: string }): string {
        return dirname(fileURLToPath(import_meta.url));
    }

    /**
     * Get __filename from `import` for ESM modules.
     * @warning This function should only be used in ESM modules.
     * @param import_meta The default `import` variable for ESM modules.
     * @deprecated use import.meta.filename node20+.
     */
    export function __filename(import_meta: { url: string }): string {
        return fileURLToPath(import_meta.url);
    }

    /**
     * Safe exit with a traceable log message and status code
     * @docs
     */
    export function safe_exit(code: number = 1, message?: string) {
        const id = new SourceLoc(1).abs_id;
        if (message) {
            console.log(Color.red(">>>"), message)
        }
        console.log(`${Color.red_bold("Warning")}: Safe exit requested from ${Color.bold(id)}, exiting process with exit status ${Color.bold(code.toString())}.`);
        process.exit(code);
    }

    // ---------------------------------------------------------------------------
    // DEPRECATED


    /**
     * Print arguments to console without inserting spaces.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    export function print(...args: any[]): void {
        console.log(args.join(""));
    }

    /**
     * Print arguments to console error without inserting spaces.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    export function printe(...args: any[]): void {
        console.error(args.join(""));
    }

    /**
     * Print text with a blue marker prefix.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    export function print_marker(...args: any[]): void {
        print(Colors.blue, ">>> ", Colors.end, ...args);
    }

    /**
     * Print text with a yellow warning prefix.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    export function print_warning(...args: any[]): void {
        print(Colors.yellow, ">>> ", Colors.end, ...args);
    }

    /**
     * Print text with a red error prefix to stderr.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     */
    export function print_error(...args: any[]): void {
        printe(Colors.red, ">>> ", Colors.end, ...args);
    }
}
export { Utils as utils }; // snake case compatibility