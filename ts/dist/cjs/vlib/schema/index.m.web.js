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
  Entry: () => import_entry.Entry,
  InvalidUsageError: () => import_validate.InvalidUsageError,
  ValidateError: () => import_validate.ValidateError,
  Validator: () => import_validate.Validator,
  validate: () => import_validate.validate
});
module.exports = __toCommonJS(stdin_exports);
var import_entry = require("./infer/entry.js");
__reExport(stdin_exports, require("./validate/cast.js"), module.exports);
__reExport(stdin_exports, require("./validate/throw.js"), module.exports);
var import_validate = require("./validate/validate.js");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Entry,
  InvalidUsageError,
  ValidateError,
  Validator,
  validate,
  ...require("./validate/cast.js"),
  ...require("./validate/throw.js")
});
