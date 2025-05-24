var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Logger: () => Logger,
  default: () => stdin_default,
  logger: () => logger
});
module.exports = __toCommonJS(stdin_exports);
var fs = __toESM(require("fs"));
var import_cluster = __toESM(require("cluster"));
var import_date = require("../global/date.js");
var import_path = require("../system/path.js");
var import_colors = require("../system/colors.js");
var import_source_loc = require("./source_loc.js");
var import_pipe = __toESM(require("./pipe.js"));
const IsError = Symbol("vlib.Logger.IsError");
const IsWarning = Symbol("vlib.Logger.IsWarning");
const IsDebug = Symbol("vlib.Logger.IsDebug");
class UseActiveLogLevel extends Number {
  constructor(value) {
    super(value);
  }
}
const IsRaw = Symbol("vlib.Logger.Raw");
class Logger extends import_pipe.default {
  log_path;
  error_path;
  log_stream;
  error_stream;
  max_mb;
  thread;
  debug_filename;
  constructor({ log_level = 0, debug_filename = void 0, log_path = void 0, error_path = void 0, max_mb = void 0 } = {}) {
    super({ log_level });
    this.log_path = void 0;
    this.error_path = void 0;
    this.log_stream = void 0;
    this.error_stream = void 0;
    this.max_mb = max_mb;
    this.thread = import_cluster.default.worker ? import_cluster.default.worker.id.toString() : "master";
    this.debug_filename = debug_filename;
    if (log_path && error_path) {
      this.assign_paths(log_path, error_path);
    }
  }
  // --------------------------------------------------
  // Private.
  _write_count = 0;
  _truncate_interval = 1e3;
  // check every 1000 writes
  /**
   * Truncates the given file by removing lines at the start until its size is under max_bytes.
   * Closes and reopens the associated write stream to ensure subsequent writes go to the truncated file.
   *
   * @param path      The Path instance for the log or error file.
   * @param type Either 'log' or 'error' indicating which stream property to refresh.
   * @param max_bytes Maximum allowed file size in bytes.
   */
  async truncate_log_file(path, type, max_bytes) {
    const file_path = path.str();
    const { size: file_size } = await fs.promises.stat(file_path);
    if (file_size <= max_bytes) {
      return;
    }
    const start_pos = Math.max(0, file_size - max_bytes);
    const read_length = file_size - start_pos;
    const handle = await fs.promises.open(file_path, "r");
    let buffer;
    try {
      buffer = Buffer.alloc(read_length);
      await handle.read(buffer, 0, read_length, start_pos);
    } finally {
      await handle.close();
    }
    const newline_index = buffer.indexOf("\n");
    const valid_start = newline_index !== -1 ? newline_index + 1 : 0;
    const truncated = buffer.slice(valid_start);
    const temp_path = `${file_path}.tmp_${Date.now()}`;
    await fs.promises.writeFile(temp_path, truncated);
    await fs.promises.rename(temp_path, file_path);
    const old_stream = type === "log" ? this.log_stream : this.error_stream;
    old_stream.close();
    const new_stream = fs.createWriteStream(file_path, { flags: "a" });
    if (type === "log") {
      this.log_stream = new_stream;
    } else {
      this.error_stream = new_stream;
    }
  }
  // --------------------------------------------------
  // Public.
  /** @docs:
   *  @title: Stop
   *  @descr: Stop the logger and close the file streams.
   */
  stop() {
    if (this.log_stream) {
      console.log("Closing log stream.");
      this.log_stream.close();
    }
    if (this.error_stream) {
      console.log("Closing error stream.");
      this.error_stream.close();
    }
  }
  /** @docs:
   *  @title: Assign Paths
   *  @descr: Assign paths for the logger class.
   *  @param:
   *      @name: log_path
   *      @descr: The optional log path.
   *      @type: string
   *  @param:
   *      @name: error_path
   *      @descr: The optional error path.
   *      @type: string
   */
  assign_paths(log_path, error_path) {
    this.log_path = new import_path.Path(log_path);
    this.error_path = new import_path.Path(error_path);
    this.log_stream = fs.createWriteStream(this.log_path.str(), { flags: "a" });
    this.error_stream = fs.createWriteStream(this.error_path.str(), { flags: "a" });
  }
  /** The log file pattern. */
  static log_file_pattern = /^\(date=(.*?)\)\s*(?:\(loc=(.*?)\))?\s*(?:\(thread=(.*?)\))?\s*(?:\(level=(.*?)\))?\s*(?:\(type=(.*?)\))?:\s*/;
  /**
   * Parse a log file.
   */
  async _parse_log_file(path) {
    if (!path.exists()) {
      throw new Error(`Log file ${path} does not exist.`);
    }
    const logs = [];
    const buff = [];
    await path.read_lines((line) => {
      const match = line.match(Logger.log_file_pattern);
      if (match) {
        console.log("Matched:", match);
        const date = match[1];
        const loc = match[2];
        const thread = match[3];
        const level_int = parseInt(match[4]);
        const level = isNaN(level_int) ? void 0 : level_int;
        const type = match[5];
        const message = line.slice(match[0].length) + buff.join("\n");
        buff.length = 0;
        logs.push({
          date,
          loc,
          thread,
          level,
          type,
          message
        });
      } else {
        buff.push(line);
        console.log(`Unexpected line format:`, { line });
      }
    });
    if (buff.length > 0) {
      if (logs.length > 0) {
        logs[logs.length - 1].message += "\n" + buff.join("\n");
      } else {
        logs.push({
          date: "unknown",
          loc: void 0,
          thread: this.thread,
          level: 0,
          type: "log",
          message: buff.join("\n")
        });
      }
    }
    return logs;
  }
  // --------------------------------------------------
  // Override the log method to support the file streams.
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
      } else if (item === Infinity) {
        mode = IsRaw;
        args[index] = IsRaw;
      } else if (item === IsRaw) {
        is_raw = true;
      } else if (item instanceof UseActiveLogLevel) {
        active_log_level = item.valueOf();
      } else {
        break;
      }
    }
    ;
    if (mode === IsDebug && this.debug_filename && loc && loc.filename !== this.debug_filename) {
      return;
    }
    ;
    const msg = [import_colors.Colors.gray], file_msg = [];
    const stream = mode === IsDebug ? void 0 : mode === IsError ? this.error_stream : this.log_stream;
    const stream_path = mode === IsDebug ? void 0 : mode === IsError ? this.error_path : this.log_path;
    if (level > active_log_level && !stream) {
      return;
    }
    const dump_buffs = () => {
      if (msg.some((x) => typeof x === "symbol")) {
        throw new Error("System error, encountered a symbol.");
      }
      if (msg.length > 0 && level <= active_log_level) {
        console.log(msg.join(""));
      }
      if (stream != null && file_msg.length > 0) {
        stream.write(file_msg.join("") + "\n", () => {
          this._write_count++;
          if (this._write_count >= this._truncate_interval) {
            this._write_count = 0;
            this.truncate_log_file(
              stream_path,
              // Path instance (this.log_path or this.error_path)
              stream === this.log_stream ? "log" : "error",
              this.max_mb * 1024 * 1024
            ).catch(console.error);
          }
        });
      }
      msg.length = 0;
      file_msg.length = 0;
    };
    if (mode !== IsDebug) {
      const date = new import_date.VDate().format("%d-%m-%y %H:%M:%S");
      msg.push(date, " ");
      file_msg.push(`(date=${date}) `);
    }
    loc ??= new import_source_loc.SourceLoc(1);
    if (!loc.is_unknown()) {
      if (mode === IsDebug) {
        const id = loc.caller === "<unknown>" || loc.caller === "<root>" ? loc.id : loc.filename + ":" + loc.caller;
        msg.push(`[${id}] `);
      }
      file_msg.push(`(loc=${loc.abs_id}) `);
    }
    msg.push(this.thread !== "master" ? `(t${this.thread})` : "");
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
    if (msg.length > 1) {
      msg.push(": ");
    }
    msg.push(import_colors.Colors.end);
    file_msg.push(this.thread ? `(thread=${this.thread}) ` : "", `(level=${level}) `, `(type=${mode === IsError ? "error" : mode === IsWarning ? "warning" : "log"})`, ": ");
    this.add_args(msg, args, mode, level, active_log_level);
    this.add_args(file_msg, args, mode, level, active_log_level);
    dump_buffs();
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
}
var stdin_default = Logger;
const logger = new Logger({ log_level: 0 });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logger,
  logger
});
