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
  error: () => error,
  throw_error: () => throw_error
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
function error(...err) {
  let str = "";
  err.forEach((e) => {
    if (e.stack) {
      str += "\n" + e.stack;
    } else {
      str += e.toString();
    }
  });
  str = str.trim();
  if (str.startsWith("Error: ") || str.startsWith("error: ")) {
    str = str.substring(7).trim();
  }
  console.error(`${import_colors.Color.red("Error")}: ${str}`);
}
function throw_error(...err) {
  error(...err);
  process.exit(1);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  error,
  throw_error
});
