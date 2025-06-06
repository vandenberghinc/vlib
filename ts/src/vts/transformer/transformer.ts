/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import fs from "fs/promises";
import fg from 'fast-glob';
import path_module from "path";
import * as vlib from "@vlib";
import { Path } from "@vlib";
import { log_helper, Plugin, Source } from "../plugins/plugin.js";
import { Enforce, Merge, EnforceOne, Transform, TransformFor } from "@vlib/types/index.m.js";
import { parse_imports } from "../utils/parse_imports.js";

/**
 * Transformer options.
 */
export namespace Transformer {

    /**
     * The goal is to create variants, whereas ! is used to indicate that the property is required.
     * 
     * - Base & { tsconfig!: X } 
     * - Base & { include!: X[] }
     */

    export type Opts<V extends "tsconfig" | "include" | "memory" = "tsconfig" | "include" | "memory"> = V extends "tsconfig"
        ? TransformFor<Opts.Base, "tsconfig", never, "include" | "exclude" | "check_include", {}, never>
        : V extends "include"
            ? TransformFor<Opts.Base, "include", "exclude", never, {}, never >
            : TransformFor<Opts.Base, "memory", never, never, {}, never>

    /** Base options. */
    export namespace Opts {
        export interface Base {
            /**
             * The include glob patterns.
             */
            include?: string[];
            /**
             * When enabled, all non glob pattern includes must exist, or an error will be thrown.
             */
            check_include?: boolean;
            /**
             * The exclude glob patterns.
             */
            exclude?: string[];
            /**
             * The path to the tsconfig.json file.
             */
            tsconfig?: Path | string;
            /**
             * Insert the tsconfig includes/excludes into the Transformer config.
             */
            insert_tsconfig?: boolean;
            /**
             * Parse imports from the included non glob or directory file path, defaults to `false`.
             */
            parse_imports?: boolean;
            /**
             * The plugins.
             * @todo also support [string, { args }] format, where the string is the import path of a path that exports a Plugin and the args are the args for the plugin constructor.
             *       so we can also add derived plugins by string
             *       since they can ofcourse always manyally be added, but then they cant be used in the CLI.
             *       
             */
            plugins: (undefined | Plugin)[];
            /**
             * Run in async, defaults to true.
             */
            async?: boolean;
            /**
             * The debug instance to use for logging.
             */
            debug?: number | vlib.Debug;
            /**
             * Automatically answer yes to all interactive prompts, defaults to `false`.
             * This should be used with caution since some plugins edit actual source files instead of dist files.
             * By default before saving any file the user will be prompted to confirm the changes.
             */
            yes?: boolean;
            /**
             * An in-memory record of files mapped by their path to their content.
             */
            files?: Record<string, string>;
            /**
             * Capture changes, defaults to `false`.
             * When `yes` is `true`, this will always be set to `true`.
             */
            capture_changes?: boolean;
        }
    }

    /** The initialized config type. */
    export type Config = Merge<
        Enforce<
            Transformer.Opts,
            "yes" | "async" | "parse_imports"
            | "insert_tsconfig" | "check_include" | "debug"
        >,
        {
            /** Active de debug instance. */
            debug: vlib.Debug;
            /** A shared mutex for interactive prompts, in case we run in async. */
            interactive_mutex: vlib.Mutex;
            /** Input files. */
            files?: Map<string, string>;
        }
    >;
}

/**
 * The VTS transformer.
 */
export class Transformer {
    
    /** The root plugin id from the transformer. */
    static readonly id = new Plugin.Id("vts");

    /** The log id for the alias log methods. */
    protected static readonly log_id = new Path("/vts", false);

    /** The initialized config. */
    config: Transformer.Config;

    /**
     * All processed source files.
     * Note that not all source files are changed, just all processed files.
     */
    sources: Map<string, Source> = new Map();

    /** Mutext for interactive prompts. */
    protected interactive_mutex: vlib.Mutex = new vlib.Mutex();

    /** Loaded tsconfig attributes. */
    protected tsconfig: Record<string, any> | undefined = undefined;
    protected tsconfig_path: Path | undefined = undefined;
    protected tsconfig_base: Path | undefined = undefined;

