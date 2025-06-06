/** vts-version */ const __version="1.6.20"; /** vts-version END */
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
  Code: () => Code,
  Debug: () => import_index_m_uni.Debug,
  Debugging: () => Debugging,
  Scheme: () => Scheme,
  code: () => code,
  debug: () => import_index_m_uni.debug,
  debugging: () => debugging,
  print: () => print,
  scheme: () => scheme,
  version: () => version
});
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./primitives/index.uni.js"), module.exports);
var Scheme = __toESM(require("./scheme/index.m.uni.js"));
var scheme = __toESM(require("./scheme/index.m.uni.js"));
__reExport(stdin_exports, require("./generic/index.web.js"), module.exports);
var Debugging = __toESM(require("./debugging/index.m.uni.js"));
var debugging = __toESM(require("./debugging/index.m.uni.js"));
var import_index_m_uni = require("./debugging/index.m.uni.js");
var import_index_m_uni2 = require("./debugging/index.m.uni.js");
__reExport(stdin_exports, require("./search/index.uni.js"), module.exports);
var Code = __toESM(require("./code/index.m.uni.js"));
var code = __toESM(require("./code/index.m.uni.js"));
__reExport(stdin_exports, require("./clipboard/index.web.js"), module.exports);
Error.stackTraceLimit = 25;
const print = (...args) => (0, import_index_m_uni2.debug)(0, ...args);
const version = __version;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Code,
  Debug,
  Debugging,
  Scheme,
  code,
  debug,
  debugging,
  print,
  scheme,
  version,
  ...require("./primitives/index.uni.js"),
  ...require("./generic/index.web.js"),
  ...require("./search/index.uni.js"),
  ...require("./clipboard/index.web.js")
});
