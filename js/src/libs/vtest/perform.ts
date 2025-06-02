/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as zlib from 'zlib';
import { diffLines, Change } from 'diff';
import * as ts from 'typescript';
import pkg from 'js-beautify';
const { js: beautify } = pkg;

// Imports.
import { CLI, cli, Color, Colors, Path } from '../../index.js';
import { Module, modules } from './module.js';

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
export async function perform({
    results,
    module = cli.get({ id: "--module", required: false }),
    target = cli.get({ id: "--target" }),
    stop_on_failure = cli.present("--stop-on-failure"),
    stop_after = cli.get({ id: "--stop-after", required: false }),
    debug = cli.get({ id: "--debug", def: 0, type: "number" }),
    interactive = cli.present("--interactive"),
    all_yes = cli.present(["--yes", "-y"]),
    repeat = cli.get({ id: "--repeat", def: 0, type: "number" }),
    list_modules = cli.present(["--list-modules", "--list"]),
    no_changes = cli.present(["--no-changes", "-nc"]),
    refresh = cli.present("--refresh") ? true : cli.get({ id: "--refresh", def: false, type: ["string", "boolean"] }),
}: {
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
}): Promise<boolean> {

    // List modules.
    if (list_modules) {
        if (modules.length === 0) {
            console.log(`Available unit test modules: None`);
        } else {
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

    // Check cache.
    const cache_path = new Path(results);
    if (!cache_path.exists()) {
        throw new Error(`Cache directory "${results}" does not exist.`);
    } else if (!cache_path.is_dir()) {
        throw new Error(`Cache path "${results}" is not a directory.`);
    }

    // Test target module or only a single module defined.
    if (module != null || modules.length === 1) {
        const mod = modules.find(m => module == null || m.name === module);
        if (!mod) {
            throw new Error(`Module "${module}" was not found, the available modules are: [${modules.map(i => i.name).join(", ")}]`,);
        }
        const res = await mod._run({
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
        })
        return res.status;
    }

    // Test all modules.
    let succeeded = 0, failed = 0;
    for (const mod of modules) {
        if (all_yes) {
            throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
        }
        const res = await mod._run({
            target,
            stop_on_failure,
            stop_after,
            debug,
            interactive,
            cache: cache_path,
            all_yes: false,
            refresh,
        });
        if (!res.status) { return false; }
        succeeded += res.succeeded || 0;
        failed += res.failed || 0;
    }
    const prefix = debug === 0 ? " * " : "";
    if (failed === 0) {
        if (succeeded === 0) {
            console.log(`${Color.red("Error")}: No unit tests are defined.`);
            return false;
        }
        console.log(Color.cyan_bold(`\nExecuted ${modules.length} test modules.`));
        console.log(`${prefix}All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
        return true;
    } else {
        console.log(Color.cyan_bold(`\nExecuted ${modules.length} test modules.`));
        console.log(`${prefix}Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
        return false;
    }
}
