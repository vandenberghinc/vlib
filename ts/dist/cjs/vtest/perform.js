var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Tester: () => Tester
});
module.exports = __toCommonJS(stdin_exports);
var import_js_beautify = __toESM(require("js-beautify"));
var import_vlib = require("../vlib/index.js");
var vlib = __toESM(require("../vlib/index.js"));
var import_module = require("./module.js");
const { js: beautify } = import_js_beautify.default;
class Tester {
  /**
   * The initialized configuration object.
   */
  config;
  /**
   * Construct a tester instance.
   * Loads the configuration from the provided file path or object.
   */
  constructor(config) {
    if (typeof config === "string") {
      config = [config];
    }
    if (Array.isArray(config)) {
      if (config.some(vlib.GlobPattern.is)) {
        config = vlib.Path.glob_sync(config, {
          string: true,
          only_files: true,
          absolute: true
        });
      }
      let data;
      for (const p of config) {
        if (typeof p !== "string") {
          throw new TypeError(`Invalid config path "${p}", expected a string or an array of strings.`);
        }
        const path = new import_vlib.Path(p);
        if (path.exists()) {
          data = vlib.jsonc.load_sync(p);
          break;
        }
      }
      if (!data) {
        throw new Error(`No valid config file found in the provided paths: ${config.join(", ")}`);
      }
      config = data;
    }
    this.config = vlib.scheme.validate(config, {
      throw: true,
      unknown: false,
      scheme: Tester.config_scheme
    });
  }
  /**
   * Merge an additional configuration object into the current configuration.
   * The new attributes override the existing ones.
   * @param config The configuration object to merge.
   */
  merge(config) {
    for (const key of Object.keys(config)) {
      this.config[key] = config[key];
    }
  }
  /** Run the unit tests. */
  async run() {
    const config = this.config;
    if (config.env?.length) {
      for (const env of config.env) {
        if (config.debug >= 1)
          import_vlib.logger.marker(`Importing environment file ${env}`);
        vlib.env.from(env);
      }
    }
    const included = await import_vlib.Path.glob(config.include, { exclude: config.exclude, string: true });
    if (config.list_files) {
      console.log(`Include patterns: ${config.include?.map((i) => `
 - ${i}`).join("")}`);
      console.log(`Exclude patterns: ${config.exclude?.map((i) => `
 - ${i}`).join("")}`);
      console.log(`Found ${included.length} included paths: ${included?.map((i) => `
 - ${i}`).join("")}`);
      return true;
    }
    for (const p of included) {
      if (typeof config.debug === "number" && config.debug >= 1) {
        import_vlib.logger.marker(`Importing unit test module: ${p}`);
      }
      await import(new import_vlib.Path(p).abs().str());
    }
    if (config.list_modules) {
      if (import_module.modules.length === 0) {
        console.log(`Available unit test modules: None`);
      } else {
        console.log(`Available unit test modules:`);
        for (const mod of import_module.modules) {
          console.log(` * ${mod.name}`);
        }
      }
      return true;
    }
    if (import_module.modules.length === 0) {
      console.log(`${import_vlib.Color.red("Error")}: No unit tests defined, add unit tests using the add() function.`);
      return false;
    }
    const cache_path = new import_vlib.Path(config.results);
    if (!cache_path.exists()) {
      throw new Error(`Cache directory "${config.results}" does not exist.`);
    } else if (!cache_path.is_dir()) {
      throw new Error(`Cache path "${config.results}" is not a directory.`);
    }
    if (config.module != null || import_module.modules.length === 1) {
      const mod = import_module.modules.find((m) => config.module == null || m.name === config.module);
      if (!mod) {
        throw new Error(`Module "${config.module}" was not found, the available modules are: [${import_module.modules.map((i) => i.name).join(", ")}]`);
      }
      const res = await mod._run({
        target: config.target,
        stop_on_failure: config.stop_on_failure,
        stop_after: config.stop_after,
        debug: config.debug,
        interactive: config.interactive,
        cache: cache_path,
        yes: config.yes,
        repeat: config.repeat,
        no_changes: config.no_changes,
        refresh: config.refresh
      });
      return res.status;
    }
    let succeeded = 0, failed = 0;
    for (const mod of import_module.modules) {
      if (config.yes) {
        throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
      }
      const res = await mod._run({
        target: config.target,
        stop_on_failure: config.stop_on_failure,
        stop_after: config.stop_after,
        debug: config.debug,
        interactive: config.interactive,
        cache: cache_path,
        yes: config.yes,
        repeat: config.repeat,
        no_changes: config.no_changes,
        refresh: config.refresh
      });
      if (!res.status) {
        return false;
      }
      succeeded += res.succeeded || 0;
      failed += res.failed || 0;
    }
    const prefix = config.debug === 0 ? " * " : "";
    if (failed === 0) {
      if (succeeded === 0) {
        console.log(`${import_vlib.Color.red("Error")}: No unit tests are defined.`);
        return false;
      }
      console.log(import_vlib.Color.cyan_bold(`
Executed ${import_module.modules.length} test modules.`));
      console.log(`${prefix}All ${failed + succeeded} unit tests ${import_vlib.Colors.green}${import_vlib.Colors.bold}passed${import_vlib.Colors.end} successfully.`);
      return true;
    } else {
      console.log(import_vlib.Color.cyan_bold(`
Executed ${import_module.modules.length} test modules.`));
      console.log(`${prefix}Encountered ${failed === 0 ? import_vlib.Colors.green : import_vlib.Colors.red}${import_vlib.Colors.bold}${failed}${import_vlib.Colors.end} failed unit tests.`);
      return false;
    }
  }
}
(function(Tester2) {
  Tester2.config_scheme = {
    include: {
      type: "array",
      default: ["**/unit_tests/**/*.js", "**/tests/**/*.js"],
      value_scheme: { type: "string" }
    },
    exclude: {
      type: "array",
      default: ["**/node_modules/**"],
      value_scheme: { type: "string" }
    },
    results: { type: "string", default: ".vtest_results" },
    module: { type: "string", required: false },
    target: { type: "string", required: false },
    stop_on_failure: { type: "boolean", default: false },
    stop_after: { type: "string", required: false },
    debug: { type: ["number", "string"], default: 0 },
    interactive: { type: "boolean", default: false },
    yes: { type: "boolean", default: false },
    repeat: { type: "number", default: 1, min: 1, max: 1e3 },
    no_changes: { type: "boolean", default: false },
    refresh: { type: ["boolean", "string"], default: false },
    env: {
      type: "array",
      required: false,
      default: [],
      value_scheme: { type: "string" }
    },
    list_files: { type: "boolean", default: false },
    list_modules: { type: "boolean", default: false }
  };
})(Tester || (Tester = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Tester
});
