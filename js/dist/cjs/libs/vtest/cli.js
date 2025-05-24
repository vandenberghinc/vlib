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
var vlib = __toESM(require("../../index.js"));
var import_perform = require("./perform.js");
const cli = new vlib.CLI({
  name: "vtest",
  version: "1.0.0",
  main: {
    description: "Execute the defined VTest modules.",
    examples: {
      "Run": "vtest --import tests/module_1/unit_test.js,tests/module_2/unit_test.js --results tests/results/"
    },
    args: [
      { id: ["--imports", "--import", "-i"], type: "string[]", description: "The dist paths of the unit test module files to import." },
      { id: ["--results", "-r"], type: "string", description: "The directory to write the results to." },
      { id: ["--module", "-m"], type: "string", description: "The module to run, e.g. 'module_1'." },
      { id: ["--target", "-t"], type: "string", description: "An optional identifier of a module unit test, when defined only the targeted unit test(s) will be executed. Supports wildcard patterns '*'." },
      { id: ["--stop-on-failure", "-f"], type: "boolean", description: "Stop running tests on the first failure." },
      { id: ["--stop-after", "-a"], type: "string", description: "Stop running tests after a certain number of tests." },
      { id: ["--debug", "-d"], type: "number", default: 0, description: "Set the debug level, 0 for no debug, 1 for basic debug, 2 for verbose debug." },
      { id: ["--interactive", "-I"], type: "boolean", description: "Run in interactive mode, allowing you to select which tests to run." },
      { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
      { id: ["--repeat", "-r"], type: "number", required: false, description: "Repeat the tests a certain number of times. By default the tests are only executed once." },
      { id: ["--list-modules", "--list"], type: "boolean", description: "List all available unit test modules." },
      { id: ["--no-changes", "-nc"], type: "boolean", description: "Do not log any diff changes between cached and new data when in interactive mode." },
      { id: ["--refresh"], type: ["boolean", "string"], default: false, description: "Refresh the cache before running the tests. Can be set to 'true' or a path to refresh from." }
    ],
    callback: async (args) => {
      for (const i of args.imports) {
        await import(i);
      }
      delete args.imports;
      if (!args.results) {
        cli.throw("The --results argument is required.");
      }
      await (0, import_perform.perform)({ ...args, results: args.results });
    }
  }
});
cli.start();
