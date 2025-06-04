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
  Plugin: () => Plugin,
  Source: () => Source,
  log_helper: () => log_helper
});
module.exports = __toCommonJS(stdin_exports);
var fs = __toESM(require("fs"));
var vlib = __toESM(require("../../../index.js"));
var import__ = require("../../../index.js");
var import_compute_diff = require("../utils/compute_diff.js");
const last_log = [void 0, void 0];
function log_helper(log_path, prefix, ...args) {
  let plugin = void 0;
  for (let i = 0; args.length > i; i++) {
    if (args[i] instanceof Plugin.Id) {
      plugin = args[i].id;
      args[i] = "";
      break;
    } else if (args[i] instanceof Plugin) {
      plugin = args[i].id.id;
      args[i] = "";
      break;
    }
  }
  if (last_log[1] === plugin && last_log[0]?.path === log_path.path) {
    vlib.debug.raw(vlib.debugging.Directive.enforce, `    ${prefix ?? ""}`, ...args);
  } else {
    vlib.debug.raw(vlib.debugging.Directive.enforce, `${vlib.Color.cyan(log_path.path.charAt(0) === "/" ? "" : ".")}${vlib.Color.cyan(log_path.path)}${plugin ? ` ${vlib.Colors.gray}(${plugin})${vlib.Colors.end}` : ""}
    ${prefix ?? ""}`, ...args);
  }
  last_log[0] = log_path;
  last_log[1] = plugin;
}
class Source {
  ts_src;
  config;
  in_memory;
  /** The path of the source object. */
  path;
  /**
   * The non unique id path used for logging.
   * @note This is not guaranteed to be unique.
   * @warning This should not be used for anything else than logging.
   *          Since this path might be resolved correctly.
   */
  non_unique_id;
  /** The loaded source data. */
  data;
  /** Flag to indicate if the source still requires a load call. */
  requires_load;
  /**
   * Each version of the edited `data` transformation.
   */
  changes = [];
  static log_level_for_changes = 1;
  /** Has been changed by the pipeline callbacks. */
  changed = false;
  /** Type dist for js like files and src for ts like files */
  type;
  is_src;
  is_dist;
  // /** Changed - @debug Only for pure debugging since the plugin is not accessable here. */
  // private _changed: boolean = false;
  // get changed(): boolean { return this._changed; }
  // set changed(value: boolean) {
  //     if (this._changed !== value) {
  //         this._changed = value;
  //         if (this.debug.on(1)) { this.log(this.debug.loc(1).abs_id + ": Marking source as changed."); }
  //     }
  // }
  /** Forwarded Transformer.Config attributes. */
  debug;
  interactive_mutex;
  /** Methods. */
  constructor(path, type, data, ts_src, config, in_memory) {
    this.ts_src = ts_src;
    this.config = config;
    this.in_memory = in_memory;
    this.path = path instanceof import__.Path ? path : new import__.Path(path);
    this.type = type;
    this.is_src = this.type === "src";
    this.is_dist = this.type === "dist";
    this.non_unique_id = new import__.Path(this.path.path);
    this.data = data;
    this.requires_load = typeof this.data === "string" ? void 0 : true;
    this.debug = config.debug;
    this.interactive_mutex = config.interactive_mutex;
  }
  /** Safely get the ts_src, ensuring it exists. */
  get safe_ts_src() {
    if (!this.ts_src)
      throw new Error(`Source "${this.path.path}" is not a TypeScript dist file, cannot ensure ts_src.`);
    if (!(this.ts_src instanceof import__.Path))
      throw new Error(`Source "${this.path.path}" ts_src is not a Path instance.`);
    return this.ts_src;
  }
  /**
   * Log functions to log a (process) message for this source.
   *
   * @warning Keep this private since the user should use `Transformer.log` or `Plugin.log` since that has an attached plugin id.
   *
   * @note That we do not use the `debug` instance here.
   *       The plugin should use `if (this.debug.on(1)) source.log()` to log messages.
   */
  log(...args) {
    log_helper(this.non_unique_id, void 0, ...args);
  }
  warn(...args) {
    log_helper(this.non_unique_id, vlib.Color.yellow_bold("warning "), ...args);
  }
  error(...args) {
    log_helper(this.non_unique_id, vlib.Color.red_bold("error "), ...args);
  }
  /**
   * Add a change to the source data.
   * @note This function does not mark the source as changed.
   *       This function should be called when a plugin callback has made a change to the source data.
   *       And the `changes` behaviour is enabled.
   * @param plugin The plugin that made the change.
   * @param old_data The old data of the source file before the change.
   */
  add_change(plugin, old) {
    if (!this.data) {
      return this.error(plugin, `Source data is not loaded, cannot check changes.`);
    }
    if (old.data === this.data) {
      return this.warn(plugin, `No changes made in source data, but marked as changed.`);
    }
    this.changes.push(old.data);
    if (this.debug.on(Source.log_level_for_changes)) {
      const { status, diff } = (0, import_compute_diff.compute_diff)({
        new: this.data,
        old: old.data,
        prefix: "    "
      });
      if (status === "identical") {
        return this.warn(plugin, `No changes made in source data, but marked as changed.`);
      } else if (status === "diff") {
        this.log(plugin, `Changes made in source data, computing diff...`);
        if (diff) {
          this.log(plugin, diff);
        }
      }
    }
  }
  /**
   * Load the source data
   * Should be chained like `if (source.requires_load) { await source.load(); source.assert_load(); }`.
   */
  async load() {
    this.data = await fs.promises.readFile(this.path.path, "utf8");
    this.requires_load = false;
  }
  assert_load() {
    if (typeof this.data !== "string") {
      throw new Error(`Assert failed, source "${this.path.path}" is not loaded.`);
    }
    this.requires_load = false;
  }
  /**
   * Save the source data to the file system.
   * @note This function only saves the data when any changes were made.
   */
  async save({
    plugin,
    yes = false
    /** @warning never change to `true` as default, warning docstring inside why. */
  }) {
    if (this.data && this.changed) {
      if (yes) {
        await this.interactive_mutex.lock();
        try {
          const multiple = this.changes.length > 1;
          for (let i = 0; i < this.changes.length; i++) {
            if (multiple)
              this.log(plugin, `Transformation ${i + 1}`);
            const { status, diff } = (0, import_compute_diff.compute_diff)({
              new: this.changes[i + 1] ?? this.data,
              old: this.changes[i],
              prefix: multiple ? "        " : "    ",
              trim_keep: 2
            });
            if (status === "identical") {
              this.warn(plugin, `No changes made in source data, but marked as changed.`);
            } else if (status === "diff") {
              this.log(plugin, `Changes made in source data, computing diff...`);
              this.log(plugin, diff);
            }
          }
          if (!await vlib.logging.confirm(`[${vlib.Color.green_bold("Interactive")}] Do you want to save the changes to "${this.path.path}"?`)) {
            console.log(vlib.Color.red_bold("Aborted"));
            process.exit(1);
          }
          last_log[0] = void 0;
        } finally {
          this.interactive_mutex.unlock();
        }
      }
      if (this.debug.on(1))
        this.log(plugin, `Saved source changes [${vlib.utils.format_bytes(Buffer.byteLength(this.data, "utf8"))}]`);
      await fs.promises.writeFile(this.path.path, this.data, "utf8");
    }
    return this;
  }
  /**
   * Replaces characters between start and end indices with the given substring.
   * Automatically assigns attribute `changed` to true.
   */
  replace_indices(substr, start, end) {
    if (this.data == null) {
      throw new Error(`Source data is not loaded, cannot replace indices.`);
    }
    this.data = this.data.slice(0, start) + substr + this.data.slice(end);
    this.changed = true;
  }
  /** Cast to string. */
  toString() {
    return `Source(${vlib.Color.object({ path: this.path.path })})`;
  }
}
class Plugin {
  /** Static id, every subclass must override this or a runtime error will be thrown. */
  static id;
  /** The id of the plugin, auto derived upon construction from the static attribute */
  id;
  /** The plugin type, on which files it will be processed. */
  type;
  /** Has `src` in type */
  has_src = false;
  /** Has `dist` in type */
  has_dist = false;
  /**
   * The templates & exact templates to insert into the source callback files.
   * Use _prefix names to avoid conflicts for derived plugins.
   */
  _templates;
  _exact_templates;
  /** The debug instance, later added when the plugin is executed. */
  debug = vlib.debug;
  /**
   * The callback to join this plugin with the same type of plugin
   * For instance when multiple UpsertRuntimeVars plugins are defined they can just as good be joined.
   * This can happen since some plugins use other plugins internally.
   * @todo the current implementation just forwards the callback when using another plugin internally so thats not supported yet.
   */
  /** Constructor. */
  constructor(opts) {
    this.type = Array.isArray(opts.type) ? new Set(opts.type) : opts.type;
    if (opts.callback)
      this.callback = opts.callback.bind(this);
    if (opts.init)
      this.init = opts.init.bind(this);
    this._templates = opts.templates;
    this._exact_templates = opts.exact_templates;
    this.has_src = Plugin.Type.has(this.type, "src");
    this.has_dist = Plugin.Type.has(this.type, "dist");
    const ctor = this.constructor;
    if (!("id" in ctor) || !(ctor.id instanceof Plugin.Id)) {
      throw new Error(`Plugin "${ctor.name}" did not define static attribute "static readonly id: Plugin.Id". Ensure this attribute is defined in the derived plugin class.`);
    }
    this.id = ctor.id;
  }
  /**
   * Log functions to log a (process) message for this source.
   * @note That we do not use the `debug` instance here.
   *       The plugin should use `if (this.debug.on(1)) source.log()` to log messages.
   */
  log(source, ...message) {
    log_helper(source.non_unique_id, void 0, this.id, ...message);
  }
  warn(source, ...message) {
    log_helper(source.non_unique_id, vlib.Color.yellow_bold("warning "), this.id, ...message);
  }
  error(source, ...message) {
    log_helper(source.non_unique_id, vlib.Color.red_bold("error "), this.id, ...message);
  }
  /**
   * Create a manual `on` function to detect used log levels.
   */
  on(level) {
    return level <= this.debug.level.n;
  }
  /** Cast to string. */
  toString() {
    return `${vlib.Color.cyan("vts")}${vlib.Color.gray(".")}${vlib.Color.cyan("Plugin")} ${vlib.Color.object({
      id: this.id.id,
      type: Array.isArray(this.type) ? Array.from(this.type).join(", ") : this.type,
      ...this._templates ? { templates: Object.keys(this._templates).join(", ") } : {},
      ...this._exact_templates ? { exact_templates: Object.keys(this._exact_templates).join(", ") } : {}
    })}`;
  }
}
(function(Plugin2) {
  let Type;
  (function(Type2) {
    Type2.has = (type, query) => Array.isArray(query) ? query.some((q) => Type2.has(type, q)) : type instanceof Set ? type.has(query) : type === query;
  })(Type = Plugin2.Type || (Plugin2.Type = {}));
  class Id extends String {
    id;
    /**
     * Also define a id attribute so we can do a universal `x.id` on both Plugin.Id and Plugin.
     */
    constructor(id) {
      if (!id) {
        throw new Error(`Plugin id cannot be empty.`);
      } else if (!/^[\w-_]+$/.test(id)) {
        throw new Error(`Plugin id "${id}" is invalid, must only contain alphanumeric characters, underscores and dashes.`);
      }
      super(id);
      this.id = id;
    }
    /** Get the string value of the plugin id. */
    value() {
      return this.id;
    }
    toString() {
      return this.id;
    }
  }
  Plugin2.Id = Id;
})(Plugin || (Plugin = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Plugin,
  Source,
  log_helper
});
