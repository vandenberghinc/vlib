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
  LogMode: () => LogMode,
  directive: () => Directive
});
module.exports = __toCommonJS(stdin_exports);
var import_source_loc = require("./source_loc.js");
const SymbolMap = {
  log: Symbol("vlib/debugging/pipe/Log"),
  debug: Symbol("vlib/debugging/pipe/Debug"),
  warn: Symbol("vlib/debugging/pipe/Warn"),
  error: Symbol("vlib/debugging/pipe/Error"),
  raw: Symbol("vlib/debugging/pipe/Raw"),
  enforce: Symbol("vlib/debugging/pipe/Enforce"),
  ignore: Symbol("vlib/debugging/pipe/Ignore"),
  not_a_directive: Symbol("vlib/debugging/pipe/NotADirective")
};
var Directive;
(function(Directive2) {
  Directive2.log = SymbolMap.log;
  Directive2.debug = SymbolMap.debug;
  Directive2.warn = SymbolMap.warn;
  Directive2.error = SymbolMap.error;
  Directive2.raw = SymbolMap.raw;
  Directive2.enforce = SymbolMap.enforce;
  Directive2.ignore = SymbolMap.ignore;
  Directive2.not_a_directive = SymbolMap.not_a_directive;
  Directive2.set = new Set(Object.values(Directive2));
  Directive2.is = (value) => value instanceof ActiveLogLevel || value instanceof import_source_loc.SourceLoc || typeof value === "symbol" && Directive2.set.has(value);
})(Directive || (Directive = {}));
var LogMode;
(function(LogMode2) {
  LogMode2.is = (value) => typeof value === "symbol" && (value === Directive.warn || value === Directive.error || value === Directive.debug);
})(LogMode || (LogMode = {}));
;
class ActiveLogLevel {
  n;
  constructor(n) {
    this.n = n;
  }
  set(value) {
    this.n = typeof value === "number" ? value : value.n;
  }
  update(value) {
    this.n = typeof value === "number" ? value : value.n;
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
  /**
   * Some operations to compare the current log level with a given level.
   */
  eq(level) {
    return this.n === level;
  }
  gt(level) {
    return this.n > level;
  }
  gte(level) {
    return this.n >= level;
  }
  lt(level) {
    return this.n < level;
  }
  lte(level) {
    return this.n <= level;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActiveLogLevel,
  Directive,
  LogMode,
  directive
});
