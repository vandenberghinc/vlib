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
  Clipboard: () => Clipboard,
  clipboard: () => Clipboard
});
module.exports = __toCommonJS(stdin_exports);
class Clipboard {
  /**
   * Copy data to the system clipboard (browser).
   */
  static async set(data) {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API not supported in this browser");
    }
    await navigator.clipboard.writeText(text);
  }
  /**
   * Read data from the system clipboard (browser).
   */
  static async get(opts) {
    if (!navigator.clipboard?.readText) {
      throw new Error("Clipboard API not supported in this browser");
    }
    const text = await navigator.clipboard.readText();
    if (opts?.json) {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Failed to parse clipboard content as JSON");
      }
    }
    return text;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Clipboard,
  clipboard
});
