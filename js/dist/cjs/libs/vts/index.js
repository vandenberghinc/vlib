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
__reExport(stdin_exports, require("./bundle.js"), module.exports);
__reExport(stdin_exports, require("./cjs.js"), module.exports);
__reExport(stdin_exports, require("./css.js"), module.exports);
__reExport(stdin_exports, require("./plugins/plugin.js"), module.exports);
__reExport(stdin_exports, require("./plugins/dirname.js"), module.exports);
__reExport(stdin_exports, require("./plugins/header.js"), module.exports);
__reExport(stdin_exports, require("./plugins/no_debug.js"), module.exports);
__reExport(stdin_exports, require("./plugins/fill_templates.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./bundle.js"),
  ...require("./cjs.js"),
  ...require("./css.js"),
  ...require("./plugins/plugin.js"),
  ...require("./plugins/dirname.js"),
  ...require("./plugins/header.js"),
  ...require("./plugins/no_debug.js"),
  ...require("./plugins/fill_templates.js")
});
