var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  NoDebug: () => NoDebug
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("../../vlib/index.js"));
var import_plugin = require("./plugin.js");
class NoDebug extends import_plugin.Plugin {
  /** Set id. */
  static id = new import_plugin.Plugin.Id("vts-no-debug");
  /** Create a new instance of the plugin. */
  constructor() {
    super({
      type: "dist"
    });
  }
  /** Callback. */
  callback(src) {
    const data = src.data;
    const edits = [];
    let match;
    const debug_call_re = /^\s*debug\s*\(/gm;
    while ((match = debug_call_re.exec(data)) !== null) {
      const match_start = match.index;
      const paren_index = match_start + match[0].lastIndexOf("(");
      const it = new vlib.code.Iterator({ data, offset: paren_index }, vlib.code.Iterator.opts.ts);
      while (it.avail()) {
        if (it.state.peek === ")" && it.state.depth.parenth === 1 && it.state.is_code) {
          let end_offset = it.state.nested_offset + it.state.offset + 1;
          if (data[end_offset] === ";") {
            end_offset++;
          }
          debug_call_re.lastIndex = end_offset;
          edits.push({ start: match_start, end: end_offset });
          break;
        }
        it.advance();
      }
    }
    if (edits.length === 0) {
      return;
    }
    const parts = [];
    let last_index = 0;
    for (const { start, end } of edits) {
      parts.push(data.slice(last_index, start));
      const snippet = data.slice(start, end);
      const commented = snippet.split("\n").map((line) => "//" + line).join("\n");
      parts.push(commented);
      last_index = end;
    }
    parts.push(data.slice(last_index));
    src.data = parts.join("");
    src.changed = true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NoDebug
});
