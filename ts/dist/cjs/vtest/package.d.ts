/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { GlobPatternList } from "../vlib/index.js";
import * as vlib from "../vlib/index.js";
/**
 * Initialized configuration options.
 */
export type Config = typeof Config.Schema.validated & {
    debug?: number | string;
};
/** Configuration options. */
export declare namespace Config {
    /**
     * Unit test configuration file options.
     */
    interface Opts {
        /**
         * The path to the output directory. This should reside inside your repo and should not be ignored by git etc.
         * Under this directory the unit test results will be stored, including the hashes of the unit tests.
         * Therefore this directory should be handled with care.
         * @warning
         *      When the output directory is deleted all unit test hashes will be lost.
         *      Causing a full manual re-evaluation of all unit tests.
         */
        output: string;
        /** The glob patterns of unit test files to include. Defaults to all files in the current working directory. */
        include: string | string[];
        /** The glob patterns of unit test files to exclude. */
        exclude?: string | string[];
        /** The paths to one or multiple environment files to import. */
        env?: string | string[];
        /**
         * The path(s) to a configuration file that will be used as base for the configuration.
         * The first existing configuration file will be used as base when multiple base files are defined.
         * New configuration values will override values from the base configuration.
         */
        extends?: string | string[];
    }
    /** Initialize the schema validator. */
    const Schema: vlib.Schema.Validator<any[] | Record<string, any>, true, {
        readonly output: {
            readonly type: "string";
            readonly required: true;
        };
        readonly include: {
            readonly type: "array";
            readonly value_schema: {
                readonly type: "string";
            };
            readonly required: true;
            readonly preprocess: (v: any) => any;
        };
        readonly exclude: {
            readonly type: "array";
            readonly default: readonly [string];
            readonly value_schema: {
                readonly type: "string";
            };
            readonly preprocess: (v: any) => any;
        };
        readonly env: {
            readonly type: "array";
            readonly required: false;
            readonly default: string[];
            readonly value_schema: {
                readonly type: "string";
            };
            readonly preprocess: (v: any) => any;
        };
        readonly base: {
            readonly type: readonly ["string", "array"];
            readonly required: false;
        };
    }, any, any[]>;
}
/**
 * The unit test package class.
 * Responsible for executing managing its included modules and unit tests.
 */
export declare class Package {
    /**
     * The initialized configuration object.
     */
    config: Config;
    /** Flag to indicate if the modules are already initialized by `init_modules()` */
    private modules_initialized;
    /**
     * Resolve a path search to a file path, basically an OR operation if any file exists.
     * @returns The resolved path or undefined when no path is provided.
     */
    private static resolve_path_search;
    /**
     * Construct a unit test package.
     * Loads the configuration from the provided file path or object.
     */
    constructor(config: Config.Opts);
    /**
     *
     */
    /**
     * Try to load a package by input file or if omitted by searching for a default configuration file.
     * If no input paths are provided, this function will search for a configuration file
     * like 'vtest.json', '.vtest.json' etc. in the current working directory or 1 level above.
     * @throw An error when no configuration file is found.
     * @param inputs The input file path(s) to load the configuration from.
     *               If not provided, the function will search for a default configuration file.
     * @param override An optional object to override the loaded configuration.
     */
    static from_file(inputs?: string | string[], override?: Partial<Config.Opts>): Promise<Package>;
    /**
     * Merge an additional configuration object into the current configuration.
     * The new attributes override the existing ones.
     * @param config The configuration object to merge.
     */
    merge(config: Partial<Config.Opts>): void;
    /** Run the unit tests. */
    run(opts: Package.run.Opts): Promise<boolean>;
    /**
     * Reset unit tests.
     */
    /**
     * List all included files to the console.
     */
    list_files(): Promise<void>;
    /**
     * List all included modules to the console.
     */
    list_modules(): Promise<void>;
    /**
     * Reset certain unit test results.
     * @param module The module name to reset the unit tests for.
     * @param ids The unit test ids to reset. Supports glob patterns.
     * @param yes Automatically answer yes to all prompts.
     */
    reset_unit_tests({ module, target, yes, }: {
        module: string;
        target: GlobPatternList.T | GlobPatternList.T[];
        yes?: boolean;
    }): Promise<void>;
    /** Parse the included files. */
    private parse_includes;
    /** Initialize the environment files. */
    private init_env;
    /** Parse includes and initialize all unit test modules. */
    private init_modules;
}
/** Package types. */
export declare namespace Package {
    namespace run {
        /** Argument options of `Package.run()` */
        interface Opts {
            /** The module name to run. If not defined all modules will be run. */
            module?: string;
            /** The target unit test to run. If not defined all unit tests will be run. Asterisks (*) are supported to run multiple targeted unit tests. */
            target?: string;
            /** Whether to enter interactive mode on failure. */
            interactive?: boolean;
            /** Automatically answer yes to all prompts. */
            yes?: boolean;
            /** Do not show the diff from cached and new data. */
            no_changes?: boolean;
            /** Whether to stop on a failed unit test. */
            stop_on_failure?: boolean;
            /** The unit test id to stop after. */
            stop_after?: string;
            /** The number of times to repeat the tests. Defaults to 1. */
            repeat?: number;
            /** The active debug level to use for the unit tests. However this may also be a unit test id, in which case all logs of this unit test will be shown, while hiding all other logs. */
            debug?: string | number;
        }
    }
}
