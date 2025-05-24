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
  dirname_plugin: () => dirname_plugin
});
module.exports = __toCommonJS(stdin_exports);
async function dirname_plugin(source_path, dist_path, tsconfig_path, tsconfig_dirname) {
  const data = await dist_path.load();
  const needs_insertion = /__(?:filename|dirname|ts_filename|ts_dirname|package_json)/.test(data);
  if (!needs_insertion || data.includes("vts-plugin: dirname@1.0.0")) {
    return;
  }
  await dist_path.save(`// vts-plugin: dirname@1.0.0
import { fileURLToPath as __fileURLToPath } from "url"; import __path_module from "path";const __filename = __fileURLToPath(import.meta.url);const __dirname = __path_module.dirname(__filename);const __ts_filename = ${JSON.stringify(source_path.str())};const __ts_dirname = __path_module.dirname(__ts_filename);const __tsconfig = ${tsconfig_path};const __tsconfig_dirname = ${tsconfig_dirname};

` + data);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  dirname_plugin
});
