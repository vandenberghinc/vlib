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
  bundle: () => import_bundle.bundle
});
module.exports = __toCommonJS(stdin_exports);
var import_bundle = require("./bundle/bundle.js");
__reExport(stdin_exports, require("./bundle/inspect.js"), module.exports);
__reExport(stdin_exports, require("./utils/cjs.js"), module.exports);
__reExport(stdin_exports, require("./utils/css.js"), module.exports);
__reExport(stdin_exports, require("./utils/parse_imports.js"), module.exports);
__reExport(stdin_exports, require("./utils/compute_diff.js"), module.exports);
__reExport(stdin_exports, require("./transformer/transformer.js"), module.exports);
__reExport(stdin_exports, require("./plugins/dirname.js"), module.exports);
__reExport(stdin_exports, require("./plugins/header.js"), module.exports);
__reExport(stdin_exports, require("./plugins/no_debug.js"), module.exports);
__reExport(stdin_exports, require("./plugins/fill_templates.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bundle,
  ...require("./bundle/inspect.js"),
  ...require("./utils/cjs.js"),
  ...require("./utils/css.js"),
  ...require("./utils/parse_imports.js"),
  ...require("./utils/compute_diff.js"),
  ...require("./transformer/transformer.js"),
  ...require("./plugins/dirname.js"),
  ...require("./plugins/header.js"),
  ...require("./plugins/no_debug.js"),
  ...require("./plugins/fill_templates.js")
});
