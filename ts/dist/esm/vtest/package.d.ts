/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "../vlib/index.js";
import { Path, GlobPatternList } from "../vlib/index.js";
import { Merge, RequiredExcept } from "../vlib/types/types.js";
/**
 * The unit test package class.
 * Responsible for executing managing its included modules and unit tests.
 *
 * @note This class is automatically used when using the `vtest` CLI tool.
 *       However, it can also be used programmatically.
 *
 * @nav Unit Tests
 * @docs
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
    static resolve_path_search(path: string | string[]): Path | undefined;
    /** Construct a unit test package. */
    constructor(config: Config);
    /**
     * Run the unit tests.
     * @param opts Optional context options to override the current configuration options with.
     * @returns A promise to a boolean indicating whether the unit tests succeeded or not.
     * @docs
     */
    run(opts?: Partial<Package.Context.Opts>): Promise<boolean>;
    /**
     * List all included files to the console.
     * @docs
     */
    list_files(): Promise<void>;
    /**
     * List all included modules to the console.
     * @docs
     */
    list_modules(): Promise<void>;
    /**
     * Reset certain unit test results.
     * @param module The module name to reset the unit tests for.
     * @param ids The unit test ids to reset. Supports glob patterns.
     * @param yes Automatically answer yes to all prompts.
     * @docs
     */
    reset_unit_tests({ module, target, yes, }: {
        module: string;
        target: GlobPatternList.T | GlobPatternList.T[];
        yes?: boolean;
    }): Promise<void>;
    /** Parse the included files. */
    private parse_includes;
    private parsed_includes;
    /** Initialize the environment files. */
    private init_env;
    /** Parse includes and initialize all unit test modules. */
    private init_modules;
}
/** Package types. */
export declare namespace Package {
    /**
     * Context object for running the unit tests.
     * This context is passed to the module and unit test functions.
     */
    type Context = Merge<RequiredExcept<Context.Opts, "module" | "target" | "stop_after">, {
        /** The initialized output directory path. */
        output: Path;
        /** The module name to run. If not defined all modules will be run. */
        module?: vlib.GlobPatternList;
    }>;
    /** Types for the context type. */
    namespace Context {
        /** The input options to create a context object. */
        interface Opts {
            /** The path to the output directory. */
            output: string;
            /** The module name to run. If not defined all modules will be run. */
            module?: string | string[];
            /** The target unit test to run. If not defined all unit tests will be run. Asterisks (*) are supported to run multiple targeted unit tests. */
            target?: string;
            /** The active debug level to use for the unit tests. However this may also be a unit test id, in which case all logs of this unit test will be shown, while hiding all other logs. */
            debug?: string | number;
            /** Automatically answer yes to all prompts. */
            yes?: boolean;
            /** Whether to enter interactive mode on failure. */
            interactive?: boolean;
            /** Do not show the diff from cached and new data. */
            no_changes?: boolean;
            /** Whether to stop on a failed unit test. */
            stop_on_failure?: boolean;
            /** The unit test id to stop after. */
            stop_after?: string;
            /** When enabled this bypasses any cached output, forcing the user to re-evaluate the unit tests when in interactive mode, or simply cause a failure in non interactive mode. */
            refresh?: boolean;
            /** The number of times to repeat the tests. Defaults to 1. */
            repeat?: number;
            /** Optionally strip colors from the unit test outputs, defaults to `false` */
            strip_colors?: boolean;
        }
        /** A validator schema for the context options. */
        const Schema: {
            readonly $schema: {
                readonly type: "any";
                readonly required: false;
            };
            readonly module: {
                readonly type: readonly ["string", "array"];
                readonly required: false;
            };
            readonly target: {
                readonly type: "string";
                readonly required: false;
            };
            readonly debug: {
                readonly type: readonly ["string", "number"];
                readonly required: false;
            };
            readonly yes: {
                readonly type: "boolean";
                readonly required: false;
            };
            readonly interactive: {
                readonly type: "boolean";
                readonly required: false;
            };
            readonly no_changes: {
                readonly type: "boolean";
                readonly required: false;
            };
            readonly stop_on_failure: {
                readonly type: "boolean";
                readonly required: false;
            };
            readonly stop_after: {
                readonly type: "string";
                readonly required: false;
            };
            readonly refresh: {
                readonly type: "boolean";
                readonly required: false;
            };
            readonly repeat: {
                readonly type: "number";
                readonly required: false;
            };
            readonly strip_colors: {
                readonly type: "boolean";
                readonly required: false;
            };
            /**
             * @warning Keep this not required since this field
             * is often ignored and added more in terms of consistency.
             * Otherwise the `Config.create()` function will need to be updated
             * since that does not expect the `output` field to be required
             * in the `Config.options` field.
             */
            readonly output: {
                readonly type: "string";
                readonly required: false;
            };
        };
        /** Create a context object from its input options. */
        function create(opts: Context.Opts): Context;
        /**
         * Merge an additional context object into a current context object.
         * The new context attributes will override the existing ones.
         * @param base The base context object.
         * @param override The context object that will override the base context.
         * @param copy Whether to copy the base context object (true) or update it in place (false).
         * @returns The updated base context object.
         */
        function merge(base: Context, override: Partial<Context.Opts>, copy?: boolean): Context;
    }
}
/**
 * The initialized configuration object.
 *
 * Note that the user-input configuration options are defined in the `Config.Opts` interface.
 *
 * @dev_note Attribute `options` field is kept since this is used for the `extends` field.
 *
 * @nav Unit Tests
 * @docs
 */
