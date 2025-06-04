var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./dirname.js"), module.exports);
__reExport(stdin_exports, require("./fill_templates.js"), module.exports);
__reExport(stdin_exports, require("./header.js"), module.exports);
__reExport(stdin_exports, require("./no_debug.js"), module.exports);
__reExport(stdin_exports, require("./plugin.js"), module.exports);
__reExport(stdin_exports, require("./plugins.js"), module.exports);
__reExport(stdin_exports, require("./regex_replace.js"), module.exports);
__reExport(stdin_exports, require("./upsert_runtime_vars.js"), module.exports);
__reExport(stdin_exports, require("./version.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./dirname.js"),
  ...require("./fill_templates.js"),
  ...require("./header.js"),
  ...require("./no_debug.js"),
  ...require("./plugin.js"),
  ...require("./plugins.js"),
  ...require("./regex_replace.js"),
  ...require("./upsert_runtime_vars.js"),
  ...require("./version.js")
});
