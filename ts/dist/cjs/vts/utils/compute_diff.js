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
    if (part.value !== "") {
      acc.push(part);
    }
    return acc;
  }, []);
  let line_count = 0;
  const diff_lines = diffs.map((part) => {
    const s = part.value.split("\n");
    line_count += s.length - 1;
    return s;
  });
  const max_line_nr_length = String(line_count).length;
  const whitespace_prefix = " ".repeat(prefix.length > 1 ? prefix.length - 1 : 0);
  const dumped_lines = [];
  const plus_str = import_vlib.Color.green_bold("+");
  const minus_str = import_vlib.Color.red_bold("-");
  let line_nr = 0;
  for (let index = 0; index < diffs.length; ++index) {
    const part = diffs[index];
    const line_prefix = part.added ? plus_str : part.removed ? minus_str : " ";
    let local_line_nr = part.removed ? line_nr : void 0;
    let last_dots = false;
    const iter_diff_lines = diff_lines[index];
    for (let line_index = 0; index < iter_diff_lines.length; ++index) {
      const line = iter_diff_lines[line_index];
      if (local_line_nr != null) {
        ++local_line_nr;
      } else {
        ++line_nr;
      }
      if (line_index === iter_diff_lines.length - 1 && line === "")
        continue;
      if (trim && !part.added && !part.removed && !(line_index < trim_keep || line_index >= iter_diff_lines.length - trim_keep)) {
        if (!last_dots && (line_index === trim_keep || line_index === iter_diff_lines.length - trim_keep - 1)) {
          dumped_lines.push(`${whitespace_prefix} ${String().padEnd(max_line_nr_length, " ")} | ${line_prefix} ${import_vlib.Color.italic("... unchanged ...")}`);
          last_dots = true;
        }
        continue;
      }
      dumped_lines.push(`${whitespace_prefix} ${String(local_line_nr != null ? local_line_nr : line_nr).padEnd(max_line_nr_length, " ")} | ${line_prefix} ${line}`);
      last_dots = false;
    }
    ;
    --line_nr;
  }
  ;
  return { status: "diff", changes: diffs, diff: dumped_lines.join("\n") };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  compute_diff
});