export type Config = Merge<RequiredExcept<Config.Opts, "exclude" | "env" | "extends">, {
    include: string[];
    exclude?: string[];
    env?: string[];
    ctx: Package.Context;
    output: Path;
}>;
/**
 * The unit test configuration module.
 */
export declare namespace Config {
    /**
     * Unit test configuration file options.
     *
     * This interface can also be saved as a JSON file under `./vtest.json` or `./.vtest.json` to
     * be used as the default configuration file for the CLI.
     *
     * @docs
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
        /** The runtime context options. */
        options?: Package.Context.Opts;
    }
    /** Initialize the schema validator. */
    const Schema: vlib.Schema.Validator<any[] | Record<string, any>, false, {
        readonly $schema: {
            readonly type: "any";
            readonly required: false;
        };
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
        readonly extends: {
            readonly type: readonly ["string", "array"];
            readonly required: false;
        };
        readonly options: {
            readonly type: "object";
            readonly schema: {
                readonly $schema: {
                    readonly type: "any";
                    readonly required: false;
                };
                readonly module: {
                    readonly type: readonly ["string", "array"];
                    readonly required: false;
                };
                readonly target: {
                    readonly type: "string";
                    readonly required: false;
                };
                readonly debug: {
                    readonly type: readonly ["string", "number"];
                    readonly required: false;
                };
                readonly yes: {
                    readonly type: "boolean";
                    readonly required: false;
                };
                readonly interactive: {
                    readonly type: "boolean";
                    readonly required: false;
                };
                readonly no_changes: {
                    readonly type: "boolean";
                    readonly required: false;
                };
                readonly stop_on_failure: {
                    readonly type: "boolean";
                    readonly required: false;
                };
                readonly stop_after: {
                    readonly type: "string";
                    readonly required: false;
                };
                readonly refresh: {
                    readonly type: "boolean";
                    readonly required: false;
                };
                readonly repeat: {
                    readonly type: "number";
                    readonly required: false;
                };
                readonly strip_colors: {
                    readonly type: "boolean";
                    readonly required: false;
                };
                /**
                 * @warning Keep this not required since this field
                 * is often ignored and added more in terms of consistency.
                 * Otherwise the `Config.create()` function will need to be updated
                 * since that does not expect the `output` field to be required
                 * in the `Config.options` field.
                 */
                readonly output: {
                    readonly type: "string";
                    readonly required: false;
                };
            };
            readonly required: false;
        };
    }, vlib.Schema.ValueEntries.Opts<{}>, (vlib.Schema.Entry.Type.Castable.Base | readonly vlib.Schema.Entry.Type.Castable.Base[] | {
        type?: vlib.Schema.Entry.Type.Castable.Base | readonly vlib.Schema.Entry.Type.Castable.Base[] | undefined;
        default?: any;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, vlib.Schema.Entry.Type.Castable.Base | readonly vlib.Schema.Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
        value_schema?: vlib.Schema.Entry.Type.Castable.Base | readonly vlib.Schema.Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
        tuple?: (vlib.Schema.Entry.Type.Castable.Base | readonly vlib.Schema.Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: boolean | vlib.Types.Neverify<{
            preserve: true;
            strict?: boolean;
        } | {
            preserve?: boolean;
            strict: true;
        }, "preserve"> | vlib.Types.Neverify<{
            preserve: true;
            strict?: false;
        } | {
            preserve?: false;
            strict: true;
        }, "preserve"> | undefined;
        charset?: RegExp | undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: any;
    })[]>;
    /**
     * Load or initialize a new configuration object.
     * @param opts
     *      The configuration options to initialize the configuration object with.
     *      1) The string "__default__" to search & load the default configuration file.
     *      2) A single path or an array with path options to load the configuration from,
     *         note that a path string supports glob patterns.
     *      3) An object type with the configuration options.
     * @param override
     *      An optional object which will be used to override the loaded configuration.
     * @param _exclude
     *      A system exclude set to ignore already included base paths to prevent infinite recursion.
     *      Do not manually pass this parameter, as it is a system parameter
     * @returns The initialized configuration object, or an object with an `error` field.
     *
     * @docs
     */
    function load(opts?: Config.Opts | string | string[] | "__default__", override?: Partial<Config.Opts>, _exclude?: Set<string>): Config | {
        error: string;
    };
    /**
     * Merge an additional configuration object into a current configuration.
     * The new config attributes will override the existing ones.
     * @param base The base configuration object.
     * @param override The configuration object that will override the base configuration.
     * @param copy Whether to copy the base context object (true) or update it in place (false).
     * @returns The updated base configuration object.
     *
     * @docs
     */
    function merge(base: Config, override: Partial<Config.Opts> | Config, copy?: boolean): Config;
}
