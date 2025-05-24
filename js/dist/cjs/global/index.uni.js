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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
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
  Types: () => Types,
  types: () => types
});
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./array.js"), module.exports);
__reExport(stdin_exports, require("./date.js"), module.exports);
__reExport(stdin_exports, require("./number.js"), module.exports);
__reExport(stdin_exports, require("./object.js"), module.exports);
__reExport(stdin_exports, require("./string.js"), module.exports);
var Types = __toESM(require("./types.js"));
var types = __toESM(require("./types.js"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Types,
  types,
  ...require("./array.js"),
  ...require("./date.js"),
  ...require("./number.js"),
  ...require("./object.js"),
  ...require("./string.js")
});
