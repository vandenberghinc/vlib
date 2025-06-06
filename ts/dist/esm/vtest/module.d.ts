/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../vlib/index.js";
/** Expect type. */
type Expect = "error" | "success";
/** User inputted unit test callback type */
type Callback = (args: {
    id: string;
    hash: (data: string) => string;
    debug: (...args: any[]) => void;
    log_level: string | number;
    expect: Expect;
}) => Promise<any> | any;
/** Cache for all unit test responses mapped per module per unit test */
type CacheRecord = {
    hash: string;
    data: string;
    expect: Expect;
};
/**
 * Unit test module.
 * @note Should be created at file-level scope.
 */
export declare class Module {
    name: string;
    unit_tests: Record<string, (args: {
        log_level: string | number;
        cache: Path;
        interactive: boolean;
        index: number;
        yes?: boolean;
        no_changes?: boolean;
        refresh?: string | boolean;
    }) => Promise<{
        success: boolean;
        hash?: string;
        output?: string;
        expect: Expect;
    }>>;
    mod_cache?: Record<string, CacheRecord>;
    /**
     * Create a unit test module.
     * @param name The name of the module.
     */
    constructor({ name }: {
        name: string;
    });
    /**
     * Add a unit test to the module.
     * @param id The id of the unit test to add.
     * @param expect The expected result of the unit test. This can be either "error" or "success".
     * @param callback The callback function to execute the unit test. This callback should return the result of the test. Thrown errors will be captured.
     * @param refresh Refresh the unit test cache. This will remove the cached data for this unit test.
     * @note When expecting an error, then also throw an error, the error's message will be used for hash comparisons.
     */
    add(opts: {
        id: string;
        expect: Expect;
        callback: Callback;
        refresh?: boolean;
    }): any;
    add(id: string, callback: Callback): any;
    add(id: string, expect: Expect, callback: Callback, refresh?: boolean): any;
    /**
     * Save the module cache to the given path.
     */
    private save_mod_cache;
    /**
     * Try load the mod cache
     */
    private init_mod_cache;
    /**
     * Run the unit tests of the module
     * @private
     */
    _run({ target, stop_on_failure, stop_after, debug, interactive, cache, yes, repeat, no_changes, refresh, }: {
        target?: string;
        stop_on_failure?: boolean;
        stop_after?: string;
        debug?: string | number;
        interactive?: boolean;
        cache: Path;
        yes?: boolean;
        repeat?: number;
        no_changes?: boolean;
        refresh?: boolean | string;
    }): Promise<{
        status: boolean;
        failed: number;
        succeeded: number;
    }>;
}
/**
 * The unit tests module cache.
 * @warning Keep this semi-private to enforce the use of the add() function.
 * @warning Dont use a `Set` so we can retain the order of the unit tests modules in which they were added.
 *          This is especially useful since some unit tests require to be executed in a specific order.
 */
export declare const modules: Module[];
export {};
