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
  FilePipe: () => FilePipe
});
module.exports = __toCommonJS(stdin_exports);
var fs = __toESM(require("fs"));
var import_cluster = __toESM(require("cluster"));
var import_date = require("../../primitives/date.js");
var import_path = require("../../generic/path.js");
var import_colors = require("../../generic/colors.js");
var import_source_loc = require("../uni/source_loc.js");
var import_directives = require("../uni/directives.js");
var import_pipe = require("../uni/pipe.js");
var import_spinners = require("../uni/spinners.js");
class FilePipe extends import_pipe.Pipe {
  log_path;
  error_path;
  log_stream;
  err_stream;
  max_mb;
  thread;
  /**
   * The inherited `pipe` attribute is never used since this class overrides the `log` method, which is the only place where `pipe` is used.
   * @ts-expect-error */
  _out;
  // @ts-expect-error
  _err;
  /**
   * Constructor.
   * @docs
   */
  constructor({ log_level = 0, log_path = void 0, error_path = void 0, max_mb = void 0 } = {}) {
    super({ log_level, out: (d) => process.stdout.write(d) });
    this.log_path = void 0;
    this.error_path = void 0;
    this.log_stream = void 0;
    this.err_stream = void 0;
    this.max_mb = max_mb;
    this.thread = import_cluster.default.worker ? import_cluster.default.worker.id.toString() : "master";
    if (log_path || error_path) {
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
    const temp_path = `${file_path}.tmp_${import_date.Date.now()}`;
    await fs.promises.writeFile(temp_path, truncated);
    await fs.promises.rename(temp_path, file_path);
    const old_stream = type === "log" ? this.log_stream : this.err_stream;
    old_stream.close();
    const new_stream = fs.createWriteStream(file_path, { flags: "a" });
    if (type === "log") {
      this.log_stream = new_stream;
    } else {
      this.err_stream = new_stream;
    }
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
      const match = line.match(FilePipe.log_file_pattern);
      if (match) {
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
  // Public.
  /**
   * Stop the logger and close the file streams.
   * @docs
   */
  stop() {
    if (this.log_stream) {
      this.log_stream.close();
    }
    if (this.err_stream) {
      this.err_stream.close();
    }
  }
  /**
   * Assign paths for the logger class.
   * @param log_path The path to a new log path, or `undefined` to reset the log stream.
   * @param error_path The path to a new error path, or `undefined` to reset the error stream.
   * @docs
   */
  assign_paths(log_path, error_path) {
    if (this.log_stream)
      this.log_stream.close();
    if (log_path) {
      this.log_path = new import_path.Path(log_path);
      this.log_stream = fs.createWriteStream(this.log_path.str(), { flags: "a" });
    } else {
      this.log_path = void 0;
      this.log_stream = void 0;
    }
    if (this.err_stream)
      this.err_stream.close();
    if (log_path) {
      this.log_path = new import_path.Path(log_path);
      this.err_stream = fs.createWriteStream(this.log_path.str(), { flags: "a" });
    } else {
      this.log_path = void 0;
      this.err_stream = void 0;
    }
  }
  // --------------------------------------------------
  // Override the log method to support the file streams.
  /**
   * Log data to the console and file streams when defined.
   * See {@link Pipe.log} for more details.
   *
   * @param args
   *      The data to log.
   *      The first number is treated as the local log level.
   *      Any other directives are allowed before the first non-directive / local log level argument.
   * @docs
   */
  log(...args) {
    let { local_level, active_log_level, is_raw, log_mode: mode, loc, local_level_arg_index } = this.parse_directives(args);
    const msg = [import_colors.Colors.gray], file_msg = [];
    const stream = mode === import_directives.Directive.debug ? void 0 : mode === import_directives.Directive.error ? this.err_stream : this.log_stream;
    const stream_path = mode === import_directives.Directive.debug ? void 0 : mode === import_directives.Directive.error ? this.error_path : this.log_path;
    if (local_level > active_log_level && !stream) {
      return;
    }
    if (mode !== import_directives.Directive.debug) {
      const date = new import_date.Date().format("%d-%m-%y %H:%M:%S");
      file_msg.push(`(date=${date}) `);
      if (!is_raw) {
        msg.push(date, " ");
      }
    }
    loc ??= new import_source_loc.SourceLoc(1);
    if (!loc.is_unknown()) {
      if (mode === import_directives.Directive.debug && !is_raw) {
        const id = loc.caller === "<unknown>" || loc.caller === "<root>" ? loc.id : loc.filename + ":" + loc.caller;
        msg.push(`[${id}] `);
      }
      file_msg.push(`(loc=${loc.abs_id}) `);
    }
    if (!is_raw) {
      msg.push(this.thread !== "master" ? `(t${this.thread})` : "");
      this.trim_trailing_spaces(msg);
      if (msg.length > 1) {
        msg.push(": ");
      }
    }
    msg.push(import_colors.Colors.end);
    file_msg.push(this.thread ? `(thread=${this.thread}) ` : "", `(level=${local_level}) `, `(type=${mode === import_directives.Directive.error ? "error" : mode === import_directives.Directive.warn ? "warning" : "log"})`, ": ");
    this.add_args(msg, file_msg, args, mode, local_level, active_log_level, local_level_arg_index);
    if (msg.length > 0 && local_level <= active_log_level) {
      import_spinners.Spinners.ensure_safe_print();
      this.pre_pipe_process(msg);
      if (mode === import_directives.Directive.error || mode === import_directives.Directive.warn) {
        console.error(msg.join(""));
      } else {
        console.log(msg.join(""));
      }
    }
    if (stream != null && file_msg.length > 0) {
      this.pre_pipe_process(file_msg);
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
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilePipe
});
