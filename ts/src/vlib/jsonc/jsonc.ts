/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as commentjson from 'comment-json';
import {
    parse as parse_jsonc_native,
    modify,
    applyEdits,
    type FormattingOptions,
    type ModificationOptions,
    type Node,
} from 'jsonc-parser';

import { Path } from '../generic/path.js';

/**
 * JSONC - A parser for json5 syntax with comments.
 * This includes a data insertion save function that preserves the original comments and formatting.
 * @nav System
 * @docs
 */
export namespace JSONC {

    /**
     * Parse a JSONC file.
     * @param data - The JSONC string form data to parse into an object.
     * @returns The parsed JSON object.
    * @docs
     */
    export function parse<T extends any[] | Record<any, any> = any>(data: string): T {
        return commentjson.parse(data, undefined, true) as any as T;
    }

    /**
     * Load and parse a file.
     * 
     * @param path The path to load.
     * @returns The parsed JSON object.
     * 
     * @docs
     */
    export async function load<T extends any[] | Record<any, any> = any>(path: string | Path): Promise<T> {
        const p = path instanceof Path ? path : new Path(path);
        return parse<T>(await p.load({ type: "string" }));
    }
    /**
     * Load and parse a file synchronously.
     * 
     * @param path The path to load.
     * @returns The parsed JSON object.
     * 
     * @docs
     */
    export function load_sync<T extends any[] | Record<any, any> = any>(path: string | Path): T {
        const p = path instanceof Path ? path : new Path(path);
        return parse<T>(p.load_sync({ type: "string" }));
    }

