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
  Pipe: () => Pipe,
  pipe: () => pipe
});
module.exports = __toCommonJS(stdin_exports);
var import_date = require("../global/date.js");
var import_colors = require("../system/colors.js");
var import_source_loc = require("./source_loc.js");
var import_directives = require("./directives.js");
class Pipe {
  /**
   * The active log level.
   * When defined, specific log level features are enabled in the pipe function(s).
   */
  log_level;
  /**
   * The accumulated piped data.
   */
  data;
  /**
   * The pipe function.
   */
  _out;
  /**
   * The error pipe function.
   */
  _err;
  /**
   * The transform function to apply to pipe input arguments.
   * It should return any type that can be joined by `.join()` as a child of the `msg` array.
   * If the transform function returns `Ignore`, the argument will be ignored.
   */
  _transform;
  /**
   * Constructor
   * @param log_level
   *     The active log level for this pipe instance.
   *     When defined, specific log level features are enabled in the pipe function(s).
   *     See {@link Pipe.pipe} for more information.
   * @param out
   *     The output function to use for logging data.
   *     Note that in order to use any of the related `log()` methods, this parameter must be defined.
   * @param err
   *     The error output function to use for logging error data.
   *     Defaults to the `out` function.
   * @param transform
   *     A transform function to apply to pipe input arguments.
   *     It should return any type that can be joined by `.join()` as a child of the `msg` array.
   *     If the transform function returns `Ignore`, the argument will be ignored.
   *     For the following types the transform function is NOT called:
   *     - `undefined | null | symbol | Error`
   * @param accumulate
   *     Whether to accumulate the piped data in an array.
   *     If `true`, the `buff` property will be an array that can be used to store the piped data.
   */
  constructor({ log_level, out, err = out, transform, accumulate }) {
    this.log_level = log_level == null ? void 0 : log_level instanceof import_directives.ActiveLogLevel ? log_level : new import_directives.ActiveLogLevel(log_level);
    this._out = out;
    this._err = err;
    this._transform = transform;
    this.data = accumulate ? [] : void 0;
  }
  /**
   * Ensure the out and err functions are defined.
   * @throws Error when the out or err function is not defined.
   */
  ensure_out_err() {
    if (!this._out) {
      throw new Error("Pipe out function is not defined.");
    }
    if (!this._err) {
      throw new Error("Pipe err function is not defined.");
    }
  }
  /** Wrapper to push an arg to two arrays. */
  push_arg(msg, file_msg, item) {
    if (file_msg !== void 0) {
      file_msg.push(item);
    }
    msg.push(item);
  }
  /** Add args. */
  add_args(msg, file_msg, args, mode, level, active_log_level, local_level_arg_index) {
    const start_msg_len = msg.length;
    for (let i = 0; i < args.length; i++) {
      let item = args[i];
      let transformed = false;
      if (item instanceof import_source_loc.SourceLoc || item instanceof import_directives.ActiveLogLevel || item === import_directives.Directive.log || item === import_directives.Directive.debug || item === import_directives.Directive.warn || item === import_directives.Directive.error || item === import_directives.Directive.raw || item === import_directives.Directive.enforce || item === import_directives.Directive.ignore || local_level_arg_index != null && i === local_level_arg_index) {
        continue;
      } else if (item === void 0) {
        this.push_arg(msg, file_msg, "undefined");
      } else if (item === null) {
        this.push_arg(msg, file_msg, "null");
      } else if (typeof item === "symbol") {
        this.push_arg(msg, file_msg, item.toString());
      } else if (item instanceof Error) {
        let add = item.stack ?? item.message;
        if (mode === import_directives.Directive.warn && add.startsWith("Error: ")) {
          add = "Warning: " + add.slice(7);
        }
        if (mode === import_directives.Directive.warn) {
          this.push_arg(msg, file_msg, add.replace(/^Warning: /gm, `${import_colors.Color.yellow("Warning")}: `));
        } else {
          this.push_arg(msg, file_msg, add.replace(/^Error: /gm, `${import_colors.Color.red("Error")}: `));
        }
      } else {
        if (item && typeof item === "object") {
          if (typeof item.toString === "function" && item.toString !== Object.prototype.toString) {
            item = item.toString.call(item);
          } else if (typeof item.str === "function") {
            item = item.str.call(item);
          }
        }
        if (mode === import_directives.Directive.debug && typeof item === "object") {
          if (this._transform) {
            if ((item = this._transform(item)) === import_directives.Directive.ignore) {
              continue;
            }
            transformed = true;
          }
          if (typeof item === "object") {
            if (level <= active_log_level) {
              this.push_arg(msg, file_msg, import_colors.Color.object(item, { max_depth: 3 }));
            } else {
              this.push_arg(msg, file_msg, "[object Object]");
            }
            return;
          }
        }
        if (msg.length === start_msg_len && (mode === import_directives.Directive.error || mode === import_directives.Directive.warn)) {
          this.push_arg(msg, file_msg, mode === import_directives.Directive.error ? `${import_colors.Color.red("Error")}: ` : `${import_colors.Color.yellow("Warning")}: `);
        }
        if (this._transform) {
          const transformed2 = this._transform(item);
          if (transformed2 === import_directives.Directive.ignore) {
            item = transformed2;
          }
        }
        this.push_arg(msg, file_msg, item);
      }
    }
  }
  /**
   * Parse the directives and log levels.
   * @param args the args to extract the directives from.
   * @param directives optional directives to override with parse.
   */
  parse_directives(args, directives, out = {}) {
    out.local_level ??= 0;
    out.active_log_level ??= this.log_level.n ?? 0;
    out.mode ??= import_directives.Directive.log;
    out.is_raw ??= false;
    out.enforce ??= false;
    for (let index = 0; index < args.length; index++) {
      const item = args[index];
      if (item instanceof import_source_loc.SourceLoc) {
        out.loc = item;
      } else if (item === import_directives.Directive.error || item === import_directives.Directive.warn || item === import_directives.Directive.debug) {
        out.mode = item;
      } else if (item === import_directives.Directive.raw) {
        out.is_raw = true;
      } else if (item === import_directives.Directive.enforce) {
        out.enforce = true;
      } else if (item instanceof import_directives.ActiveLogLevel) {
        out.active_log_level = item.n;
      } else if (this.log_level != null && out.local_level_arg_index == null && typeof item === "number") {
        out.local_level_arg_index = index;
        out.local_level = item;
      } else {
        break;
      }
    }
    ;
    if (directives != null) {
      for (const key of Object.keys(directives)) {
        out[key] = directives[key];
      }
    }
    return out;
  }
  /**
   * Trim trailing spaces from the message array.
   */
  trim_trailing_spaces(msg) {
    while (
      // trim trailing spaces.
      msg.length > 0 && (msg[msg.length - 1].length === 0 || msg[msg.length - 1].endsWith(" "))
    ) {
      if (msg[msg.length - 1].length <= 1) {
        msg.length--;
      } else {
        msg[msg.length - 1] = msg[msg.length - 1].trimEnd();
      }
    }
  }
  /**
   * Pre-pipe process the message.
   */
  pre_pipe_process(msg) {
    if (msg.length === 0) {
      return;
    }
    for (let i = 0; i < msg.length; i++) {
      if (typeof msg[i] === "symbol") {
        msg[i] = msg[i].toString();
      } else {
        msg[i] = msg[i].toString();
      }
    }
  }
  add(info) {
    if (this.data != null && info != null) {
      this.data.push(info);
    }
    return info;
  }
  /**
   * Join data and return the result information object.
   *
   * This only processes the data args when the local log level is active.
   *
   * Directives
   *   The directive search stops when any non directive / first primitive number is detected.
   *   Any directive must be passed before the other real args.
   *   The local log level can be mixed between directives.
   *   This method supports the following directives:
   *     1) SourceLoc - The source location of the log message.
   *     2) IsWarning - Enable warning mode.
   *     3) IsError - Enable error mode.
   *     4) IsDebug - Enable debug mode.
   *     5) ActiveLogLevel - Set the active log level for this log message.
   *     6) IsRaw - Enable raw mode, which will not add any additional information to the log message.
   *
   * Active log level.
   *   The active log level can be set by passing an instance of `ActiveLogLevel` as the first argument.
   *
   * Local log level.
   *   The local log level can be set by passing a number as the first argument.
   *   However, the number may also be passed in between directives.
   *   Note that logging a real true number as the first argument is not supported.
   *
   * @param args
   *      The data to pipe together.
   *      The first number is treated as the local log level. However, only when the `log_level` was defined upon Pipe construction.
   *      Any other directives are allowed before the first non-directive / local log level argument.
   */
  pipe(args, directives) {
    let { local_level, active_log_level, is_raw, mode, loc, local_level_arg_index, enforce } = this.parse_directives(args, directives);
    const msg = [];
    if (!enforce && local_level > active_log_level) {
      return this.add({ ignored: true, mode });
    }
    if (!is_raw) {
      msg.push(import_colors.Colors.gray);
      if (mode !== import_directives.Directive.debug) {
        const date = new import_date.Date().format("%d-%m-%y %H:%M:%S");
        msg.push(date, " ");
      }
      loc ??= new import_source_loc.SourceLoc(1);
      if (!loc.is_unknown() && mode === import_directives.Directive.debug) {
        const id = loc.caller === "<unknown>" || loc.caller === "<root>" ? loc.id : loc.filename + ":" + loc.caller;
        msg.push(`[${id}] `);
      }
      this.trim_trailing_spaces(msg);
      if (msg.length > 1) {
        msg.push(": ");
      }
      msg.push(import_colors.Colors.end);
    }
    this.add_args(msg, void 0, args, mode, local_level, active_log_level, local_level_arg_index);
    return this.add({ data: msg, mode, ignored: false });
  }
  /**
   * Join data and return the result as a string.
   * This ignores the current log level.
   */
  join(...args) {
    return this.pipe(args, { enforce: true }).data?.join("") ?? "";
  }
  /**
   * Log data to the console and file streams when defined.
   *
   * Directives
   *   The directive search stops when any non directive / first primitive number is detected.
   *   Any directive must be passed before the other real args.
   *   The local log level can be mixed between directives.
   *   This method supports the following directives:
   *     1) SourceLoc - The source location of the log message.
   *     2) IsWarning - Enable warning mode.
   *     3) IsError - Enable error mode.
   *     4) IsDebug - Enable debug mode.
   *     5) ActiveLogLevel - Set the active log level for this log message.
   *     6) IsRaw - Enable raw mode, which will not add any additional information to the log message.
   *
   * Active log level.
   *   The active log level can be set by passing an instance of `ActiveLogLevel` as the first argument.
   *
   * Local log level.
   *   The local log level can be set by passing a number as the first argument.
   *   However, the number may also be passed in between directives.
   *   @note That logging a real true number as the first argument is not supported.
   *
   * @param args
   *      The data to log.
   *      The first number is treated as the local log level.
   *      Any other directives are allowed before the first non-directive / local log level argument.
   */
  log(...args) {
    this.ensure_out_err();
    const r = this.pipe(args);
    if (r.ignored || !r.data) {
      return;
    }
    if (r.mode === import_directives.Directive.error || r.mode === import_directives.Directive.warn) {
      this._err(r.data.join(""));
    } else {
      this._out(r.data.join(""));
    }
  }
  /**
   * Log a raw message to the console.
   */
  raw(level, ...args) {
    this.log(import_directives.Directive.raw, new import_source_loc.SourceLoc(1), level, ...args);
  }
  /**
   * {Errors}
   *  Log error data to the console and file streams when defined.
   * @param args The data to log.
   */
  error(...errs) {
    this.log(-1, import_directives.Directive.error, new import_source_loc.SourceLoc(1), ...errs);
  }
  /**
   * {Warn}
   * Log a warning to the console and file streams when defined.
   * @param args
   *        The data to log.
   *        The first number is treated as the local log level.
   *        Any other directives are allowed before the first non-directive / local log level argument.
   * @funcs 2
   */
  warn(level, ...errs) {
    this.log(import_directives.Directive.warn, new import_source_loc.SourceLoc(1), level, ...errs);
  }
  warning(level, ...errs) {
    this.log(import_directives.Directive.warn, new import_source_loc.SourceLoc(1), level, ...errs);
  }
  /**
   * Initialize a nested debug module with a specific active log level.
   */
  loggers(active_log_level) {
    const active_log = new import_directives.ActiveLogLevel(active_log_level);
    return {
      log: (...args) => {
        this.log(active_log, new import_source_loc.SourceLoc(1), ...args);
      },
      raw: (...args) => {
        this.raw(active_log, import_directives.Directive.raw, new import_source_loc.SourceLoc(1), ...args);
      },
      error: (...args) => {
        this.log(active_log, -1, import_directives.Directive.error, new import_source_loc.SourceLoc(1), ...args);
      },
      warn: (...args) => {
        this.warn(active_log, new import_source_loc.SourceLoc(1), ...args);
      },
      warning: (...args) => {
        this.warning(active_log, import_directives.Directive.warn, new import_source_loc.SourceLoc(1), ...args);
      }
      // debug: (...args: Args) => {
      //     this.log(active_log, Mode.debug, new SourceLoc(1), ...args)
      // }
    };
  }
  /** Create a marker log message. */
  marker(level, ...args) {
    if (typeof level === "number") {
      this.log(level, new import_source_loc.SourceLoc(1), import_colors.Color.blue(">>> "), ...args);
    } else {
      this.log(new import_source_loc.SourceLoc(1), import_colors.Color.blue(">>> "), level, ...args);
    }
  }
}
const pipe = new Pipe({
  log_level: 0,
  out: console.log,
  err: console.error
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Pipe,
  pipe
});
