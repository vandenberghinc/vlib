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
__reExport(stdin_exports, require("../errors/throw.js"), module.exports);
__reExport(stdin_exports, require("./path.js"), module.exports);
__reExport(stdin_exports, require("./cache.js"), module.exports);
__reExport(stdin_exports, require("./colors.js"), module.exports);
__reExport(stdin_exports, require("./env.js"), module.exports);
__reExport(stdin_exports, require("./daemon.js"), module.exports);
__reExport(stdin_exports, require("./mutex.js"), module.exports);
__reExport(stdin_exports, require("./network.js"), module.exports);
__reExport(stdin_exports, require("./performance.js"), module.exports);
__reExport(stdin_exports, require("./process.js"), module.exports);
__reExport(stdin_exports, require("./system/node.js"), module.exports);
__reExport(stdin_exports, require("./time_limiter.js"), module.exports);
__reExport(stdin_exports, require("./glob_pattern.js"), module.exports);
__reExport(stdin_exports, require("./events.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("../errors/throw.js"),
  ...require("./path.js"),
  ...require("./cache.js"),
  ...require("./colors.js"),
  ...require("./env.js"),
  ...require("./daemon.js"),
  ...require("./mutex.js"),
  ...require("./network.js"),
  ...require("./performance.js"),
  ...require("./process.js"),
  ...require("./system/node.js"),
  ...require("./time_limiter.js"),
  ...require("./glob_pattern.js"),
  ...require("./events.js")
});
