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
  Plugin: () => Plugin
});
module.exports = __toCommonJS(stdin_exports);
var import_glob = require("glob");
var import_path = __toESM(require("path"));
var vlib = __toESM(require("../../../index.js"));
var import_no_debug = require("./no_debug.js");
var import_header = require("./header.js");
var import_dirname = require("./dirname.js");
var import_fill_templates = require("./fill_templates.js");
class Plugin {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Run the plugin.
   */
  async run() {
    const tsconfig_path = new vlib.Path(this.config.tsconfig);
    if (!tsconfig_path.exists()) {
      throw new Error(`Typescript config file "${tsconfig_path}" does not exist.`);
    }
    const tsconfig = tsconfig_path.load_sync({ type: "object" });
    const include_patterns = tsconfig.include ?? [];
    const exclude_patterns = tsconfig.exclude ?? [];
    const tsconfig_dir = tsconfig_path.base()?.str() ?? "";
    const matched_files = include_patterns.flatMap((pattern) => (0, import_glob.sync)(pattern, { cwd: tsconfig_dir, absolute: true, ignore: exclude_patterns }));
    let pkg_version;
    if (this.config.version?.package) {
      const pkg_path = new vlib.Path(this.config.version?.package);
      if (!pkg_path.exists()) {
        throw new Error(`Package.json "${pkg_path.str()}" does not exist.`);
      }
      const pkg_data = pkg_path.load_sync({ type: "object" });
      if (!pkg_data.version) {
        throw new Error(`Package.json "${pkg_path.str()}" does not contain a version.`);
      }
      pkg_version = pkg_data.version;
    }
    const promises = [];
    for (const file_path of matched_files) {
      const source_path = new vlib.Path(file_path);
      let dist_path = null;
      if (tsconfig.compilerOptions?.outDir) {
        const relative_path = import_path.default.relative(tsconfig_dir, file_path);
        const js_relative_path = relative_path.replace(/\.[tj]s$/, ".js");
        const dist_file_path = import_path.default.join(tsconfig_dir, tsconfig.compilerOptions.outDir, js_relative_path);
        dist_path = new vlib.Path(dist_file_path);
      }
      if (this.config.dirname && dist_path) {
        promises.push((0, import_dirname.dirname_plugin)(source_path, dist_path, tsconfig_path.str(), tsconfig_dir));
      }
      if (this.config.header?.author) {
        promises.push((0, import_header.header_plugin)(source_path, this.config.header.author, this.config.header.start_year));
      }
      if (this.config.no_debug && dist_path) {
        promises.push((0, import_no_debug.no_debug_plugin)(dist_path));
      }
      if (pkg_version && dist_path) {
        (0, import_fill_templates.fill_version)(dist_path, void 0, false, pkg_version);
      }
      if (this.config.templates && dist_path) {
        (0, import_fill_templates.fill_templates)(dist_path, this.config.templates, false);
      }
    }
    await Promise.all(promises);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Plugin
});
