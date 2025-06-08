#!/usr/bin/env node
/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 *
 * CLI for running VTest modules.
 */
// Imports.
import * as vlib from "../vlib/index.js";
import { Package } from "./package.js";
// CLI.
const cli = new vlib.cli.CLI({
    name: "vtest",
    version: "1.0.1",
    strict: false,
    options: [
        { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns." },
        { id: ["--include", "-i"], type: "string[]", description: "The glob patterns of unit test files to include." },
        { id: ["--exclude", "-e"], type: "string[]", required: false, description: "The glob patterns of unit test files to exclude." },
        { id: ["--env"], type: "string[]", description: "The path to one or multiple environment files to import." },
        { id: ["--output"], type: "string", description: "The unit test results directory used as a cache folder, defaults to './.unit_tests'." },
    ],
});
/**
 * The main command.
 */
cli.main({
    description: `
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
        { id: ["--module", "-m"], type: "string", description: "The module to run, e.g. 'module_1'." },
        { id: ["--target", "-t"], type: "string", required: false, description: "An optional identifier of a module unit test, when defined only the targeted unit test(s) will be executed. Supports wildcard patterns '*'." },
        { id: ["--interactive", "-I"], type: "boolean", description: "Run in interactive mode, allowing you to select which tests to run." },
        { id: ["--no-changes", "-nc"], type: "boolean", description: "Do not log any diff changes between cached and new data when in interactive mode." },
        { id: ["--stop-on-failure", "-f"], type: "boolean", description: "Stop running tests on the first failure." },
        { id: ["--stop-after", "-a"], type: "string", description: "Stop running tests after a certain number of tests." },
        { id: ["--repeat", "-r"], type: "number", required: false, description: "Repeat the tests a certain number of times. By default the tests are only executed once." },
        { id: ["--debug", "-d"], type: "number", description: "Set the debug level, 0 for no debug, 1 for basic debug, 2 for verbose debug." },
        // { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
    ],
    async callback(args) {
        const pkg = await Package.from_file(cli.options.config, cli.options);
        await pkg.run(args);
    }
});
/**
 * The --list-files command, used to list the included files after processing the 'include' and 'exclude' attributes.
 */
cli.command({
    id: "--list-files",
    description: `
        The --list-files command can be used to list the included files after processing the 'include' and 'exclude' attributes.
        It supports the default CLI options for importing or customizing the configuration file.
        `.dedent(true),
    examples: {
        "List files": "vtest --list-files",
    },
    async callback(args) {
        const pkg = await Package.from_file(cli.options.config, cli.options);
        pkg.list_files();
    }
});
/**
 * The --list-modules command, used to list the included files after processing the 'include' and 'exclude' attributes.
 */
cli.command({
    id: "--list-modules",
    description: `
        The --list-modules command can be used to list the available unit test modules.
        `.dedent(true),
    examples: {
        "List modules": "vtest --list-modules",
    },
    async callback(args) {
        const pkg = await Package.from_file(cli.options.config, cli.options);
        pkg.list_modules();
    }
});
/**
 * The --reset command, used to reset the cached result of certain unit tests.
 */
cli.command({
    id: "--reset",
    description: `
        Reset the cached result of specified unit tests from a targeted module.
        `.dedent(true),
    examples: {
        "Reset": "vtest --reset 'dist/**/unit_tests/**/*.js'",
    },
    args: [
        { id: ["--module", "-m"], type: "string", required: true, description: "The module of the unit test identifier(s), e.g. 'module_1'." },
        { id: ["--target", "-t"], type: "string[]", required: true, description: "The unit test identifier(s) to reset, Supports wildcard patterns '*'." },
        { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
    ],
    async callback(args) {
        const pkg = await Package.from_file(cli.options.config, cli.options);
        await pkg.reset_unit_tests(args);
    }
});
cli.start();
//# sourceMappingURL=cli.js.map