    /** The save options. */
    export interface SaveOpts {
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
     * 
     * @see {Save} See {@link save} for saving to file directly.
     * @see {Update} See {@link update} for updating to file directly.
     * 
     * @docs
     */
    export function insert_into_file(
        file_content: string,
        next_value: Record<string, any> | any[],
        options: SaveOpts = {},
    ): string {
        const insert = options.update ?? false;

        // Normalise empty input so jsonc-parser always has something to edit.
        let current_text = file_content.trim().length === 0 ? "null\n" : file_content;

        const formatting_options: FormattingOptions = {
            tabSize: options.indent ?? 2,
            insertSpaces: options.indent_using_spaces ?? true,
            eol: options.eol ?? "\n",
            insertFinalNewline: options.insert_final_eol ?? false,
            keepLines: options.keep_lines ?? false,
        };

        const modification_options: ModificationOptions = {
            formattingOptions: formatting_options,
        };

        /**
         * Apply a value at `path` using `modify()` and update `current_text`.
         *
         * @param path JSON path segments.
         * @param value Value to set, or `undefined` to delete/remove.
         */
        const apply_value_at_path = (path: (string | number)[], value: unknown): void => {
            const edits = modify(current_text, path, value as any, modification_options);
            if (!edits || edits.length === 0) return;
            current_text = applyEdits(current_text, edits);
        };

        /**
         * True for non-null plain objects (excluding arrays).
         *
         * @param value Any value.
         */
        const is_plain_object = (value: unknown): value is Record<string, unknown> =>
            value !== null && typeof value === "object" && !Array.isArray(value);

        /**
         * True for arrays.
         *
         * @param value Any value.
         */
        const is_array = (value: unknown): value is unknown[] => Array.isArray(value);

        /**
         * True if both values are the same container type (plain object or array).
         *
         * @param a First value.
         * @param b Second value.
         */
        const same_container_type = (a: unknown, b: unknown): boolean =>
            (is_plain_object(a) && is_plain_object(b)) || (is_array(a) && is_array(b));

        /**
         * Merge an object at `base_path`.
         *
         * @param old_obj Parsed old object.
         * @param new_obj New object to apply.
         * @param base_path Path to the object.
         */
        const merge_object = (
            old_obj: Record<string, unknown>,
            new_obj: Record<string, unknown>,
            base_path: (string | number)[],
        ): void => {
            // Canonical sync: remove keys not present in new_obj.
            if (!insert) {
                for (const old_key of Object.keys(old_obj)) {
                    if (!(old_key in new_obj)) {
                        apply_value_at_path(base_path.concat(old_key), undefined);
                    }
                }
            }

            // Upsert keys present in new_obj.
            for (const new_key of Object.keys(new_obj)) {
                const child_path = base_path.concat(new_key);
                const old_child = old_obj[new_key];
                const new_child = new_obj[new_key];

                if (is_plain_object(old_child) && is_plain_object(new_child)) {
                    merge_object(old_child, new_child, child_path);
                    continue;
                }

                if (is_array(old_child) && is_array(new_child)) {
                    merge_array(old_child, new_child, child_path);
                    continue;
                }

                // Primitive, null, mismatched types, or container replacement.
                apply_value_at_path(child_path, new_child);
            }
        };

        /**
         * Read a value from a parsed JSON root using a jsonc-parser style path.
         *
         * @param root Parsed root value from `parse_jsonc_native`.
         * @param path JSON path segments.
         * @returns The value at the path, or `undefined` if not found.
         */
        const get_value_at_path = (root: unknown, path: (string | number)[]): unknown => {
            let cur: any = root as any;
            for (const seg of path) {
                if (cur == null) return undefined;
                cur = cur[seg as any];
            }
            return cur;
        };

        /**
         * Safely re-parse the current document text for structural inspection.
         *
         * @returns Parsed document root.
         */
        const reparse_current_text = (): unknown => parse_jsonc_native(current_text, undefined, {
            allowTrailingComma: true,
            allowEmptyContent: true,
        });

        /**
         * Merge an array at `base_path` using positional sync:
         * - Update indices present in `new_arr`
         * - Sync length to `new_arr.length` (always)
         * - Merge object elements when both sides are objects
         *
         * @param old_arr Parsed old array.
         * @param new_arr New array to apply.
         * @param base_path Path to the array.
         */
        const merge_array = (old_arr: unknown[], new_arr: unknown[], base_path: (string | number)[]): void => {
            // 1) Upsert indices present in new_arr.
            for (let i = 0; i < new_arr.length; i++) {
                const child_path = base_path.concat(i);
                const old_child = i < old_arr.length ? old_arr[i] : undefined;
                const new_child = new_arr[i];

                if (is_plain_object(old_child) && is_plain_object(new_child)) {
                    // Preserve missing keys when update:true, delete when update:false.
                    merge_object(old_child, new_child, child_path);
                    continue;
                }

                if (is_array(old_child) && is_array(new_child)) {
                    // Nested arrays follow the same rules.
                    merge_array(old_child, new_child, child_path);
                    continue;
                }

                // Primitive, null, mismatch, or creating a new index.
                apply_value_at_path(child_path, new_child);
            }

            // 2) Sync array length to new_arr.length.
            //
            // IMPORTANT:
            // Deleting array items one-by-one with `modify(path, undefined)` can produce corrupted
            // tokens in some layouts (e.g. turning 10 + 2 into 102). To avoid this, when shrinking,
            // we replace the whole array with a sliced version of the *already-updated* array.
            if (old_arr.length > new_arr.length) {
                const reparsed_root = reparse_current_text();
                const current_arr = get_value_at_path(reparsed_root, base_path);

                if (Array.isArray(current_arr)) {
                    apply_value_at_path(base_path, current_arr.slice(0, new_arr.length));
                } else {
                    // Fallback: if we can't locate the array reliably, replace with new_arr.
                    apply_value_at_path(base_path, new_arr);
                }
            } else if (old_arr.length < new_arr.length) {
                // When expanding, indices were already created via apply_value_at_path per index.
                // No additional action required.
            }
        };

        // Parse once to inspect current structure before edits.
        const parsed_root = parse_jsonc_native(current_text, undefined, {
            allowTrailingComma: true,
            allowEmptyContent: true,
        });

        // If root container types differ, replace the entire document with next_value.
        if (!same_container_type(parsed_root, next_value)) {
            apply_value_at_path([], next_value);
            return current_text;
        }

        // Both roots are same container type -> merge incrementally.
        if (is_plain_object(parsed_root) && is_plain_object(next_value)) {
            merge_object(parsed_root, next_value, []);
            return current_text;
        }

        if (is_array(parsed_root) && is_array(next_value)) {
            merge_array(parsed_root, next_value, []);
            return current_text;
        }

        // Fallback: replace whole document.
        apply_value_at_path([], next_value);
        return current_text;
    }


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
     * @see {@link insert_into_file}
     * 
     * @docs
     */
    export async function save(
        path: string | Path,
        obj: Record<string, any> | any[],
        options: Omit<SaveOpts, "insert"> = {},
    ): Promise<void> {
        const p = path instanceof Path ? path  : new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = await p.load({ type: "string" });
        const updated_content = insert_into_file(file, obj, { ...options, update: false });
        await p.save(updated_content);
    }

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
    export async function update(
        path: string | Path,
        obj: Record<string, any> | any[],
        options: Omit<SaveOpts, "insert"> = {},
    ): Promise<void> {
        const p = path instanceof Path ? path  : new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = await p.load({ type: "string" });
        const updated_content = insert_into_file(file, obj, { ...options, update: true });
        await p.save(updated_content);
    }

