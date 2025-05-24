/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * JSONC - A parser for json5 syntax with comments.
 * This includes a data insertion save function that preserves the original comments and formatting.
 */
export declare namespace JSONC {
    /**
     * Parse a JSONC file.
     * @param file - The JSONC file content to parse.
     * @returns The parsed JSON object.
     */
    function parse<T extends any[] | Record<any, any> = any>(file: string): T;
    /**
     * Save a JSONC file.
     */
    function save(path: string, obj: Record<string, any>): Promise<void>;
    /**
     * Inserts a JSON object into a JSONC file while preserving comments and formatting.
     * @param file - The original JSONC file content including comments and formatting.
     * @param obj - The object to insert into the file content.
     */
    function insert_into_file(file: string, obj: Record<string, any>): string;
}
export { JSONC as jsonc };
