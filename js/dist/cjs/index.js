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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  debug: () => debug,
  error: () => error,
  info: () => info,
  log: () => log,
  warn: () => warn
});
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./cli/cli.js"), module.exports);
__reExport(stdin_exports, require("./cli/progress_loader.js"), module.exports);
__reExport(stdin_exports, require("./sockets/request.js"), module.exports);
__reExport(stdin_exports, require("./sockets/websocket.js"), module.exports);
__reExport(stdin_exports, require("./global/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./system/index.js"), module.exports);
__reExport(stdin_exports, require("./logging/index.js"), module.exports);
__reExport(stdin_exports, require("./scheme/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./jsonc/jsonc.js"), module.exports);
__reExport(stdin_exports, require("./utils.js"), module.exports);
var import_logger = require("./logging/logger.js");
const { log, debug, warn, error } = import_logger.logger.loggers();
const info = {
  // @ts-expect-error
  version: "1.5.38"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  debug,
  error,
  info,
  log,
  warn,
  ...require("./cli/cli.js"),
  ...require("./cli/progress_loader.js"),
  ...require("./sockets/request.js"),
  ...require("./sockets/websocket.js"),
  ...require("./global/index.uni.js"),
  ...require("./system/index.js"),
  ...require("./logging/index.js"),
  ...require("./scheme/index.uni.js"),
  ...require("./jsonc/jsonc.js"),
  ...require("./utils.js")
});
