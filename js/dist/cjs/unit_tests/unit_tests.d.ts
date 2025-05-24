import { Path } from '../system/path.js';
export declare namespace UnitTests {
    type Expect = "error" | "success";
    /** User inputted unit test callback type */
    type UnitTestCallback = (args: {
        id: string;
        hash: (data: string) => string;
        debug: (...args: any[]) => void;
        log_level: string | number;
        expect: Expect;
    }) => Promise<any> | any;
    /** Cache for all unit test responses mapped per module per unit test */
    type UnitTestCacheRecord = {
        hash: string;
        data: string;
        expect: Expect;
    };
    /**
     * Unit test module.
     * @note Should be created at file-level scope.
     */
    export class Module {
        name: string;
        unit_tests: Record<string, (args: {
            log_level: string | number;
            cache: Path;
            interactive: boolean;
            index: number;
            all_yes?: boolean;
            no_changes?: boolean;
            refresh?: string | boolean;
        }) => Promise<{
            success: boolean;
            hash?: string;
            output?: string;
            expect: Expect;
        }>>;
        mod_cache?: Record<string, UnitTestCacheRecord>;
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
            callback: UnitTestCallback;
            refresh?: boolean;
        }): any;
        add(id: string, callback: UnitTestCallback): any;
        add(id: string, expect: Expect, callback: UnitTestCallback, refresh?: boolean): any;
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
        _run({ target, stop_on_failure, stop_after, debug, interactive, cache, all_yes, repeat, no_changes, refresh, }: {
            target?: string;
            stop_on_failure?: boolean;
            stop_after?: string;
            debug?: string | number;
            interactive?: boolean;
            cache: Path;
            all_yes?: boolean;
            repeat?: number;
            no_changes?: boolean;
            refresh?: boolean | string;
        }): Promise<boolean>;
    }
    /**
     * Perform all unit tests of all added modules.
     * @param results The path to a results cache directory. This should reside inside your repo and should not be ignored by git etc.
     * @warning When the results directory is deleted all unit test hashes will be lost. Causing a full manual re-evaluation of all unit tests.
     * @param module The module name to run. If not defined all modules will be run.
     * @param target The target unit test to run. If not defined all unit tests will be run. Asterisks (*) are supported to run multiple targeted unit tests.
     * @param stop_on_failure Whether to stop on a failed unit test.
     * @param stop_after The unit test id to stop after.
     * @param debug The active debug level to use for the unit tests. However this may also be a unit test id, in which case all logs of this unit test will be shown, while hiding all other logs.
     * @param interactive Whether to enter interactive mode on failure.
     * @param no_changes Do not show the diff from cached and new data.
     *
     * @example
     * ```ts
     * import { UnitTests } from "@vandenberghinc/vlib";
     *
     * // Create a unit test module.
     * // This can be defined at file-level scope to create multiple modules.
     * const unit_tests = new UnitTests.Module({ name: "MyModule" });
     *
     * // Add a unit test to the module.
     * unit_tests.add("MyUnitTest", "success", () => somefunc()); // somefunc() may return anything.
     *
     * // Add a unit test with object based arguments.
     * unit_tests.add({ id: "MyUnitTest2", expect: "error", callback: ({ id, hash, debug }) => { ... } });
     *
     * // Perform the added unit tests.
     * UnitTests.perform({
     *     results: "./unit_tests/results/",
     * })
     * .then((success) => console.log("Unit tests succeeded:", success))
     * .catch(console.error);
     * ```
     */
    export function perform({ results, module, target, stop_on_failure, stop_after, debug, interactive, all_yes, repeat, list_modules, no_changes, refresh, }: {
        results: string;
        module?: string;
        target?: string;
        stop_on_failure?: boolean;
        stop_after?: string;
        args?: Record<string, any>;
        debug?: string | number;
        interactive?: boolean;
        all_yes?: boolean;
        repeat?: number;
        list_modules?: boolean;
        no_changes?: boolean;
        refresh?: boolean | string;
    }): Promise<boolean>;
    /**
     * A scheme format for include/exclude/visit options.
     */
    type FilterScheme<T> = {
        [key: string]: T | FilterScheme<T>;
    };
    /**
     * Filter (output) data based on a simple scheme, then sort object key's by defined scheme order.
     * This can be useful for producing a consistent output format.
     * @param data {Record<string, any> | any[]} The input data.
     * @param include Include only a list of keys, all other keys will be excluded, formatted as an object with boolean values or nested include schemes.
     * @param exclude Exclude a list of keys, all other keys will still be included, formatted as an object with boolean values or nested exclude schemes.
     * @param visit Allows for defining postprocess visit functions for each key, formatted as an object with function values or nested visit schemes.
     * @param opts.drop_empty Drop all empty values from objects and arrays - such as null, undefined, empty strings, empty arrays and empty objects.
     * @param opts.drop_undef Drop all null and undefined values from objects and arrays.
     * @example
     *
     * const data = {
     *    key1: "value1",
     *    key2: "value2",
     *    key3: "",
     *    key4: null,
     *    key5: {
     *       key1: undefined,
     *       key2: undefined,
     *    },
     * };
     *
     * // Using include.
     * UnitTests.filter_output(data, {
     *    include: {
     *       key1: true,
     *       key5: { key1: true },
     *    },
     * }); // => { key1: "value1", key5: { key1: undefined } }
     *
     * // Using exclude.
     * UnitTests.filter_output(data, {
     *    exclude: {
     *       key2: true,
     *       key3: true,
     *       key4: true,
     *       key5: { key2: true },
     *    },
     * }); // => { key1: "value1", key5: { key1: undefined } }
     *
     */
    export function filter_output<T extends any>(data: T, opts: {
        include?: FilterScheme<boolean>;
        exclude?: FilterScheme<boolean>;
        visit?: FilterScheme<(item: any) => any> | ((item: any) => any);
        drop_empty?: boolean;
        drop_undef?: boolean;
    }): T;
    export {};
}
export { UnitTests as unit_tests };
export default UnitTests;
