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
  CLIError: () => CLIError
});
module.exports = __toCommonJS(stdin_exports);
var import_spinners = require("../logging/uni/spinners.js");
var import_colors = require("../generic/colors.js");
class CLIError extends globalThis.Error {
  /** The error name. */
  name = "CLIError";
  /** The message string. */
  message;
  /** The attached docs from `CLI.docs()`. */
  docs;
  /** The cli identifier where this error is attached to. */
  id;
  /** An optionally nested error rethrown as a CLI error. */
  error;
  /** Constructor. */
  constructor(message, opts) {
    super(message);
    this.message = message;
    if (opts) {
      this.docs = opts.docs;
      this.id = opts.id;
      this.error = opts.error;
    }
  }
  /** Dump an `Error` stack */
  add_error_stack(lines, error, nested_depth = 0, id) {
    const indent = nested_depth === 0 ? "" : " ".repeat(nested_depth * 4);
    lines.push(indent + import_colors.Color.red(typeof error.name === "string" ? error.name : "Error") + (id ? " " + import_colors.Color.gray(`[${id}]`) : "") + `: ${error.message ?? error}`);
    if (error.stack) {
      const split = error.stack.split("\n");
      if (split.length > 1) {
        for (let i = 1; i < split.length; i++) {
          lines.push(indent + split[i]);
        }
      } else {
        lines.push(...split.map((l) => indent + l));
      }
    }
  }
  /** Dump to console. */
  dump() {
    const lines = [];
    if (this.docs) {
      lines.push(this.docs + "\n");
    }
    this.add_error_stack(lines, this, 0, this.id);
    if (this.error) {
      this.add_error_stack(lines, this.error, 0);
    }
    if (import_spinners.Spinners.has_active()) {
      console.log();
    }
    console.error(import_colors.Colors.end + lines.join("\n"));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLIError
});
