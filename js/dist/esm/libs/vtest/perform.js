/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import pkg from 'js-beautify';
const { js: beautify } = pkg;
// Imports.
import { cli, Color, Path } from '../../index.js';
import { modules } from './module.js';
// -----------------------------------------------------------------
// Perform the unit tests.
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
export async function perform({ results, module = cli.get({ id: "--module", def: undefined }), target = cli.get({ id: "--target" }), stop_on_failure = cli.present("--stop-on-failure"), stop_after = cli.get({ id: "--stop-after", def: undefined }), debug = cli.get({ id: "--debug", def: 0, type: "number" }), interactive = cli.present("--interactive"), all_yes = cli.present(["--yes", "-y"]), repeat = cli.get({ id: "--repeat", def: 0, type: "number" }), list_modules = cli.present(["--list-modules", "--list"]), no_changes = cli.present(["--no-changes", "-nc"]), refresh = cli.present("--refresh") ? true : cli.get({ id: "--refresh", def: false, type: ["string", "boolean"] }), }) {
    // List modules.
    if (list_modules) {
        if (modules.length === 0) {
            console.log(`Available unit test modules: None`);
        }
        else {
            console.log(`Available unit test modules:`);
            for (const mod of modules) {
                console.log(` * ${mod.name}`);
            }
        }
        return true;
    }
    // Error when no unit tests are defined.
    if (modules.length === 0) {
        console.log(`${Color.red("Error")}: No unit tests defined, add unit tests using the add() function.`);
        return false;
    }
    // Error when interactive mode and no module is defined.
    if (interactive && !module) {
        console.log(`${Color.red("Error")}: Interactive mode is only available when a module is defined.`);
        return false;
    }
    // Check cache.
    const cache_path = new Path(results);
    if (!cache_path.exists()) {
        throw new Error(`Cache directory "${results}" does not exist.`);
    }
    else if (!cache_path.is_dir()) {
        throw new Error(`Cache path "${results}" is not a directory.`);
    }
    // Test target module.
    if (module != null) {
        const mod = modules.find(m => m.name === module);
        if (!mod) {
            throw new Error(`Module "${module}" was not found, the available modules are: [${modules.map(i => i.name).join(", ")}]`);
        }
        return mod._run({
            target,
            stop_on_failure,
            stop_after,
            debug,
            interactive,
            cache: cache_path,
            all_yes,
            repeat,
            no_changes,
            refresh,
        });
    }
    // Test all modules.
    for (const mod of modules) {
        if (all_yes) {
            throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
        }
        const proceed = await mod._run({
            target,
            stop_on_failure,
            stop_after,
            debug,
            interactive,
            cache: cache_path,
            all_yes: false,
            refresh,
        });
        if (!proceed) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=perform.js.map