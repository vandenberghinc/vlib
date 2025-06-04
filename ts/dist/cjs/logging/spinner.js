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
  Spinner: () => Spinner
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
var import_date = require("../global/date.js");
class Spinner {
  /** The spinner frames to cycle through. */
  frames = [
    "\u280B",
    "\u2819",
    "\u2839",
    "\u2838",
    "\u283C",
    "\u2834",
    "\u2826",
    "\u2827",
    "\u2807",
    "\u280F"
  ];
  /** Handle for the running interval timer. */
  interval_handle = null;
  /** Index of the current frame in `frames`. */
  frame_index = 0;
  /** The prefix message shown before the spinner. */
  prefix;
  /** Milliseconds between spinner frame updates. */
  interval_ms;
  /** Show timestamps */
  timestamps;
  /** Default start/stop/success message. */
  start_message;
  stop_message;
  success_message;
  /**
   * Create a new Spinner.
   * @param prefix Optional text to display before the spinner.
   * @param opts.interval Milliseconds between spinner frame updates (default: 100).
   * @param opts.auto_start Start the spinner upon construction (default: true).
   * @param opts.timestamps Show timestamps (default: true).
   * @param opts.start Optional default message to display when starting the spinner with `start()` or by `auto_start`.
   * @param opts.success Optional default message to display when stopping the spinner with `success()`.
   * @param opts.stop Optional default message to display when stopping the spinner with `stop()`.
   */
  constructor(opts) {
    if (typeof opts === "string") {
      opts = { message: opts };
    }
    this.prefix = opts.message ?? "";
    this.interval_ms = opts?.interval || 100;
    this.timestamps = opts?.timestamps ?? true;
    this.start_message = opts?.start;
    this.success_message = opts?.success;
    this.stop_message = opts?.stop;
    if (opts?.auto_start !== false) {
      this.start();
    }
  }
  /** Is running. */
  get running() {
    return this.interval_handle != null;
  }
  get is_running() {
    return this.interval_handle != null;
  }
  /**
   * Start rendering the spinner to stdout.
   * If already started, this is a no-op.
   */
  start() {
    if (this.interval_handle)
      return;
    if (this.start_message) {
      this.opt_timestamp_write(`${this.start_message}
`);
    }
    this.render_frame();
    this.interval_handle = setInterval(() => {
      this.frame_index = (this.frame_index + 1) % this.frames.length;
      this.render_frame();
    }, this.interval_ms);
  }
  /**
   * Stop the spinner without marking success or failure.
   * Clears the current line.
   */
  stop(message) {
    if (!this.interval_handle)
      return;
    clearInterval(this.interval_handle);
    this.interval_handle = null;
    process.stdout.write("\r\x1B[K");
    if (message || this.stop_message) {
      message ??= this.stop_message;
      this.opt_timestamp_write(`${message}
`);
    }
  }
  /**
   * Pause the spinner, preserving the current frame.
   * If not running, this is a no-op.
   */
  pause() {
    if (!this.interval_handle)
      return;
    clearInterval(this.interval_handle);
    this.interval_handle = null;
    process.stdout.write("\r");
    process.stdout.write("\x1B[K");
  }
  /**
   * Pause, then call callback, then resume the spinner.
   * Allowing for safe logging during the spinner.
   */
  safe_log(cb) {
    this.pause();
    cb();
    this.resume();
  }
  /**
   * Resume the spinner from a paused state.
   * If already running, this is a no-op.
   */
  resume() {
    if (this.interval_handle)
      return;
    this.render_frame();
    this.interval_handle = setInterval(() => {
      this.frame_index = (this.frame_index + 1) % this.frames.length;
      this.render_frame();
    }, this.interval_ms);
  }
  /**
   * Stop the spinner and mark it as succeeded.
   * @param message Optional message to display after the success mark.
   */
  success(message) {
    message ??= this.success_message;
    this.stop();
    const text = message ?? this.prefix;
    this.opt_timestamp_write(`${import_colors.Color.green_bold("\u2714")} ${text}
`);
  }
  /**
   * Stop the spinner and mark it as failed.
   * @param message Optional message to display after the failure mark.
   */
  error(message) {
    this.stop();
    const text = message ?? this.prefix;
    this.opt_timestamp_write(`${import_colors.Color.red_bold("\u2716")} ${text}
`);
  }
  /**
   * Update the prefix message shown alongside the spinner.
   * @param prefix The new prefix text.
   */
  set_prefix(prefix) {
    this.prefix = prefix;
  }
  /**
   * Render the current spinner frame plus prefix to stdout.
   * Clears the line first, then writes spinner + prefix.
   */
  render_frame() {
    const frame = this.frames[this.frame_index];
    const text = this.prefix ? ` ${this.prefix}` : "";
    this.opt_timestamp_write(`${frame}${text}`);
  }
  /** write wrapper. */
  raw_write(text) {
    process.stdout.write("\r");
    process.stdout.write("\x1B[K");
    process.stdout.write(text);
  }
  opt_timestamp_write(text) {
    const prefix = !this.timestamps ? "" : `${import_colors.Color.gray(new import_date.Date().format("%d-%m-%y %H:%M:%S"))}: `;
    this.raw_write(prefix + text);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Spinner
});
