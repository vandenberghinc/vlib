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
  info: () => info
});
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./global/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./scheme/index.uni.js"), module.exports);
__reExport(stdin_exports, require("./system/index.web.js"), module.exports);
__reExport(stdin_exports, require("./logging/index.web.js"), module.exports);
const info = {
  // @ts-expect-error
  version: __version
  // libpath: __filename,
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  info,
  ...require("./global/index.uni.js"),
  ...require("./scheme/index.uni.js"),
  ...require("./system/index.web.js"),
  ...require("./logging/index.web.js")
});
