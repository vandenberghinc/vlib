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
  Transformer: () => Transformer
});
module.exports = __toCommonJS(stdin_exports);
var import_fast_glob = __toESM(require("fast-glob"));
var import_path = __toESM(require("path"));
var vlib = __toESM(require("../../vlib/index.js"));
var import_vlib = require("../../vlib/index.js");
var import_plugin = require("../plugins/plugin.js");
var import_parse_imports = require("../utils/parse_imports.js");
class Transformer {
  /** The root plugin id from the transformer. */
  static id = new import_plugin.Plugin.Id("vts");
  /** The log id for the alias log methods. */
  static log_id = new import_vlib.Path("/vts", false);
  /** The initialized config. */
  config;
  /**
   * All processed source files.
   * Note that not all source files are changed, just all processed files.
   */
  sources = /* @__PURE__ */ new Map();
  /** Mutext for interactive prompts. */
  interactive_mutex = new vlib.Mutex();
  /** Loaded tsconfig attributes. */
  tsconfig = void 0;
  tsconfig_path = void 0;
  tsconfig_base = void 0;
  /** Constructor. */
  constructor(config) {
    this.config = {
      ...config,
      yes: config.yes ?? false,
      interactive_mutex: new vlib.Mutex(),
      async: config.async ?? true,
      parse_imports: config.parse_imports ?? false,
      insert_tsconfig: config.insert_tsconfig ?? false,
      check_include: config.check_include ?? true,
      debug: config.debug instanceof vlib.Debug ? config.debug : new vlib.Debug(config.debug ?? 0),
      files: config.files ? new Map(Object.entries(config.files ?? {})) : void 0
    };
  }
  /**
   * Create a manual `on` function to detect used log levels.
   */
  on(level) {
    return level <= this.config.debug.level.n;
  }
  /**
   * Get a file from the in-memory files.
   * @throws an error if the file is not found.
   */
  get_in_memory_file(file_path) {
    if (!this.config.files) {
      throw new Error(`No in-memory files configured, cannot get file "${file_path}".`);
    }
    if (!this.config.files.has(file_path)) {
      throw new Error(`In-memory file "${file_path}" not found.`);
    }
    return this.config.files.get(file_path);
  }
  /** Ensure a tsconfig is loaded. */
  assert_tsconfig() {
    if (!this.tsconfig || !this.tsconfig_path) {
      if (this.config.tsconfig) {
        throw new Error(`No tsconfig found at "${this.tsconfig_path?.path ?? "undefined"}".`);
      } else {
        throw new Error(`No tsconfig configured, but required for this transformer.`);
      }
    }
  }
  /**
   * Initialize a source file.
   */
  init_source(file_path, in_memory = false) {
    const f = new import_vlib.Path(file_path, false);
    const ext = f.extension();
    const is_d_ts = file_path.endsWith(".d.ts");
    const is_ts = !is_d_ts && (ext === ".ts" || ext === ".tsx");
    const is_js = ext === ".js" || ext === ".jsx";
    const type = is_js ? "dist" : is_ts ? "src" : void 0;
    if (!type) {
      if (this.on(1))
        this.log(`Skipping file "${file_path}" by unsupported file extension.`);
      return;
    }
    let ts_src;
    if (type === "dist") {
      const ts_path = f.path.replace(/\.js(x?)$/, ".ts$1");
      let root_dir, relative_path, full_ts_path;
      if (in_memory && this.config.files?.has(ts_path) || !in_memory && import_vlib.Path.exists(ts_path)) {
        ts_src = new import_vlib.Path(ts_path, false);
      } else if (this.tsconfig && (root_dir = this.tsconfig.compilerOptions?.rootDir ? import_path.default.resolve(this.tsconfig_base?.path || "", this.tsconfig.compilerOptions.rootDir) : this.tsconfig_base?.path || void 0) && (relative_path = import_path.default.relative(root_dir, ts_path)) && (full_ts_path = import_path.default.resolve(root_dir, relative_path)) && (in_memory && this.config.files?.has(full_ts_path) || !in_memory && import_vlib.Path.exists(full_ts_path))) {
        ts_src = new import_vlib.Path(full_ts_path, false);
      }
    } else if (type === "src" && !is_d_ts) {
      ts_src = f;
    }
    const src = new import_plugin.Source(file_path, type, in_memory ? this.get_in_memory_file(file_path) : void 0, ts_src, this.config, in_memory);
    this.sources.set(src.path.path, src);
  }
  /**
   * Initialize all sources.
   */
  async init_sources() {
    if (this.on(2))
      this.log(`Initializing sources...`);
    if (this.config.tsconfig) {
      this.tsconfig_path = this.config.tsconfig ? Transformer.resolve_tsconfig(this.config.tsconfig) : void 0;
      if (!this.tsconfig_path || !this.tsconfig_path.exists())
        throw new Error(`No tsconfig found at "${this.tsconfig_path?.path ?? "undefined"}".`);
      this.tsconfig = await vlib.jsonc.load(this.tsconfig_path);
      if (this.on(1))
        this.log(`Loaded tsconfig from "${this.tsconfig_path.path}".`);
      this.tsconfig_base = this.tsconfig_path.base();
    }
    if (this.config.files && this.config.files.size > 0) {
      if (this.on(1))
        this.log(`Processing ${this.config.files.size} in-memory files.`);
      for (const file_path of this.config.files.keys()) {
        this.init_source(file_path, true);
      }
    }
    if (this.on(1))
      this.log(`Processing include patterns...`);
    const { error, tsconfig_base, matched_files } = await this.create_include_patterns();
    if (error) {
      return { error };
    }
    this.tsconfig_base = tsconfig_base;
    if (this.config.files?.size === 0 && matched_files.length === 0) {
      return { error: { type: "warning", message: "No files matched the include patterns." } };
    }
    for (const file_path of matched_files) {
      this.init_source(file_path, false);
    }
    const cbp = import_vlib.Path.find_common_base_path(Array.from(this.sources.keys()));
    if (cbp) {
      for (const src of this.sources.values()) {
        src.non_unique_id.path = src.path.path.slice(cbp.length + 1);
      }
    }
    if (this.on(1))
      this.log(`Initialized ${this.sources.size} sources.`);
    return {};
  }
  /**
   * Create the include patterns from the `include` and `tsconfig.include` options.
   */
  async create_include_patterns() {
    const include_patterns = [];
    const exclude_patterns = this.config.exclude ?? [];
    exclude_patterns.push("**/node_modules/**", "**/.DS_Store");
    const process_include_pattern = (include, in_memory = false) => {
      if (this.on(2))
        this.log(`Processing include "${include}"`);
      if (in_memory) {
        return;
      }
      if (/[*?{}]/.test(include)) {
        include_patterns.push(include);
        if (this.on(2))
          this.log(`Adding included pattern "${include}".`);
        return;
      }
      const path = new import_vlib.Path(include);
      if (!path.exists()) {
        throw new Error(`Included path "${include}" does not exist.`);
      }
      if (path.is_dir()) {
        include_patterns.push(include);
        if (this.on(2))
          this.log(`Adding included directory "${include}".`);
        return;
      }
      if (!this.config.parse_imports) {
        include_patterns.push(include);
        if (this.on(2))
          this.log(`Adding included file "${include}".`);
        return;
      }
      return new Promise((resolve, reject) => {
        (0, import_parse_imports.parse_imports)(include, { recursive: true, external: false }).then((parsed_imports) => {
          if (this.on(2))
            this.log(`Parsed imports from tsconfig include "${include}":`, parsed_imports);
          include_patterns.push(...parsed_imports);
          resolve();
        }).catch(reject);
      });
    };
    let promise;
    if (this.config.include) {
      for (let i = 0; i < this.config.include.length; i++) {
        if ((promise = process_include_pattern(this.config.include[i])) instanceof Promise)
          await promise;
      }
    }
    const tsconfig_path = this.config.tsconfig ? Transformer.resolve_tsconfig(this.config.tsconfig) : void 0;
    if (tsconfig_path && this.on(1))
      this.log(`Using tsconfig "${tsconfig_path}"`);
    const tsconfig = tsconfig_path ? await vlib.jsonc.load(tsconfig_path) : void 0;
    const tsconfig_base = tsconfig_path?.base();
    if (this.config.insert_tsconfig) {
      if (Array.isArray(tsconfig.exclude)) {
        for (const exclude of tsconfig.exclude) {
          const res = import_path.default.resolve(tsconfig_base?.path || process.cwd(), exclude);
          if (this.on(1))
            this.log(`Adding tsconfig exclude "${exclude}"`);
          exclude_patterns.push(res);
        }
      }
      if (Array.isArray(tsconfig.include)) {
        for (let i = 0; i < tsconfig.include.length; i++) {
          if ((promise = process_include_pattern(tsconfig.include[i])) instanceof Promise)
            await promise;
        }
      }
    }
    if (this.config.files && this.config.files.size > 0) {
      if (this.on(1))
        this.log(`Processing ${this.config.files.size} in-memory files.`);
      for (const file_path of this.config.files.keys()) {
        if ((promise = process_include_pattern(file_path, true)) instanceof Promise)
          await promise;
      }
    }
    let not_found;
    if (this.config.check_include && (not_found = include_patterns.filter((include) => !/[*?{}]/.test(include))).length) {
      throw new Error(`Included path${not_found.length > 1 ? "s" : ""} ${not_found.map((l) => `"${l}"`).join(", ")} do${not_found.length > 1 ? "es" : ""} not exist.`);
    }
    if (this.on(1))
      this.log(`Found ${include_patterns.length} include patterns.`);
    if (include_patterns.length && this.on(2))
      this.log(`Include patterns:
${include_patterns.map((l, i) => `      - ${l.replace(/^[./]*/, "")}`).join("\n")}`);
    const matched_files = include_patterns.length === 0 ? [] : await (0, import_fast_glob.default)(include_patterns.map((p) => {
      const path = new import_vlib.Path(p);
      return !path.exists() || !path.is_dir() ? p : `${p.split(import_path.default.sep).join("/")}/**/*.{js,jsx,ts,tsx}`;
    }), { dot: true, onlyFiles: true, ignore: exclude_patterns, absolute: true, cwd: tsconfig_base?.path || process.cwd() });
    if (matched_files.length === 0 && !this.config.files?.size) {
      this.warn(`No files matched the include patterns: ${include_patterns.join(", ")}`);
      return { error: { type: "warning", message: "No files matched the include patterns." } };
    }
    if (this.on(1))
      this.log(`Found ${matched_files.length} files to consider.`);
    return { tsconfig_base, matched_files };
  }
  /**
   * Alias log methods.
   * @note That we do not use the `debug` instance here.
   *       The plugin should use `if (this.this.on(1)) source.log()` to log messages.
   */
  log(...message) {
    (0, import_plugin.log_helper)(Transformer.log_id, void 0, Transformer.id, ...message);
  }
  warn(...message) {
    (0, import_plugin.log_helper)(Transformer.log_id, vlib.Color.yellow_bold("warning "), Transformer.id, ...message);
  }
  error(...message) {
    (0, import_plugin.log_helper)(Transformer.log_id, vlib.Color.red_bold("error "), Transformer.id, ...message);
  }
  /**
   * Run the plugin.
   */
  async run() {
    let { debug, yes } = this.config;
    if (this.config.plugins && this.on(2)) {
      this.log(`Found ${this.config.plugins.length} plugin${this.config.plugins.length === 1 ? "" : "s"} to run:`);
      for (let i = 0; i < this.config.plugins.length; i++) {
        const plugin = this.config.plugins[i];
        if (plugin) {
          this.log(`  - `, plugin);
        } else {
          this.log(`  - <undefined plugin>`);
        }
      }
    }
    const res = await this.init_sources();
    if (res.error) {
      return res;
    }
    const plugins = this.config.plugins?.filter((p) => p && p.callback);
    const has_dist = plugins.some((p) => p.has_dist);
    const process_file = async (source) => {
      const capture_changes = yes || this.on(import_plugin.Source.log_level_for_changes);
      for (const plugin of plugins) {
        if (!plugin || !plugin.callback) {
          continue;
        }
        let not_processed = true;
        if (source.is_src && plugin.has_src || source.is_dist && plugin.has_dist) {
          if (plugin.on(2))
            plugin.log(source, `Processing source [${source.type}]...`);
          if (source.requires_load) {
            await source.load();
          }
          const old = capture_changes ? { data: source.data } : void 0;
          const changed = source.changed;
          source.changed = false;
          const p = plugin.callback(source);
          if (p instanceof Promise)
            await p;
          if (source.changed && old !== void 0)
            source.add_change(plugin, old);
          if (!source.changed && changed)
            source.changed = true;
          continue;
        }
        if (this.on(1)) {
          plugin.log(source, `Source is not supported.`);
        }
      }
      if (!source.in_memory) {
        if (source?.data != null && source.changed) {
          await source.save({ yes, plugin: Transformer.id });
        }
      }
    };
    if (this.config.async) {
      const promises = [];
      for (const source of this.sources.values()) {
        promises.push(process_file(source));
      }
      await Promise.all(promises);
    } else {
      for (const source of this.sources.values()) {
        await process_file(source);
      }
    }
    return {};
  }
  /**
   * Run multiple transformers optionally in parallel.
   * Mainly used for in the CLI.
   */
  static async run_multiple(transformers, opts) {
    const ts = transformers.map((t) => t instanceof Transformer ? t : new Transformer({ ...t, async: opts?.async ?? true }));
    if (opts?.async ?? true) {
      const res = await Promise.all(ts.map((t) => t.run()));
      for (const r of res) {
        if (r.error?.type === "warning") {
          vlib.warn(r.error.message);
        } else if (r.error) {
          throw new Error(r.error.message);
        }
      }
    } else {
      for (const transformer of ts) {
        const { error } = await transformer.run();
        if (error?.type === "warning") {
          vlib.warn(error.message);
        } else if (error) {
          throw new Error(error.message);
        }
      }
    }
  }
  /** Resolve tsconfig to an existing file.. */
  static resolve_tsconfig(path) {
    let tsconfig = new import_vlib.Path(path);
    if (!tsconfig.exists()) {
      throw new Error(`Typescript config path "${tsconfig}" does not exist.`);
    } else if (tsconfig.is_dir()) {
      tsconfig = tsconfig.join("tsconfig.json");
      if (!tsconfig.exists()) {
        throw new Error(`Typescript source "${path}" does not contain a "tsconfig.json" file.`);
      }
    }
    if (!tsconfig.path.endsWith("tsconfig.json")) {
      throw new Error(`Invalid typescript config path "${tsconfig}", the path should end with "tsconfig.json".`);
    }
    return tsconfig;
  }
}
/* @__PURE__ */ (function(Transformer2) {
  ;
})(Transformer || (Transformer = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Transformer
});
