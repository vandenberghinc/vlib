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
  SourceLoc: () => SourceLoc
});
module.exports = __toCommonJS(stdin_exports);
class SourceLoc {
  file = "<unknown>";
  filename = "<unknown>";
  line = "?";
  column = "?";
  caller = "<unknown>";
  id = "<unknown>:?:?";
  abs_id = "<unknown>:?:?";
  adjust;
  constructor(adjust = 0) {
    this.adjust = adjust;
    if (typeof Error.prepareStackTrace === "function") {
      this._captureWithCallSite();
    } else {
      this._captureWithStackString();
    }
  }
  _captureWithCallSite() {
    this.file = "<unknown>";
    this.filename = "<unknown>";
    this.line = "?";
    this.column = "?";
    this.caller = "<unknown>";
    this.id = "<unknown>:?:?";
    this.abs_id = "<unknown>:?:?";
    const orig_prepare = Error.prepareStackTrace;
    Error.prepareStackTrace = (_err, sites2) => sites2;
    Error.stackTraceLimit = 3 + this.adjust;
    const holder = {};
    Error.captureStackTrace(holder, SourceLoc);
    const sites = holder.stack;
    Error.prepareStackTrace = orig_prepare;
    if (!sites) {
      return;
    }
    const site = sites[this.adjust];
    if (!site) {
      return;
    }
    let file_path = "<unknown>";
    try {
      file_path = site.getFileName() || "<unknown>";
    } catch (_) {
    }
    this.file = file_path;
    if (/^(?:node|module_job|loader):/.test(this.file)) {
      this._as_unknown();
      return;
    }
    const pos = file_path.lastIndexOf("/");
    const win = file_path.lastIndexOf("\\");
    const cut = pos > win ? pos : win;
    this.filename = cut < 0 ? file_path : file_path.slice(cut + 1);
    this.caller = site.getFunctionName() || site.getMethodName() || "<anonymous>";
    if (!site.getFunctionName()) {
      const t = site.getTypeName();
      const m = site.getMethodName();
      if (t && m) {
        this.caller = `${t}.${m}`;
      }
    }
    if (this.caller === "<anonymous>") {
      const caller = site.getThis();
      if (caller && typeof caller === "object") {
        this.caller = caller.constructor.name || "<anonymous>";
      }
    }
    if (this.caller === "<anonymous>" && site.isToplevel()) {
      this.caller = "<root>";
    }
    this.line = site.getLineNumber() ?? "?";
    this.column = site.getColumnNumber() ?? "?";
    const suffix = `:${this.line}:${this.column}` + (this.caller === "<root>" ? "" : this.caller ? `:${this.caller}` : "");
    this.id = `${this.filename}${suffix}`;
    this.abs_id = `${this.file}${suffix}`;
  }
  _captureWithStackString() {
    const stack = new Error().stack?.split("\n") ?? [];
    const frameLine = stack[1 + this.adjust]?.trim();
    if (!frameLine)
      return;
    const re = /^\s*at\s+(?:(\S+)\s+\()?(.+?):(\d+):(\d+)\)?$/;
    const m = frameLine.match(re);
    if (!m)
      return;
    const [, fnName, fp, ln, col] = m;
    this.file = fp;
    const cut = Math.max(fp.lastIndexOf("/"), fp.lastIndexOf("\\"));
    this.filename = cut < 0 ? fp : fp.slice(cut + 1);
    this.line = parseInt(ln, 10) || "?";
    this.column = parseInt(col, 10) || "?";
    let fn = fnName || "<anonymous>";
    if (fn === "<anonymous>")
      fn = stack.length > 2 ? stack[2].trim() : fn;
    this.caller = fn === "" ? "<anonymous>" : fn;
    const suffix = `:${this.line}:${this.column}` + (this.caller === "<root>" ? "" : `:${this.caller}`);
    this.id = `${this.filename}${suffix}`;
    this.abs_id = `${this.file}${suffix}`;
  }
  /** Is unknown. */
  is_unknown() {
    return this.file === "<unknown>" && this.filename === "<unknown>";
  }
  /** Assign as unknown. */
  _as_unknown() {
    this.file = "<unknown>";
    this.filename = "<unknown>";
    this.line = "?";
    this.column = "?";
    this.caller = "<unknown>";
    this.id = "<unknown>:?:?";
    return true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SourceLoc
});
