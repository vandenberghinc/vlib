var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  RuntimeVarsOpts: () => RuntimeVarsOpts,
  UpsertRuntimeVars: () => UpsertRuntimeVars
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../../vlib/index.js");
var import_plugin = require("./plugin.js");
var RuntimeVarsOpts;
(function(RuntimeVarsOpts2) {
  function is(obj) {
    return obj != null && Array.isArray(obj.keys) && (typeof obj.vars === "function" || typeof obj.vars === "object");
  }
  RuntimeVarsOpts2.is = is;
})(RuntimeVarsOpts || (RuntimeVarsOpts = {}));
class UpsertRuntimeVars extends import_plugin.Plugin {
  /** Set id. */
  static id = new import_plugin.Plugin.Id("vts-upsert-runtime-vars");
  /** Attributes. */
  identifier;
  var_opts;
  code;
  insert_pattern;
  needs_insertion_pattern;
  /** Create a new instance of the plugin. */
  constructor({ identifier, vars, code = {} }) {
    super({
      type: "dist"
    });
    this.identifier = typeof identifier === "string" ? identifier : identifier.id;
    this.var_opts = RuntimeVarsOpts.is(vars) ? vars : Array.isArray(vars) ? { keys: vars[0], vars: vars[1] } : { keys: Object.keys(vars), vars };
    this.insert_pattern = new RegExp(`/\\*\\* ${this.identifier} \\*/.*?/\\*\\* ${this.identifier} END \\*/[\r
]*`, "g");
    this.needs_insertion_pattern = new RegExp(`(${this.var_opts.keys.map((key) => key.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})`, "");
    this.code = {
      before: code.before ? code.before + ";" : "",
      after: code.after ? code.after + ";" : ""
    };
  }
  /** Process source callback. */
  async callback(source) {
    if (this.debug.on(2))
      this.log(source, "Running plugin...");
    if (!this.needs_insertion_pattern.test(source.data)) {
      if (this.debug.on(2))
        this.log(source, `No need to insert runtime vars, pattern not found in source data.`);
      return;
    }
    let vars = {};
    if (typeof this.var_opts.vars === "function") {
      const res = this.var_opts.vars(source);
      if (res instanceof Promise) {
        vars = await res;
      } else {
        vars = res;
      }
    } else if (typeof this.var_opts.vars === "object" && this.var_opts.vars !== null) {
      vars = this.var_opts.vars;
    } else {
      throw new Error("Invalid vars type, expected object or function returning object.");
    }
    const var_entries = Object.entries(vars).map(([key, value]) => [key, value instanceof import_vlib.Path ? value.quote().path : JSON.stringify(value)]);
    const insert = `/** ${this.identifier} */ ` + this.code.before + var_entries.map(([name, value]) => `const ${name}=${value};`).join("") + this.code.after + ` /** ${this.identifier} END */
`;
    const match = this.insert_pattern.exec(source.data);
    if (this.on(2))
      this.log(source, `Found match: ${match != null}`);
    if (match) {
      if (match[0] === insert) {
        if (this.on(2))
          this.log(source, `Insert pattern already exists in source data, no changes made.`);
        return;
      }
      if (this.on(1))
        this.log(source, `Replacing existing insert pattern in source data.`);
      source.data = source.data.replace(this.insert_pattern, insert);
    } else {
      if (this.on(1))
        this.log(source, `Inserting new insert pattern in source data.`);
      source.data = insert + source.data;
    }
    source.changed = true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RuntimeVarsOpts,
  UpsertRuntimeVars
});
