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
  ActiveLogLevel: () => ActiveLogLevel,
  Directive: () => Directive,
  directive: () => Directive
});
module.exports = __toCommonJS(stdin_exports);
const Directive = {
  log: Symbol("vlib/debugging/pipe/Log"),
  debug: Symbol("vlib/debugging/pipe/Debug"),
  warn: Symbol("vlib/debugging/pipe/Warn"),
  error: Symbol("vlib/debugging/pipe/Error"),
  raw: Symbol("vlib/debugging/pipe/Raw"),
  enforce: Symbol("vlib/debugging/pipe/Enforce"),
  ignore: Symbol("vlib/debugging/pipe/Ignore")
};
class ActiveLogLevel {
  n;
  constructor(n) {
    this.n = n;
  }
  set(value) {
    this.n = value;
  }
  update(value) {
    this.n = value;
  }
  get() {
    return this.n;
  }
  // better to use `.n` directly.
  on(log_level) {
    return this.n >= log_level;
  }
  toString() {
    return String(this.n);
  }
}
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActiveLogLevel,
  Directive,
  directive
});
