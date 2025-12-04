/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Color, Debug, Path } from '@vlib';
import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Import chain query result
 */
export interface ImportChain {
    target: string;
    chains: string[][];
    found: boolean;
}

/**
 * ImportGraphPlugin that builds import graph during resolution, works even when builds fail
 *
 * @note This does not accurately work with tracking imports across libraries.
 */
export class ImportGraphPlugin {
    private graph = new Map<string, { imports: Set<string>; imported_by: Set<string> }>();
    private entry_points = new Set<string>();

    /** ESBuild plugin instance */
    readonly plugin: esbuild.Plugin;

    constructor(private options: {
        track_externals?: boolean,
        debug?: Debug,
    } = {}) {
        // this.options.track_externals ??= true; // only tmp for debug.
        // this.options.debug ??= new Debug(1); // only tmp for debug.
        this.plugin = {
            name: 'import-graph',
            setup: (build) => {
                // Capture entry points
                if (build.initialOptions.entryPoints) {
                    const entry_points = build.initialOptions.entryPoints;
                    if (Array.isArray(entry_points)) {
                        entry_points.forEach(ep => {
                            const resolved = typeof ep === 'string' ? path.resolve(ep) : path.resolve(ep.in);
                            this.entry_points.add(resolved);
                            this.ensure_node(resolved);
                        });
                    } else {
                        Object.values(entry_points).forEach(ep => {
                            const resolved = path.resolve(ep);
                            this.entry_points.add(resolved);
                            this.ensure_node(resolved);
                        });
                    }
                }

                // Track all resolutions to build a map
                build.onResolve({ filter: /.*/ }, (args) => {
                    // Let esbuild resolve normally but capture the result
                    return undefined;
                });

                // Use onLoad to track import relationships
                build.onLoad({ filter: /.*/ }, async (args) => {
                    const file_path = args.path;

                    // Skip if not tracking externals and this is external
                    if (!this.options.track_externals && this.is_external(file_path)) {
                        return undefined;
                    }

                    // Ensure node exists
                    this.ensure_node(file_path);

                    try {
                        // Read the file content to parse imports
                        const content = await fs.promises.readFile(file_path, 'utf-8');

                        // Parse imports from the content
                        const imports = this.parse_imports(content, file_path);

                        for (const import_spec of imports) {
                            // Try to resolve the import
                            const resolved = await this.resolve_import(import_spec, file_path);
                            if (resolved) {
                                if (!/node_modules/.test(file_path)) {
                                    if (this.options.debug?.on(1)) this.options.debug(`Resolved import "${import_spec}" in file "${file_path}" to "${resolved}"`);
                                }
                                this.add_import_relation(file_path, resolved);
                            }
                            // else if (this.options.debug?.on(1)) this.options.debug("Failed to resolve import specifier: ", import_spec, " in file: ", file_path);
                        }
                    } catch (err) {
                        // File might not exist or be readable, skip it
                        if (this.options.debug?.on(1)) this.options.debug(`${Color.red("Error")} reading file ${file_path}: ${err instanceof Error ? err.message : String(err)}`);
                    }

                    return undefined; // Let esbuild handle the actual loading
                });

                // Process results at the end
                build.onEnd((result) => {
                    if (this.options.debug?.on(1)) this.options.debug(Color.gray(`[ImportGraph] Build ended. Graph has ${this.graph.size} nodes`));

                    // If we have a metafile, use it to enhance our graph
                    if (result.metafile) {
                        if (this.options.debug?.on(1)) this.options.debug(Color.gray("[ImportGraph] Enhancing graph with metafile data"));
                        this.enhance_with_metafile(result.metafile);
                    }

                    // Debug: Show sample of what we captured
                    if (this.graph.size > 0) {
                        if (this.options.debug?.on(1)) this.options.debug(Color.gray("[ImportGraph] Sample nodes with imports:"));
                        let count = 0;
                        for (const [file, node] of this.graph.entries()) {
                            if (node.imports.size > 0 && count < 3) {
                                if (this.options.debug?.on(1)) this.options.debug(Color.gray(`  ${file} imports ${node.imports.size} files`));
                                count++;
                            }
                        }
                    }
                });
            },
        };
    }

