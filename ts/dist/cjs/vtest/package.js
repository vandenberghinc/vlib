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
var vlib = __toESM(require("../vlib/index.js"));
var import_vlib = require("../vlib/index.js");
var import_module = require("./module.js");
const import_meta = {};
const __root = import_meta.dirname.split("vlib/ts/")[0] + "/vlib/ts/";
class Package {
  /**
   * The initialized configuration object.
   */
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
  /** Construct a unit test package. */
  constructor(config) {
    this.config = config;
  }
  // --------------------------------------------------------------------
  // Executing the package unit tests.
  /**
   * Run the unit tests.
   * @param opts Optional context options to override the current configuration options with.
   * @returns A promise to a boolean indicating whether the unit tests succeeded or not.
   * @docs
   */
  async run(opts) {
    const config = this.config;
    const ctx = opts ? Package.Context.merge(config.ctx, opts, true) : config.ctx;
    this.init_env();
    await this.init_modules();
    if (import_module.Modules.length === 0) {
      throw new Error("No unit test modules defined, add unit tests using the 'vtest.Module.add()` function.");
    }
    const mods = import_module.Modules.filter((m) => ctx.module == null || ctx.module.match(m.name));
    if (mods.length === 0) {
      throw new Error(`Module "${ctx.module?.length === 1 ? ctx.module[0] : ctx.module}" was not found, the available modules are: [${import_module.Modules.map((i) => i.name).join(", ")}]`);
    }
    if (mods.length === 1) {
      const res = await mods[0].run(ctx);
      return res.status;
    }
    let succeeded = 0, failed = 0;
    for (const mod of mods) {
      if (ctx.yes) {
        throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
      }
      const res = await mod.run(ctx);
      if (!res.status) {
        return false;
      }
      succeeded += res.succeeded || 0;
      failed += res.failed || 0;
    }
    const prefix = ctx.debug === 0 ? " * " : "";
    if (failed === 0) {
      if (succeeded === 0) {
        console.log(`${import_vlib.Color.red("Error")}: No unit tests are defined.`);
        return false;
      }
      console.log(import_vlib.Color.cyan_bold(`
Executed ${mods.length} test modules.`));
      console.log(`${prefix}All ${failed + succeeded} unit tests ${import_vlib.Colors.green}${import_vlib.Colors.bold}passed${import_vlib.Colors.end} successfully.`);
      return true;
    } else {
      console.log(import_vlib.Color.cyan_bold(`
Executed ${mods.length} test modules.`));
      console.log(`${prefix}Encountered ${failed === 0 ? import_vlib.Colors.green : import_vlib.Colors.red}${import_vlib.Colors.bold}${failed}${import_vlib.Colors.end} failed unit tests.`);
      return false;
    }
  }
  // --------------------------------------------------------------------
  // Other public methods.
  /**
   * List all included files to the console.
   * @docs
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
   * @docs
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
   * @docs
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
    if (this.parsed_includes != null)
      return this.parsed_includes;
    if (!this.config.include?.length) {
      throw new Error(`No include patterns defined, please define at least one include pattern in the configuration.`);
    }
    this.parsed_includes = await import_vlib.Path.glob(this.config.include, { exclude: this.config.exclude, string: true });
    return this.parsed_includes;
  }
  parsed_includes = void 0;
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
    const included = await this.parse_includes();
    const imported_paths = /* @__PURE__ */ new Set();
    for (const p of included) {
      const abs = new import_vlib.Path(p).abs().str();
      if (imported_paths.has(abs)) {
        import_vlib.log.marker(`Skipping already imported unit test module: ${p}`);
        if (typeof this.config.ctx.debug === "number" && this.config.ctx.debug >= 1) {
          import_vlib.log.marker(`Skipping already imported unit test module: ${p}`);
        }
        continue;
      }
      imported_paths.add(abs);
      if (typeof this.config.ctx.debug === "number" && this.config.ctx.debug >= 1) {
        import_vlib.log.marker(`Importing unit test module: ${p}`);
      }
      try {
        await import(abs);
      } catch (err) {
        import_vlib.log.error(`Failed to import unit test module: ${p}`);
        throw err;
      }
    }
    if (import_module.Modules.length === 0) {
      throw new Error("No unit tests defined, add unit tests using the 'vtest.Module.add()` function.");
    }
    this.modules_initialized = true;
  }
}
(function(Package2) {
  let Context;
  (function(Context2) {
    Context2.Schema = {
      $schema: { type: "any", required: false },
      module: { type: ["string", "array"], required: false },
      target: { type: "string", required: false },
      debug: { type: ["string", "number"], required: false },
      yes: { type: "boolean", required: false },
      interactive: { type: "boolean", required: false },
      no_changes: { type: "boolean", required: false },
      stop_on_failure: { type: "boolean", required: false },
      stop_after: { type: "string", required: false },
      refresh: { type: "boolean", required: false },
      repeat: { type: "number", required: false },
      strip_colors: { type: "boolean", required: false },
      /**
       * @warning Keep this not required since this field
       * is often ignored and added more in terms of consistency.
       * Otherwise the `Config.create()` function will need to be updated
       * since that does not expect the `output` field to be required
       * in the `Config.options` field.
       */
      output: { type: "string", required: false }
    };
    function create(opts) {
      const output = new import_vlib.Path(opts.output).abs();
      if (!output.exists() || !output.is_dir()) {
        throw new Error(`Output directory "${opts.output}" does not exist or is not a directory.`);
      }
      return {
        output,
        target: opts.target,
        debug: opts.debug ?? 0,
        yes: opts.yes ?? false,
        interactive: opts.interactive ?? true,
        no_changes: opts.no_changes ?? false,
        stop_on_failure: opts.stop_on_failure ?? false,
        stop_after: opts.stop_after,
        repeat: opts.repeat ?? 0,
        strip_colors: opts.strip_colors ?? false,
        refresh: opts.refresh ?? false,
        module: opts.module ? new vlib.GlobPatternList(opts.module) : void 0
      };
    }
    Context2.create = create;
    function merge(base, override, copy = true) {
      if (copy)
        base = { ...base };
      for (const key of Object.keys(override)) {
        if (override[key] === void 0)
          continue;
        base[key] = override[key];
      }
      if (typeof base.output === "string") {
        base.output = new import_vlib.Path(base.output).abs();
        if (!base.output.exists() || !base.output.is_dir()) {
          throw new Error(`Output directory "${base.output}" does not exist or is not a directory.`);
        }
      }
      if (base.module != null && base.module instanceof vlib.GlobPatternList === false) {
        base.module = new vlib.GlobPatternList(base.module);
      }
      return base;
    }
    Context2.merge = merge;
  })(Context = Package2.Context || (Package2.Context = {}));
})(Package || (Package = {}));
var Config;
(function(Config2) {
  ;
  Config2.Schema = new vlib.Schema.Validator({
    throw: false,
    unknown: false,
    schema: {
      $schema: { type: "any", required: false },
      output: { type: "string", required: true },
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
      extends: {
        type: ["string", "array"],
        required: false
      },
      options: {
        type: "object",
        schema: Package.Context.Schema,
        required: false
      }
    }
  });
  if (process.argv.includes("--vlib-generate-schemas")) {
    vlib.Schema.create_json_schema_sync({
      unknown: false,
      output: `${__root}assets/schemas/vtest.json`,
      schema: Config2.Schema.schemas.schema
    });
    (0, import_vlib.log)(`Generated JSON schema 'vtest.json' at '${__root}assets/schemas/vtest.json'`);
  }
  function load(opts = "__default__", override, _exclude = /* @__PURE__ */ new Set()) {
    let config_path = void 0;
    if (typeof opts === "string" || Array.isArray(opts)) {
      let found;
      if (opts === "__default__") {
        found = vlib.cli.find_config_path({
          name: ["vtest", ".vtest"],
          extension: ["", ".json", ".jsonc"],
          up: 1,
          cwd: process.cwd()
        });
        if (!found) {
          return { error: `Could not find a default configuration file named 'vtest.json' in the current working directory "${process.cwd()}" or 1 level above.` };
        }
      } else {
        found = Package.resolve_path_search(opts);
        if (!found) {
          return { error: `No valid configuration file found in the provided path(s): ${typeof opts === "string" ? opts : opts.join(", ")}` };
        }
      }
      if (_exclude.has(found.path)) {
        return { error: `Configuration file '${found.path}' circularly references itself.` };
      }
      _exclude.add(found.path);
      config_path = found.path;
      const opts_data = found.load_sync({ type: "jsonc" });
      if (!opts_data) {
        return { error: `No valid JSONC data found at config file '${found.path}'` };
      }
      ;
      opts = opts_data;
    }
    const response = Config2.Schema.validate(opts, {
      error_prefix: config_path ? `Invalid configuration file "${config_path}": ` : `Invalid configuration object: `
    });
    if (typeof response.error === "string") {
      return response;
    }
    let base_config = void 0;
    if (response.data.extends) {
      const res = load(response.data.extends, void 0, _exclude);
      if (typeof res === "object" && "error" in res) {
        return res;
      }
      base_config = res;
    }
    let ctx_opts;
    if (response.data.options) {
      ctx_opts = response.data.options;
      ctx_opts.output = response.data.output;
    } else {
      ctx_opts = { output: response.data.output };
    }
    const ctx = Package.Context.create(ctx_opts);
    let config = {
      include: response.data.include,
      exclude: response.data.exclude,
      env: response.data.env,
      extends: response.data.extends,
      ctx,
      output: ctx.output,
      // for opts/initialized consistency.
      options: ctx_opts
      // for opts/initialized consistency.
    };
    if (base_config) {
      config = Config2.merge(config, base_config, false);
    }
    if (override && Object.keys(override).length > 0) {
      config = Config2.merge(config, override, false);
    }
    return config;
  }
  Config2.load = load;
  function merge(base, override, copy = true) {
    if (copy)
      base = { ...base };
    for (const key of Object.keys(override)) {
      switch (key) {
        case "include":
        case "exclude":
        case "env":
          if (!base[key]) {
            base[key] = [];
          } else if (copy) {
            base[key] = [...base[key]];
          }
          if (typeof override[key] === "string") {
            base[key] = [...base[key], override[key]];
          } else if (Array.isArray(override[key])) {
            base[key] = [...base[key], ...override[key]];
          } else {
            throw new TypeError(`Invalid type for "${key}", expected a string or an array of strings.`);
          }
          break;
        case "options":
          base.ctx = Package.Context.merge(base.ctx, override.options ?? {}, copy);
          break;
        case "ctx":
          break;
        default:
          if (override[key] === void 0)
            continue;
          base[key] = override[key];
          break;
      }
    }
    return base;
  }
  Config2.merge = merge;
})(Config || (Config = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  Package
});
