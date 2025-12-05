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
     * Inserts a JSON object into a JSONC file while preserving comments and formatting.
     * @param file_content - The original JSONC file content including comments and formatting.
     * @param obj - The object to insert into the file content.
     * 
     * @docs
     */
    export function insert_into_file(file_content: string, obj: Record<string, any>): string {

        // Capture original blank line indices
        const original_lines = file_content.split(/\r?\n/);
        const blank_indices = original_lines
            .map((line, idx) => ({ line, idx }))
            .filter(({ line }) => line.trim() === '')
            .map(({ idx }) => idx);

        // Parse JSONC into AST
        const ast = commentjson.parse(file_content, undefined, false);

        // Deep merge new_config into AST
        function deep_merge(target: any, source: any): any {
            for (const key of Object.keys(source)) {
                const srcVal = (source as any)[key];
                if (typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal)) {
                    if (typeof target[key] !== 'object' || target[key] === null || Array.isArray(target[key])) {
                        target[key] = {};
                    }
                    deep_merge(target[key], srcVal);
                } else {
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

}
export { JSONC as jsonc }; // snake_case compatibility