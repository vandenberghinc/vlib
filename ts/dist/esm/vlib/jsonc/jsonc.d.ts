/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { type FormattingOptions } from 'jsonc-parser';
import { Path } from '../generic/path.js';
/**
 * JSONC - A parser for json5 syntax with comments.
 * This includes a data insertion save function that preserves the original comments and formatting.
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
    function save(path: string | Path, obj: Record<string, any>): Promise<void>;
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
    function save_sync(path: string | Path, obj: Record<string, any>): void;
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
    function insert_into_file(file_content: string, obj: Record<string, any>, formatting_overrides?: Partial<FormattingOptions>): string;
}
export { JSONC as jsonc };
