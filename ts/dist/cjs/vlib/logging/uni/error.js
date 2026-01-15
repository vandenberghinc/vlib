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
  format_error: () => format_error
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../../generic/colors.js");
var import_object = require("../../primitives/object.js");
function format_error(err, options) {
  const max_depth = options?.depth ?? 5;
  const current_depth = options?.current_depth ?? 0;
  const indent_size = options?.indent ?? 2;
  const start_indent = (options?.start_indent ?? 0) * indent_size + current_depth * indent_size;
  const attrs_indent = " ".repeat(start_indent + indent_size);
  const colored = options?.colored ?? false;
  let data = err.stack ?? `${err.name}: ${err.message}`;
  data = data.split("\n").map((line, index2) => {
    if (index2 === 0)
      return line;
    line = line.trimStart();
    if (colored && line.startsWith("at ")) {
      line = import_colors.Colors.gray + line + import_colors.Colors.end;
    }
    return attrs_indent + line;
  }).join("\n");
  if (colored) {
    if (options?.type === "warning") {
      data = data.replaceAll(/^Error: /gm, `${import_colors.Color.yellow("Error")}: `);
    } else {
      data = data.replaceAll(/^Error: /gm, `${import_colors.Color.red("Error")}: `);
    }
  }
  let keys = Object.keys(err);
  if (err.cause != null)
    keys.push("cause");
  let index = -1;
  for (const key of keys) {
    ++index;
    if (key === "name" || key === "message" || key === "stack" || key === "cause" && index < keys.length - 1) {
      continue;
    }
    const raw_value = err[key];
    let value;
    if (raw_value instanceof Error) {
      if (current_depth + 1 >= max_depth) {
        value = "[Truncated Error]";
      } else {
        value = format_error(raw_value, {
          colored,
          depth: max_depth,
          current_depth: current_depth + 1,
          indent: indent_size,
          type: options?.type,
          start_indent: options?.start_indent
        });
      }
    } else {
      value = import_object.ObjectUtils.stringify(raw_value, {
        indent: indent_size,
        start_indent: current_depth + 1,
        max_depth: max_depth === -1 ? void 0 : max_depth,
        max_length: 1e4,
        json: false,
        colored
      });
    }
    data += `
${attrs_indent}${key}: ${value}`;
  }
  ;
  return data;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  format_error
});