    /** Constructor. */
    constructor(config: Transformer.Opts) {
        const { yes = false } = config;
        this.config = {
            ...config,
            yes,
            interactive_mutex: new vlib.Mutex(),
            async: (config.async ?? true) && yes, // dont run in async if yes is false, otherwise the logs are hard to read with interactive prompts.
            parse_imports: config.parse_imports ?? false,
            insert_tsconfig: config.insert_tsconfig ?? false,
            check_include: config.check_include ?? true,
            debug: config.debug instanceof vlib.Debug
                ? config.debug
                : new vlib.Debug(config.debug ?? 0),
            files: config.files ? new Map(Object.entries(config.files ?? {})) : undefined,
            capture_changes: !yes || (config.capture_changes ?? false),
        };
    }

    /**
     * Create a manual `on` function to detect used log levels.
     */
    on(level: number): boolean {
        return level <= this.config.debug.level.n;
    }

    /**
     * Get a file from the in-memory files.
     * @throws an error if the file is not found.
     */
    get_in_memory_file(file_path: string): string {
        if (!this.config.files) {
            throw new Error(`No in-memory files configured, cannot get file "${file_path}".`);
        }
        if (!this.config.files.has(file_path)) {
            throw new Error(`In-memory file "${file_path}" not found.`);
        }
        return this.config.files.get(file_path)!
    }

    /** Ensure a tsconfig is loaded. */
    assert_tsconfig(): asserts this is { tsconfig: Record<string, any>, tsconfig_path: Path, tsconfig_base?: Path } {
        if (!this.tsconfig || !this.tsconfig_path) {
            if (this.config.tsconfig) {
                throw new Error(`No tsconfig found at "${this.tsconfig_path?.path ?? "undefined"}".`);
            } else {
                throw new Error(`No tsconfig configured, but required for this transformer.`);
            }
        }
    }

    /**
     * Initialize a source file.
     */
    private init_source(
        file_path: string,
        in_memory: boolean = false,
    ): void {

        // Infer dist/src type.
        const f = new Path(file_path, false)
        const ext = f.extension();
        const is_d_ts = file_path.endsWith(".d.ts");
        const is_ts = !is_d_ts && (ext === ".ts" || ext === ".tsx");
        const is_js = ext === ".js" || ext === ".jsx";
        const type = is_js ? "dist" : is_ts ? "src" : undefined;
        if (!type) {
            if (this.on(1)) this.log(`Skipping file "${file_path}" by unsupported file extension.`);
            return ;
        }

        // Resolve the ts source file from dist file.
        let ts_src: Path | undefined;
        if (type === "dist") {
            const ts_path = f.path.replace(/\.js(x?)$/, ".ts$1");
            let root_dir: string | undefined, relative_path: string | undefined, full_ts_path: string | undefined;
            if (
                (in_memory && this.config.files?.has(ts_path))
                || (!in_memory && Path.exists(ts_path)
                )
            ) { ts_src = new Path(ts_path, false); }
            else if (
                this.tsconfig
                && (root_dir = this.tsconfig.compilerOptions?.rootDir
                    ? path_module.resolve(this.tsconfig_base?.path || "", this.tsconfig.compilerOptions.rootDir)
                    : this.tsconfig_base?.path || undefined)
                && (relative_path = path_module.relative(root_dir, ts_path))
                && (full_ts_path = path_module.resolve(root_dir, relative_path))
                && (
                    (in_memory && this.config.files?.has(full_ts_path))
                    || (!in_memory && Path.exists(full_ts_path))
                )
            ) { ts_src = new Path(full_ts_path, false) }
        } else if (type === "src" && !is_d_ts) {
            ts_src = f;
        }

        // Create source.
        const src: Source = new Source(
            file_path,
            type,
            in_memory ? this.get_in_memory_file(file_path) : undefined,
            ts_src,
            this.config,
            in_memory,
        );
        this.sources.set(src.path.path, src);
    }

