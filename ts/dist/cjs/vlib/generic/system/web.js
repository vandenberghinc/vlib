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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  System: () => System
});
module.exports = __toCommonJS(stdin_exports);
var System;
(function(System2) {
  function format_bytes(bytes) {
    if (typeof bytes === "string") {
      bytes = Buffer.byteLength(bytes, "utf-8");
    }
    if (bytes > 1024 * 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
    } else if (bytes > 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    } else if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    } else if (bytes > 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    }
    return `${Math.floor(bytes)}B`;
  }
  System2.format_bytes = format_bytes;
})(System || (System = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  System
});
