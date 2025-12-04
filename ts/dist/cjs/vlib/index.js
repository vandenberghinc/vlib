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
  CLI: () => CLI,
  Code: () => Code,
  Crypto: () => Crypto,
  Debug: () => import_index_m_node.Debug,
  Logger: () => import_index_m_node.Logger,
  Logging: () => Logging,
  Schema: () => Schema,
  cli: () => cli,
  code: () => code,
  crypto: () => crypto,
  debug: () => import_index_m_node.debug,
  error: () => error,
  log: () => import_index_m_node.log,
  logging: () => logging,
  print: () => print,
  schema: () => schema,
  version: () => version,
  warn: () => warn,
  warning: () => warning
});
module.exports = __toCommonJS(stdin_exports);
var CLI = __toESM(require("./cli/index.m.js"));
var cli = __toESM(require("./cli/index.m.js"));
__reExport(stdin_exports, require("./sockets/request.js"), module.exports);
__reExport(stdin_exports, require("./sockets/websocket.deprecated.js"), module.exports);
__reExport(stdin_exports, require("./primitives/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./generic/index.js"), module.exports);
var Logging = __toESM(require("./logging/index.m.node.js"));
var logging = __toESM(require("./logging/index.m.node.js"));
var import_index_m_node = require("./logging/index.m.node.js");
var import_index_m_node2 = require("./logging/index.m.node.js");
var Schema = __toESM(require("./schema/index.m.node.js"));
var schema = __toESM(require("./schema/index.m.node.js"));
__reExport(stdin_exports, require("./jsonc/jsonc.js"), module.exports);
var Crypto = __toESM(require("./crypto/index.m.js"));
var crypto = __toESM(require("./crypto/index.m.js"));
__reExport(stdin_exports, require("./search/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./generic/utils.js"), module.exports);
var Code = __toESM(require("./code/index.m.uni.js"));
var code = __toESM(require("./code/index.m.uni.js"));
__reExport(stdin_exports, require("./clipboard/index.js"), module.exports);
__reExport(stdin_exports, require("./generic/zip.js"), module.exports);
Error.stackTraceLimit = 25;
const version = "1.6.33";
const print = (...args) => import_index_m_node2.log.raw(0, ...args);
const error = (...args) => import_index_m_node2.log.error(...args);
const warn = (arg, ...args) => import_index_m_node2.log.warn(arg, ...args);
const warning = warn;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLI,
  Code,
  Crypto,
  Debug,
  Logger,
  Logging,
  Schema,
  cli,
  code,
  crypto,
  debug,
  error,
  log,
  logging,
  print,
  schema,
  version,
  warn,
  warning,
  ...require("./sockets/request.js"),
  ...require("./sockets/websocket.deprecated.js"),
  ...require("./primitives/index.uni.js"),
  ...require("./generic/index.js"),
  ...require("./jsonc/jsonc.js"),
  ...require("./search/index.uni.js"),
  ...require("./generic/utils.js"),
  ...require("./clipboard/index.js"),
  ...require("./generic/zip.js")
});