    // /**
    //  * Save a JSONC file.
    //  * 
    //  * Automatically loads the old file and calls `insert_into_file` on the old file with the new data.
    //  * 
    //  * @param path The path to load
    //  * @param obj The object to save.
    //  * 
    //  * @docs
    //  */
    // export async function save(path: string | Path, obj: Record<string, any>): Promise<void> {
    //     const p = path instanceof Path ? path  : new Path(path);
    //     if (!p.exists()) {
    //         throw new Error(`File "${path}" does not exist.`);
    //     }
    //     const file = await p.load({ type: "string" });
    //     await p.save(insert_into_file(file, obj));
    // }

    // /**
    //  * Save a JSONC file synchronously.
    //  * 
    //  * Automatically loads the old file and calls `insert_into_file` on the old file with the new data.
    //  * 
    //  * @param path The path to load
    //  * @param obj The object to save.
    //  * 
    //  * @docs
    //  */
    // export function save_sync(path: string | Path, obj: Record<string, any>): void {
    //     const p = path instanceof Path ? path : new Path(path);
    //     if (!p.exists()) {
    //         throw new Error(`File "${path}" does not exist.`);
    //     }
    //     const file = p.load_sync({ type: "string" });
    //     p.save_sync(insert_into_file(file, obj));
    // }
    
    // /**
    //  * Merge a JSON object into an existing JSONC document string, treating `obj`
    //  * as the canonical root object and preserving comments where possible.
    //  *
    //  * Semantics (root-level and nested):
    //  *   - Properties present in `obj` are created or overwritten in the file
    //  *   - Properties missing from `obj` but present in the file are deleted
    //  *   - Arrays are replaced wholesale (no element-level diffing)
    //  *
    //  * If the existing document cannot be parsed as an object, the entire content
    //  * is replaced with `obj` while still using jsonc-parser for formatting.
    //  *
    //  * @param file_content Existing JSONC text (e.g. a VS Code or project config).
    //  * @param obj Canonical JSON object to apply to the document.
    //  * @param formatting_overrides Optional formatting overrides for jsonc-parser.
    //  * @returns Updated JSONC text that can be written back to disk.
    //  */
    // export function insert_into_file(
    //     file_content: string,
    //     obj: Record<string, any>,
    //     formatting_overrides: Partial<FormattingOptions> = {},
    // ): string {
    //     const is_plain_object = (value: unknown): value is Record<string, unknown> =>
    //         value !== null && typeof value === 'object' && !Array.isArray(value);

    //     if (!is_plain_object(obj)) {
    //         throw new TypeError('insert_into_file: "obj" must be a non-null plain object.');
    //     }

    //     // Normalise empty input so jsonc-parser has a valid starting point.
    //     let current_text = file_content.trim().length === 0 ? '{}\n' : file_content;

    //     const formatting_options: FormattingOptions = {
    //         insertSpaces: true,
    //         tabSize: 2,
    //         eol: '\n',
    //         ...formatting_overrides,
    //     };

    //     const modification_options: ModificationOptions = {
    //         formattingOptions: formatting_options,
    //     };

    //     const apply_value_at_path = (path: (string | number)[], value: unknown): void => {
    //         // jsonc-parser.modify re-parses the *current* text based on the path,
    //         // so we can safely call it multiple times as we update `current_text`.
    //         const edits = modify(current_text, path, value as any, modification_options);
    //         if (!edits || edits.length === 0) {
    //             return; // No change needed at this path.
    //         }
    //         current_text = applyEdits(current_text, edits);
    //     };

