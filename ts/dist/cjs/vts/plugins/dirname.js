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
  Dirname: () => Dirname
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../../vlib/index.js");
var import_plugin = require("./plugin.js");
var import_upsert_runtime_vars = require("./upsert_runtime_vars.js");
class Dirname extends import_plugin.Plugin {
  /** Set id. */
  static id = new import_plugin.Plugin.Id("vts-dirname");
  /** Create a new instance of the plugin. */
  constructor({ pkg_json, tsconfig }) {
    super({
      type: "dist"
    });
    const pkg_p = !pkg_json ? void 0 : pkg_json instanceof import_vlib.Path ? pkg_json : new import_vlib.Path(pkg_json);
    const tsconfig_p = tsconfig instanceof import_vlib.Path ? tsconfig : new import_vlib.Path(tsconfig);
    const upsert = new import_upsert_runtime_vars.UpsertRuntimeVars({
      identifier: Dirname.id,
      vars: [
        ["__filename", "__dirname", "__ts_filename", "__ts_dirname", "__tsconfig", "__tsconfig_dirname", "__package_json"],
        (source) => ({
          __filename: "__fileURLToPath(import.meta.url);",
          __dirname: "__path_module.dirname(__filename);",
          __ts_filename: `"${source.safe_ts_src.path}"`,
          __ts_dirname: source.safe_ts_src.base()?.quote("undefined") ?? "undefined",
          __tsconfig: tsconfig_p.quote(),
          __tsconfig_dirname: tsconfig_p.base()?.quote("undefined") ?? "undefined",
          __package_json: pkg_p?.quote("undefined") ?? "undefined"
        })
      ],
      code: {
        before: `import {fileURLToPath as __fileURLToPath} from "url";import __path_module from "path";`
      }
    });
    this.callback = (src) => upsert.callback(src);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dirname
});
