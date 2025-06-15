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