    /**
     * Parse import statements from file content
     */
    private parse_imports(content: string, file_path: string): string[] {
        const imports: string[] = [];

        // Check file extension to determine parsing strategy
        const ext = path.extname(file_path);
        const is_typescript = ext === '.ts' || ext === '.tsx';
        const is_javascript = ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs';

        if (!is_typescript && !is_javascript) {
            return imports;
        }

        // Parse ES6 imports
        const es6_import_regex = /import\s+(?:(?:\*\s+as\s+\w+|{[^}]+}|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = es6_import_regex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        // Parse CommonJS requires
        const require_regex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = require_regex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        // Parse dynamic imports
        const dynamic_import_regex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = dynamic_import_regex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    /**
     * Resolve an import specifier to an absolute path
     */
    private async resolve_import(import_spec: string, importer: string): Promise<string | null> {
        // Skip certain imports
        if (import_spec.startsWith('data:') || import_spec.startsWith('http')) {
            return null;
        }

        // For relative imports
        if (import_spec.startsWith('.') || import_spec.startsWith('/')) {
            const base_path = path.resolve(path.dirname(importer), import_spec);

            // Try with various extensions
            const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
            for (const ext of extensions) {
                const full_path = base_path + ext;
                if (await this.file_exists(full_path)) {
                    return full_path;
                }
            }

            // Try index files
            for (const ext of extensions) {
                const index_path = path.join(base_path, 'index' + ext);
                if (await this.file_exists(index_path)) {
                    return index_path;
                }
            }
        } else {

            // For bare imports, try to resolve from node_modules
            let current_dir = path.dirname(importer);
            while (current_dir !== path.dirname(current_dir)) {
                // --- 1) split import_spec into pkgName + subPath ---
                const parts = import_spec.split('/');
                const isScoped = import_spec.startsWith('@');
                const pkgNameParts = isScoped ? parts.slice(0, 2) : parts.slice(0, 1);
                const pkgName = pkgNameParts.join('/');              // e.g. "@vandenberghinc/vlib"
                const subPath = parts.slice(pkgNameParts.length).join('/'); // e.g. "frontend" or ""  
                const exportKey = subPath ? `./${subPath}` : '.';    // e.g. "./frontend"

                // locate the package root dir
                const pkgRoot = path.join(current_dir, 'node_modules', pkgName);

                // --- 2) read & apply package.json.exports if present ---
                const pkgJsonPath = path.join(pkgRoot, 'package.json');
                if (await this.file_exists(pkgJsonPath)) {
                    try {
                        const pkgJson = JSON.parse(await fs.promises.readFile(pkgJsonPath, 'utf-8'));

                        // 2a) exports map
                        if (pkgJson.exports && typeof pkgJson.exports === 'object') {
                            const expDef = pkgJson.exports[exportKey];
                            if (expDef) {
                                // pick import > require > string
                                let targetRel: string | null = null;
                                if (typeof expDef === 'string') {
                                    targetRel = expDef;
                                } else {
                                    targetRel = expDef.import || expDef.require || null;
                                }
                                if (targetRel) {
                                    // resolve against pkgRoot
                                    const absTarget = path.resolve(path.dirname(pkgJsonPath), targetRel);
                                    // try file or with extensions
                                    const exts = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
                                    for (const ext of exts) {
                                        const candidate = absTarget + ext;
                                        if (await this.file_exists(candidate)) {
                                            return candidate;
                                        }
                                    }
                                }
                            }
                        }

                        // 2b) fallback to "main"
                        const mainFile = pkgJson.main || 'index.js';
                        const absMain = path.join(pkgRoot, mainFile);
                        if (await this.file_exists(absMain)) {
                            return absMain;
                        }
                    } catch {
                        // ignore parse errors
                    }
                }

                // --- 3) Try direct file lookup under pkgRoot + subPath  ---
                // (in case someone omitted exports-map entirely)
                const baseDir = subPath ? path.join(pkgRoot, subPath) : pkgRoot;
                const exts = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
                for (const ext of exts) {
                    const f = baseDir + ext;
                    if (await this.file_exists(f)) {
                        return f;
                    }
                }

                // --- 4) index.* fallback ---
                for (const ext of exts) {
                    const idx = path.join(baseDir, 'index' + ext);
                    if (await this.file_exists(idx)) {
                        return idx;
                    }
                }

                // climb up and try again
                current_dir = path.dirname(current_dir);
            }

            
            // // For bare imports, try to resolve from node_modules
            // let current_dir = path.dirname(importer);
            // while (current_dir !== path.dirname(current_dir)) {
            //     const node_modules_path = path.join(current_dir, 'node_modules', import_spec);
            //     console.log("NODE MODULES PATH:",  node_modules_path)

            //     // Check if it's a file
            //     const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
            //     for (const ext of extensions) {
            //         const full_path = node_modules_path + ext;
            //         if (await this.file_exists(full_path)) {
            //             return full_path;
            //         }
            //     }

            //     // Check for package.json
            //     const package_json_path = path.join(node_modules_path, 'package.json');
            //     if (await this.file_exists(package_json_path)) {
            //         try {
            //             const pkg = JSON.parse(await fs.promises.readFile(package_json_path, 'utf-8'));
            //             const main = pkg.main || 'index.js';
            //             const main_path = path.join(node_modules_path, main);
            //             if (await this.file_exists(main_path)) {
            //                 return main_path;
            //             }
            //         } catch { }
            //     }

            //     // Check for index files
            //     for (const ext of extensions) {
            //         const index_path = path.join(node_modules_path, 'index' + ext);
            //         if (await this.file_exists(index_path)) {
            //             return index_path;
            //         }
            //     }

            //     current_dir = path.dirname(current_dir);``
            // }
        }

        return null;
    }

    /**
     * Check if a file exists
     */
    private async file_exists(file_path: string): Promise<boolean> {
        try {
            await fs.promises.access(file_path);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Enhance the graph with data from esbuild's metafile
     */
    private enhance_with_metafile(metafile: esbuild.Metafile): void {
        for (const [input_path, input] of Object.entries(metafile.inputs)) {
            const importer = path.resolve(input_path);

            if (input.imports) {
                for (const imp of input.imports) {
                    if (!this.options.track_externals && imp.external) {
                        continue;
                    }

                    const imported = path.resolve(imp.path);
                    this.add_import_relation(importer, imported);
                }
            }
        }
    }

    /**
     * Ensure a node exists in the graph
     */
    private ensure_node(file_path: string): void {
        const normalized = path.resolve(file_path);
        if (!this.graph.has(normalized)) {
            this.graph.set(normalized, { imports: new Set(), imported_by: new Set() });
        }
    }

    /**
     * Add an import relationship to the graph
     */
    private add_import_relation(importer: string, imported: string): void {
        // Skip external modules if not tracking them
        if (!this.options.track_externals && this.is_external(imported)) {
            return;
        }

        // Normalize paths
        const importer_normalized = path.resolve(importer);
        const imported_normalized = path.resolve(imported);

        // Ensure nodes exist
        this.ensure_node(importer_normalized);
        this.ensure_node(imported_normalized);

        // Get nodes
        const importer_node = this.graph.get(importer_normalized)!;
        const imported_node = this.graph.get(imported_normalized)!;

        // Add bidirectional relationship
        importer_node.imports.add(imported_normalized);
        imported_node.imported_by.add(importer_normalized);
    }

    /**
     * Check if a path represents an external module
     */
    private is_external(file_path: string): boolean {
        return file_path.includes('node_modules') ||
            (!file_path.startsWith('.') && !file_path.startsWith('/') && !path.isAbsolute(file_path));
    }

    /**
     * Get all import chains leading to target file
     */
    get_import_chains(target_path: string): ImportChain {
        // Try multiple path formats to find the node
        const candidates = [
            target_path,
            path.resolve(target_path),
            path.normalize(target_path),
            // Remove ./ prefix if present
            target_path.replace(/^\.\//, ''),
            path.resolve(target_path.replace(/^\.\//, '')),
        ];

        // Also try to find by partial match if exact match fails
        let resolved_target = target_path;
        let node: { imports: Set<string>; imported_by: Set<string> } | undefined = undefined;

        // First try exact matches
        for (const candidate of candidates) {
            node = this.graph.get(candidate);
            if (node) {
                resolved_target = candidate;
                break;
            }
        }

        // If not found, try to find by partial path match
        if (!node) {
            const target_basename = path.basename(target_path);
            for (const [graph_path, graph_node] of this.graph.entries()) {
                if (graph_path.endsWith(target_path) ||
                    path.basename(graph_path) === target_basename) {
                    node = graph_node;
                    resolved_target = graph_path;
                    if (this.options.debug?.on(1)) this.options.debug(`Found target by partial match: ${graph_path}`);
                    break;
                }
            }
        }

        if (!node) {
            if (this.options.debug?.on(1)) {
                this.options.debug(`Target not found: ${target_path}`);
                this.options.debug(`Graph has ${this.graph.size} nodes`);
                if (this.graph.size > 0) {
                    this.options.debug(`Files with path.js in name:`);
                    for (const p of this.graph.keys()) {
                        if (p.includes('path.js')) {
                            this.options.debug(`  - ${p}`);
                        }
                    }
                }
            }
            return { target: target_path, chains: [], found: false };
        }

        const chains: string[][] = [];
        const visited = new Set<string>();

        const find_chains = (current: string, chain: string[] = []): void => {
            // Prevent cycles
            if (visited.has(current)) return;
            visited.add(current);

            chain = [...chain, current];
            const current_node = this.graph.get(current);

            if (!current_node || current_node.imported_by.size === 0) {
                // This is a root (entry point or orphaned file)
                chains.push([...chain].reverse());
            } else {
                // Continue traversing up
                for (const importer of current_node.imported_by) {
                    find_chains(importer, chain);
                }
            }

            visited.delete(current);
        };

        find_chains(resolved_target);

        // If no chains found but the node exists, it might be an entry point
        if (chains.length === 0 && this.entry_points.has(resolved_target)) {
            chains.push([resolved_target]);
        }

        return {
            target: target_path,
            chains: chains.length > 0 ? chains : [[resolved_target]],
            found: true
        };
    }

    /**
     * Format a list of import chains.
     */
    format_import_chains(import_chains: ImportChain[], indent = "", limit = -1): string[] {
        // Get all paths for common base calculation
        const all_import_chains_paths: string[] = [];
        for (const chain of import_chains) {
            /** @warning somehow using `chain.chains.flat()` sometimes causes a recursive limit reached err */
            // all_import_chains_paths.push(path.resolve(chain.target), ...chain.chains.flat().map(c => path.resolve(c)));
            for (const c of chain.chains) {
                if (c.length > 0) {
                    all_import_chains_paths.push(...c);
                }
            }
            all_import_chains_paths.push(chain.target);
        }

        const common_base = Path.find_common_base_path(all_import_chains_paths);
        let common_base_slice: number | undefined;
        if (common_base) {
            common_base_slice = new Path(common_base).abs().str().length;
        }
        
        let limit_count = 0;
        const import_chains_formatted: string[] = [];
        for (const chain of import_chains) {
            const target = common_base_slice ? "." + path.resolve(chain.target).slice(common_base_slice) : chain.target;

            if (!chain.found) {
                import_chains_formatted.push(`No import chain found for target "${target}"`);
                continue;
            }
            if (chain.chains.length === 0) {
                import_chains_formatted.push(`No import chain found for target "${target}"`);
                continue;
            }

            const lines: string[] = [];
            for (const c of chain.chains) {
                if (c.length === 0) continue;
                if (limit !== -1 && limit_count > limit) {
                    break;
                }
                ++limit_count;
                lines.push(
                    `${indent}${Color.gray("note")}: Import chain:` +
                    c.map(l =>
                        `\n${indent}    ${Color.italic(common_base_slice ? "." + path.resolve(l).slice(common_base_slice) : l)}`
                    ).join(Color.blue(" => "))
                );
            }
            const add = lines.join("\n");
            if (import_chains_formatted[import_chains_formatted.length - 1] !== add) {
                import_chains_formatted.push(lines.join("\n"));
            }
        }
        return import_chains_formatted;
    }

    /**
     * Debug: Print the current state of the import graph
     */
    debug_print(): void {
        console.log(Color.yellow("\n=== Import Graph Debug ==="));
        console.log(Color.yellow(`Total nodes: ${this.graph.size}`));
        console.log(Color.yellow(`Entry points: ${this.entry_points.size}`));

        // Look specifically for path.js
        console.log(Color.yellow("\nLooking for path.js files:"));
        for (const [file, relations] of this.graph.entries()) {
            if (file.includes('path.js') || file.includes('path.ts')) {
                console.log(Color.cyan(`\n${file}:`));
                if (relations.imports.size > 0) {
                    console.log(Color.green("  imports:"));
                    for (const imp of relations.imports) {
                        console.log(Color.gray(`    -> ${imp}`));
                    }
                }
                if (relations.imported_by.size > 0) {
                    console.log(Color.magenta("  imported by:"));
                    for (const imp of relations.imported_by) {
                        console.log(Color.gray(`    <- ${imp}`));
                    }
                }
            }
        }

        console.log(Color.yellow("=== End Debug ===\n"));
    }
}




































// VERSION 4
// /**
//  * @author Daan van den Bergh
//  * @copyright © 2025 Daan van den Bergh. All rights reserved.
//  */

// import { Color, Path } from '@vlib';
// import * as esbuild from 'esbuild';
// import * as path from 'path';
// import * as fs from 'fs';

// /**
//  * Import chain query result
//  */
// export interface ImportChain {
//     target: string;
//     chains: string[][];
//     found: boolean;
// }

// /**
//  * ImportGraphPlugin that builds import graph during resolution, works even when builds fail
//  */
// export class ImportGraphPlugin {
//     private graph = new Map<string, { imports: Set<string>; imported_by: Set<string> }>();
//     private pending_imports = new Map<string, Set<string>>(); // Track pending imports during resolution

//     /** ESBuild plugin instance */
//     readonly plugin: esbuild.Plugin;

//     constructor(private options: { track_externals?: boolean } = {}) {
//         this.plugin = {
//             name: 'import-graph',
//             setup: (build) => {
//                 // Intercept and immediately resolve all imports to track true file paths
//                 build.onResolve({ filter: /.*/ }, async (args) => {
//                     // Perform actual resolution to get the concrete file path
//                     const result = await build.resolve(args.path, { importer: args.importer, kind: args.kind });

//                     if (args.importer && result.path) {
//                         // Track the resolved import relationship
//                         this.add_import_relation(args.importer, result.path);
//                     }

//                     // Return the resolution result so esbuild can continue normally
//                     return result;
//                 });

//                 // Original onLoad and pending imports fallback remain for robustness
//                 build.onResolve({ filter: /.*/ }, (args) => {
//                     if (args.importer && args.path) {
//                         const importer = args.importer;
//                         const imported = args.path;

//                         if (!this.pending_imports.has(importer)) {
//                             this.pending_imports.set(importer, new Set());
//                         }
//                         this.pending_imports.get(importer)!.add(imported);
//                     }
//                     return undefined;
//                 });

//                 build.onLoad({ filter: /.*/ }, (args) => {
//                     const file_path = args.path;

//                     for (const [importer, imports] of this.pending_imports.entries()) {
//                         for (const imported_spec of imports) {
//                             if (this.paths_match(file_path, imported_spec, importer)) {
//                                 this.add_import_relation(importer, file_path);
//                             }
//                         }
//                     }

//                     this.ensure_node(file_path);
//                     return undefined;
//                 });

//                 build.onEnd((result) => {
//                     console.log(Color.gray(`[ImportGraph] Build ended. Graph has ${this.graph.size} nodes`));
//                     this.finalize_pending_imports();
//                     if (result.metafile) {
//                         console.log(Color.gray("[ImportGraph] Enhancing graph with metafile data"));
//                         this.enhance_with_metafile(result.metafile);
//                     }
//                 });
//             },
//         };
//     }


//     /**
//      * Check if a loaded file path matches an import specifier
//      */
//     private paths_match(loaded_path: string, import_spec: string, importer: string): boolean {
//         // Direct match
//         if (loaded_path === import_spec) return true;

//         // Resolve the import spec relative to the importer
//         if (import_spec.startsWith('.') || import_spec.startsWith('/')) {
//             const resolved_spec = path.resolve(path.dirname(importer), import_spec);

//             // Check with common extensions
//             const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
//             for (const ext of extensions) {
//                 if (loaded_path === resolved_spec + ext) return true;
//             }
//         }

//         return false;
//     }

//     /**
//      * Process any remaining pending imports
//      */
//     private finalize_pending_imports(): void {
//         for (const [importer, imports] of this.pending_imports.entries()) {
//             this.ensure_node(importer);

//             for (const imported of imports) {
//                 // Try to resolve the import
//                 let resolved_path = imported;

//                 if (imported.startsWith('.') || imported.startsWith('/')) {
//                     resolved_path = path.resolve(path.dirname(importer), imported);

//                     // Try with extensions if the file doesn't exist as-is
//                     if (!fs.existsSync(resolved_path)) {
//                         const extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
//                         for (const ext of extensions) {
//                             if (fs.existsSync(resolved_path + ext)) {
//                                 resolved_path = resolved_path + ext;
//                                 break;
//                             }
//                         }
//                     }
//                 }

//                 // Add the relationship even if the file doesn't exist (for error tracking)
//                 this.add_import_relation(importer, resolved_path);
//             }
//         }

//         this.pending_imports.clear();
//     }

//     /**
//      * Enhance the graph with data from esbuild's metafile
//      */
//     private enhance_with_metafile(metafile: esbuild.Metafile): void {
//         for (const [inputPath, input] of Object.entries(metafile.inputs)) {
//             const importer = path.resolve(inputPath);

//             if (input.imports) {
//                 for (const imp of input.imports) {
//                     if (!this.options.track_externals && imp.external) {
//                         continue;
//                     }

//                     const imported = path.resolve(imp.path);
//                     this.add_import_relation(importer, imported);
//                 }
//             }
//         }
//     }

//     /**
//      * Ensure a node exists in the graph
//      */
//     private ensure_node(file_path: string): void {
//         const normalized = path.resolve(file_path);
//         if (!this.graph.has(normalized)) {
//             this.graph.set(normalized, { imports: new Set(), imported_by: new Set() });
//         }
//     }

//     /**
//      * Add an import relationship to the graph
//      */
//     private add_import_relation(importer: string, imported: string): void {
//         // Skip external modules if not tracking them
//         if (!this.options.track_externals && this.is_external(imported)) {
//             return;
//         }

//         // Normalize paths
//         const importer_normalized = path.resolve(importer);
//         const imported_normalized = path.resolve(imported);

//         // Ensure nodes exist
//         this.ensure_node(importer_normalized);
//         this.ensure_node(imported_normalized);

//         // Get nodes
//         const importer_node = this.graph.get(importer_normalized)!;
//         const imported_node = this.graph.get(imported_normalized)!;

//         // Add bidirectional relationship
//         importer_node.imports.add(imported_normalized);
//         imported_node.imported_by.add(importer_normalized);
//     }

//     /**
//      * Check if a path represents an external module
//      */
//     private is_external(file_path: string): boolean {
//         return file_path.includes('node_modules') ||
//             (!file_path.startsWith('.') && !file_path.startsWith('/') && !path.isAbsolute(file_path));
//     }

//     /**
//      * Get all import chains leading to target file
//      */
//     get_import_chains(target_path: string): ImportChain {
//         // Finalize any pending imports first
//         this.finalize_pending_imports();

//         // Try multiple path formats to find the node
//         const candidates = [
//             target_path,
//             path.resolve(target_path),
//             path.normalize(target_path),
//             // Remove ./ prefix if present
//             target_path.replace(/^\.\//, ''),
//             path.resolve(target_path.replace(/^\.\//, '')),
//         ];

//         let resolved_target = target_path;
//         let node: { imports: Set<string>; imported_by: Set<string> } | undefined = undefined;

//         for (const candidate of candidates) {
//             node = this.graph.get(candidate);
//             if (node) {
//                 resolved_target = candidate;
//                 break;
//             }
//         }

//         if (!node) {
//             console.log(Color.gray(`[ImportGraph] Target not found: ${target_path}`));
//             console.log(Color.gray(`[ImportGraph] Graph has ${this.graph.size} nodes`));
//             if (this.graph.size > 0) {
//                 console.log(Color.gray(`[ImportGraph] Sample paths in graph:`));
//                 let count = 0;
//                 for (const p of this.graph.keys()) {
//                     console.log(Color.gray(`  - ${p}`));
//                     if (++count >= 5) break;
//                 }
//             }
//             return { target: target_path, chains: [], found: false };
//         }

//         const chains: string[][] = [];
//         const visited = new Set<string>();

//         const find_chains = (current: string, chain: string[] = []): void => {
//             // Prevent cycles
//             if (chain.includes(current)) return;

//             chain = [...chain, current];
//             const currentNode = this.graph.get(current);

//             if (!currentNode || currentNode.imported_by.size === 0) {
//                 // This is a root - we found a complete chain
//                 chains.push([...chain].reverse());
//             } else {
//                 // Continue traversing up
//                 for (const importer of currentNode.imported_by) {
//                     find_chains(importer, chain);
//                 }
//             }
//         };

//         find_chains(resolved_target);

//         return {
//             target: target_path,
//             chains: chains.length > 0 ? chains : [[resolved_target]],
//             found: true
//         };
//     }

//     /**
//      * Format a list of import chains.
//      */
//     format_import_chains(import_chains: ImportChain[], indent = ""): string[] {
//         // Get all paths for common base calculation
//         const all_import_chains_paths: string[] = [];
//         for (const chain of import_chains) {
//             all_import_chains_paths.push(path.resolve(chain.target), ...chain.chains.flat().map(c => path.resolve(c)));
//         }

//         const common_base = Path.find_common_base_path(all_import_chains_paths);
//         let common_base_slice: number | undefined;
//         if (common_base) {
//             common_base_slice = new Path(common_base).abs().str().length;
//         }

//         const import_chains_formatted: string[] = [];
//         for (const chain of import_chains) {
//             const target = common_base_slice ? "." + path.resolve(chain.target).slice(common_base_slice) : chain.target;

//             if (!chain.found) {
//                 import_chains_formatted.push(`No import chain found for target "${target}"`);
//                 continue;
//             }
//             if (chain.chains.length === 0) {
//                 import_chains_formatted.push(`No import chain found for target "${target}"`);
//                 continue;
//             }

//             const lines: string[] = [];
//             for (const c of chain.chains) {
//                 if (c.length === 0) continue;
//                 lines.push(
//                     `${indent}${Color.gray("note")}: Import chain:` +
//                     c.map(l =>
//                         `\n${indent}    ${Color.italic(common_base_slice ? "." + path.resolve(l).slice(common_base_slice) : l)}`
//                     ).join(Color.blue(" => "))
//                 );
//             }
//             const add = lines.join("\n");
//             if (import_chains_formatted[import_chains_formatted.length - 1] !== add) {
//                 import_chains_formatted.push(lines.join("\n"));
//             }
//         }
//         return import_chains_formatted;
//     }


//     /**
//      * Debug: Print the current state of the import graph
//      */
//     debug_print(): void {
//         console.log(Color.yellow("\n=== Import Graph Debug ==="));
//         console.log(Color.yellow(`Total nodes: ${this.graph.size}`));

//         let count = 0;
//         for (const [file, relations] of this.graph.entries()) {
//             if (count++ > 20) {
//                 console.log(Color.gray("... and more"));
//                 break;
//             }

//             if (relations.imports.size > 0 || relations.imported_by.size > 0) {
//                 console.log(Color.cyan(`\n${file}:`));
//                 if (relations.imports.size > 0) {
//                     console.log(Color.green("  imports:"));
//                     for (const imp of relations.imports) {
//                         console.log(Color.gray(`    -> ${imp}`));
//                     }
//                 }
//                 if (relations.imported_by.size > 0) {
//                     console.log(Color.magenta("  imported by:"));
//                     for (const imp of relations.imported_by) {
//                         console.log(Color.gray(`    <- ${imp}`));
//                     }
//                 }
//             }
//         }
//         console.log(Color.yellow("=== End Debug ===\n"));
//     }
// }




























// VERSION 3
// /**
//  * @author Daan van den Bergh
//  * @copyright © 2025 Daan van den Bergh. All rights reserved.
//  */

// import { Color, Path } from '@vlib';
// import * as esbuild from 'esbuild';
// import * as path from 'path';
// import * as fs from 'fs';

// /**
//  * Import chain query result
//  */
// export interface ImportChain {
//     target: string;
//     chains: string[][];
//     found: boolean;
// }

// /**
//  * ImportGraphPlugin that builds import graph during resolution, works even when builds fail
//  */
// export class ImportGraphPlugin {
//     private graph = new Map<string, { imports: Set<string>; imported_by: Set<string> }>();
//     private pending_imports = new Map<string, Set<string>>(); // Track pending imports during resolution

//     /** ESBuild plugin instance */
//     readonly plugin: esbuild.Plugin;

//     constructor(private options: { track_externals?: boolean } = {}) {
//         this.plugin = {
//             name: 'import-graph',
//             setup: (build) => {
//                 // Intercept all resolutions to track import relationships
//                 build.onResolve({ filter: /.*/ }, (args) => {
//                     if (args.importer && args.path) {
//                         // Track this import relationship immediately
//                         const importer = args.importer;
//                         const imported = args.path;

//                         // Store in pending imports first
//                         if (!this.pending_imports.has(importer)) {
//                             this.pending_imports.set(importer, new Set());
//                         }
//                         this.pending_imports.get(importer)!.add(imported);
//                     }

//                     // Let esbuild handle the actual resolution
//                     return undefined;
//                 });

//                 // Process successful loads to build the graph
//                 build.onLoad({ filter: /.*/ }, (args) => {
//                     const file_path = args.path;

//                     // Process any pending imports for files that imported this one
//                     for (const [importer, imports] of this.pending_imports.entries()) {
//                         for (const imported_spec of imports) {
//                             // Check if this load corresponds to a pending import
//                             if (this.paths_match(file_path, imported_spec, importer)) {
//                                 this.add_import_relation(importer, file_path);
//                             }
//                         }
//                     }

//                     // Ensure this file has a node in the graph
//                     this.ensure_node(file_path);

//                     return undefined; // Let esbuild handle the actual loading
//                 });

//                 // Process results at the end
//                 build.onEnd((result) => {
//                     console.log(Color.gray(`[ImportGraph] Build ended. Graph has ${this.graph.size} nodes`));

//                     // Process any remaining pending imports
//                     this.finalize_pending_imports();

//                     // If we have a metafile, use it to enhance our graph
//                     if (result.metafile) {
//                         console.log(Color.gray("[ImportGraph] Enhancing graph with metafile data"));
//                         this.enhance_with_metafile(result.metafile);
//                     }
//                 });
//             },
//         };
//     }

//     /**
//      * Check if a loaded file path matches an import specifier
//      */
//     private paths_match(loaded_path: string, import_spec: string, importer: string): boolean {
//         // Direct match
//         if (loaded_path === import_spec) return true;

//         // Resolve the import spec relative to the importer
//         if (import_spec.startsWith('.') || import_spec.startsWith('/')) {
//             const resolved_spec = path.resolve(path.dirname(importer), import_spec);

//             // Check with common extensions
//             const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
//             for (const ext of extensions) {
//                 if (loaded_path === resolved_spec + ext) return true;
//             }
//         }

//         return false;
//     }

//     /**
//      * Process any remaining pending imports
//      */
//     private finalize_pending_imports(): void {
//         for (const [importer, imports] of this.pending_imports.entries()) {
//             this.ensure_node(importer);

//             for (const imported of imports) {
//                 // Try to resolve the import
//                 let resolved_path = imported;

//                 if (imported.startsWith('.') || imported.startsWith('/')) {
//                     resolved_path = path.resolve(path.dirname(importer), imported);

//                     // Try with extensions if the file doesn't exist as-is
//                     if (!fs.existsSync(resolved_path)) {
//                         const extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.json'];
//                         for (const ext of extensions) {
//                             if (fs.existsSync(resolved_path + ext)) {
//                                 resolved_path = resolved_path + ext;
//                                 break;
//                             }
//                         }
//                     }
//                 }

//                 // Add the relationship even if the file doesn't exist (for error tracking)
//                 this.add_import_relation(importer, resolved_path);
//             }
//         }

//         this.pending_imports.clear();
//     }

//     /**
//      * Enhance the graph with data from esbuild's metafile
//      */
//     private enhance_with_metafile(metafile: esbuild.Metafile): void {
//         for (const [inputPath, input] of Object.entries(metafile.inputs)) {
//             const importer = path.resolve(inputPath);

//             if (input.imports) {
//                 for (const imp of input.imports) {
//                     if (!this.options.track_externals && imp.external) {
//                         continue;
//                     }

//                     const imported = path.resolve(imp.path);
//                     this.add_import_relation(importer, imported);
//                 }
//             }
//         }
//     }

//     /**
//      * Ensure a node exists in the graph
//      */
//     private ensure_node(file_path: string): void {
//         const normalized = path.resolve(file_path);
//         if (!this.graph.has(normalized)) {
//             this.graph.set(normalized, { imports: new Set(), imported_by: new Set() });
//         }
//     }

//     /**
//      * Add an import relationship to the graph
//      */
//     private add_import_relation(importer: string, imported: string): void {
//         // Skip external modules if not tracking them
//         if (!this.options.track_externals && this.is_external(imported)) {
//             return;
//         }

//         // Normalize paths
//         const importer_normalized = path.resolve(importer);
//         const imported_normalized = path.resolve(imported);

//         // Ensure nodes exist
//         this.ensure_node(importer_normalized);
//         this.ensure_node(imported_normalized);

//         // Get nodes
//         const importer_node = this.graph.get(importer_normalized)!;
//         const imported_node = this.graph.get(imported_normalized)!;

//         // Add bidirectional relationship
//         importer_node.imports.add(imported_normalized);
//         imported_node.imported_by.add(importer_normalized);
//     }

//     /**
//      * Check if a path represents an external module
//      */
//     private is_external(file_path: string): boolean {
//         return file_path.includes('node_modules') ||
//             (!file_path.startsWith('.') && !file_path.startsWith('/') && !path.isAbsolute(file_path));
//     }

//     /**
//      * Get all import chains leading to target file
//      */
//     get_import_chains(target_path: string): ImportChain {
//         // Finalize any pending imports first
//         this.finalize_pending_imports();

//         // Try multiple path formats to find the node
//         const candidates = [
//             target_path,
//             path.resolve(target_path),
//             path.normalize(target_path),
//             // Remove ./ prefix if present
//             target_path.replace(/^\.\//, ''),
//             path.resolve(target_path.replace(/^\.\//, '')),
//         ];

//         let resolved_target = target_path;
//         let node: { imports: Set<string>; imported_by: Set<string> } | undefined = undefined;

//         for (const candidate of candidates) {
//             node = this.graph.get(candidate);
//             if (node) {
//                 resolved_target = candidate;
//                 break;
//             }
//         }

//         if (!node) {
//             console.log(Color.gray(`[ImportGraph] Target not found: ${target_path}`));
//             console.log(Color.gray(`[ImportGraph] Graph has ${this.graph.size} nodes`));
//             if (this.graph.size > 0) {
//                 console.log(Color.gray(`[ImportGraph] Sample paths in graph:`));
//                 let count = 0;
//                 for (const p of this.graph.keys()) {
//                     console.log(Color.gray(`  - ${p}`));
//                     if (++count >= 5) break;
//                 }
//             }
//             return { target: target_path, chains: [], found: false };
//         }

//         const chains: string[][] = [];

//         const find_chains = (current: string, chain: string[] = []): void => {
//             // Prevent cycles
//             if (chain.includes(current)) return;

//             chain = [...chain, current];
//             const currentNode = this.graph.get(current);

//             if (!currentNode || currentNode.imported_by.size === 0) {
//                 // This is a root - we found a complete chain
//                 chains.push([...chain].reverse());
//             } else {
//                 // Continue traversing up
//                 for (const importer of currentNode.imported_by) {
//                     find_chains(importer, chain);
//                 }
//             }
//         };

//         find_chains(resolved_target);

//         // If we have multiple chains with only the target, then skip.
//         if (chains.length > 1 && chains.every(c => c.length === 1 && c[0] === resolved_target)) {
//             chains.length = 1;
//         }

//         return {
//             target: target_path,
//             chains: chains.length > 0 ? chains : [[resolved_target]],
//             found: true
//         };
//     }

//     /**
//      * Format a list of import chains.
//      */
//     format_import_chains(import_chains: ImportChain[], indent = ""): string[] {
//         // Get all paths for common base calculation
//         const all_import_chains_paths: string[] = [];
//         for (const chain of import_chains) {
//             all_import_chains_paths.push(path.resolve(chain.target), ...chain.chains.flat().map(c => path.resolve(c)));
//         }

//         const common_base = Path.find_common_base_path(all_import_chains_paths);
//         let common_base_slice: number | undefined;
//         if (common_base) {
//             common_base_slice = new Path(common_base).abs().str().length;
//         }

//         const import_chains_formatted: string[] = [];
//         for (const chain of import_chains) {
//             const target = common_base_slice ? "." + path.resolve(chain.target).slice(common_base_slice) : chain.target;

//             if (!chain.found) {
//                 import_chains_formatted.push(`No import chain found for target "${target}"`);
//                 continue;
//             }
//             if (chain.chains.length === 0) {
//                 import_chains_formatted.push(`No import chain found for target "${target}"`);
//                 continue;
//             }

//             const lines: string[] = [];
//             for (const c of chain.chains) {
//                 if (c.length === 0) continue;
//                 lines.push(
//                     `${indent}${Color.gray("note")}: Import chain:` +
//                     c.map(l =>
//                         `\n${indent}    ${Color.italic(common_base_slice ? "." + path.resolve(l).slice(common_base_slice) : l)}`
//                     ).join(Color.blue(" => "))
//                 );
//             }
//             const add = lines.join("\n");
//             if (import_chains_formatted[import_chains_formatted.length - 1] !== add) {
//                 import_chains_formatted.push(lines.join("\n"));
//             }
//         }
//         return import_chains_formatted;
//     }

//     /**
//      * Debug: Print the current state of the import graph
//      */
//     debug_print(): void {
//         console.log(Color.yellow("\n=== Import Graph Debug ==="));
//         console.log(Color.yellow(`Total nodes: ${this.graph.size}`));

//         let count = 0;
//         for (const [file, relations] of this.graph.entries()) {
//             if (count++ > 20) {
//                 console.log(Color.gray("... and more"));
//                 break;
//             }

//             if (relations.imports.size > 0 || relations.imported_by.size > 0) {
//                 console.log(Color.cyan(`\n${file}:`));
//                 if (relations.imports.size > 0) {
//                     console.log(Color.green("  imports:"));
//                     for (const imp of relations.imports) {
//                         console.log(Color.gray(`    -> ${imp}`));
//                     }
//                 }
//                 if (relations.imported_by.size > 0) {
//                     console.log(Color.magenta("  imported by:"));
//                     for (const imp of relations.imported_by) {
//                         console.log(Color.gray(`    <- ${imp}`));
//                     }
//                 }
//             }
//         }
//         console.log(Color.yellow("=== End Debug ===\n"));
//     }
// }




























// // --------------------------------------------------
// // VERSION 2
// /**
//  * @author Daan van den Bergh
//  * @copyright © 2025 Daan van den Bergh. All rights reserved.
//  */

// import { Color, Path } from '@vlib';
// import * as esbuild from 'esbuild';
// import * as path from 'path';

// /**
//  * Import chain query result
//  */
// export interface ImportChain {
//     target: string;
//     chains: string[][];
//     found: boolean;
// }

// /**
//  * Simplified ImportGraphPlugin that uses esbuild's metafile for import tracking
//  */
// export class ImportGraphPlugin {
//     private metafile: esbuild.Metafile | undefined;
//     private graph = new Map<string, { imports: Set<string>; imported_by: Set<string> }>();

//     /** ESBuild plugin instance */
//     readonly plugin: esbuild.Plugin;

//     constructor(private options: { track_externals?: boolean } = {}) {
//         this.plugin = {
//             name: 'import-graph',
//             setup: (build) => {
//                 // Capture the metafile after build
//                 build.onEnd((result) => {
//                     console.log(Color.red_bold("Build ended."));
//                     if (result.metafile) {
//                         this.metafile = result.metafile;
//                         this.build_graph_from_metafile(result.metafile);
//                         console.log(Color.red_bold("Import graph built successfully."));
//                     }
//                 });
//             },
//         };
//     }

//     /**
//      * Build the import graph from esbuild's metafile
//      */
//     private build_graph_from_metafile(metafile: esbuild.Metafile): void {
//         this.graph.clear();

//         // First pass: ensure all files have entries
//         for (const inputPath of Object.keys(metafile.inputs)) {
//             const resolved = path.resolve(inputPath);
//             if (!this.graph.has(resolved)) {
//                 this.graph.set(resolved, { imports: new Set(), imported_by: new Set() });
//             }
//         }

//         // Second pass: build relationships
//         for (const [inputPath, input] of Object.entries(metafile.inputs)) {
//             const importer = path.resolve(inputPath);

//             if (input.imports) {
//                 for (const imp of input.imports) {
//                     // Skip external imports if not tracking
//                     if (!this.options.track_externals && imp.external) {
//                         continue;
//                     }

//                     const imported = path.resolve(imp.path);

//                     // Get or create nodes
//                     const importerNode = this.graph.get(importer);
//                     let importedNode = this.graph.get(imported);

//                     if (!importedNode) {
//                         importedNode = { imports: new Set(), imported_by: new Set() };
//                         this.graph.set(imported, importedNode);
//                     }

//                     // Add bidirectional relationship
//                     if (importerNode) {
//                         importerNode.imports.add(imported);
//                         importedNode.imported_by.add(importer);
//                     }
//                 }
//             }
//         }
//     }

//     /**
//      * Get all import chains leading to target file
//      */
//     get_import_chains(target_path: string): ImportChain {
//         const resolved_target = path.resolve(target_path);
//         const node = this.graph.get(resolved_target);

//         if (!node) {
//             return { target: resolved_target, chains: [], found: false };
//         }

//         const chains: string[][] = [];

//         const find_chains = (current: string, chain: string[] = []): void => {
//             // Prevent infinite loops
//             if (chain.includes(current)) return;

//             chain = [...chain, current];

//             const currentNode = this.graph.get(current);
//             if (!currentNode || currentNode.imported_by.size === 0) {
//                 // This is a root - we found a complete chain
//                 chains.push(chain.reverse());
//             } else {
//                 // Continue up the tree
//                 for (const importer of currentNode.imported_by) {
//                     find_chains(importer, chain);
//                 }
//             }
//         };

//         find_chains(resolved_target);

//         return {
//             target: resolved_target,
//             chains: chains.length > 0 ? chains : [[resolved_target]],
//             found: true
//         };
//     }

//     /**
//      * Format a list of import chains.
//      */
//     format_import_chains(import_chains: ImportChain[]): string[] {
//         // Get import chains.
//         const all_import_chains_paths: string[] = [];
//         for (let i = 0; i < import_chains.length; i++) {
//             all_import_chains_paths.push(import_chains[i].target, ...import_chains[i].chains.flat());
//         }
//         const common_base = Path.find_common_base_path(all_import_chains_paths);
//         let common_base_slice: number | undefined;
//         if (common_base) {
//             common_base_slice = new Path(common_base).abs().str().length;
//         }
//         const import_chains_formatted: string[] = [];
//         for (const chain of import_chains) {
//             const target = common_base_slice ? "." + chain.target.slice(common_base_slice) : chain.target;
//             // for (let i = 0; i < import_chains.length; i++) {
//             //     const item = import_chains[i];
//             //     item.target = "." + item.target.slice(slice_start);
//             //     for (let j = 0; j < item.chains.length; j++) {
//             //         item.chains[j] = item.chains[j].map(c => "." + c.slice(slice_start));
//             //     }
//             // }
//             if (!chain.found) {
//                 import_chains_formatted.push(`No import chain found for target "${target}"`);
//                 continue;
//             }
//             if (chain.chains.length === 0) {
//                 import_chains_formatted.push(`No import chain found for target "${target}"`);
//                 continue;
//             }
//             const lines: string[] = [];
//             for (const c of chain.chains) {
//                 if (c.length === 0) continue;
//                 const formatted = c.map(l => 
//                     Color.gray(common_base_slice ? "." + l.slice(common_base_slice) : l)
//                 ).join(Color.blue(" => "));
//                 lines.push(`${Color.cyan(target)}: import chain:\n    ${formatted}`);
//             }
//             import_chains_formatted.push(lines.join("\n"));
//         }
//         console.log(Color.red_bold("Formatted import chains:"));
//         return import_chains_formatted;
//     }
// }























// --------------------------------------------------
// VERSION 1
// /**
//  * @author Daan van den Bergh
//  * @copyright © 2025 Daan van den Bergh. All rights reserved.
//  */

// import * as esbuild from 'esbuild';
// import * as path from 'path';
// import { createRequire } from 'module';

// /**
//  * Import relationship in the dependency graph
//  */
// interface ImportRelation {
//     /** Files this module imports */
//     imports: Set<string>;
//     /** Files that import this module */
//     imported_by: Set<string>;
//     /** Whether this is external (node_modules) */
//     is_external: boolean;
// }

// /**
//  * Import chain query result
//  */
// interface ImportChain {
//     target: string;
//     chains: string[][];
//     found: boolean;
// }

// /**
//  * Plugin configuration options
//  */
// interface ImportGraphOptions {
//     /** Include external modules in tracking */
//     track_externals?: boolean;
//     /** Maximum depth for chain resolution */
//     max_chain_depth?: number;
// }

// /**
//  * ESBuild plugin that tracks import relationships and provides dependency analysis
//  */
// class ImportGraphPlugin {
//     private graph = new Map<string, ImportRelation>();
//     private options: Required<ImportGraphOptions>;

//     /** ESBuild plugin instance - pass this to esbuild.build() */
//     readonly plugin: esbuild.Plugin;

//     constructor(options: ImportGraphOptions = {}) {
//         this.options = {
//             track_externals: true,
//             max_chain_depth: 20,
//             ...options,
//         };
//         this.plugin = {
//             name: 'import-graph',
//             setup: (build) => this.setup_plugin(build),
//         };
//     }

//     // ---------------------------------------------------------------
//     // Private methods.

//     /**
//      * Sets up esbuild plugin hooks
//      */
//     private setup_plugin(build: esbuild.PluginBuild): void {
//         // Capture resolved imports via onResolve - let esbuild do the heavy lifting
//         build.onResolve({ filter: /.*/ }, (args) => {
//             if (args.importer) {
//                 // Let esbuild resolve, then we'll capture the result in onLoad
//                 this.pending_resolutions.set(args.path + '::' + args.importer, {
//                     specifier: args.path,
//                     importer: args.importer,
//                 });
//             }
//             return null; // Let esbuild handle resolution
//         });

//         // Track imports when files are processed
//         build.onLoad({ filter: /\.(js|jsx|ts|tsx|mjs|cjs|json)$/ }, (args) => {
//             this.process_file(args.path);
//             return null; // Let esbuild handle loading
//         });
//     }

//     private pending_resolutions = new Map<string, { specifier: string; importer: string }>();

//     /**
//      * Process a file and extract its import relationships
//      */
//     private process_file(file_path: string): void {
//         try {
//             const normalized_path = path.resolve(file_path);

//             // Initialize node if not exists
//             if (!this.graph.has(normalized_path)) {
//                 this.graph.set(normalized_path, {
//                     imports: new Set(),
//                     imported_by: new Set(),
//                     is_external: this.is_external(normalized_path),
//                 });
//             }

//             // Process any pending resolutions for this file
//             const content = require('fs').readFileSync(file_path, 'utf8');
//             const import_specifiers = this.extract_imports(content);

//             for (const specifier of import_specifiers) {
//                 const resolved = this.smart_resolve(specifier, file_path);
//                 if (resolved && (this.options.track_externals || !this.is_external(resolved))) {
//                     this.add_import_relation(normalized_path, resolved);
//                 }
//             }
//         } catch (error: any) {
//             // Fail silently to not break builds
//             console.warn(`Import tracking failed for ${file_path}:`, error.message);
//         }
//     }

//     /**
//      * Smart import extraction using minimal regex
//      */
//     private extract_imports(content: string): string[] {
//         // Single regex to capture all common import patterns
//         const import_pattern = /(?:import|export)(?:\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?(?:\s*\(\s*)?['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]/g;

//         const matches: string[] = [];
//         let match;
//         while ((match = import_pattern.exec(content)) !== null) {
//             matches.push(match[1] || match[2]);
//         }
//         return matches;
//     }

//     /**
//      * Smart path resolution using Node.js built-ins where possible
//      */
//     private smart_resolve(specifier: string, from_file: string): string | null {
//         try {
//             // Use createRequire for accurate Node.js resolution
//             const require_from_file = createRequire(from_file);
//             return require_from_file.resolve(specifier);
//         } catch {
//             // Fallback for edge cases
//             try {
//                 if (specifier.startsWith('.')) {
//                     return path.resolve(path.dirname(from_file), specifier);
//                 }
//                 return require.resolve(specifier, { paths: [path.dirname(from_file)] });
//             } catch {
//                 return null;
//             }
//         }
//     }

//     /**
//      * Check if path is external (node_modules)
//      */
//     private is_external(file_path: string): boolean {
//         return file_path.includes('node_modules');
//     }

//     /**
//      * Add bidirectional import relationship
//      */
//     private add_import_relation(importer: string, imported: string): void {
//         const importer_node = this.get_or_create_node(importer);
//         const imported_node = this.get_or_create_node(imported);

//         importer_node.imports.add(imported);
//         imported_node.imported_by.add(importer);
//     }

//     /**
//      * Get or create graph node
//      */
//     private get_or_create_node(file_path: string): ImportRelation {
//         let node = this.graph.get(file_path);
//         if (!node) {
//             node = {
//                 imports: new Set(),
//                 imported_by: new Set(),
//                 is_external: this.is_external(file_path),
//             };
//             this.graph.set(file_path, node);
//         }
//         return node;
//     }

//     // ---------------------------------------------------------------
//     // Public methods.

//     /**
//      * Get all import chains leading to target file
//      */
//     get_import_chains(target_path: string): ImportChain {
//         const resolved_target = path.resolve(target_path);
//         if (!this.graph.has(resolved_target)) {
//             return { target: resolved_target, chains: [], found: false };
//         }

//         const chains: string[][] = [];
//         const visited = new Set<string>();

//         const dfs = (current: string, chain: string[], depth: number) => {
//             if (depth > this.options.max_chain_depth || visited.has(current)) return;

//             visited.add(current);
//             chain.push(current);

//             const node = this.graph.get(current);
//             if (node?.imported_by.size === 0) {
//                 // Root node - save chain
//                 chains.push([...chain].reverse());
//             } else {
//                 // Continue traversal
//                 node?.imported_by.forEach(importer => dfs(importer, chain, depth + 1));
//             }

//             chain.pop();
//             visited.delete(current);
//         };

//         dfs(resolved_target, [], 0);
//         return { target: resolved_target, chains, found: true };
//     }

//     /**
//      * Get direct dependencies
//      */
//     get_dependencies(file_path: string): string[] {
//         return Array.from(this.graph.get(path.resolve(file_path))?.imports ?? []);
//     }

//     /**
//      * Get direct dependents
//      */
//     get_dependents(file_path: string): string[] {
//         return Array.from(this.graph.get(path.resolve(file_path))?.imported_by ?? []);
//     }

//     /**
//      * Get graph statistics
//      */
//     get_stats() {
//         const total = this.graph.size;
//         const external = Array.from(this.graph.values()).filter(n => n.is_external).length;
//         const total_edges = Array.from(this.graph.values()).reduce((sum, n) => sum + n.imports.size, 0);

//         return { total_files: total, external_files: external, local_files: total - external, total_imports: total_edges };
//     }

//     /**
//      * Clear the import graph
//      */
//     clear(): void {
//         this.graph.clear();
//         this.pending_resolutions.clear();
//     }

//     /**
//      * Get raw graph data
//      */
//     get_graph(): ReadonlyMap<string, ImportRelation> {
//         return this.graph;
//     }
// }

// export { ImportGraphPlugin, type ImportChain, type ImportGraphOptions, type ImportRelation };