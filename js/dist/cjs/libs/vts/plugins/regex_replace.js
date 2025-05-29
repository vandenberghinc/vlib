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
  RegexReplace: () => RegexReplace
});
module.exports = __toCommonJS(stdin_exports);
var import_plugin = require("./plugin.js");
class RegexReplace extends import_plugin.Plugin {
  /** Set id. */
  static id = new import_plugin.Plugin.Id("vts-regex-replace");
  /** The list of regex replacements. */
  replacements;
  /**
   * Create a new instance of the regex replace plugin.
   * @param replacements  List of regex patterns and their replacements.
   */
  constructor({ replacements }) {
    super({ type: "dist" });
    this.replacements = replacements;
  }
  /** Process source files and apply replacements. */
  async callback(source) {
    if (this.debug.on(3))
      this.log(source, "Running regex replace plugin...");
    for (const i of this.replacements) {
      const matches = [...source.data.matchAll(i.pattern)];
      if (matches.length === 0) {
        if (this.debug.on(2))
          this.log(source, `Pattern ${i.pattern} not found.`);
        continue;
      }
      if (this.debug.on(1))
        this.log(source, `Replacing ${matches.length} occurrences of ${i.pattern}.`);
      source.data = source.data.replace(i.pattern, (...args) => {
        source.changed = true;
        const match_array = args.slice(0, -2);
        return typeof i.replacement === "function" ? i.replacement(match_array, source) : i.replacement;
      });
    }
    if (source.changed && this.on(1))
      this.log(source, "Source data updated with regex replacements.");
    else if (this.debug.on(2))
      this.log(source, "No replacements made.");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RegexReplace
});
