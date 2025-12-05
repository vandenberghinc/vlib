/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
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
     * Inserts a JSON object into a JSONC file while preserving comments and formatting.
     * @param file_content - The original JSONC file content including comments and formatting.
     * @param obj - The object to insert into the file content.
     *
     * @docs
     */
    function insert_into_file(file_content: string, obj: Record<string, any>): string;
}
export { JSONC as jsonc };
