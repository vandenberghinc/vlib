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
  FillTemplates: () => FillTemplates
});
module.exports = __toCommonJS(stdin_exports);
var import_plugin = require("./plugin.js");
class FillTemplates extends import_plugin.Plugin {
  /** Set id. */
  static id = new import_plugin.Plugin.Id("vts-fill-templates");
  /** Number of templates. */
  template_count;
  /** Replacement pattern. */
  pattern;
  /** Template values. */
  templates_map;
  /** Quote flag. */
  quote_values;
  /** Create a new instance of the plugin. */
  constructor({ templates, prefix = "", suffix = "", quote = false }) {
    super({ type: "dist" });
    const escape_regexp = (str) => str.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    const keys = Object.keys(templates);
    this.template_count = keys.length;
    this.templates_map = templates;
    this.quote_values = quote;
    let pattern_str;
    const escaped_prefix = escape_regexp(prefix);
    const escaped_suffix = escape_regexp(suffix);
    const joined_keys = keys.map(escape_regexp).join("|");
    if (!prefix && !suffix) {
      pattern_str = `\\b(${joined_keys})\\b`;
    } else if (prefix && suffix) {
      pattern_str = `${escaped_prefix}(${joined_keys})${escaped_suffix}`;
    } else if (prefix) {
      pattern_str = `${escaped_prefix}(${joined_keys})\\b`;
    } else {
      pattern_str = `\\b(${joined_keys})${escaped_suffix}`;
    }
    this.pattern = new RegExp(pattern_str, "g");
  }
  /** Plugin callback to replace templates. */
  callback(source) {
    if (this.template_count === 0)
      return;
    let changed = false;
    const templates = this.templates_map;
    const quote = this.quote_values;
    const out = source.data.replace(this.pattern, (_match, key) => {
      const value = templates[key];
      if (value === void 0)
        return _match;
      changed = true;
      const text = String(value);
      return quote ? `"${text}"` : text;
    });
    if (changed) {
      source.data = out;
      source.changed = true;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FillTemplates
});
