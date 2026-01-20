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
var import_package = require("./package.js");
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
  ]
});
cli.main({
  description: `
        Execute the defined VTest modules.
        When no "--config" option is passed, the CLI will search for a configuration file named 'vtest.json', '.vtest.json', 'vtest.jsonc', or '.vtest.jsonc' in the current working directory or above.
        Unless the '--config' option is defined as "ignore", in which case no configuration file will be loaded.
        
        Any additional options passed will override the options in the loaded configuration.
        
        A configuration file must be located at the root of the project.
        `.dedent(true),
  examples: {
    "Run": "vtest --include 'dist/**/unit_tests/**/*.js'"
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
    { id: ["--debug", "-d"], type: "number", description: "Set the debug level, 0 for no debug, 1 for basic debug, 2 for verbose debug." }
    // { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." },
  ],
  async callback(args) {
    const config = import_package.Config.load(args.config || "__default__");
    if ("error" in config)
      throw cli.error(config.error);
    const pkg = new import_package.Package(config);
    await pkg.run(args);
  }
});
cli.command({
  id: "--list-files",
  description: `
        The --list-files command can be used to list the included files after processing the 'include' and 'exclude' attributes.
        It supports the default CLI options for importing or customizing the configuration file.
        `.dedent(true),
  args: [
    { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." }
  ],
  examples: {
    "List files": "vtest --list-files"
  },
  async callback(args) {
    const config = await import_package.Config.load(args.config || "__default__");
    if ("error" in config)
      throw cli.error(config.error);
    const pkg = new import_package.Package(config);
    pkg.list_files();
  }
});
cli.command({
  id: "--list-modules",
  description: `
        The --list-modules command can be used to list the available unit test modules.
        `.dedent(true),
  args: [
    { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." }
  ],
  examples: {
    "List modules": "vtest --list-modules"
  },
  async callback(args) {
    const config = await import_package.Config.load(args.config || "__default__");
    if ("error" in config)
      throw cli.error(config.error);
    const pkg = new import_package.Package(config);
    pkg.list_modules();
  }
});
cli.command({
  id: "--reset",
  description: `
        Reset the cached result of specified unit tests from a targeted module.
        `.dedent(true),
  examples: {
    "Reset": "vtest --reset 'dist/**/unit_tests/**/*.js'"
  },
  args: [
    { id: ["--config", "-c"], type: "string[]", required: false, description: "The path to the configuration file. By default it will search for any configuration files in the current working directory or above. Supports glob patterns. Multiple paths can be specified by separating them with commas." },
    { id: ["--module", "-m"], type: "string", required: true, description: "The module of the unit test identifier(s), e.g. 'module_1'." },
    { id: ["--target", "-t"], type: "string[]", required: true, description: "The unit test identifier(s) to reset, Supports wildcard patterns '*'." },
    { id: ["--yes", "-y"], type: "boolean", description: "Automatically answer yes to all prompts." }
  ],
  async callback(args) {
    const config = await import_package.Config.load(args.config || "__default__");
    if ("error" in config)
      throw cli.error(config.error);
    const pkg = new import_package.Package(config);
    await pkg.reset_unit_tests(args);
  }
});
cli.start();
