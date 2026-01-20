/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, GlobPatternList, Logger } from "../vlib/index.js";
import { Package } from './package.js';
/** Expect type. */
type Expect = "error" | "success";
/** User inputted unit test callback type */
export type Callback = (args: {
    id: string;
    expect: Expect;
    debug: Logger<any, any>;
}) => Promise<any> | any;
/**
 * Unit test module.
 * @note Should be created at file-level scope.
 * @example
 * {Basic Usage}
 * Create a unit test module and add unit tests to it.
 * ```ts ./unit_tests/example_module.ts
 * import { Module } from "@vlib/vtest";
 *
 * // Create a unit test module.
 * const tests = new Module({ name: "my_module" });
 *
 * // Add a test to it.
 * tests.add("test_1", "success", () => {
 *    return 1 + 1; // expected output is 2
 * });
 * ```
 *
 * @example
 * {Configuration}
 * Creating a configuration file for the unit tests.
 * ```json ./vtest.json
 * {
 *   "$schema": "https://raw.githubusercontent.com/vandenberghinc/vlib/master/ts/assets/schemas/vtest.json",
 *   "output": "./.unit_tests",
 *   "include": [
 *     "unit_tests/**\/*.js"
 *   ],
 * }
 * ```
 *
 * @example
 * {Running Unit Tests}
 * Running the unit tests through the CLI in interactive mode.
 * When interactive mode is enabled, failed unit tests will enter an interactive mode
 * where the user can inspect the output and decide whether the test actually succeeded or failed.
 * Succeed unit tests will automatically be marked as succeeded and saved to the cache.
 * ```bash
 * vtest --config ./vtest.json --interactive
 * ```
 *
 * @docs
 */
export declare class Module {
    name: string;
    private unit_tests;
    private mod_cache?;
    /** The path to the `output` directory from the active package. */
    private output?;
    /**
     * The context options that are always used for the unit tests.
     * Keep as opts so we can detect present keys.
     */
    private override_ctx?;
    /**
     * Create a unit test module.
     * @param name The name of the module.
     */
    constructor(opts: {
        /** The name of the module. */
        name: string;
        /**
         * Optionally strip colors from the unit test outputs, defaults to `false`.
         * Note that when this is defined, this wil always override other context options.
         * So also when providing different options through the CLI or by a parent package.
         */
        strip_colors?: boolean;
    });
    /**
     * Try load the mod cache
     */
    private init_mod_cache;
    /**
     * Save the module cache to the given path.
     */
    private save_mod_cache;
    /**
     * Add a unit test to the module.
     * @param id The id of the unit test to add.
     * @param expect The expected result of the unit test. This can be either "error" or "success".
     * @param callback The callback function to execute the unit test. This callback should return the result of the test. Thrown errors will be captured.
     * @note When expecting an error, then also throw an error, the error's message will be used for hash comparisons.
     *
     * @docs
     */
    add(opts: {
        id: string;
        expect: Expect;
        callback: Callback;
    }): this;
    add(id: string, callback: Callback): this;
    add(id: string, expect: Expect, callback: Callback): this;
    /**
     * Run the unit tests of the module
     *
     * @docs
     */
    run(ctx: Package.Context): Promise<{
        status: boolean;
        failed: number;
        succeeded: number;
    }>;
    /**
     * Reset certain unit test results.
     * @param opts.results The path to the module's results file.
     * @param opts.ids The id or ids to reset, supports glob patterns.
     * @param opts.yes Whether to skip the confirmation prompt.
     *
     * @docs
     */
    reset_unit_tests(opts: {
        results: string | Path;
        target: GlobPatternList.T | GlobPatternList.T[];
        yes?: boolean;
    }): Promise<void>;
}
/**
 * The unit tests module cache.
 * @warning Keep this semi-private to enforce the use of the add() function.
 * @warning Dont use a `Set` so we can retain the order of the unit tests modules in which they were added.
 *          This is especially useful since some unit tests require to be executed in a specific order.
 */
export declare const Modules: Module[];
export {};
