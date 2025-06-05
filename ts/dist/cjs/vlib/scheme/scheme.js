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
  Scheme: () => Scheme
});
module.exports = __toCommonJS(stdin_exports);
var import_entry = require("./entry.js");
class Scheme extends Map {
  /** Initialize a scheme object. */
  constructor(scheme, parent, parent_key) {
    super(Object.entries(scheme).map(([key, value]) => [key, value instanceof import_entry.Entry ? value : new import_entry.Entry(value)]));
    if (parent != null && parent_key != null) {
      parent[parent_key] = this;
    }
  }
  /**
   * A map of aliases. Is initialized be initialized on demand.
   */
  get aliases() {
    if (this._aliases == null) {
      this._aliases = /* @__PURE__ */ new Map();
      for (const entry of this.values()) {
        if (typeof entry === "object" && entry.alias?.length) {
          for (let i = 0; i < entry.alias.length; i++) {
            this._aliases.set(entry.alias[i], entry);
          }
        }
      }
    }
    return this._aliases;
  }
  _aliases;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Scheme
});