    /**
     * Initialize all sources.
     */
    private async init_sources(): Promise<{ error?: Transformer.Error }> {
        if (this.on(2)) this.log(`Initializing sources...`);

        // Load the tsconfig.
        if (this.config.tsconfig) {
            this.tsconfig_path = this.config.tsconfig ? Transformer.resolve_tsconfig(this.config.tsconfig) : undefined;
            if (!this.tsconfig_path || !this.tsconfig_path.exists()) throw new Error(`No tsconfig found at "${this.tsconfig_path?.path ?? "undefined"}".`);
            this.tsconfig = await vlib.jsonc.load(this.tsconfig_path);
            if (this.on(1)) this.log(`Loaded tsconfig from "${this.tsconfig_path.path}".`);
            this.tsconfig_base = this.tsconfig_path.base();
        }

        // Process in-memory files.
        if (this.config.files && this.config.files.size > 0) {
            if (this.on(1)) this.log(`Processing ${this.config.files.size} in-memory files.`);
            for (const file_path of this.config.files.keys()) {
                this.init_source(file_path, true);
            }
        }

        // Process include patterns.
        if (this.on(1)) this.log(`Processing include patterns...`);
        const { error, tsconfig_base, matched_files } =  await this.create_include_patterns()
        if (error) { return { error }; }
        this.tsconfig_base = tsconfig_base;
        if (this.config.files?.size === 0 && matched_files.length === 0) {
            return { error: { type: "warning", message: "No files matched the include patterns." } };
        }
        for (const file_path of matched_files) {
            this.init_source(file_path, false);
        }

        // Resolve the common base path for all sources.
        const cbp = Path.find_common_base_path(Array.from(this.sources.keys()));
        if (cbp) {
            for (const src of this.sources.values()) {
                src.non_unique_id.path = src.path.path.slice(cbp.length + 1);
            }
        }

        // Response.
        if (this.on(1)) this.log(`Initialized ${this.sources.size} sources.`);
        return {};
    }

