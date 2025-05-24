/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as commentjson from 'comment-json';
import { Path } from '../system/path.js';

/**
 * JSONC - A parser for json5 syntax with comments.
 * This includes a data insertion save function that preserves the original comments and formatting.
 */
export namespace JSONC {

    /**
     * Parse a JSONC file.
     * @param file - The JSONC file content to parse.
     * @returns The parsed JSON object.
     */
    export function parse<T extends any[] | Record<any, any> = any>(file: string): T {
        return commentjson.parse(file, undefined, true) as any as T;
    }

    /**
     * Save a JSONC file.
     */
    export async function save(path: string, obj: Record<string, any>): Promise<void> {
        const p = new Path(path);
        if (!p.exists()) {
            throw new Error(`File "${path}" does not exist.`);
        }
        const file = await p.load({ type: "string" });
        await p.save(insert_into_file(file, obj));
    }

    /**
     * Inserts a JSON object into a JSONC file while preserving comments and formatting.
     * @param file - The original JSONC file content including comments and formatting.
     * @param obj - The object to insert into the file content.
     */
    export function insert_into_file(file: string, obj: Record<string, any>): string {

        // Capture original blank line indices
        const original_lines = file.split(/\r?\n/);
        const blank_indices = original_lines
            .map((line, idx) => ({ line, idx }))
            .filter(({ line }) => line.trim() === '')
            .map(({ idx }) => idx);

        // Parse JSONC into AST
        const ast = commentjson.parse(file, undefined, false);

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