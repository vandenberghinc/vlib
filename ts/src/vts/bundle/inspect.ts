/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as pathlib from 'path';
import * as esbuild from 'esbuild';
import { Color, Path } from "@vlib";

// Imports.
import { resolve_path, create_esbuild_err, BundleOptions, CompilerError } from "./bundle.js"
import { ImportChain, ImportGraphPlugin } from './import_graph.js';
import { ImportTracer, TraceRequest } from './trace_imports.js';

// ------------------------------------------------------------------------------------------------------------------------
// Inspect & debugging a bundle.

/**
 * Result of the bundling process.
 */
export interface InspectBundleResult {
    /** Compilation and bundling errors, if any. */
    errors: CompilerError[];
    format_errors: () => string[];
    /** Input paths. Only defined when extract_inputs is `true`. */
    inputs: string[];
    /** Retrieve the import chain of all errors. */
    import_chains: () => ImportChain[];
    format_import_chains: () => string[];
    /** Retrieve the generated meta file */
    metafile?: string;
    /** Get a formatted debug string, optionally pass a limit for the errors to show, by default no limit is set. */
    debug({
        limit,
        filter
    }: {
        limit?: -1 | number,
        filter?: (error: CompilerError) => boolean
    }): string;
}

/**
 * Inspect & debug a bundle. 
 * @param options The bundle options.
 */
export async function inspect_bundle(options: Pick<
    BundleOptions,
    'include' | 'externals' | 'output' | 'platform' | 'format' | 'target' | 'minify' | 'tree_shaking' | 'opts'
>): Promise<InspectBundleResult> {
    let {
        include = [],
        externals = [],
        output = undefined,
        platform = 'browser',
        format = 'iife',
        target = 'es2021',
        minify = false,
        tree_shaking = undefined,
        opts = {},
    } = options;

    // Variables.
    const errors: CompilerError[] = [];
    let inputs: string[] = [];
    let outfile = Array.isArray(output) ? output[0] : output;
    if (outfile instanceof Path) outfile = outfile.path;
    let build_result: esbuild.BuildResult | undefined = undefined;
    let secondary_build_result: esbuild.BuildResult | undefined = undefined;

    const use_import_graph = false;
    const graph = use_import_graph
        ? new ImportGraphPlugin({ track_externals: true })
        : undefined
    const import_tracer = !use_import_graph
        ? new ImportTracer()
        : undefined;

    // Capture the context.
    let plugins: esbuild.Plugin[] = [];
    if (opts.plugins) plugins = [...opts.plugins];
    if (graph) plugins.push(graph.plugin);
    plugins.push(
        {
            name: 'capture-result',
            setup(build) {
                build.onEnd(result => { secondary_build_result = result; });
            }
        },
        // {
        //     name: 'show-import-chain',
        //     setup(build) {
        //         build.onResolve({
        //             // filter: /json_schema\.js$/,
        //             filter: /index.m.node\.js$/,
        //             // filter: /.*/
        //         }, args => {
        //             console.log(
        //                 `[show-import-chain] ${args.path}` +
        //                 (args.importer ? ` imported by ${args.importer}` : '')
        //             )
        //             return null
        //         })
        //     }
        // },
    );
    const ctx = await esbuild.context({
        entryPoints: include.map(p => p instanceof Path ? p.path : p),
        bundle: true,
        platform,
        format,
        target,
        minify,
        write: false,
        metafile: true,
        logLevel: "silent",
        treeShaking: tree_shaking,
        external: externals,
        outfile,
        loader: {
            '.ttf': 'file',
            '.woff': 'file',
            '.woff2': 'file',
            '.eot': 'file',
            '.svg': 'file',
        },
        ...opts,
        plugins,
    });

    // Bundle.
    try {
        build_result = await ctx.rebuild();
        // console.log("INSPECT Build result:", build_result);
        for (const msg of build_result?.errors ?? []) errors.push(create_esbuild_err(msg));
        for (const msg of build_result?.warnings ?? []) errors.push(create_esbuild_err(msg));
    } catch (err: any) {
        // console.log("Bundle gailed, error:", err);

        // Add errors/warnings.
        let processed = false;
        if (Array.isArray(err.errors)) {
            for (const error of err.errors) errors.push(create_esbuild_err(error));
            processed = true;
        }
        if (Array.isArray(err.warnings)) {
            for (const warning of err.warnings) errors.push(create_esbuild_err(warning));
            processed = true;
        }

        // Add normal err.
        if (!processed) {
            errors.push({ data: err.message || String(err) });
        }
    } finally {
        await ctx.dispose();
        if (!build_result) {
            build_result = secondary_build_result;
        }
    }

    // Capture inputs.
    if (build_result?.metafile?.inputs) {
        inputs = Object.keys(build_result.metafile.inputs).map(resolve_path);
    }

    // Get import chains.
    let import_chains: ImportChain[] | undefined;
    const get_import_chains = () => {
        import_chains = [];
        if (graph) {
            for (let i = 0; i < errors.length; i++) {
                const p = errors[i].file_name;
                if (!p) continue;
                const g = graph.get_import_chains(p)
                if (!g) continue;
                // const last = import_chains[import_chains.length - 1];
                import_chains.push(g);
            }
        } else {
            // use a batch for caching.
            const traces: TraceRequest[] = [];
            for (const e of errors) {
                if (e.file_name) {
                    for (const input of include) {
                        traces.push({ from: pathlib.resolve(input.toString()), to: pathlib.resolve(e.file_name) });
                    }
                }
            }
            import_chains = import_tracer!.trace(traces);
        }
        return import_chains;
    }

    // Response.
    return {
        errors,
        format_errors: () => {
            const errors_formatted: string[] = [];
            for (let i = 0; i < errors.length; i++) {
                const e = errors[i];
                errors_formatted.push(e.data);
            }
            return errors_formatted;
        },
        inputs,
        import_chains: get_import_chains,
        format_import_chains: () => use_import_graph
            ? graph!.format_import_chains(get_import_chains())
            : import_tracer!.format_import_chains(get_import_chains()),
        metafile: build_result?.metafile ? esbuild.analyzeMetafileSync(build_result.metafile, { verbose: false }) : undefined,
        debug({
            limit,
            filter,
        }: {
            limit?: number
            filter?: (error: CompilerError) => boolean
        }): string {
            const lines: string[] = [];
            if (limit == null || limit < 0) limit = errors.length;
            for (let i = 0; i < Math.min(limit, errors.length); i++) {
                const e = errors[i];
                if (filter && !filter(e)) continue;
                lines.push(e.data);
                if (e.file_name) {
                    const error_chains = use_import_graph
                        ? [graph!.get_import_chains(e.file_name)]
                        : import_tracer!.trace(
                            include.map(p => ({ from: pathlib.resolve(p.toString()), to: pathlib.resolve(e.file_name!) })),
                        );
                    // console.log("Error chains for", e.file_name, ":", error_chains);
                    // const error_chains = import_chains?.filter(c => c.target === e.file_name);
                    if (error_chains?.length) {
                        for (const chain of error_chains) {
                            if (!chain || !chain.found || chain.chains.length === 0) continue;
                            const g = use_import_graph
                                ? graph!.format_import_chains([chain], "    ", 10)
                                : import_tracer!.format_import_chains([chain], "    ", 10);
                            lines.push(...g);
                            if (g.length > 0) {
                                lines.push(""); // add an empty line after the import chain
                            }
                        }
                    }
                }
            }
            return lines.join("\n");
        }
    };
}

