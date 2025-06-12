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
  Config: () => Config,
  Package: () => Package
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../vlib/index.js");
var vlib = __toESM(require("../vlib/index.js"));
var import_module = require("./module.js");
var Config;
(function(Config2) {
  ;
  Config2.SchemaOpts = {
    output: {
      type: "string",
      required: true
    },
    include: {
      type: "array",
      value_schema: { type: "string" },
      required: true,
      preprocess: (v) => typeof v === "string" ? [v] : v
    },
    exclude: {
      type: "array",
      default: ["**/node_modules/**"],
      value_schema: { type: "string" },
      preprocess: (v) => typeof v === "string" ? [v] : v
    },
    env: {
      type: "array",
      required: false,
      default: [],
      value_schema: { type: "string" },
      preprocess: (v) => typeof v === "string" ? [v] : v
    },
    base: {
      type: ["string", "array"],
      required: false
    }
  };
  Config2.Schema = new vlib.Schema.ValidatorEntries(Config2.SchemaOpts);
})(Config || (Config = {}));
class Package {
  /**
   * The initialized configuration object.
   */
  // config: ReturnType<typeof this.validator.validate>;
  config;
  /** Flag to indicate if the modules are already initialized by `init_modules()` */
  modules_initialized = false;
  /**
   * Resolve a path search to a file path, basically an OR operation if any file exists.
   * @returns The resolved path or undefined when no path is provided.
   */
  static resolve_path_search(path) {
    let paths;
    if (Array.isArray(path) && vlib.GlobPatternList.is(path) || typeof path === "string" && vlib.GlobPattern.is(path)) {
      paths = vlib.Path.glob_sync(path, {
        string: false,
        only_files: true,
        absolute: true
      });
    } else {
      paths = Array.isArray(path) ? path.map((p) => new import_vlib.Path(p)) : [new import_vlib.Path(path)];
    }
    if (paths.length === 0) {
      return void 0;
    }
    return paths.find((p) => p.exists() && p.is_file());
  }
  /**
   * Construct a unit test package.
   * Loads the configuration from the provided file path or object.
   */
  constructor(config) {
    let config_path;
    if (typeof config.extends === "string") {
      config.extends = [config.extends];
    }
    if (Array.isArray(config.extends)) {
      const found = Package.resolve_path_search(config.extends);
      if (!found) {
        throw new Error(`No valid configuration file found in the provided paths: ${config.extends.join(", ")}`);
      }
      const base_data = found.load_sync({ type: "jsonc" });
      if (!base_data) {
        throw new Error(`No valid data found at config file: ${found.path}`);
      }
      this.config = vlib.schema.validate(base_data, {
        schema: Config.Schema,
        unknown: false,
        throw: true,
        error_prefix: `Invalid base configuration file "${found.path}": `
      });
      this.merge(config);
    } else {
      this.config = vlib.schema.validate(config, {
        schema: Config.Schema,
        unknown: false,
        throw: true,
        error_prefix: `Invalid vtest configuration file "${config_path ?? "[object]"}": `
      });
    }
    const output_dir = new import_vlib.Path(config.output);
    if (!output_dir.exists()) {
      throw new Error(`Output directory "${config.output}" does not exist.`);
    } else if (!output_dir.is_dir()) {
      throw new Error(`Output path "${config.output}" is not a directory.`);
    }
  }
  /**
   *
   */
  /**
   * Try to load a package by input file or if omitted by searching for a default configuration file.
   * If no input paths are provided, this function will search for a configuration file
   * like 'vtest.json', '.vtest.json' etc. in the current working directory or 1 level above.
   * @throw An error when no configuration file is found.
   * @param inputs The input file path(s) to load the configuration from.
   *               If not provided, the function will search for a default configuration file.
   * @param override An optional object to override the loaded configuration.
   */
  static async from_file(inputs, override = {}) {
    let data;
    if (inputs) {
      const found = Package.resolve_path_search(inputs);
      if (!found) {
        throw new Error(`No valid configuration file found in the provided paths: ${Array.isArray(inputs) ? inputs.join(", ") : inputs}`);
      }
      data = found.load_sync({ type: "jsonc" });
      if (!data) {
        throw new Error(`Invalid configuration file data at ${found.path}`);
      }
    } else {
      const found = vlib.cli.find_config_path({
        name: ["vtest", ".vtest"],
        extension: ["", ".json", ".jsonc"],
        up: 1,
        cwd: process.cwd()
      });
      if (!found) {
        throw new Error(`No default configuration file found, please provide a configuration file or use the 'extends' option to load a base configuration.`);
      }
      data = await found.load({ type: "jsonc" });
      if (!data) {
        throw new Error(`No valid config file found in the current working directory "${process.cwd()}" or 1 level above.`);
      }
    }
    if (!data) {
      throw new Error(`Unable to load configuration data from the provided paths or default configuration file.`);
    }
    return new Package({
      ...data,
      ...override
    });
  }
  /**
   * Merge an additional configuration object into the current configuration.
   * The new attributes override the existing ones.
   * @param config The configuration object to merge.
   */
  merge(config) {
    for (const key of Object.keys(config)) {
      switch (key) {
        case "include":
        case "exclude":
        case "env":
          if (!this.config[key]) {
            this.config[key] = [];
          }
          if (typeof config[key] === "string") {
            this.config[key] = [...this.config[key], config[key]];
          } else if (Array.isArray(config[key])) {
            this.config[key] = [...this.config[key], ...config[key]];
          } else {
            throw new TypeError(`Invalid type for "${key}", expected a string or an array of strings.`);
          }
          break;
        default:
          this.config[key] = config[key];
      }
    }
  }
  /** Run the unit tests. */
  async run(opts) {
    const config = this.config;
    this.init_env();
    const included = await this.parse_includes();
    await this.init_modules();
    const output_dir = new import_vlib.Path(config.output);
    if (opts.module != null || import_module.Modules.length === 1) {
      const mod = import_module.Modules.find((m) => opts.module == null || m.name === opts.module);
      if (!mod) {
        throw new Error(`Module "${opts.module}" was not found, the available modules are: [${import_module.Modules.map((i) => i.name).join(", ")}]`);
      }
      const res = await mod._run({
        target: opts.target,
        stop_on_failure: opts.stop_on_failure,
        stop_after: opts.stop_after,
        interactive: opts.interactive,
        output: output_dir,
        repeat: opts.repeat,
        no_changes: opts.no_changes
      });
      return res.status;
    }
    let succeeded = 0, failed = 0;
    for (const mod of import_module.Modules) {
      if (opts.yes) {
        throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
      }
      const res = await mod._run({
        target: opts.target,
        stop_on_failure: opts.stop_on_failure,
        stop_after: opts.stop_after,
        interactive: opts.interactive,
        output: output_dir,
        repeat: opts.repeat,
        no_changes: opts.no_changes
      });
      if (!res.status) {
        return false;
      }
      succeeded += res.succeeded || 0;
      failed += res.failed || 0;
    }
    const prefix = opts.debug === 0 ? " * " : "";
    if (failed === 0) {
      if (succeeded === 0) {
        console.log(`${import_vlib.Color.red("Error")}: No unit tests are defined.`);
        return false;
      }
      console.log(import_vlib.Color.cyan_bold(`
Executed ${import_module.Modules.length} test modules.`));
      console.log(`${prefix}All ${failed + succeeded} unit tests ${import_vlib.Colors.green}${import_vlib.Colors.bold}passed${import_vlib.Colors.end} successfully.`);
      return true;
    } else {
      console.log(import_vlib.Color.cyan_bold(`
Executed ${import_module.Modules.length} test modules.`));
      console.log(`${prefix}Encountered ${failed === 0 ? import_vlib.Colors.green : import_vlib.Colors.red}${import_vlib.Colors.bold}${failed}${import_vlib.Colors.end} failed unit tests.`);
      return false;
    }
  }
  /**
   * Reset unit tests.
   */
  /**
   * List all included files to the console.
   */
  async list_files() {
    const included = await this.parse_includes();
    console.log(`Include patterns: ${this.config.include?.map((i) => `
 - ${i}`).join("")}`);
    console.log(`Exclude patterns: ${this.config.exclude?.map((i) => `
 - ${i}`).join("")}`);
    console.log(`Found ${included.length} included paths: ${included?.map((i) => `
 - ${i}`).join("")}`);
  }
  /**
   * List all included modules to the console.
   */
  async list_modules() {
    await this.init_modules();
    if (import_module.Modules.length === 0) {
      console.log(`Available unit test modules: None`);
    } else {
      console.log(`Available unit test modules:`);
      for (const mod of import_module.Modules) {
        console.log(` * ${mod.name}`);
      }
    }
  }
  /**
   * Reset certain unit test results.
   * @param module The module name to reset the unit tests for.
   * @param ids The unit test ids to reset. Supports glob patterns.
   * @param yes Automatically answer yes to all prompts.
   */
  async reset_unit_tests({ module: module2, target, yes = false }) {
    await this.init_modules();
    const mod = import_module.Modules.find((m) => m.name === module2);
    if (!mod) {
      throw new Error(`Module "${module2}" was not found, the available modules are: [${import_module.Modules.map((i) => i.name).join(", ")}]`);
    }
    return mod.reset_unit_tests({
      results: new import_vlib.Path(this.config.output),
      target,
      yes
    });
  }
  // --------------------------------------------------------------------
  // Private methods.
  /** Parse the included files. */
  async parse_includes() {
    if (!this.config.include?.length) {
      throw new Error(`No include patterns defined, please define at least one include pattern in the configuration.`);
    }
    return import_vlib.Path.glob(this.config.include, { exclude: this.config.exclude, string: true });
  }
  /** Initialize the environment files. */
  init_env() {
    if (this.config.env?.length) {
      const env = typeof this.config.env === "string" ? [this.config.env] : this.config.env;
      for (const e of env) {
        import_vlib.log.raw(`Importing environment file ${e}`);
        vlib.env.from(e);
      }
    }
  }
  /** Parse includes and initialize all unit test modules. */
  async init_modules() {
    if (this.modules_initialized)
      return;
    const config = this.config;
    const included = await this.parse_includes();
    const imported_paths = /* @__PURE__ */ new Set();
    for (const p of included) {
      const abs = new import_vlib.Path(p).abs().str();
      if (imported_paths.has(abs)) {
        import_vlib.log.marker(`Skipping already imported unit test module: ${p}`);
        if (typeof config.debug === "number" && config.debug >= 1) {
          import_vlib.log.marker(`Skipping already imported unit test module: ${p}`);
        }
        continue;
      }
      imported_paths.add(abs);
      if (typeof config.debug === "number" && config.debug >= 1) {
        import_vlib.log.marker(`Importing unit test module: ${p}`);
      }
      await import(abs);
    }
    if (import_module.Modules.length === 0) {
      throw new Error("No unit tests defined, add unit tests using the 'vtest.Module.add()` function.");
    }
    this.modules_initialized = true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  Package
});
