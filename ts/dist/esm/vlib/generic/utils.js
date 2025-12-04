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
 * @docs
 */
export var Utils;
(function (Utils) {
    /**
     * Sleep for an amount of milliseconds.
     * @param msec The amount of milliseconds
     * @docs
     */
    async function sleep(msec) {
        return new Promise((resolve) => setTimeout(resolve, msec));
    }
    Utils.sleep = sleep;
    /**
     * Create a debounced version of a function.
     * @param delay Delay in milliseconds
     * @param func Function to debounce
     * @docs
     */
    function debounce(delay, func) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            // timeout = setTimeout(() => func.apply(this, args), delay);
            timeout = setTimeout(() => func(args), delay);
        };
    }
    Utils.debounce = debounce;
    /**
     * Format a byte size to human readable string.
     * @param value The value in bytes or a string to get byte length of
     * @returns Formatted string (e.g., "1.5MB")
     * @deprecated use System.format_bytes instead.
     */
    function format_bytes(value) {
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
        return `${Math.floor(value)}B`;
    }
    Utils.format_bytes = format_bytes;
    function hash(data, algo = "sha256", format = "hex") {
        const hash = crypto.createHash(algo);
        hash.update(data);
        if (format) {
            return hash.digest(format);
        }
        return hash;
    }
    Utils.hash = hash;
    const _npm_package_version_cache = new Map();
    /** Load the version from a npm package.json or any other json file that has a `version: string` attribute. */
    function load_npm_package_version(package_json_path, def = "1.0.0") {
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
    Utils.load_npm_package_version = load_npm_package_version;
    /**
     * Get __dirname from `import` for ESM modules.
     * @warning This function should only be used in ESM modules.
     * @param import_meta The default `import` variable for ESM modules.
     * @example
     * ```ts
     * const __dirname = vlib.Utils.__dirname(import.meta);
     * ```
     * @deprecated use import.meta.dirname node20+.
     * @libris
     */
    function __dirname(import_meta) {
        return dirname(fileURLToPath(import_meta.url));
    }
    Utils.__dirname = __dirname;
    /**
     * Get __filename from `import` for ESM modules.
     * @warning This function should only be used in ESM modules.
     * @param import_meta The default `import` variable for ESM modules.
     */
    function __filename(import_meta) {
        return fileURLToPath(import_meta.url);
    }
    Utils.__filename = __filename;
    /** Safe exit with a traceable log message and status code */
    function safe_exit(code = 1, message) {
        const id = new SourceLoc(1).abs_id;
        if (message) {
            console.log(Color.red(">>>"), message);
        }
        console.log(`${Color.red_bold("Warning")}: Safe exit requested from ${Color.bold(id)}, exiting process with exit status ${Color.bold(code.toString())}.`);
        process.exit(code);
    }
    Utils.safe_exit = safe_exit;
    // ---------------------------------------------------------------------------
    // DEPRECATED
    /**
     * Print arguments to console without inserting spaces.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     * @docs
     */
    function print(...args) {
        console.log(args.join(""));
    }
    Utils.print = print;
    /**
     * Print arguments to console error without inserting spaces.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     * @docs
     */
    function printe(...args) {
        console.error(args.join(""));
    }
    Utils.printe = printe;
    /**
     * Print text with a blue marker prefix.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     * @docs
     */
    function print_marker(...args) {
        print(Colors.blue, ">>> ", Colors.end, ...args);
    }
    Utils.print_marker = print_marker;
    /**
     * Print text with a yellow warning prefix.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     * @docs
     */
    function print_warning(...args) {
        print(Colors.yellow, ">>> ", Colors.end, ...args);
    }
    Utils.print_warning = print_warning;
    /**
     * Print text with a red error prefix to stderr.
     * @deprecated use the `logging/Logger` module instead.
     * @param args Arguments to print
     * @docs
     */
    function print_error(...args) {
        printe(Colors.red, ">>> ", Colors.end, ...args);
    }
    Utils.print_error = print_error;
})(Utils || (Utils = {}));
export { Utils as utils }; // snake case compatibility
//# sourceMappingURL=utils.js.map