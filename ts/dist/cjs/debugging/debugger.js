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
  Debug: () => Debug,
  debug: () => debug
});
module.exports = __toCommonJS(stdin_exports);
var import_callable = require("../global/callable.js");
var import_directives = require("./directives.js");
var import_pipe = require("./pipe.js");
var import_source_loc = require("./source_loc.js");
var import_colors = require("../system/colors.js");
var import_utils = require("../utils.js");
class Debug extends import_callable.Callable {
  level;
  pipe;
  /**
   * Construct a new debug instance.
   *
   * @param opts The options for the debug instance.
   *             This can be a number, an ActiveLogLevel instance, or an object.
   * @param opts.level The log level to set for this debug instance.
   *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
   * @param opts.pipe The pipe to use for logging. If not provided, the default pipe will be used.
   */
  constructor(opts) {
    let level = 0;
    let pipe2;
    if (opts instanceof import_directives.ActiveLogLevel || typeof opts === "number") {
      level = opts;
    } else if (opts) {
      if (opts.level instanceof import_directives.ActiveLogLevel || typeof opts.level === "number") {
        level = opts.level;
      }
      if (opts.pipe) {
        pipe2 = opts.pipe;
      }
    }
    super();
    this.level = level instanceof import_directives.ActiveLogLevel ? level : new import_directives.ActiveLogLevel(level);
    this.pipe = pipe2 ?? import_pipe.pipe;
  }
  /** Call the debug fn. */
  call(log_level, ...args) {
    this.pipe.log(this.level, import_directives.Mode.debug, new import_source_loc.SourceLoc(1), ...args);
  }
  /**
   * Check if the local log level is active.
   * @param local_level The local log level to check against the active log level.
   * @param active_level Optionally provide an active log level to check against.
   * @returns `true` if the local level is active, otherwise `false`.
   */
  on(local_level, active_level) {
    return active_level == null ? local_level <= this.level.n : local_level <= active_level;
  }
  /**
   * Log a message in raw mode.
   * @param args Log arguments to pass to the pipe.
   */
  raw(...args) {
    import_pipe.pipe.raw(this.level, import_directives.Mode.debug, import_directives.Mode.raw, new import_source_loc.SourceLoc(1), ...args);
  }
  /**
   * Update the log level of this debug instance.
   * @param value The log level to set for this debug instance.
   * @returns The debug instance itself for chaining.
   */
  set(value) {
    this.level.set(value);
    return this;
  }
  update(value) {
    this.level.update(value);
    return this;
  }
  /**
   * Create a new SourceLoc instance.
   * @param lookback
   *      The number of function calls to go back in the call stack for the creation of the SourceLoc.
   *      By default the source location will be created for the location of where this function is called.
   * @returns A new SourceLoc instance.
   */
  loc(lookback = 0) {
    return new import_source_loc.SourceLoc(1 + lookback);
  }
}
const debug = new Debug({ level: 0 });
let now = Date.now();
const count = 1e5;
const times = {};
const some_large_object = {
  x: 0,
  y: 1,
  z: 2,
  a: 3,
  b: 4,
  c: 5,
  d: 6,
  e: 7,
  f: 8,
  g: 9,
  h: 10,
  i: 11,
  j: 12,
  k: 13,
  l: 14,
  m: 15,
  n: 16,
  o: 17,
  p: 18,
  q: 19,
  r: 20,
  s: 21,
  t: 22,
  u: 23,
  v: 24,
  w: 25,
  y2: 27,
  z2: {
    x: 0,
    y: 1,
    z: 2,
    a: 3,
    b: 4,
    c: 5,
    d: 6,
    e: 7,
    f: 8,
    g: 9,
    h: 10,
    i: 11,
    j: 12,
    k: 13,
    l: 14,
    m: 15,
    n: 16,
    o: 17,
    p: 18,
    q: 19,
    r: 20,
    s: 21,
    t: 22,
    u: 23,
    v: 24,
    w: 25
  }
};
now = Date.now();
for (let i = 0; i < count; i++) {
  debug(1, import_colors.Color.object(some_large_object));
}
times["eager"] = Date.now() - now;
now = Date.now();
for (let i = 0; i < count; i++) {
  debug(1, () => import_colors.Color.object(some_large_object));
}
times["lazy"] = Date.now() - now;
now = Date.now();
for (let i = 0; i < count; i++) {
  if (debug.on(1))
    debug(import_colors.Color.object(some_large_object));
}
times["if+on+debug"] = Date.now() - now;
now = Date.now();
for (let i = 0; i < count; i++) {
  if (debug.level.n >= 1) {
    debug(import_colors.Color.object(some_large_object));
  }
}
times["if+debug"] = Date.now() - now;
now = Date.now();
for (let i = 0; i < count; i++) {
  if (debug.level.n >= 1) {
    console.log(import_colors.Color.object(some_large_object));
  }
}
times["if+console.log"] = Date.now() - now;
console.log("Benchmark results for debug():");
for (const [name, time] of Object.entries(times).sort((a, b) => a[1] - b[1])) {
  console.log(" *", name, time, "ms");
}
import_utils.utils.safe_exit();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Debug,
  debug
});
