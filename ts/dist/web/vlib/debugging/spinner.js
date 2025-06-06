/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Color } from "../generic/colors.js";
import { Date } from "../primitives/date.js";
import { Spinners } from "./spinners.js";
/**
 * A CLI spinner/loader with an optional prefix message.
 *
 * Example:
 * ```ts
 * const loader = new Spinner("Building project");
 * loader.start();
 * // do work…
 * loader.succeed("Build complete");
 * ```
 */
export class Spinner {
    /** The spinner frames to cycle through. */
    frames = [
        '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'
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
        if (typeof opts === 'string') {
            opts = { message: opts };
        }
        this.prefix = opts.message ?? '';
        this.interval_ms = opts?.interval || 100;
        this.timestamps = opts?.timestamps ?? true; // @warning dont change default to false by default, vlib and other libs depend on this.
        this.start_message = opts?.start;
        this.success_message = opts?.success;
        this.stop_message = opts?.stop;
        if (opts?.auto_start !== false) { // @warning dont change default to false by default, vlib and other libs depend on this.
            this.start();
        }
    }
    /** Is running. */
    get running() { return this.interval_handle != null; }
    get is_running() { return this.interval_handle != null; }
    /**
     * Start rendering the spinner to stdout.
     * If already started, this is a no-op.
     */
    start() {
        // Start the spinner.
        if (this.interval_handle)
            return;
        if (this.start_message) {
            this.opt_timestamp_write(`${this.start_message}\n`);
        }
        this.render_frame(); // render first frame immediately
        this.interval_handle = setInterval(() => {
            this.frame_index = (this.frame_index + 1) % this.frames.length;
            this.render_frame();
        }, this.interval_ms);
        // Add this spinner to the active spinners while pausing others.
        Spinners.pause_all();
        Spinners.add(this);
    }
    /**
     * Stop the spinner without marking success or failure.
     * Clears the current line.
     */
    stop(message) {
        // Stop the spinner.
        if (!this.interval_handle)
            return;
        clearInterval(this.interval_handle);
        this.interval_handle = null;
        process.stdout.write('\r\x1b[K');
        if (message || this.stop_message) {
            message ??= this.stop_message;
            this.opt_timestamp_write(`${message}\n`);
        }
        // Remove this spinner from the active spinners.
        Spinners.remove(this);
        Spinners.resume_last();
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
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
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
        this.render_frame(); // render current frame immediately
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
        this.opt_timestamp_write(`${Color.green_bold("✔")} ${text}\n`);
    }
    /**
     * Stop the spinner and mark it as failed.
     * @param message Optional message to display after the failure mark.
     */
    error(message) {
        this.stop();
        const text = message ?? this.prefix;
        this.opt_timestamp_write(`${Color.red_bold("✖")} ${text}\n`);
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
        const text = this.prefix ? ` ${this.prefix}` : '';
        this.opt_timestamp_write(`${frame}${text}`);
    }
    /** write wrapper. */
    raw_write(text) {
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
        process.stdout.write(text); // write the text
    }
    opt_timestamp_write(text) {
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.raw_write(prefix + text);
    }
}
//# sourceMappingURL=spinner.js.map