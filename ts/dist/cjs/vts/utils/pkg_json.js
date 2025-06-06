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
  load_pkg_json: () => load_pkg_json,
  resolve_pkg_json: () => resolve_pkg_json
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../../vlib/index.js");
function load_pkg_json(path, opts) {
  if (typeof path === "string") {
    path = new import_vlib.Path(path);
  }
  if (!path.exists()) {
    if (opts?.throw === false) {
      return void 0;
    }
    throw new Error(`Package.json "${path.str()}" does not exist.`);
  }
  const pkg_data = path.load_sync({ type: "object" });
  if (opts?.version && !pkg_data.version) {
    if (opts?.throw === false) {
      return void 0;
    }
    throw new Error(`Package.json "${path.str()}" does not contain a version.`);
  }
  return pkg_data;
}
function resolve_pkg_json(path, opts) {
  if (typeof path === "string") {
    path = new import_vlib.Path(path);
  }
  if (path.full_name() === "package.json") {
    return path;
  }
  let base = path;
  while ((base = base?.base()) && !base.join("package.json").exists()) {
  }
  const pkg_json = base?.join("package.json");
  if (!pkg_json || !pkg_json.exists()) {
    if (opts?.throw === false) {
      return void 0;
    }
    throw new Error(`No package.json file found in path "${path.str()}".`);
  }
  return pkg_json;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  load_pkg_json,
  resolve_pkg_json
});
