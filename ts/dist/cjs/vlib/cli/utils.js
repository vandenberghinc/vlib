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
  find_config_path: () => find_config_path
});
module.exports = __toCommonJS(stdin_exports);
var import_path = require("../generic/path.js");
function find_config_path({ name, extension = "", cwd = process.cwd(), up = 1 }) {
  const paths = [];
  if (typeof name === "string")
    name = [name];
  if (!extension)
    extension = [""];
  else if (typeof extension === "string")
    extension = [extension];
  for (const n of name) {
    for (const e of extension) {
      paths.push(new import_path.Path(`${cwd}/${n}${e}`));
    }
  }
  let up_str = "";
  for (let i = 0; i < up; i++) {
    up_str += "../";
    for (const n of name) {
      for (const e of extension) {
        paths.push(new import_path.Path(`${cwd}/${up_str}/${n}${e}`));
      }
    }
  }
  ;
  return paths.find((p) => p.exists() && p.is_file());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  find_config_path
});
