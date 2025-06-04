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

import esbuild from 'esbuild';
import { promises as fs } from 'fs';
import pathlib from 'path';

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
export async function parse_imports(
    file_path: string,
    options: ParseOptions = {}
): Promise<Set<string>> {
    const { recursive = false, external = false, include_exports: includeExports = true } = options;
    const visited = new Set<string>();
    const results = new Set<string>();

    async function _walk(file: string, depth: number): Promise<void> {
        // resolve the entry file (adds extension if missing)
        const resolved_entry = await resolve_file(file);
        if (visited.has(resolved_entry)) return;
        visited.add(resolved_entry);

        // Read file content
        let sourceText: string;
        try {
            sourceText = await fs.readFile(resolved_entry, 'utf8');
        } catch {
            results.add(file);
            return;
        }

        // 1) Use esbuild metafile to find imports
        const build = await esbuild.build({
            entryPoints: [resolved_entry],
            bundle: false,
            write: false,
            metafile: true,
            platform: 'node',
            format: 'esm',
            absWorkingDir: process.cwd(),
            logLevel: 'silent',
        });

        const meta = build.metafile!;
        for (const info of Object.values(meta.outputs)) {
            if (info.entryPoint && pathlib.resolve(info.entryPoint) === resolved_entry) {
                for (const imp of info.imports) {
                    await process_specifier(imp.path, imp.external ?? false, resolved_entry, depth);
                }
                break;
            }
        }

        // 2) Manual regex fallback for require() calls
        for (const m of sourceText.matchAll(/\brequire\(\s*['"](.+?)['"]\s*\)/g)) {
            await process_specifier(m[1], false, resolved_entry, depth);
        }

        // 3) Optional export-from statements
        if (includeExports) {
            for (const m of sourceText.matchAll(/export\s+(?:\*|\{[\s\S]*?\})\s+from\s+['"](.+?)['"]/g)) {
                await process_specifier(m[1], false, resolved_entry, depth);
            }
        }
    }

    async function process_specifier(spec: string, is_external: boolean, importer: string, depth: number): Promise<void> {
        if (is_external) {
            if (external) results.add(spec);
        } else {
            // resolve local path relative to importer
            let target: string;
            try {
                target = require.resolve(spec, { paths: [pathlib.dirname(importer)] });
            } catch {
                // fallback: resolve via our helper
                target = await resolve_file(pathlib.resolve(pathlib.dirname(importer), spec));
            }
            if (!results.has(target)) {
                results.add(target);
                if (recursive && (options.max_depth === undefined || depth < options.max_depth)) {
                    await _walk(target, depth + 1);
                }
            }
        }
    }

    /**
     * Resolve file path with extension fallback (.js, .ts, .mjs, .cjs, /index.js etc.)
     */
    async function resolve_file(p: string): Promise<string> {
        const exts = ['', '.js', '.ts', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts'];
        for (const ext of exts) {
            const full = p + ext;
            try {
                await fs.access(full);
                return pathlib.resolve(full);
            } catch {
                continue;
            }
        }
        // if not found, return original
        return pathlib.resolve(p);
    }

    await _walk(file_path, 0);
    return results;
}