    /**
     * Create the include patterns from the `include` and `tsconfig.include` options.
     */
    private async create_include_patterns(): Promise<
        | { error: Transformer.Error, tsconfig_base?: never, matched_files?: never }
        | { error?: never, tsconfig_base?: Path, matched_files: string[] }
    > {
        
        // Extract include/exclude patterns
        const include_patterns: string[] = [];
        const exclude_patterns = this.config.exclude ?? [];
        exclude_patterns.push("**/node_modules/**", "**/.DS_Store");

        /** Process an include pattern. */
        const process_include_pattern = (include: string, in_memory = false): void | Promise<void> => {
            if (this.on(2)) this.log(`Processing include "${include}"`);
            if (in_memory) {
                return;
            }
            if (vlib.GlobPattern.is(include)) {
                include_patterns.push(include);
                if (this.on(2)) this.log(`Adding included pattern "${include}".`);
                return;
            }
            const path = new Path(include);
            if (!path.exists()) {
                throw new Error(`Included path "${include}" does not exist.`);
            }
            if (path.is_dir()) {
                include_patterns.push(`${path.unix().path}/**/*.{js,jsx,ts,tsx}`);
                if (this.on(2)) this.log(`Adding included directory "${include}".`);
                return;
            }
            if (!this.config.parse_imports) {
                include_patterns.push(path.unix().path);
                if (this.on(2)) this.log(`Adding included file "${include}".`);
                return;
            }
            // add imports.
            return new Promise<void>((resolve, reject) => {
                parse_imports(include, { recursive: true, external: false })
                    .then(parsed_imports => {
                        if (this.on(2)) this.log(`Parsed imports from tsconfig include "${include}":`, parsed_imports);
                        include_patterns.push(...parsed_imports); // not unix but ok.
                        resolve();
                    })
                    .catch(reject);
            })
        }

        // Process the already added include patterns.
        let promise;
        if (this.config.include) {
            for (let i = 0; i < this.config.include.length; i++) {
                if ((promise = process_include_pattern(this.config.include[i])) instanceof Promise) await promise;
            }
        }

        // Load and parse tsconfig.json
        const tsconfig_path = this.config.tsconfig ? Transformer.resolve_tsconfig(this.config.tsconfig) : undefined;
        if (tsconfig_path && this.on(1)) this.log(`Using tsconfig "${tsconfig_path}"`);
        const tsconfig = tsconfig_path ? await vlib.jsonc.load(tsconfig_path) : undefined;
        const tsconfig_base = tsconfig_path?.base();
        if (this.config.insert_tsconfig) {
            if (Array.isArray(tsconfig.exclude)) {
                for (const exclude of tsconfig.exclude) {
                    const res = path_module.resolve(tsconfig_base?.path || process.cwd(), exclude);
                    if (this.on(1)) this.log(`Adding tsconfig exclude "${exclude}"`);
                    exclude_patterns.push(res);
                }
            }
            if (Array.isArray(tsconfig.include)) {
                for (let i = 0; i < tsconfig.include.length; i++) {
                    if ((promise = process_include_pattern(tsconfig.include[i])) instanceof Promise) await promise;
                }
            }
        }

        // Process in-memory files.
        if (this.config.files && this.config.files.size > 0) {
            if (this.on(1)) this.log(`Processing ${this.config.files.size} in-memory files.`);
            for (const file_path of this.config.files.keys()) {
                if ((promise = process_include_pattern(file_path, true)) instanceof Promise) await promise;
            }
        }

        // Check include paths.
        let not_found: string[];
        if (
            this.config.check_include
            && (not_found = include_patterns.filter(i => !vlib.GlobPattern.is(i))).length
        ) {
            throw new Error(`Included path${not_found.length > 1 ? "s" : ""} ${not_found.map(l => `"${l}"`).join(", ")} do${not_found.length > 1 ? "es" : ""} not exist.`);
        }

        if (this.on(1)) this.log(`Found ${include_patterns.length} include patterns.`);
        if (this.on(2)) this.log(`Include patterns:${include_patterns.length ? include_patterns.map((l, i) => `\n      - ${l.replace(/^[./]*/, "")}`).join("") : "[]"}`);

        // List all files matching include, filtering out exclude
        const matched_files = include_patterns.length === 0 ? [] as never : await fg(
            include_patterns,
            { dot: true, onlyFiles: true, ignore: exclude_patterns, absolute: true, cwd: tsconfig_base?.path || process.cwd() },
        )
        if (matched_files.length === 0 && !this.config.files?.size) {
            this.warn(`No files matched the include patterns: ${include_patterns.join(", ")}`);
            return { error: { type: "warning", message: "No files matched the include patterns." } };
        }
        if (this.on(1)) this.log(`Found ${matched_files.length} files to consider.`);
        if (this.on(2)) this.log(`Matched files:${matched_files.length ? matched_files.map((l, i) => `\n      - ${l.replace(/^[./]*/, "")}`).join("") : "[]"}`);

        return { tsconfig_base, matched_files };

    }

    /**
     * Alias log methods.
     * @note That we do not use the `debug` instance here.
     *       The plugin should use `if (this.this.on(1)) source.log()` to log messages.
     */
    log(...message: any[]): void {
        log_helper(Transformer.log_id, undefined, Transformer.id, ...message);
    }
    warn(...message: any[]): void {
        log_helper(Transformer.log_id, vlib.Color.yellow_bold("warning "), Transformer.id, ...message);
    }
    error(...message: any[]): void {
        log_helper(Transformer.log_id, vlib.Color.red_bold("error "), Transformer.id, ...message);
    }

