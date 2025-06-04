/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as pathlib from 'path';
import * as esbuild from 'esbuild';

// Get the directory name of the current module
import { Color, Colors, logger, Path, Utils } from '../../../index.js';

// Error interface.
interface CompilerError {
    data: string,
    file_name?: string,
    line?: number,
    column?: number,
};

/**
 * Options for bundling TypeScript code.
 */
export interface BundleOptions {

    // Include paths.
    include?: string[],

    // Output path.
    output?: string | string[],

    // @deprecated Additional entry paths.
    entry_paths?: string[],

    // Error limit.
    error_limit?: number,

    /**
     * Target platform: 'browser' or 'node'.
     */
    platform?: 'browser' | 'node';

    /**
     * Target platform: 'ES2023' etc.
     */
    target?: string;

    /**
     * Output format based on platform.
     * - For 'browser': 'iife' or 'umd'
     * - For 'node': 'cjs' or 'esm'
     */
    format?:
    | 'iife'       // Immediately Invoked Function Expression (Browser)
    // | 'umd'     // Universal Module Definition (Browser/Node)
    | 'cjs'        // CommonJS (Node)
    | 'esm';       // ES Modules (Browser/Node);

    /**
     * Enable or disable minification.
     */
    minify?: boolean;

    /**
     * Enable or disable tree shaking.
     */
    tree_shaking?: boolean;

    /** External library names not to be included in the bundle */
    externals?: string[];

    /**
     * Enable or disable debug console statements.
     */
    debug?: string | boolean;

    /**
     * Enable or disable source map generation.
     */
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';

    // Extract input files.
    extract_inputs?: boolean;

    // Any other esbuild.bundle options.
    opts?: any;

    // Post process the bundled code.
    postprocess?: undefined | ((data: string) => string | Promise<string>);

    /** Log level (default is 0) */
    log_level?: number;

    /** Analyze */
    analyze?: boolean
}

/**
 * Result of the bundling process.
 */
export interface BundleResult {

    /**
     * Bundled JavaScript code.
     */
    code?: string;

    /**
     * Compilation and bundling errors, if any.
     */
    errors: CompilerError[];

    /**
     * Source map, if generated.
     */
    source_map?: string;

    /**
     * Debug function.
     */
    debug: () => void;

    // Input paths.
    // Only defined when extract_inputs is `true`.
    inputs: string[];
}

/*
 * Bundles transpiled JavaScript files using esbuild.
 */
