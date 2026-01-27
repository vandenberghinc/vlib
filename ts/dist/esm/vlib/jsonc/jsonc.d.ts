/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from '../generic/path.js';
/**
 * JSONC - A parser for json5 syntax with comments.
 * This includes a data insertion save function that preserves the original comments and formatting.
 * @nav System
 * @docs
 */
export declare namespace JSONC {
    /**
     * Parse a JSONC file.
     * @param data - The JSONC string form data to parse into an object.
     * @returns The parsed JSON object.
    * @docs
     */
    function parse<T extends any[] | Record<any, any> = any>(data: string): T;
    /**
     * Load and parse a file.
     *
     * @param path The path to load.
     * @returns The parsed JSON object.
     *
     * @docs
     */
    function load<T extends any[] | Record<any, any> = any>(path: string | Path): Promise<T>;
    /**
     * Load and parse a file synchronously.
     *
     * @param path The path to load.
     * @returns The parsed JSON object.
     *
     * @docs
     */
    function load_sync<T extends any[] | Record<any, any> = any>(path: string | Path): T;
    /** The save options. */
    interface SaveOpts {
        /**
         * When `true`, perform partial updates:
         * - Do not delete keys/indices that are not present in the input value.
         * - Only upsert (add/update) paths present in the input value.
         * @default false
         */
        update?: boolean;
        /**
         * If indentation is based on spaces (`insertSpaces` = true), the number of spaces that make an indent.
         * @default 2
         */
        indent?: number;
        /**
         * Is indentation based on spaces?
         * @default true
         */
        indent_using_spaces?: boolean;
        /**
         * The default 'end of line' character. If not set, '\n' is used as default.
         * @default "\n"
         */
        eol?: string;
        /**
         * If set, will add a new line at the end of the document.
         * @default false
         */
        insert_final_eol?: boolean;
        /**
         * If true, will keep line positions as is in the formatting
         * @default true
         */
        keep_lines?: boolean;
    }
    /**
     * Inserts an object/array into existing JSONC by applying `jsonc-parser.modify()` edits
     * incrementally to preserve formatting/comments where possible.
     *
     * Semantics:
     * - `options.update:false` (default): canonical sync for objects (delete missing keys recursively)
     * - `options.update:true`: partial upsert for objects (do not delete missing keys)
     *
     * Arrays use positional sync:
     * - Indices present in `next_value` are updated/replaced.
     * - Indices beyond `next_value.length` are removed (array length is synced).
     * - If an array element is an object on both sides, it is merged like a normal object.
     *
     * If root types differ (object vs array vs primitive), the entire document is replaced.
     *
     * @note With `options.update:true`, array length is still synced to `next_value` (trailing
     * indices not present in the input are removed). However, object elements inside arrays
     * are merged in "update" mode, so missing object keys (e.g. `"keep"`) are preserved.
     *
     * @param file_content Existing JSONC text.
     * @param next_value Value to apply (object or array root).
     * @param options Save/update + formatting options.
     * @returns Updated JSONC text.
     */
    function insert_into_file(file_content: string, next_value: Record<string, any> | any[], options?: SaveOpts): string;
    /**
     * Save a JSONC file.
     *
     * Automatically inserts into the old file with the new data.
     * Removing all keys that are not present in the new data.
     *
     * @param path The path to load
     * @param obj The object to save.
     * @param options The save options.
     *
     * @docs
     */
    function save(path: string | Path, obj: Record<string, any> | any[], options?: Omit<SaveOpts, "insert">): Promise<void>;
    /**
     * Update a JSONC file.
     *
     * Automatically inserts into the old file with the new data.
     * Not removing any keys that are not present in the new data.
     *
     * @param path The path to load
     * @param obj The object to save.
     * @param options The save options.
     *
     * @docs
     */
    function update(path: string | Path, obj: Record<string, any> | any[], options?: Omit<SaveOpts, "insert">): Promise<void>;
}
export { JSONC as jsonc };