// /**
//  * A plugin that tracks imports and can retrace the import chain for errors.
//  * This requires a plugin since metafiles are not available on thrown errors.
//  * This plugin is useful for debugging used backend files in frontend code.
//  * 
//  * @warning This should only be used for debugging purposes and may cause external modules to be bundled incorrectly.
//  */
// class ImportTracker {
//     plugin: esbuild.Plugin;
//     import_graph: Map<string, string[]> = new Map();
//     errors: CompilerError[] = [];
//     error_files: Set<string> = new Set();
//     externals: Set<string>;

//     constructor(externals: string[] = []) {
//         const import_graph = this.import_graph;
//         this.externals = new Set(externals);
//         const externals_set = this.externals;
        
//         this.plugin = {
//             name: 'import-tracker',
//             setup(build) {

//                 // Track and fully resolve relative / absolute imports
//                 build.onResolve({ filter: /^(\.|\/)/ }, (args): esbuild.OnResolveResult => {
//                     const importer = args.importer || '__cwd__';
//                     const resolved = pathlib.resolve(
//                         pathlib.dirname(importer === '__cwd__' ? process.cwd() : importer),
//                         args.path
//                     );
//                     const arr = import_graph.get(importer) || [];
//                     arr.push(resolved);
//                     import_graph.set(importer, arr);
//                     return { path: resolved };
//                 });
                