    //     // Parse once to inspect the existing structure (independent from edits).
    //     const parsed_root = parse_jsonc_native(current_text, undefined, {
    //         allowTrailingComma: true,
    //         allowEmptyContent: true,
    //     });

    //     // If the existing root isn't a plain object, replace the whole document
    //     // with the canonical object.
    //     if (!is_plain_object(parsed_root)) {
    //         apply_value_at_path([], obj);
    //         return current_text;
    //     }

    //     const merge_full_object = (
    //         old_value: Record<string, unknown>,
    //         new_value: Record<string, unknown>,
    //         base_path: (string | number)[],
    //     ): void => {
    //         // 1) Delete keys that exist in old_value but not in new_value.
    //         const old_keys = Object.keys(old_value);
    //         for (const key of old_keys) {
    //             if (!(key in new_value)) {
    //                 const delete_path = base_path.concat(key);
    //                 // Passing undefined to modify() deletes the property.
    //                 apply_value_at_path(delete_path, undefined);
    //             }
    //         }

    //         // 2) Add or update keys that exist in new_value.
    //         const new_keys = Object.keys(new_value);
    //         for (const key of new_keys) {
    //             const child_path = base_path.concat(key);
    //             const old_child = old_value[key];
    //             const new_child = new_value[key];

    //             const old_is_plain = is_plain_object(old_child);
    //             const new_is_plain = is_plain_object(new_child);

    //             if (old_is_plain && new_is_plain) {
    //                 // Both sides are objects → recurse so that we only touch
    //                 // changed leaf properties and preserve nested comments.
    //                 merge_full_object(
    //                     old_child as Record<string, unknown>,
    //                     new_child as Record<string, unknown>,
    //                     child_path,
    //                 );
    //             } else {
    //                 // Primitive, array, null, or type mismatch → replace wholesale.
    //                 // This also covers adding a brand-new property.
    //                 apply_value_at_path(child_path, new_child);
    //             }
    //         }
    //     };

    //     // At this point both parsed_root and obj are plain objects, so we can
    //     // perform a deep, canonical merge with deletion-by-omission semantics.
    //     merge_full_object(parsed_root, obj, []);

    //     return current_text;
    // }

    // v1 manually, works partially but does not work properly with removing keys etc.
    // /**
    //  * Inserts a JSON object into a JSONC file while preserving comments and formatting.
    //  * @param file_content - The original JSONC file content including comments and formatting.
    //  * @param obj - The object to insert into the file content.
    //  * 
    //  * @docs
    //  */
    // export function insert_into_file(file_content: string, obj: Record<string, any>): string {

    //     // Capture original blank line indices
    //     const original_lines = file_content.split(/\r?\n/);
    //     const blank_indices = original_lines
    //         .map((line, idx) => ({ line, idx }))
    //         .filter(({ line }) => line.trim() === '')
    //         .map(({ idx }) => idx);

    //     // Parse JSONC into AST
    //     const ast = commentjson.parse(file_content, undefined, false);

    //     // Deep merge new_config into AST
    //     function deep_merge(target: any, source: any): any {
    //         for (const key of Object.keys(source)) {
    //             const srcVal = (source as any)[key];
    //             if (typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal)) {
    //                 if (typeof target[key] !== 'object' || target[key] === null || Array.isArray(target[key])) {
    //                     target[key] = {};
    //                 }
    //                 deep_merge(target[key], srcVal);
    //             } else {
    //                 target[key] = srcVal;
    //             }
    //         }
    //         return target;
    //     }
    //     deep_merge(ast, obj);

    //     // Stringify back to JSONC with 4-space indent
    //     const result = commentjson.stringify(ast, null, 4);

    //     // Restore blank lines at original positions
    //     const result_lines = result.split(/\r?\n/);
    //     for (const idx of blank_indices) {
    //         if (idx <= result_lines.length) {
    //             result_lines.splice(idx, 0, '');
    //         }
    //     }

    //     // Response.
    //     return result_lines.join('\n');
    // }

}
export { JSONC as jsonc }; // snake_case compatibility