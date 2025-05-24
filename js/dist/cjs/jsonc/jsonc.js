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
  JSONC: () => JSONC,
  jsonc: () => JSONC
});
module.exports = __toCommonJS(stdin_exports);
var commentjson = __toESM(require("comment-json"));
var import_path = require("../system/path.js");
var JSONC;
(function(JSONC2) {
  function parse(file) {
    return commentjson.parse(file, void 0, true);
  }
  JSONC2.parse = parse;
  async function save(path, obj) {
    const p = new import_path.Path(path);
    if (!p.exists()) {
      throw new Error(`File "${path}" does not exist.`);
    }
    const file = await p.load({ type: "string" });
    await p.save(insert_into_file(file, obj));
  }
  JSONC2.save = save;
  function insert_into_file(file, obj) {
    const original_lines = file.split(/\r?\n/);
    const blank_indices = original_lines.map((line, idx) => ({ line, idx })).filter(({ line }) => line.trim() === "").map(({ idx }) => idx);
    const ast = commentjson.parse(file, void 0, false);
    function deep_merge(target, source) {
      for (const key of Object.keys(source)) {
        const srcVal = source[key];
        if (typeof srcVal === "object" && srcVal !== null && !Array.isArray(srcVal)) {
          if (typeof target[key] !== "object" || target[key] === null || Array.isArray(target[key])) {
            target[key] = {};
          }
          deep_merge(target[key], srcVal);
        } else {
          target[key] = srcVal;
        }
      }
      return target;
    }
    deep_merge(ast, obj);
    const result = commentjson.stringify(ast, null, 4);
    const result_lines = result.split(/\r?\n/);
    for (const idx of blank_indices) {
      if (idx <= result_lines.length) {
        result_lines.splice(idx, 0, "");
      }
    }
    return result_lines.join("\n");
  }
  JSONC2.insert_into_file = insert_into_file;
})(JSONC || (JSONC = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JSONC,
  jsonc
});
