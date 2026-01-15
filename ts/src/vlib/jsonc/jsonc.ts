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

    /**
     * Save a JSONC file.
     * 
     * Automatically loads the old file and calls `insert_into_file` on the old file with the new data.
     * 
     * @param path The path to load
     * @param obj The object to save.
     * 
     * @docs
     */
    export async function save(path: string | Path, obj: Record<string, any>): Promise<void> {
        const p = path instanceof Path ? path  : new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = await p.load({ type: "string" });
        await p.save(insert_into_file(file, obj));
    }

    /**
     * Save a JSONC file synchronously.
     * 
     * Automatically loads the old file and calls `insert_into_file` on the old file with the new data.
     * 
     * @param path The path to load
     * @param obj The object to save.
     * 
     * @docs
     */
    export function save_sync(path: string | Path, obj: Record<string, any>): void {
        const p = path instanceof Path ? path : new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = p.load_sync({ type: "string" });
        p.save_sync(insert_into_file(file, obj));
    }
    
    /**
 * Merge a JSON object into an existing JSONC document string, treating `obj`
 * as the canonical root object and preserving comments where possible.
 *
 * Semantics (root-level and nested):
 *   - Properties present in `obj` are created or overwritten in the file
 *   - Properties missing from `obj` but present in the file are deleted
 *   - Arrays are replaced wholesale (no element-level diffing)
 *
 * If the existing document cannot be parsed as an object, the entire content
 * is replaced with `obj` while still using jsonc-parser for formatting.
 *
 * @param file_content Existing JSONC text (e.g. a VS Code or project config).
 * @param obj Canonical JSON object to apply to the document.
 * @param formatting_overrides Optional formatting overrides for jsonc-parser.
 * @returns Updated JSONC text that can be written back to disk.
 */
    export function insert_into_file(
        file_content: string,
        obj: Record<string, any>,
        formatting_overrides: Partial<FormattingOptions> = {},
    ): string {
        const is_plain_object = (value: unknown): value is Record<string, unknown> =>
            value !== null && typeof value === 'object' && !Array.isArray(value);

        if (!is_plain_object(obj)) {
            throw new TypeError('insert_into_file: "obj" must be a non-null plain object.');
        }

        // Normalise empty input so jsonc-parser has a valid starting point.
        let current_text = file_content.trim().length === 0 ? '{}\n' : file_content;

        const formatting_options: FormattingOptions = {
            insertSpaces: true,
            tabSize: 2,
            eol: '\n',
            ...formatting_overrides,
        };

        const modification_options: ModificationOptions = {
            formattingOptions: formatting_options,
        };

        const apply_value_at_path = (path: (string | number)[], value: unknown): void => {
            // jsonc-parser.modify re-parses the *current* text based on the path,
            // so we can safely call it multiple times as we update `current_text`.
            const edits = modify(current_text, path, value as any, modification_options);
            if (!edits || edits.length === 0) {
                return; // No change needed at this path.
            }
            current_text = applyEdits(current_text, edits);
        };

        // Parse once to inspect the existing structure (independent from edits).
        const parsed_root = parse_jsonc_native(current_text, undefined, {
            allowTrailingComma: true,
            allowEmptyContent: true,
        });

        // If the existing root isn't a plain object, replace the whole document
        // with the canonical object.
        if (!is_plain_object(parsed_root)) {
            apply_value_at_path([], obj);
            return current_text;
        }

        const merge_full_object = (
            old_value: Record<string, unknown>,
            new_value: Record<string, unknown>,
            base_path: (string | number)[],
        ): void => {
            // 1) Delete keys that exist in old_value but not in new_value.
            const old_keys = Object.keys(old_value);
            for (const key of old_keys) {
                if (!(key in new_value)) {
                    const delete_path = base_path.concat(key);
                    // Passing undefined to modify() deletes the property.
                    apply_value_at_path(delete_path, undefined);
                }
            }

            // 2) Add or update keys that exist in new_value.
            const new_keys = Object.keys(new_value);
            for (const key of new_keys) {
                const child_path = base_path.concat(key);
                const old_child = old_value[key];
                const new_child = new_value[key];

                const old_is_plain = is_plain_object(old_child);
                const new_is_plain = is_plain_object(new_child);

                if (old_is_plain && new_is_plain) {
                    // Both sides are objects → recurse so that we only touch
                    // changed leaf properties and preserve nested comments.
                    merge_full_object(
                        old_child as Record<string, unknown>,
                        new_child as Record<string, unknown>,
                        child_path,
                    );
                } else {
                    // Primitive, array, null, or type mismatch → replace wholesale.
                    // This also covers adding a brand-new property.
                    apply_value_at_path(child_path, new_child);
                }
            }
        };

        // At this point both parsed_root and obj are plain objects, so we can
        // perform a deep, canonical merge with deletion-by-omission semantics.
        merge_full_object(parsed_root, obj, []);

        return current_text;
    }

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