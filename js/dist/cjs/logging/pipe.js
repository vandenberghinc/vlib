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
  default: () => stdin_default,
  pipe: () => pipe
});
module.exports = __toCommonJS(stdin_exports);
var import_date = require("../global/date.js");
var import_colors = require("../system/colors.js");
var import_source_loc = require("./source_loc.js");
const IsError = Symbol("vlib.Logger.IsError");
const IsWarning = Symbol("vlib.Logger.IsWarning");
const IsDebug = Symbol("vlib.Logger.IsDebug");
class UseActiveLogLevel extends Number {
  constructor(value) {
    super(value);
  }
}
const IsRaw = Symbol("vlib.Logger.Raw");
class Pipe {
  log_level;
  constructor({ log_level = 0 } = {}) {
    this.log_level = log_level;
  }
  /** @docs:
   *  @title: Log
   *  @descr: Log data to the console and file streams when defined.
   *  @param:
   *      @name: level
   *      @descr: The log level of the message.
   *      @type: number
   *  @param:
   *      @name: args
   *      @descr:
   *          The data to log.
   *      @type: any[]
   */
  log(level, ...args) {
    if (typeof level !== "number") {
      args.unshift(level);
      level = 0;
    }
    let active_log_level = this.log_level;
    let loc;
    let mode;
    let is_raw = false;
    for (let index = 0; index < args.length; index++) {
      const item = args[index];
      if (item instanceof import_source_loc.SourceLoc) {
        loc = item;
      } else if (item === IsError || item === IsWarning || item === IsDebug) {
        mode = item;
      } else if (item === IsRaw || item === Infinity) {
        is_raw = true;
      } else if (item instanceof UseActiveLogLevel) {
        active_log_level = item.valueOf();
      } else {
        break;
      }
    }
    ;
    const msg = [import_colors.Colors.gray];
    if (level > active_log_level) {
      return;
    }
    const dump_buffs = () => {
      if (msg.length > 0 && level <= active_log_level) {
        console.log(msg.join(""));
      }
      msg.length = 0;
    };
    if (mode !== IsDebug) {
      const date = new import_date.VDate().format("%d-%m-%y %H:%M:%S");
      msg.push(date, " ");
    }
    loc ??= new import_source_loc.SourceLoc(1);
    if (!loc.is_unknown() && mode === IsDebug) {
      const id = loc.caller === "<unknown>" || loc.caller === "<root>" ? loc.id : loc.filename + ":" + loc.caller;
      msg.push(`[${id}] `);
    }
    while (msg.length > 0 && (msg[msg.length - 1].length === 0 || msg[msg.length - 1].endsWith(" "))) {
      if (msg[msg.length - 1].length <= 1) {
        msg.length--;
      } else {
        msg[msg.length - 1] = msg[msg.length - 1].trimEnd();
      }
    }
    if (msg.length > 1) {
      msg.push(": ");
    }
    msg.push(import_colors.Colors.end);
    this.add_args(msg, args, mode, level, active_log_level);
    dump_buffs();
  }
  /** Add args. */
  add_args(msg, args, mode, level, active_log_level) {
    const start_msg_len = msg.length;
    for (let i = 0; i < args.length; i++) {
      const item = args[i];
      if (item instanceof import_source_loc.SourceLoc || item instanceof UseActiveLogLevel || item === IsError || item === IsWarning || item === IsDebug || item === IsRaw || item === Infinity) {
        continue;
      } else if (item === void 0) {
        msg.push("undefined");
      } else if (item === null) {
        msg.push("null");
      } else if (typeof item === "symbol") {
        msg.push(item.toString());
      } else if (item instanceof Error) {
        let add = item.stack ?? item.message;
        if (mode === IsWarning && add.startsWith("Error: ")) {
          add = "Warning: " + add.slice(7);
        }
        if (mode === IsWarning) {
          msg.push(add.replace(/^Warning: /gm, `${import_colors.Color.yellow("Warning")}: `));
        } else {
          msg.push(add.replace(/^Error: /gm, `${import_colors.Color.red("Error")}: `));
        }
      } else if (mode === IsDebug && item && typeof item === "object") {
        if (level <= active_log_level) {
          msg.push(import_colors.Colors.object(item, { max_depth: 3 }));
        } else {
          msg.push("[object Object]");
        }
      } else {
        if (msg.length === start_msg_len && (mode === IsError || mode === IsWarning)) {
          msg.push(mode === IsError ? `${import_colors.Color.red("Error")}: ` : `${import_colors.Color.yellow("Warning")}: `);
        }
        msg.push(item);
      }
    }
  }
  /** @docs:
   *  @title: Error
   *  @descr:
   *      Log error data to the console and file streams when defined.
   *  @param:
   *      @name: mode
   *      @descr: The error prefix.
   *      @type: LogSource
   *      @warning:
   *          The log source. However, when this is a string type, it will be processed as error message.
   *  @param:
   *      @name: errs
   *      @descr: The error or string objects.
   *      @type: (string | Error)[]
   */
  error(...errs) {
    this.log(-1, IsError, new import_source_loc.SourceLoc(1), ...errs);
  }
  /** @docs:
   *  @title: Warn
   *  @descr: Log a warning to the console and file streams when defined.
   *  @param:
   *      @name: level
   *      @descr: The log level of the message.
   *      @type: number
   *  @param:
   *      @name: mode
   *      @descr: The warning prefix.
   *      @type: LogSource
   *      @warning:
   *          The log source. However, when this is a string type, it will be processed as error message.
   *  @param:
   *      @name: args
   *      @descr:
   *          The data to log.
   *          The log source can be defined by passing the first `...args` as a `LogSource` instance.
   *      @type: any[]
   *  @funcs: 2
   */
  warn(level, ...errs) {
    if (typeof level === "number") {
      this.log(level, IsWarning, new import_source_loc.SourceLoc(1), ...errs);
    } else {
      this.log(IsWarning, new import_source_loc.SourceLoc(1), level, ...errs);
    }
  }
  warning(level, ...errs) {
    if (typeof level === "number") {
      this.log(level, IsWarning, new import_source_loc.SourceLoc(1), ...errs);
    } else {
      this.log(IsWarning, new import_source_loc.SourceLoc(1), level, ...errs);
    }
  }
  /** @docs:
   *  @title: Debug
   *  @descr: Log debug data to the console while not saving it to the file streams.
   *  @note This does not log to the file streams.
   *  @param:
   *      @name: level
   *      @descr: The log level of the message.
   *      @type: number
   *  @param:
   *      @name: args
   *      @descr:
   *          The data to log.
   *          The log source can be defined by passing the first `...args` as a `LogSource` instance.
   *      @type: any[]
   */
  debug(level, ...args) {
    if (typeof level === "number") {
      this.log(level, IsDebug, new import_source_loc.SourceLoc(1), ...args);
    } else {
      this.log(IsDebug, new import_source_loc.SourceLoc(1), level, ...args);
    }
  }
  /** Initialize a nested debug module/function */
  loggers() {
    const debug = (log_level, ...args) => {
      this.log(log_level, IsDebug, new import_source_loc.SourceLoc(1), ...args);
    };
    debug.Raw = Infinity;
    debug.raw = Infinity;
    return {
      log: (log_level, ...args) => {
        if (typeof log_level === "number") {
          this.log(log_level, new import_source_loc.SourceLoc(1), ...args);
        } else {
          this.log(new import_source_loc.SourceLoc(1), log_level, ...args);
        }
      },
      error: (...args) => {
        this.log(-1, IsError, new import_source_loc.SourceLoc(1), ...args);
      },
      warn: (log_level, ...args) => {
        if (typeof log_level === "number") {
          this.warn(log_level, IsWarning, new import_source_loc.SourceLoc(1), ...args);
        } else {
          this.warn(IsWarning, new import_source_loc.SourceLoc(1), log_level, ...args);
        }
      },
      warning: (log_level, ...args) => {
        if (typeof log_level === "number") {
          this.warning(log_level, IsWarning, new import_source_loc.SourceLoc(1), ...args);
        } else {
          this.warning(IsWarning, new import_source_loc.SourceLoc(1), log_level, ...args);
        }
      },
      debug
    };
  }
  /** Initialize a debugger / debug func with a predefined active log level */
  debugger(active_log_level) {
    const fn = (log_level, ...args) => {
      if (typeof log_level === "number") {
        this.log(log_level, IsDebug, new import_source_loc.SourceLoc(1), new UseActiveLogLevel(active_log_level), ...args);
      } else {
        this.log(IsDebug, new import_source_loc.SourceLoc(1), new UseActiveLogLevel(active_log_level), log_level, ...args);
      }
    };
    fn.Raw = IsRaw;
    fn.raw = IsRaw;
    fn.level = active_log_level;
    fn.on = (log_level) => {
      return active_log_level >= log_level;
    };
    return fn;
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
var stdin_default = Pipe;
const pipe = new Pipe({ log_level: 0 });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Pipe,
  pipe
});
