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
  FileLogger: () => FileLogger
});
module.exports = __toCommonJS(stdin_exports);
var import_logger = require("../uni/logger.js");
var import_file_pipe = require("./file_pipe.js");
class FileLogger extends import_logger.Logger {
  /**
   * Construct a file logger instance.
   * See ${@link Logger} for more info about the constructor options.
   */
  constructor(opts) {
    super({
      level: opts.level,
      debug: false,
      pipe: new import_file_pipe.FilePipe({
        log_path: opts.log_path,
        error_path: opts.error_path
      })
    });
  }
  /**
   * Stop the logger and close the file streams.
   */
  stop() {
    this.pipe.stop();
  }
  /**
   * Assign paths for the logger class.
   * @param log_path The optional log path.
   * @param error_path The optional error path.
   */
  assign_paths(log_path, error_path) {
    this.pipe.assign_paths(log_path, error_path);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileLogger
});
