/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Color } from "../system/colors.js";
import { Date } from "../global/date.js";
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
    /**
     * Create a new Spinner.
     * @param prefix Optional text to display before the spinner.
     * @param opts.interval Milliseconds between spinner frame updates (default: 100).
     * @param opts.start Start the spinner upon construction (default: true).
     * @param opts.timestamps Show timestamps (default: true).
     */
    constructor(prefix, opts) {
        this.prefix = prefix ?? '';
        this.interval_ms = opts?.interval || 100;
        if (opts?.start !== false) {
            this.start();
        }
        this.timestamps = opts?.timestamps ?? true;
    }
    /** Is running. */
    get running() { return this.interval_handle != null; }
    get is_running() { return this.interval_handle != null; }
    /**
     * Start rendering the spinner to stdout.
     * If already started, this is a no-op.
     */
    start() {
        if (this.interval_handle)
            return;
        this.render_frame(); // render first frame immediately
        this.interval_handle = setInterval(() => {
            this.frame_index = (this.frame_index + 1) % this.frames.length;
            this.render_frame();
        }, this.interval_ms);
    }
    /**
     * Stop the spinner without marking success or failure.
     * Clears the current line.
     */
    stop() {
        if (!this.interval_handle)
            return;
        clearInterval(this.interval_handle);
        this.interval_handle = null;
        process.stdout.write('\r\x1b[K');
    }
    /**
     * Stop the spinner and mark it as succeeded.
     * @param message Optional message to display after the success mark.
     */
    success(message) {
        this.stop();
        const text = message ?? this.prefix;
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${Color.green_bold("✔")} ${text}\n`);
    }
    /**
     * Stop the spinner and mark it as failed.
     * @param message Optional message to display after the failure mark.
     */
    error(message) {
        this.stop();
        const text = message ?? this.prefix;
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${Color.red_bold("✖")} ${text}\n`);
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
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${frame}${text}`);
    }
    /** write wrapper. */
    write(text) {
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
        process.stdout.write(text); // write the text
    }
}
//# sourceMappingURL=spinner.js.map