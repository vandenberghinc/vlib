#!/usr/bin/env node
/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 *
 * CLI for running VTest modules.
 */
// Imports.
import * as vlib from "../../index.js";
import { perform } from "./perform.js";
// CLI.
const cli = new vlib.cli.CLI({
    name: "vtest",
    version: "1.0.0",
    strict: false,
});
cli.main({
    description: "Execute the defined VTest modules.",
    examples: {
        "Run": "vtest --import tests/module_1/unit_test.js,tests/module_2/unit_test.js --results tests/results/",
    },
    args: [
        { id: ["--imports", "--import", "-i"], type: "string[]", description: "The dist paths of the unit test module files to import." },
        { id: ["--results", "-r"], type: "string", description: "The directory to write the results to." },
        { id: ["--module", "-m"], type: "string", description: "The module to run, e.g. 'module_1'." },
        { id: ["--target", "-t"], type: "string", required: false, description: "An optional identifier of a module unit test, when defined only the targeted unit test(s) will be executed. Supports wildcard patterns '*'." },
        { id: ["--stop-on-failure", "-f"], type: "boolean", description: "Stop running tests on the first failure." },
        { id: ["--stop-after", "-a"], type: "string", description: "Stop running tests after a certain number of tests." },
        { id: ["--debug", "-d"], type: "number", def: 0, description: "Set the debug level, 0 for no debug, 1 for basic debug, 2 for verbose debug." },
        { id: ["--interactive", "-I"], type: "boolean", description: "Run in interactive mode, allowing you to select which tests to run." },
        { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
        { id: ["--repeat", "-r"], type: "number", required: false, description: "Repeat the tests a certain number of times. By default the tests are only executed once." },
        { id: ["--list-modules", "--list"], type: "boolean", description: "List all available unit test modules." },
        { id: ["--no-changes", "-nc"], type: "boolean", description: "Do not log any diff changes between cached and new data when in interactive mode." },
        { id: ["--refresh"], type: ["boolean", "string"], def: false, description: "Refresh the cache before running the tests. Can be set to 'true' or a path to refresh from." },
        { id: ["--env", "-e"], type: "string[]", description: "The path to one or multiple environment files to import." },
    ],
    async callback(args) {
        for (const i of args.imports) {
            if (args.debug >= 1) {
                vlib.logger.marker(`Importing unit test module: ${i}`);
            }
            await import(new vlib.Path(i).abs().str());
        }
        delete args.imports;
        if (!args.results) {
            throw this.error("The --results argument is required.", { docs: true });
        }
        if (args.env?.length) {
            for (const env of args.env) {
                if (args.debug >= 1) {
                    vlib.logger.marker(`Importing environment file ${env}`);
                }
                vlib.env.import_file(env);
            }
        }
        await perform({ ...args, results: args.results });
    }
});
cli.start();
//# sourceMappingURL=cli.js.map