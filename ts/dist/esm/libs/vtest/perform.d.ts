/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
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
export declare function perform({ results, module, target, stop_on_failure, stop_after, debug, interactive, all_yes, repeat, list_modules, no_changes, refresh, }: {
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
