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
  Number: () => NumberUtils,
  number: () => NumberUtils
});
module.exports = __toCommonJS(stdin_exports);
var NumberUtils;
(function(NumberUtils2) {
  function random(x, y) {
    if (typeof x !== "number" || typeof y !== "number" || x >= y) {
      throw new Error("Invalid input. x and y must be numbers, and x should be less than y.");
    }
    return Math.floor(Math.random() * (y - x + 1)) + x;
  }
  NumberUtils2.random = random;
  function round(value, decimals = 0) {
    if (!Number.isFinite(value))
      return value;
    if (!Number.isFinite(decimals) || decimals === 0) {
      return value === 0 ? 0 : value > 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
    }
    const factor = Math.pow(10, decimals);
    const shifted = value * factor;
    const rounded = shifted === 0 ? 0 : shifted > 0 ? Math.floor(shifted + 0.5) : Math.ceil(shifted - 0.5);
    return rounded / factor;
  }
  NumberUtils2.round = round;
})(NumberUtils || (NumberUtils = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Number,
  number
});