    /**
     * Run the plugin.
     */
    async run(): Promise<{
        error?: Transformer.Error,
    }> {

        // Variable aliases.
        let {
            debug,
            yes,
        } = this.config;

        // Dump plugins.
        if (this.config.plugins && this.on(2)) {
            this.log(`Found ${this.config.plugins.length} plugin${this.config.plugins.length === 1 ? "" : "s"} to run:`);
            for (let i = 0; i < this.config.plugins.length; i++) {
                const plugin = this.config.plugins[i];
                if (plugin) {
                    this.log(`  - `, plugin);
                } else {
                    this.log(`  - <undefined plugin>`);
                }
            }
        }

        // Initialize sources.
        const res = await this.init_sources();
        if (res.error) { return res; }
        
        // Drop all undefined plugins or plugins that do not have a callback.
        const plugins = this.config.plugins?.filter(p => p && p.callback) as Enforce<Plugin, "callback">[];

        // Update debug instance on plugins.
        await Promise.all(plugins.map(p => p.build({
            debug: this.config.debug,
        })));

        // Check if we have dist plugins.
        const has_dist = plugins.some(p => p.has_dist);

        /**
         * Wrapper function to process a file.
         */
        const process_file = async (source: Source): Promise<void> => {
            // if (this.on(2)) {
            //     this.log(`Processing source ${source.non_unique_id.path} [${source.type}]...`);
            // }

            // Run the plugins.
            for (const plugin of plugins) {
                if (!plugin || !plugin.callback) { continue; }
                let not_processed = true;

                // Run src.
                if (
                    (source.is_src && plugin.has_src) ||
                    (source.is_dist && plugin.has_dist)
                ) {
                    if (plugin.on(2)) plugin.log(source, `Processing source [${source.type}]...`);
                    if (source.requires_load) { await source.load(); }
                    const old = this.config.capture_changes ? { data: source.data! } : undefined;
                    const changed = source.changed;
                    source.changed = false; // reset to detect local changes.
                    const p = plugin.callback(source);
                    if (p instanceof Promise) await p;
                    if (source.changed && old !== undefined) source.add_change(plugin, old);
                    if (!source.changed && changed) source.changed = true;
                    continue;
                }

                // Not processed.
                if (this.on(1)) {
                   plugin.log(source, `Source is not supported.`);
                }
            }

            // Write changes.
            if (!source.in_memory) {
                if (source?.data != null && source.changed) {
                    await source.save({ yes, plugin: Transformer.id });
                }
            }
        }

        // Process in async or not.
        if (this.config.async) {
            const promises: Promise<void>[] = [];
            for (const source of this.sources.values()) {
                promises.push(process_file(source));
            }
            await Promise.all(promises);
        } else {
            for (const source of this.sources.values()) {
                await process_file(source);
            }
        }
        return {};
    }
    
    /**
     * Run multiple transformers optionally in parallel.
     * Mainly used for in the CLI.
     */
    static async run_multiple(
        transformers: (Transformer | ConstructorParameters<typeof Transformer>[0])[],
        opts?: {
            async?: boolean, // defaults to true
        },
    ): Promise<void> {
        const ts: Transformer[] = transformers.map(t => t instanceof Transformer
            ? t
            : new Transformer({...t, async: opts?.async ?? true})
        );
        if (opts?.async ?? true) {
            const res = await Promise.all(ts.map(t => t.run()));
            for (const r of res) {
                if (r.error?.type === "warning") {
                    vlib.warn(r.error.message);
                } else if (r.error) {
                    throw new Error(r.error.message);
                }
            }
        } else {
            for (const transformer of ts) {
                const { error } = await transformer.run();
                if (error?.type === "warning") {
                    vlib.warn(error.message);
                } else if (error) {
                    throw new Error(error.message);
                }
            }
        }
    }

    /** Resolve tsconfig to an existing file.. */
    static resolve_tsconfig(path: Path | string): Path {
        
        // Load and parse tsconfig.json
        let tsconfig = new Path(path);
        if (!tsconfig.exists()) {
            throw new Error(`Typescript config path "${tsconfig}" does not exist.`);
        }
        else if (tsconfig.is_dir()) {
            tsconfig = tsconfig.join("tsconfig.json");
            if (!tsconfig.exists()) {
                throw new Error(`Typescript source "${path}" does not contain a "tsconfig.json" file.`);
            }
        }
        if (!tsconfig.path.endsWith("tsconfig.json")) {
            throw new Error(`Invalid typescript config path "${tsconfig}", the path should end with "tsconfig.json".`);
        }
        return tsconfig;
    }

}
export namespace Transformer {
    /** Error type. */
    export interface Error {
        type: "error" | "warning",
        message: string,
    };
}