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
  Logging: () => Logging,
  SourceLoc: () => import_source_loc.SourceLoc,
  logging: () => Logging
});
module.exports = __toCommonJS(stdin_exports);
var _logger = __toESM(require("./logger.js"));
var _terminal_divider = __toESM(require("./terminal_divider.js"));
var _source_loc = __toESM(require("./source_loc.js"));
var _loader = __toESM(require("./loader.js"));
var _spinner = __toESM(require("./spinner.js"));
__reExport(stdin_exports, require("./logger.js"), module.exports);
var import_source_loc = require("./source_loc.js");
var Logging;
(function(Logging2) {
  Logging2.terminal_divider = _terminal_divider.terminal_divider;
  Logging2.Logger = _logger.Logger;
  Logging2.logger = _logger.logger;
  Logging2.SourceLoc = _source_loc.SourceLoc;
  Logging2.Loader = _loader.Loader;
  Logging2.Spinner = _spinner.Spinner;
})(Logging || (Logging = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logging,
  SourceLoc,
  logging,
  ...require("./logger.js")
});