export async function bundle(options: BundleOptions): Promise<BundleResult> {
    let {
        entry_paths = [],
        include = [],
        externals = [],
        output = undefined,
        platform = 'browser',
        format = 'iife',
        target = 'es2021',
        minify = false,
        sourcemap = false, // 'inline'
        error_limit = 25,
        extract_inputs = false,
        tree_shaking = undefined,
        debug = false,
        opts = {},
        postprocess = undefined,
        log_level = 0,
        analyze = true,
    } = options;
    if (entry_paths.length > 0) {
        include = include.concat(entry_paths);
    }

    // Variables.
    const errors: CompilerError[] = [];
    let bundled_code: string | undefined = undefined;
    let bundled_source_map: string | undefined = undefined;
    let inputs: string[] = [];
    const outfile = !output || typeof output === "string" ? output : output[0];
    const import_tracker = analyze ? new ImportTracker() : undefined;

    // Bundle.
    try {
        const result = await esbuild.build({
            entryPoints: include,
            bundle: true,
            platform: platform,
            plugins: [...(opts.plugins || []), import_tracker?.plugin],
            format: format,
            target: target,
            minify: minify,
            sourcemap,
            write: false,
            metafile: extract_inputs,
            logLevel: typeof debug === "boolean" ? (debug ? 'debug' : 'silent') : debug as any,
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
        });
        if (result.errors.length > 0) {
            for (const error of result.errors) {
                errors.push(format_esbuild_warning_error(error));
                const e = format_esbuild_warning_error(error);
                errors.push(e);
                import_tracker?.add_error(e);
            }
        }
        if (result.warnings.length > 0) {
            for (const warning of result.warnings) {
                const e = format_esbuild_warning_error(warning);
                errors.push(e);
                import_tracker?.add_error(e);
            }
        }

        if (extract_inputs && result.metafile?.inputs) {
            inputs = Object.keys(result.metafile.inputs).map(resolve_path);
        }

        // Read output.
        if (result.outputFiles && result.outputFiles.length > 0) {
            bundled_code = result.outputFiles
                .filter(f => f.path === "<stdout>" || (f.path.endsWith('.js') && !f.path.endsWith('.d.js')))
                .map(f => f.text)
                .join('\n');
            if (sourcemap) {
                const mapFile = result.outputFiles.find(f => f.path.endsWith('.map'));
                if (mapFile) bundled_source_map = mapFile.text;
            }
        } else {
            errors.push({ data: "No output files were generated during bundling." });
        }

        if (analyze && result.metafile) {
            const res = await esbuild.analyzeMetafile(result.metafile, { verbose: false })
            console.log("Meta:\n" + res);
        }
    } catch (err: any) {

        // Add errors/warnings.
        let processed = false;
        if (Array.isArray(err.errors)) {
            for (const error of err.errors) {
                const e = format_esbuild_warning_error(error);
                errors.push(e);
                import_tracker?.add_error(e);
            }
            processed = true;
        }
        if (Array.isArray(err.warnings)) {
            for (const warning of err.warnings) {
                const e = format_esbuild_warning_error(warning);
                errors.push(e);
                import_tracker?.add_error(e);
            }
            processed = true;
        }
        
        // Add normal err.
        if (!processed) {
            errors.push({ data: err.message || String(err) });
        }
    }

    // Postprocess with babel
    // if (bundled_code) {
    //     try {
    //         const { transformAsync } = await import('@babel/core');
    //         const babelResult = await transformAsync(bundled_code, {
    //             babelrc: false,
    //             configFile: false,
    //             presets: [
    //                 ['@babel/preset-env', {
    //                     targets: platform === 'browser' ? ">0.25%, not dead" : undefined
    //                 }]
    //             ],
    //             sourceMaps: !!sourcemap,
    //             inputSourceMap: bundled_source_map ? JSON.parse(bundled_source_map) : undefined,
    //         });
    //         if (babelResult && babelResult.code) {
    //             bundled_code = babelResult.code;
    //             if (babelResult.map) {
    //                 bundled_source_map = typeof babelResult.map === 'string'
    //                     ? babelResult.map
    //                     : JSON.stringify(babelResult.map);
    //             }
    //         }
    //     } catch (err: any) {
    //         errors.push({ data: `Babel transform error: ${err.message || err}` });
    //     }
    // }

    // Postprocess.
    if (bundled_code && typeof postprocess === "function") {
        const res = postprocess(bundled_code);
        if (res instanceof Promise) {
            bundled_code = await res;
        } else {
            bundled_code = res;
        }
    }

    // Write to file.
    if (typeof output === "string") {
        await new Path(output).save(bundled_code ?? "");
    } else if (Array.isArray(output)) {
        for (let i = 0; i < output.length; i++) {
            await new Path(output[i]).save(bundled_code ?? "");
        }
    }

    // Logs.
    if (log_level >= 1) {
        const first_path = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);
        if (first_path != null) {
            const p = new Path(first_path);
            logger.marker(`Bundled ${p.full_name()} (${p.str()}) [${Utils.format_bytes(p.size)}].`);
        }
    }

    return {
        code: bundled_code,
        source_map: bundled_source_map,
        errors,
        inputs,
        debug(): string {
            let lines: string[] = [];
            for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
                const e = errors[i];
                lines.push(e.data);
                const res = import_tracker?.show_import_chain(include, e, "    ");
                if (res) { lines.push(res); }
            }
            if (error_limit != null && errors.length > error_limit) {
                lines.push(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
            } else {
                lines.push(`Encountered ${errors.length} errors.`);
            }
            if (typeof bundled_code === "string" && bundled_code !== "") {
                lines.push(`Generated code of ${Utils.format_bytes(Buffer.byteLength(bundled_code, 'utf8'))}`);
            }
            return lines.join("\n");
        },
    };
}

/** Resolve path wrapper. */
function resolve_path(path: string) {
    path = pathlib.resolve(path);
    if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
        path = path.slice(8);
    }
    return path;
}

/** Format an esbuild warning / error. */
const format_esbuild_warning_error = (warning): CompilerError => {
    let output;
    if (warning.location) {
        const trimmed_line = warning.location.lineText.trimStart();
        const removed_start_indent = warning.location.lineText.length - trimmed_line.length;
        output =
            `${Color.cyan(warning.location.file)}:${Color.yellow(warning.location.line)}:${Color.yellow(warning.location.column)}` +
            ` - ${Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}\n` +
            "\n" + Colors.bright_bg.white + Colors.black + warning.location.line + Colors.end + "    " + trimmed_line +
            "\n" + Colors.bright_bg.white + Colors.black + " ".repeat(warning.location.line.toString().length) + Colors.end +
            " ".repeat(4 + warning.location.column - removed_start_indent) + Color.red("~".repeat(warning.location.length));
    } else {
        output = `${Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}`
    }
    if (Array.isArray(warning.notes)) {
        for (const note of warning.notes) {
            if (note.location) {
                const trimmed_line = note.location.lineText.trimStart();
                const removed_start_indent = note.location.lineText.length - trimmed_line.length;
                output +=
                    `\n    ${Color.cyan(note.location.file)}:${Color.yellow(note.location.line)}:${Color.yellow(note.location.column)}` +
                    ` - ${Color.gray("note")}: ${note.text}\n` +
                    "\n" + Colors.bright_bg.white + Colors.black + note.location.line + Colors.end + "        " + trimmed_line +
                    "\n" + Colors.bright_bg.white + Colors.black + " ".repeat(note.location.line.toString().length) + Colors.end +
                    " ".repeat(8 + note.location.column - removed_start_indent) + Color.red("~".repeat(note.location.length));
            } else {
                output +=
                    `\n    ${Color.gray("note")}: ${note.text}`;
            }
            if (note.suggestion) {
                console.error("@todo handle suggestion:" + note.suggestion + " note: " + JSON.stringify(note, null, 4));
            }
        }
    }
    return {
        data: output,
        file_name: warning.location?.file,
        line: warning.location?.line,
        column: warning.location?.column,
    }
}

