/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as pathlib from 'path';
import * as esbuild from 'esbuild';

// Get the directory name of the current module
import { Color, Colors, log, Path, Utils } from "@vlib";

// ------------------------------------------------------------------------------------------------------------------------
// Utilties.

/**
 * Resolve path wrapper.
 * @private
 */
export function resolve_path(path: string | Path): string {
    if (path instanceof Path) {
        path = path.path;
    }
    if (path === "__cwd__") {
        return process.cwd(); // "__cwd__";
    }
    path = pathlib.resolve(path);
    if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
        path = path.slice(8);
    }
    return path;
}

/**
 * Format an esbuild warning / error.
 * @private
 */
export const create_esbuild_err = (warning): CompilerError => {
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
            // if (note.suggestion) {
            //     console.error("@todo handle suggestion:" + note.suggestion + " note: " + JSON.stringify(note, null, 4));
            // }
        }
    }
    return {
        data: output,
        file_name: warning.location?.file,
        line: warning.location?.line,
        column: warning.location?.column,
    }
}

/** Error interface. */
export interface CompilerError {
    data: string,
    file_name?: string,
    line?: number,
    column?: number,
};

// ------------------------------------------------------------------------------------------------------------------------
// Types.


/**
 * Options for bundling TypeScript code.
 */
export interface BundleOptions {

    /** Include paths. */
    include?: (string | Path)[],

    /** Output path. */
    output?: string | Path | (string | Path)[],

    // Error limit.
    error_limit?: number,

    /** Target platform: 'browser' or 'node'. */
    platform?: 'browser' | 'node';

    /** Target platform: 'ES2023' etc. */
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
}

/**
 * Result of the bundling process.
 */
export interface BundleResult {
    /** Bundled JavaScript code. */
    code?: string;
    /** Compilation and bundling errors, if any. */
    errors: CompilerError[];
    /** Source map, if generated. */
    source_map?: string;
    /** Input paths. Only defined when extract_inputs is `true`. */
    inputs: string[];
    /** Debug function. */
    debug: () => string;
}

/*
 * Bundles transpiled JavaScript files using esbuild.
 */
export async function bundle(options: BundleOptions): Promise<BundleResult> {
    let {
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
        postprocess = undefined,
    } = options;

    // Variables.
    const errors: CompilerError[] = [];
    let bundled_code: string | undefined = undefined;
    let bundled_source_map: string | undefined = undefined;
    let inputs: string[] = [];
    let outfile = Array.isArray(output) ? output[0] : output;
    if (outfile instanceof Path) outfile = outfile.path;
    let build_result: esbuild.BuildResult;

    // Bundle.
    try {
        build_result = await esbuild.build({
            entryPoints: include.map(p => p instanceof Path ? p.path : p),
            bundle: true,
            platform: platform,
            format: format,
            target: target,
            minify: minify,
            sourcemap,
            write: false,
            metafile: extract_inputs,
            logLevel: (typeof debug === "boolean" && debug) || (typeof debug === "number" && debug > 0) ? 'debug' : 'silent',
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
            ...(options.opts || {}),
        });
        // console.log("BUNDLE build result:", build_result);
        if (build_result.errors.length > 0) {
            for (const error of build_result.errors) {
                errors.push(create_esbuild_err(error));
            }
        }
        if (build_result.warnings.length > 0) {
            for (const warning of build_result.warnings) {
                errors.push(create_esbuild_err(warning));
            }
        }

        if (extract_inputs && build_result.metafile?.inputs) {
            inputs = Object.keys(build_result.metafile.inputs).map(resolve_path);
        }

        // Read output.
        if (build_result.outputFiles && build_result.outputFiles.length > 0) {
            bundled_code = build_result.outputFiles
                .filter(f => f.path === "<stdout>" || (f.path.endsWith('.js') && !f.path.endsWith('.d.js')))
                .map(f => f.text)
                .join('\n');
            if (sourcemap) {
                const mapFile = build_result.outputFiles.find(f => f.path.endsWith('.map'));
                if (mapFile) bundled_source_map = mapFile.text;
            }
        } else {
            errors.push({ data: "No output files were generated during bundling." });
        }
    } catch (err: any) {
        // console.error("BUDNLE build failed, error:", err);
        // Add errors/warnings.
        let processed = false;
        if (Array.isArray(err.errors)) {
            for (const error of err.errors) {
                errors.push(create_esbuild_err(error));
            }
            processed = true;
        }
        if (Array.isArray(err.warnings)) {
            for (const warning of err.warnings) {
                errors.push(create_esbuild_err(warning));
            }
            processed = true;
        }
        
        // Add normal err.
        if (!processed) {
            errors.push({ data: err.message || String(err) });
        }
    }

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
    if (debug === true || (typeof debug === "number" && debug >= 1)) {
        const first_path = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);
        if (first_path != null) {
            const p = new Path(first_path);
            log.marker(`Bundled ${p.full_name()} (${p.str()}) [${Utils.format_bytes(p.size)}].`);
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