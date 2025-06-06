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
  Version: () => Version
});
module.exports = __toCommonJS(stdin_exports);
var import_plugin = require("./plugin.js");
var import_upsert_runtime_vars = require("./upsert_runtime_vars.js");
var import_pkg_json = require("../utils/pkg_json.js");
class Version extends import_plugin.Plugin {
  /** Set id. @todo testing no id runtime error */
  static id = new import_plugin.Plugin.Id("vts-version");
  /** Create a new instance of the plugin. */
  constructor({ pkg_json, version }) {
    super({
      type: "dist"
    });
    if (!version && !pkg_json) {
      throw new Error("Either `version` or `pkg_json` must be provided to the Version plugin.");
    }
    const upsert = new import_upsert_runtime_vars.UpsertRuntimeVars({
      identifier: Version.id,
      vars: { __version: version ? version : (0, import_pkg_json.load_pkg_json)(pkg_json, { version: true }).version }
    });
    this.callback = (src) => upsert.callback(src);
    this.plugins.push(upsert);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Version
});
