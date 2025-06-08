/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "../vlib/index.js";
export declare class Tester {
    /**
     * The initialized configuration object.
     */
    config: vlib.Scheme.Infer.Scheme<typeof Tester.config_scheme>;
    /**
     * Construct a tester instance.
     * Loads the configuration from the provided file path or object.
     */
    constructor(config: Tester.Config);
    /**
     * Merge an additional configuration object into the current configuration.
     * The new attributes override the existing ones.
     * @param config The configuration object to merge.
     */
    merge(config: Partial<Tester.Config>): void;
    /** Run the unit tests. */
    run(): Promise<boolean>;
}
/** Tester types. */
export declare namespace Tester {
    /**
     * The config validator scheme.
     */
    const config_scheme: vlib.Scheme.Infer.Scheme.T;
    /**
     * Unit test configuration options.
     *
     * @warning When the results directory is deleted all unit test hashes will be lost. Causing a full manual re-evaluation of all unit tests.
     *
     * @param include The glob patterns of unit test files to include. Defaults to all files in the current working directory.
     * @param exclude The glob patterns of unit test files to exclude.
     * @param results The path to a results cache directory. This should reside inside your repo and should not be ignored by git etc.
     * @param module The module name to run. If not defined all modules will be run.
     * @param target The target unit test to run. If not defined all unit tests will be run. Asterisks (*) are supported to run multiple targeted unit tests.
     * @param stop_on_failure Whether to stop on a failed unit test.
     * @param stop_after The unit test id to stop after.
     * @param debug The active debug level to use for the unit tests. However this may also be a unit test id, in which case all logs of this unit test will be shown, while hiding all other logs.
     * @param interactive Whether to enter interactive mode on failure.
     * @param yes Automatically answer yes to all prompts.
     * @param repeat The number of times to repeat the tests. Defaults to 1.
     * @param no_changes Do not show the diff from cached and new data.
     * @param refresh Whether to refresh the cache before running the tests. Can be set to `true` or a path to refresh from.
     * @param env The paths to one or multiple environment files to import.
     * @param list_files Whether to list the included file paths without performing anything.
     * @param list_modules Whether to list all available unit test modules.
     * @param base The path or paths to a base file. Does support glob patterns. Use a configuration file as base for the configuration. Newly defined attributes will override the existing ones.
     */
    interface Config {
        include: string[];
        exclude?: string[];
        results: string;
        module?: string;
        target?: string;
        stop_on_failure?: boolean;
        stop_after?: string;
        debug?: string | number;
        interactive?: boolean;
        yes?: boolean;
        repeat?: number;
        no_changes?: boolean;
        refresh?: boolean | string;
        env?: string[];
        list_files?: boolean;
        list_modules?: boolean;
        base?: string | string[];
    }
}