//                 // Track bare module imports, only mark as external if in externals list
//                 build.onResolve({ filter: /^[^\.\/]/ }, (args): esbuild.OnResolveResult | undefined => {
//                     const importer = args.importer || '__cwd__';
//                     // we record the module name rather than try to find a file
//                     const arr = import_graph.get(importer) || [];
//                     arr.push(args.path);
//                     import_graph.set(importer, arr);
//                     // return { path: args.path, external: true };
//                     // Only treat it as external if the caller asked for it
//                     if (externals_set.has(args.path)) {
//                         return { path: args.path, external: true };
//                     }
//                     // Otherwise let esbuild try to resolve it (so it will
//                     // surface “Could not resolve …” errors if it can’t)
//                     return undefined;
//                 });
//             },
//         };
//     }

//     /** Add an esbuild error or warning. */
//     add_error(error: CompilerError) {
//         this.errors.push(error);
//         if (error.file_name) {
//             this.error_files.add(resolve_path(error.file_name));
//         }
//     }
    
//     /** Show the import chain for an error. */
//     show_import_chain(
//         include: (string | Path)[],
//         error: string | CompilerError,
//         indent = "",
//     ): string | undefined {
//         console.log("Show import chain for error", error, "in", include, "with indent", indent, "\nIMPORT ");
//         // Skips.
//         let out_lines: string[] = [];
//         let error_path: string | undefined;
//         if (
//             this.error_files.size === 0
//             || !(error_path = resolve_path(typeof error === "string" ? error : error.file_name!))
//             || !this.error_files.has(error_path)
//         ) {
//             console.log("EARLY RETURN FUCKER!", 
//                 this.error_files.size === 0,
//                 !(error_path = resolve_path(typeof error === "string" ? error : error.file_name!)),
//                 !this.error_files.has(error_path),
//             )
//             return;
//         }

//         // Get as relative path from single include if so, otherwise just as input.
//         // const as_relative = (path: string): string => include.length === 1 ? pathlib.relative(include[0] instanceof Path ? include[0].path : include[0], path) : path;

//         // Prepare an array of paths to be dumped to console.
//         const prepare_paths = (paths: string[]): string[] => {
//             let p = paths
//                 .filter(Boolean)
//                 .map(resolve_path);
//             if (p.length > 0) {
//                 const common_base = Path.find_common_base_path(p);
//                 if (common_base) {
//                     const slice_start = new Path(common_base).abs().str().length;
//                     for (let i = 0; i < p.length; i++) {
//                         p[i] = "." + p[i].slice(slice_start);
//                     }
//                 }
//             }
//             return p;
//         }

//         // Walk the import graph.
//         const walk = (curr: string, chain: string[]): void => {
//             console.log("WALK", curr, pathlib.resolve(curr) ,"VS", error_path);
//             if (
//                 curr === error_path
//                 || pathlib.resolve(curr) === error_path // only show the chain of this error - use pathlib since tracker also uses this..
//                 // this.error_files.has(resolve_path(curr)) // show chains for all errors.
//             ) {
//                 console.log("FOUND ERROR PATH", curr, "IN", error_path);
//                 const lines = prepare_paths(chain.concat(curr))
//                     .map((l, i) => false && i === 0 ? Color.italic(l) : `${indent}  ${Color.italic(l)}`)
//                     .map((l, i, arr) => i === arr.length - 1 ? l : `${l} ${Color.blue("→")}`) // ▶ →
//                     .map((l, i, arr) => {
//                         if (!l) { return l; }
//                         const next = arr[i + 1]?.trimStart();
//                         if (next && l.length + next.length <= 125) {
//                             arr[i + 1] = "";
//                             return l + " " + next;
//                         } else if (next === l) {
//                             arr[i + 1] = "";
//                             return l;
//                         }
//                         return l;
//                     })
//                     .filter(Boolean)
//                     .join("\n");
//                 out_lines.push(`${indent}${Color.gray("note")}: Import chain for error \n${lines}`);
//                 return;
//             }
//             const children = this.import_graph.get(curr) || [];
//             for (const next of children) {
//                 if (chain.includes(next)) continue; // avoid cycles
//                 walk(next, chain.concat(curr));
//             }
//         }
        
//         // Iterate.
//         for (const entry of include.map(resolve_path)) { // ['__cwd__', ...include.map(resolve_path)]
//             walk(entry, []);
//         }
//         console.log("INCLUDE RESOLVED:", include.map(resolve_path));
//         console.log("OUT LINES:", out_lines);

//         // Response.
//         return out_lines.length > 0 ? out_lines.join("\n") : undefined;
//     }
// }