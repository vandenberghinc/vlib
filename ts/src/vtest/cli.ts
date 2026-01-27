#!/usr/bin/env node
/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 *
 * CLI for running VTest modules.
 */

// Imports.
import * as vlib from "@vlib";
import { Config, Package } from "./package.js";

// CLI.
const cli = new vlib.cli.CLI({
    name: "vtest",
    version: "1.0.1",
    strict: false,
    options: [
        // { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." },
        // { id: ["--include", "-i"], type: "string[]", description: "The glob patterns of unit test files to include." },
        // { id: ["--exclude", "-e"], type: "string[]", required: false, description: "The glob patterns of unit test files to exclude." },
        // { id: ["--env"], type: "string[]", description: "The path to one or multiple environment files to import." },
        // { id: ["--output"], type: "string", description: "The unit test results directory used as a cache folder, defaults to './.unit_tests'." },        
    ],
});

/**
 * Execute the defined VTest modules.
 * When no `--config` option is passed, the CLI will search for a configuration file named `vtest.json`, `.vtest.json`, `vtest.jsonc`, or `.vtest.jsonc` in the current working directory or above.
 * Unless the `--config` option is defined as `ignore`, in which case no configuration file will be loaded.
 * 
 * Any additional options passed will override the options in the loaded configuration.
 * 
 * A configuration file must be located at the root of the project.
 * 
 * @param --config {string | string[]} The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas.
 * @param --module {string} The module to run, e.g. `module_1`.
 * @param --target {string} An optional identifier of a module unit test, when defined only the targeted unit test(s) will be executed. Supports wildcard patterns `*`.
 * @param --interactive {boolean} Run in interactive mode, allowing you to select which tests to run.
 * @param --no-changes {boolean} Do not log any diff changes between cached and new data when in interactive mode.
 * @param --stop-on-failure {boolean} Stop running tests on the first failure.
 * @param --stop-after {string} Stop running tests after a certain number of tests.
 * @param --refresh {boolean} When enabled this bypasses any cached output, forcing the user to re-evaluate the unit tests when in interactive mode, or simply cause a failure in non interactive mode.
 * @param --repeat {number} Repeat the tests a certain number of times. By default the tests are only executed once.
 * @param --debug {number} Set the debug level, 0 for no debug, 1 for basic debug, 2 for verbose debug.
 * 
 * @example
 * {Run}
 * Execute all unit tests in the `dist/**\/unit_tests/**\/*.js` files.
 * ```bash
 * vtest --include 'dist/**\/unit_tests/**\/*.js
 * ```
 * @name Main
 * @signature $ vtest
 * @nav CLI
 * @docs
 */
