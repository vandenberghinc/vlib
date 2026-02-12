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
  Entry: () => Entry
});
module.exports = __toCommonJS(stdin_exports);
var Entry;
(function(Entry2) {
  const types_set = /* @__PURE__ */ new Set([
    "any",
    "undefined",
    "null",
    "boolean",
    "number",
    "bigint",
    "string",
    "array",
    "object"
  ]);
  let Type;
  (function(Type2) {
    let Castable;
    (function(Castable2) {
      Castable2.is = (type) => typeof type === "string" && types_set.has(type) || typeof type === "function" || Array.isArray(type) && type.every(Castable2.is);
      Castable2.is_fast = (type) => typeof type === "string" && types_set.has(type) || typeof type === "function" || Array.isArray(type);
    })(Castable = Type2.Castable || (Type2.Castable = {}));
  })(Type = Entry2.Type || (Entry2.Type = {}));
})(Entry || (Entry = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Entry
});
