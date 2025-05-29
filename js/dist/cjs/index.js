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
  Logging: () => Logging,
  code: () => code,
  debug: () => import_index_m_uni.debug,
  debugging: () => debugging,
  error: () => error,
  log: () => log,
  logger: () => import_logger.logger,
  logging: () => logging,
  print: () => print,
  version: () => version,
  warn: () => warn
});
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./cli/index.js"), module.exports);
__reExport(stdin_exports, require("./sockets/request.js"), module.exports);
__reExport(stdin_exports, require("./sockets/websocket.js"), module.exports);
__reExport(stdin_exports, require("./global/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./system/index.js"), module.exports);
var Debugging = __toESM(require("./debugging/index.m.uni.js"));
var debugging = __toESM(require("./debugging/index.m.uni.js"));
var import_index_m_uni = require("./debugging/index.m.uni.js");
var import_index_m_uni2 = require("./debugging/index.m.uni.js");
var Logging = __toESM(require("./logging/index.m.js"));
var logging = __toESM(require("./logging/index.m.js"));
var import_logger = require("./logging/logger.js");
__reExport(stdin_exports, require("./scheme/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./jsonc/jsonc.js"), module.exports);
__reExport(stdin_exports, require("./crypto/index.js"), module.exports);
__reExport(stdin_exports, require("./search/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./utils.js"), module.exports);
var Code = __toESM(require("./code/index.m.uni.js"));
var code = __toESM(require("./code/index.m.uni.js"));
__reExport(stdin_exports, require("./clipboard/index.js"), module.exports);
const print = (...args) => (0, import_index_m_uni2.debug)(0, ...args);
const {
  log,
  /*debug,*/
  warn,
  error
} = import_logger.logger;
const version = "1.5.38";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Code,
  Debug,
  Debugging,
  Logging,
  code,
  debug,
  debugging,
  error,
  log,
  logger,
  logging,
  print,
  version,
  warn,
  ...require("./cli/index.js"),
  ...require("./sockets/request.js"),
  ...require("./sockets/websocket.js"),
  ...require("./global/index.uni.js"),
  ...require("./system/index.js"),
  ...require("./scheme/index.uni.js"),
  ...require("./jsonc/jsonc.js"),
  ...require("./crypto/index.js"),
  ...require("./search/index.uni.js"),
  ...require("./utils.js"),
  ...require("./clipboard/index.js")
});
