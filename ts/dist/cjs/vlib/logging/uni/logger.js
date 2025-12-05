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
  Logger: () => Logger,
  log: () => log
});
module.exports = __toCommonJS(stdin_exports);
var import_callable = require("../../generic/callable.js");
var import_directives = require("./directives.js");
var import_pipe = require("./pipe.js");
var import_source_loc = require("./source_loc.js");
var import_colors = require("../../generic/colors.js");
;
class Logger extends import_callable.Callable {
  /** The active log level. */
  level;
  /** The pipe instance. */
  pipe;
  /**
   * The debug directive.
   * Either `Directive.debug` or a fake `Directive.log` for easy func pass.
   * When debug mode is enabled, trace locations are shown for log messages.
   * Not for errors and warnings, since they often contain their own source locations.
   */
  debug_flag;
  /** The raw flag, when `true` everything will be logged in raw mode. */
  raw_flag;
  /**
   * @dev_note Dont allow any other options than object, so we can infer D
   *           Otherwise it causes issues for the default value of `debug`.
   *           Because we need to guarantee that the debug flag matches generic `D`.
   */
  /**
   * Construct a new debug instance.
   *
   * @param opts The options for the debug instance.
   * @param opts.level The log level to set for this debug instance, defaults to 0.
   *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
   * @param opts.debug If `true`, the debug instance show trace locations for log messages, not for errors and warnings.
   * @param opts.raw When `true`, timestamps will not be shown on log messages.
   * @param opts.pipe The pipe instance to use for logging, defaults to a new `Pipe<boolean, true>`.
   *                  This attribute is required when a custom `P` generic is provided.
   *
   * @docs
   */
  constructor(opts) {
    super();
    this.debug_flag = opts.debug ? import_directives.Directive.debug : import_directives.Directive.not_a_directive;
    this.raw_flag = opts.raw ? import_directives.Directive.raw : import_directives.Directive.not_a_directive;
    this.pipe = opts.pipe ?? new import_pipe.Pipe({
      log_level: 0,
      out: console.log,
      err: console.error
    });
    this.pipe.log_level.set(opts.level ?? 0);
    this.level = this.pipe.log_level;
  }
  /**
   * {Log}
   * Log a message to the console. Including a traceback of the source location.
   * @param args
   *        The data to log.
   *        The first number is treated as the local log level.
   *        Any other directives are allowed before the first non-directive / local log level argument.
   * @docs
   */
  call(log_level, ...args) {
    this.pipe.log(this.level, this.debug_flag, this.raw_flag, new import_source_loc.SourceLoc(2), log_level, ...args);
  }
  /**
   * Check if the local log level is active.
   * @param local_level The local log level to check against the active log level.
   * @param active_level Optionally provide an active log level to check against.
   * @returns `true` if the local level is active, otherwise `false`.
   *
   * @docs
   */
  on(local_level, active_level) {
    return active_level == null ? local_level <= this.level.n : local_level <= active_level;
  }
  /**
   * Log a message in raw mode.
   * @param args Log arguments to pass to the pipe.
   *
   * @docs
   */
  raw(level, ...args) {
    this.pipe.log(this.debug_flag, this.raw_flag, new import_source_loc.SourceLoc(1), level, ...args);
  }
  dump(level, ...args) {
    this.pipe.log(this.debug_flag, this.raw_flag, new import_source_loc.SourceLoc(1), level, ...args);
  }
  /**
   * {Errors}
   * Log error data to the console and file streams when defined.
   * This automatically prepends the `Mode.raw` directive.
   * @param args The data to log.
   *
   * @docs
   */
  error(...args) {
    this.pipe.log(-1, this.raw_flag, import_directives.Directive.error, new import_source_loc.SourceLoc(1), ...args);
  }
  /**
   * {Warn}
   * Log a warning to the console and file streams when defined.
   * This automatically prepends the `Mode.raw` directive.
   * @param level The log level or the first argument to log.
   * @param errs The data to log.
   * @docs
   */
  warn(level, ...args) {
    this.pipe.log(this.raw_flag, import_directives.Directive.warn, new import_source_loc.SourceLoc(1), level, ...args);
  }
  warning(level, ...args) {
    this.pipe.log(this.raw_flag, import_directives.Directive.warn, new import_source_loc.SourceLoc(1), level, ...args);
  }
  /**
   * Update the log level of this debug instance.
   * @param value The log level to set for this debug instance.
   * @returns The debug instance itself for chaining.
   * @docs
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
   * @docs
   */
  loc(lookback = 0) {
    return new import_source_loc.SourceLoc(1 + lookback);
  }
  /**
   * Forward the `Pipe.join()` function to the pipe instance.
   * @param args The arguments to pass to the `Pipe.join()` function.
   * @returns The joined string.
   * @docs
   */
  join(...args) {
    return this.pipe.join(...args);
  }
  /**
   * Create a marker log message.
   * @param args The arguments to pass to the `Pipe.join()` function.
   * @docs
   */
  marker(level, ...args) {
    if (typeof level === "number") {
      this.pipe.log(level, this.debug_flag, this.raw_flag, new import_source_loc.SourceLoc(1), import_colors.Color.blue(">>> "), ...args);
    } else {
      this.pipe.log(this.debug_flag, this.raw_flag, new import_source_loc.SourceLoc(1), import_colors.Color.blue(">>> "), level, ...args);
    }
  }
}
const log = new Logger({ level: 0, debug: false, raw: true });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logger,
  log
});
