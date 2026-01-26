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
  compute_diff: () => compute_diff
});
module.exports = __toCommonJS(stdin_exports);
var import_diff = require("diff");
var import_vlib = require("../../vlib/index.js");
function compute_diff({ new: new_data, old, prefix = "", trim = true, trim_keep = 3 }) {
  if (typeof prefix === "number") {
    prefix = " ".repeat(prefix);
  }
  if (old === new_data) {
    return { status: "identical" };
  }
  const diffs = (0, import_diff.diffLines)(old, new_data).reduce((acc, part) => {
    if (!part.added && !part.removed) {
      const prev = acc[acc.length - 1];
      if (prev && !prev.added && !prev.removed) {
        prev.value += part.value;
        return acc;
      }
    }
    if (part.value !== "")
      acc.push(part);
    return acc;
  }, []);
  const diff_lines = diffs.map((part) => part.value.split(/\r?\n/));
  const old_total = old.split(/\r?\n/).length - (old.endsWith("\n") || old.endsWith("\r\n") ? 1 : 0);
  const new_total = new_data.split(/\r?\n/).length - (new_data.endsWith("\n") || new_data.endsWith("\r\n") ? 1 : 0);
  const max_line_nr_length = String(Math.max(old_total, new_total, 1)).length;
  const whitespace_prefix = " ".repeat(prefix.length > 1 ? prefix.length - 1 : 0);
  const plus_str = import_vlib.Color.green_bold("+");
  const minus_str = import_vlib.Color.red_bold("-");
  const dumped_lines = [];
  let old_nr = 0;
  let new_nr = 0;
  for (let part_index = 0; part_index < diffs.length; ++part_index) {
    const part = diffs[part_index];
    const line_prefix = part.added ? plus_str : part.removed ? minus_str : " ";
    let last_dots = false;
    const lines = diff_lines[part_index];
    for (let line_index = 0; line_index < lines.length; ++line_index) {
      const line = lines[line_index];
      if (line_index === lines.length - 1 && line === "")
        continue;
      if (part.added) {
        ++new_nr;
      } else if (part.removed) {
        ++old_nr;
      } else {
        ++old_nr;
        ++new_nr;
      }
      if (trim && !part.added && !part.removed && !(line_index < trim_keep || line_index >= lines.length - trim_keep)) {
        if (!last_dots && (line_index === trim_keep || line_index === lines.length - trim_keep - 1)) {
          dumped_lines.push(`${whitespace_prefix} ${"".padEnd(max_line_nr_length, " ")} | ${line_prefix} ${import_vlib.Color.italic("... unchanged ...")}`);
          last_dots = true;
        }
        continue;
      }
      const display_nr = part.removed ? old_nr : new_nr;
      dumped_lines.push(`${whitespace_prefix} ${String(display_nr).padEnd(max_line_nr_length, " ")} | ${line_prefix} ${line}`);
      last_dots = false;
    }
  }
  return { status: "diff", changes: diffs, diff: dumped_lines.join("\n") };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  compute_diff
});
