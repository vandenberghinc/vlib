#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var vlib = __toESM(require("../vlib/index.js"));
var import_perform = require("./perform.js");
const cli = new vlib.cli.CLI({
  name: "vtest",
  version: "1.0.0",
  strict: false
});
cli.main({
  description: "Execute the defined VTest modules.",
  examples: {
    "Run": "vtest --include 'dist/**/unit_tests/**/*.js'"
  },
  args: [
    { id: ["--include", "-i"], type: "string[]", description: "The glob patterns of unit test files to include." },
    { id: ["--exclude", "-e"], type: "string[]", required: false, description: "The glob patterns of unit test files to exclude." },
    { id: ["--results", "-r"], type: "string", def: process.cwd() + "/.unit_tests", description: "The directory to write the results to." },
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
    { id: ["--env"], type: "string[]", description: "The path to one or multiple environment files to import." },
    { id: ["--list-imports", "--list-includes"], type: "boolean", description: "List the computed included paths without performing anything." }
  ],
  async callback(args) {
    const included = await vlib.Path.glob(args.include, { exclude: args.exclude, string: true });
    if (args.list_imports) {
      console.log(`Include patterns: ${args.include?.map((i) => `
 - ${i}`).join("")}`);
      console.log(`Exclude patterns: ${args.exclude?.map((i) => `
 - ${i}`).join("")}`);
      console.log(`Found ${included.length} included paths: ${included?.map((i) => `
 - ${i}`).join("")}`);
      return;
    }
    for (const p of included) {
      if (args.debug >= 1) {
        vlib.logger.marker(`Importing unit test module: ${p}`);
      }
      await import(new vlib.Path(p).abs().str());
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
    await (0, import_perform.perform)({ ...args, results: args.results });
  }
});
cli.start();
