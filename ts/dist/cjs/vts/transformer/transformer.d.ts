/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "../../vlib/index.js";
import { Path } from "../../vlib/index.js";
import { Plugin, Source } from "../plugins/plugin.js";
import { Enforce, Merge, TransformFor } from "../../vlib/types/index.m.js";
/**
 * Transformer options.
 */
export declare namespace Transformer {
    /**
     * The goal is to create variants, whereas ! is used to indicate that the property is required.
     *
     * - Base & { tsconfig!: X }
     * - Base & { include!: X[] }
     */
    type Opts<V extends "tsconfig" | "include" | "memory" = "tsconfig" | "include" | "memory"> = V extends "tsconfig" ? TransformFor<Opts.Base, "tsconfig", never, "include" | "exclude" | "check_include", {}, never> : V extends "include" ? TransformFor<Opts.Base, "include", "exclude", never, {}, never> : TransformFor<Opts.Base, "memory", never, never, {}, never>;
    /** Base options. */
    namespace Opts {
        interface Base {
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
        }
    }
    /** The initialized config type. */
    type Config = Merge<Enforce<Transformer.Opts, "yes" | "async" | "parse_imports" | "insert_tsconfig" | "check_include" | "debug">, {
        /** Active de debug instance. */
        debug: vlib.Debug;
        /** A shared mutex for interactive prompts, in case we run in async. */
        interactive_mutex: vlib.Mutex;
        /** Input files. */
        files?: Map<string, string>;
    }>;
}
/**
 * The VTS transformer.
 */
export declare class Transformer {
    /** The root plugin id from the transformer. */
    static readonly id: Plugin.Id;
    /** The log id for the alias log methods. */
    protected static readonly log_id: vlib.Path;
    /** The initialized config. */
    config: Transformer.Config;
    /**
     * All processed source files.
     * Note that not all source files are changed, just all processed files.
     */
    sources: Map<string, Source>;
    /** Mutext for interactive prompts. */
    protected interactive_mutex: vlib.Mutex;
    /** Loaded tsconfig attributes. */
    protected tsconfig: Record<string, any> | undefined;
    protected tsconfig_path: Path | undefined;
    protected tsconfig_base: Path | undefined;
    /** Constructor. */
    constructor(config: Transformer.Opts);
    /**
     * Create a manual `on` function to detect used log levels.
     */
    on(level: number): boolean;
    /**
     * Get a file from the in-memory files.
     * @throws an error if the file is not found.
     */
    get_in_memory_file(file_path: string): string;
    /** Ensure a tsconfig is loaded. */
    assert_tsconfig(): asserts this is {
        tsconfig: Record<string, any>;
        tsconfig_path: Path;
        tsconfig_base?: Path;
    };
    /**
     * Initialize a source file.
     */
    private init_source;
    /**
     * Initialize all sources.
     */
    private init_sources;
    /**
     * Create the include patterns from the `include` and `tsconfig.include` options.
     */
    private create_include_patterns;
    /**
     * Alias log methods.
     * @note That we do not use the `debug` instance here.
     *       The plugin should use `if (this.this.on(1)) source.log()` to log messages.
     */
    log(...message: any[]): void;
    warn(...message: any[]): void;
    error(...message: any[]): void;
    /**
     * Run the plugin.
     */
    run(): Promise<{
        error?: Transformer.Error;
    }>;
    /**
     * Run multiple transformers optionally in parallel.
     * Mainly used for in the CLI.
     */
    static run_multiple(transformers: (Transformer | ConstructorParameters<typeof Transformer>[0])[], opts?: {
        async?: boolean;
    }): Promise<void>;
    /** Resolve tsconfig to an existing file.. */
    static resolve_tsconfig(path: Path | string): Path;
}
export declare namespace Transformer {
    /** Error type. */
    interface Error {
        type: "error" | "warning";
        message: string;
    }
}
