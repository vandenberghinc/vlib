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
  Header: () => Header
});
module.exports = __toCommonJS(stdin_exports);
var vlib = __toESM(require("../../vlib/index.js"));
var import_plugin = require("./plugin.js");
class Header extends import_plugin.Plugin {
  /** Set id. */
  static id = new import_plugin.Plugin.Id("vts-header");
  /**
   * Header tags transformations.
   * Only accepts single line replacements.
   */
  transformations = [];
  /** The header regex. */
  header_regex = /^\/\*\*([\s\S]*?)(?!<\\)\*\//;
  /** Attributes. */
  current_year = (/* @__PURE__ */ new Date()).getFullYear();
  /** Whether to skip confirmation prompts. */
  yes;
  /** Create a new instance of the plugin. */
  constructor(args) {
    super({
      type: ["dist", "src"]
    });
    this.yes = args.yes === true;
    this.transformations = [
      [
        /@author\b[\s\S]*?$/g,
        `@author ${args.author}`
      ],
      [
        /@copyright\b[\s\S]*?$/g,
        `@copyright \xA9 ${args.start_year == null ? this.current_year : `${args.start_year} - ${this.current_year}`} ${args.author}. All rights reserved.`
      ]
    ];
  }
  async callback(source) {
    const match = source.data.match(this.header_regex);
    let header;
    let changed = false;
    if (match) {
      const match_start = match.index;
      if (match_start == null) {
        this.error(source, "Header match index is null, this should not happen.");
        return;
      }
      header = match[0];
      for (const [pattern, replacement] of this.transformations) {
        pattern.lastIndex = 0;
        const pattern_match = pattern.exec(header);
        if (pattern_match) {
          const start_idx = pattern_match.index;
          const end_idx = header.indexOf("\n", start_idx) === -1 ? header.length : header.indexOf("\n", start_idx);
          if (this.on(1))
            this.log(source, `Replacing header pattern ${pattern} with ${replacement}.`);
          changed = true;
          if (this.debug.on(2)) {
            this.log(source, `Header before replacement:
${header.split("\n").map((l) => `     | ${l}`).join("\n")}`);
          }
          header = vlib.String.replace_indices(header, replacement, start_idx, end_idx);
          if (this.debug.on(2)) {
            this.log(source, `Header after replacement:
${header.split("\n").map((l) => `     | ${l}`).join("\n")}`);
          }
        } else {
          if (this.on(1))
            this.log(source, `Inserting header pattern ${replacement}.`);
          changed = true;
          if (this.debug.on(2)) {
            this.log(source, `Header before insertion:
${header.split("\n").map((l) => `     | ${l}`).join("\n")}`);
          }
          const close_index = header.lastIndexOf("*/");
          if (close_index !== -1) {
            header = header.slice(0, close_index) + ` * ${replacement}
` + header.slice(close_index);
          }
          if (this.debug.on(2)) {
            this.log(source, `Header after insertion:
${header.split("\n").map((l) => `     | ${l}`).join("\n")}`);
          }
        }
      }
    } else {
      if (this.on(1))
        this.log(source, "Inserting header.");
      changed = true;
      header = "/**\n" + this.transformations.map(([_, replacement]) => ` * ${replacement}`).join("\n") + "\n */\n";
    }
    if (changed) {
      if (!header.endsWith("*/\n") && !header.endsWith("*/")) {
        header += "\n */";
      }
      if (!match) {
        source.data = header + source.data;
      } else {
        source.replace_indices(header, match.index, match.index + match[0].length);
      }
      source.changed = true;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Header
});