/**
 * A plugin that tracks imports and can retrace the import chain for errors.
 * This requires a plugin since metafiles are not available on thrown errors.
 * This plugin is useful for debugging used backend files in frontend code.
 */
class ImportTracker {
    plugin: esbuild.Plugin;
    import_graph: Map<string, string[]> = new Map();
    errors: CompilerError[] = [];
    error_files: Set<string> = new Set();
    constructor() {
        const import_graph = this.import_graph;
        this.plugin = {
            name: 'import-tracker',
            setup(build) {
                
                // Track and fully resolve relative / absolute imports
                build.onResolve({ filter: /^(\.|\/)/ }, (args): esbuild.OnResolveResult => {
                    const importer = args.importer || '__cwd__';
                    const resolved = pathlib.resolve(
                      pathlib.dirname(importer === '__cwd__' ? process.cwd() : importer),
                      args.path
                    );
                    const arr = import_graph.get(importer) || [];
                    arr.push(resolved);
                    import_graph.set(importer, arr);
                    return { path: resolved };
                });
                
                // Track bare module imports, but mark them external so esbuild won’t recurse
                build.onResolve({ filter: /^[^\.\/]/ }, (args): esbuild.OnResolveResult => {
                    const importer = args.importer || '__cwd__';
                    // we record the module name rather than try to find a file
                    const arr = import_graph.get(importer) || [];
                    arr.push(args.path);
                    import_graph.set(importer, arr);
                    // tell esbuild dont bundle this prevents any further resolve recursion
                    return { path: args.path, external: true };
                });
            },
        };
    }
    /** Add an esbuild error or warning. */
    add_error(error: CompilerError) {
        this.errors.push(error);
        if (error.file_name) {
            this.error_files.add(resolve_path(error.file_name));
        }
    }
    /** Show the import chain for an error. */
    show_import_chain(include: string[], error: string | CompilerError, indent = ""): string | undefined {

        // Skips.
        let out_lines: string[] = [];
        let error_path: string | undefined;
        if (
            this.error_files.size === 0
            || !(error_path = resolve_path(typeof error === "string" ? error : error.file_name!))
            || !this.error_files.has(error_path)
        ) { return; }

        // Get as relative path from single include if so, otherwise just as input.
        const as_relative = (path: string): string => include.length === 1 ? pathlib.relative(include[0], path) : path;

        // Prepare an array of paths to be dumped to console.
        const prepare_paths = (paths: string[]): string[] => {
            let p = paths
                .filter(Boolean)
                .map(resolve_path);
            if (p.length > 0) {
                const common_base = Path.find_common_base_path(p);
                if (common_base) {
                    const slice_start = new Path(common_base).abs().str().length;
                    for (let i = 0; i < p.length; i++) {
                        p[i] = "." + p[i].slice(slice_start);
                    }
                }
            }
            return p;
        }

        // Walk the import graph.
        const walk = (curr: string, chain: string[]): void => {
            // console.log("Walk", curr, pathlib.resolve(curr) ,"VS", error_path);
            if (
                curr === error_path
                || pathlib.resolve(curr) === error_path // only show the chain of this error - use pathlib since tracker also uses this..
                // this.error_files.has(resolve_path(curr)) // show chains for all errors.
            ) {
                const lines = prepare_paths(chain.concat(curr))
                    .map((l, i) => false && i === 0 ? Color.italic(l) : `${indent}  ${Color.italic(l)}`)
                    .map((l, i, arr) => i === arr.length - 1 ? l : `${l} ${Color.blue("→")}`) // ▶ →
                    .map((l, i, arr) => {
                        if (!l) { return l; }
                        const next = arr[i + 1]?.trimStart();
                        if (next && l.length + next.length <= 125) {
                            arr[i + 1] = "";
                            return l + " " + next;
                        } else if (next === l) {
                            arr[i + 1] = "";
                            return l;
                        }
                        return l;
                    })
                    .filter(Boolean)
                    .join("\n");
                out_lines.push(`${indent}${Color.gray("note")}: Import chain for error \n${lines}`);
                return;
            }
            const children = this.import_graph.get(curr) || [];
            for (const next of children) {
                if (chain.includes(next)) continue; // avoid cycles
                walk(next, chain.concat(curr));
            }
        }
        
        // Iterate.
        for (const entry of include.map(resolve_path)) { // ['__cwd__', ...include.map(resolve_path)]
            walk(entry, []);
        }

        // Response.
        return out_lines.length > 0 ? out_lines.join("\n") : undefined;
    }
}