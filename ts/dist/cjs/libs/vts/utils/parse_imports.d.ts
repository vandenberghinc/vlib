/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Recursively parses import, require, and export-from statements from an ESM/CJS file using esbuild's metafile
 * with optional manual regex fallback for full coverage.
 *
 * - Supports .js, .jsx, .ts, .tsx, .cjs, .mjs
 * - Handles static imports, dynamic imports, require() calls, and export-from statements.
 * - Optional recursion into local file dependencies.
 *
 * @remarks For maximum robustness, we combine esbuild's metafile with manual regex parsing.
 */
/**
 * Options for parsing imports.
 */
export interface ParseOptions {
    /** If true, will recursively parse local file imports. */
    recursive?: boolean;
    /** Include external modules (node builtins or packages) in results. Default: false. */
    external?: boolean;
    /** Include `export * from '...'` and named export-from statements. Default: true. */
    include_exports?: boolean;
    /**
     * Max recursive depth, undefined to ignore.
     * A value of `1` means it only checks the input path, so basically non recursive.
     * @note that this is only used if `recursive` is true.
     */
    max_depth?: number;
}
/**
 * Parses all import/require/export-from paths from the given file.
 *
 * @param file_path - Absolute or relative path to the entry file.
 * @param options - ParseOptions to control recursion, externals, and exports.
 * @returns A Set of resolved import paths or module specifiers.
 */
export declare function parse_imports(file_path: string, options?: ParseOptions): Promise<Set<string>>;