cli.main({
    description: 
        `
        Execute the defined VTest modules.
        When no "--config" option is passed, the CLI will search for a configuration file named 'vtest.json', '.vtest.json', 'vtest.jsonc', or '.vtest.jsonc' in the current working directory or above.
        Unless the '--config' option is defined as "ignore", in which case no configuration file will be loaded.
        
        Any additional options passed will override the options in the loaded configuration.
        
        A configuration file must be located at the root of the project.
        `.dedent(true),
    examples: {
        "Run": "vtest --include 'dist/**/unit_tests/**/*.js'",
    },
    args: [
        { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." },
        { id: ["--module", "-m"], type: "string", description: "The module to run, e.g. 'module_1'." },
        { id: ["--target", "-t"], type: "string", required: false, description: "An optional identifier of a module unit test, when defined only the targeted unit test(s) will be executed. Supports wildcard patterns '*'." },
        { id: ["--interactive", "-I"], type: "boolean", description: "Run in interactive mode, allowing you to select which tests to run." },
        { id: ["--no-changes", "-nc"], type: "boolean", description: "Do not log any diff changes between cached and new data when in interactive mode." },
        { id: ["--stop-on-failure", "-f"], type: "boolean", description: "Stop running tests on the first failure." },
        { id: ["--stop-after", "-a"], type: "string", description: "Stop running tests after a certain number of tests." },
        { id: ["--refresh", "-r"], type: "boolean", required: false, description: "When enabled this bypasses any cached output, forcing the user to re-evaluate the unit tests when in interactive mode, or simply cause a failure in non interactive mode." },
        { id: ["--repeat"], type: "number", required: false, description: "Repeat the tests a certain number of times. By default the tests are only executed once." },
        { id: ["--strip-colors"], type: "boolean", required: false, description: "Strip colors from the unit test outputs when comparing cached and new data." },
        { id: ["--debug", "-d"], type: "number", description: "Set the debug level, 0 for no debug, 1 for basic debug, 2 for verbose debug." },
        // { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
    ],
    async callback(args) {
        const config: Config | { error: string } = Config.load(args.config || "__default__");
        if ("error" in config) throw cli.error(config.error);
        const pkg = new Package(config);
        await pkg.run(args)
    }
});

/**
 * The `--list-files` command, used to list the included files after processing the 'include' and 'exclude' attributes.
 * 
 * @param --config {string | string[]} The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas.
 * 
 * @example
 * {List Files}
 * List all included files.
 * ```bash
 * vtest --list-files
 * ```
 * 
 * @name List Files
 * @signature $ vtest --list-files
 * @nav CLI
 * @docs
 */
cli.command({
    id: "--list-files",
    description: 
        `
        The --list-files command can be used to list the included files after processing the 'include' and 'exclude' attributes.
        It supports the default CLI options for importing or customizing the configuration file.
        `.dedent(true),
    args: [
        { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." },
    ],
    examples: {
        "List files": "vtest --list-files",
    },
    async callback(args) {
        const config = await Config.load(args.config || "__default__");
        if ("error" in config) throw cli.error(config.error);
        const pkg = new Package(config);
        pkg.list_files()
    }
});

/**
 * The `--list-modules` command, used to list the included files after processing the 'include' and 'exclude' attributes.
 * 
 * @param --config {string | string[]} The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas.
 * 
 * @example
 * {List Modules}
 * List all available unit test modules.
 * ```bash
 * vtest --list-modules
 * ```
 * 
 * @name List Modules
 * @signature $ vtest --list-modules
 * @nav CLI
 * @docs
 */
cli.command({
    id: "--list-modules",
    description: 
        `
        The --list-modules command can be used to list the available unit test modules.
        `.dedent(true),
    args: [
        { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." },
    ],
    examples: {
        "List modules": "vtest --list-modules",
    },
    async callback(args) {
        const config = await Config.load(args.config || "__default__");
        if ("error" in config) throw cli.error(config.error);
        const pkg = new Package(config);
        pkg.list_modules()
    }
});

/**
 * The `--reset` command, used to reset the cached result of certain unit tests.
 * 
 * @param --config {string | string[]} The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas.
 * @param --module {string} The module of the unit test identifier(s), e.g. 'module_1'.
 * @param --target {string | string[]} The unit test identifier(s) to reset, Supports wildcard patterns '*'.
 * @param --yes {boolean} Automatically answer yes to all prompts.
 * 
 * @example
 * {Reset}
 * Reset the cached result of all unit tests included in the default vtest configuration.
 * ```bash
 * vtest --reset
 * ```
 * 
 * @name Reset Unit Tests
 * @signature $ vtest --reset
 * @nav CLI
 * @docs
 */
cli.command({
    id: "--reset",
    description:
        `
        Reset the cached result of specified unit tests from a targeted module.
        `.dedent(true),
    examples: {
        "Reset": "vtest --reset",
    },
    args: [
        { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." },
        { id: ["--module", "-m"], type: "string", required: true, description: "The module of the unit test identifier(s), e.g. 'module_1'." },
        { id: ["--target", "-t"], type: "string[]", required: true, description: "The unit test identifier(s) to reset, Supports wildcard patterns '*'." },
        { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
    ],
    async callback(args) {
        const config = await Config.load(args.config || "__default__");
        if ("error" in config) throw cli.error(config.error);
        const pkg = new Package(config);
        await pkg.reset_unit_tests(args);
    }
});

cli.start();