/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// External imports.
import * as commentjson from 'comment-json';
import { Path } from '../generic/path.js';
/**
 * JSONC - A parser for json5 syntax with comments.
 * This includes a data insertion save function that preserves the original comments and formatting.
 */
export var JSONC;
(function (JSONC) {
    /**
     * Parse a JSONC file.
     * @param data - The JSONC string form data to parse into an object.
     * @returns The parsed JSON object.
     */
    function parse(data) {
        return commentjson.parse(data, undefined, true);
    }
    JSONC.parse = parse;
    /**
     * Load and parse a file.
     *
     * @param path The path to load.
     *
     * @funcs 2
     */
    async function load(path) {
        const p = path instanceof Path ? path : new Path(path);
        return parse(await p.load({ type: "string" }));
    }
    JSONC.load = load;
    function load_sync(path) {
        const p = path instanceof Path ? path : new Path(path);
        return parse(p.load_sync({ type: "string" }));
    }
    JSONC.load_sync = load_sync;
    /**
     * Save a JSONC file.
     *
     * Automatically loads the old file and calls `insert_into_file` on the old file with the new data.
     *
     * @param path The path to load
     * @param obj The object to save.
     *
     * @funcs 2
     */
    async function save(path, obj) {
        const p = path instanceof Path ? path : new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = await p.load({ type: "string" });
        await p.save(insert_into_file(file, obj));
    }
    JSONC.save = save;
    function save_sync(path, obj) {
        const p = path instanceof Path ? path : new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = p.load_sync({ type: "string" });
        p.save_sync(insert_into_file(file, obj));
    }
    JSONC.save_sync = save_sync;
    /**
     * Inserts a JSON object into a JSONC file while preserving comments and formatting.
     * @param file_content - The original JSONC file content including comments and formatting.
     * @param obj - The object to insert into the file content.
     */
    function insert_into_file(file_content, obj) {
        // Capture original blank line indices
        const original_lines = file_content.split(/\r?\n/);
        const blank_indices = original_lines
            .map((line, idx) => ({ line, idx }))
            .filter(({ line }) => line.trim() === '')
            .map(({ idx }) => idx);
        // Parse JSONC into AST
        const ast = commentjson.parse(file_content, undefined, false);
        // Deep merge new_config into AST
        function deep_merge(target, source) {
            for (const key of Object.keys(source)) {
                const srcVal = source[key];
                if (typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal)) {
                    if (typeof target[key] !== 'object' || target[key] === null || Array.isArray(target[key])) {
                        target[key] = {};
                    }
                    deep_merge(target[key], srcVal);
                }
                else {
                    target[key] = srcVal;
                }
            }
            return target;
        }
        deep_merge(ast, obj);
        // Stringify back to JSONC with 4-space indent
        const result = commentjson.stringify(ast, null, 4);
        // Restore blank lines at original positions
        const result_lines = result.split(/\r?\n/);
        for (const idx of blank_indices) {
            if (idx <= result_lines.length) {
                result_lines.splice(idx, 0, '');
            }
        }
        // Response.
        return result_lines.join('\n');
    }
    JSONC.insert_into_file = insert_into_file;
})(JSONC || (JSONC = {}));
export { JSONC as jsonc }; // snake_case compatibility
//# sourceMappingURL=jsonc.js.map