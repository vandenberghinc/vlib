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
  Logger: () => import_logger.Logger,
  logger: () => import_logger.logger
});
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./terminal_divider.js"), module.exports);
var import_logger = require("./logger.js");
__reExport(stdin_exports, require("../debugging/source_loc.js"), module.exports);
__reExport(stdin_exports, require("./loader.js"), module.exports);
__reExport(stdin_exports, require("../debugging/spinner.js"), module.exports);
__reExport(stdin_exports, require("./prompts.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logger,
  logger,
  ...require("./terminal_divider.js"),
  ...require("../debugging/source_loc.js"),
  ...require("./loader.js"),
  ...require("../debugging/spinner.js"),
  ...require("./prompts.js")
});
