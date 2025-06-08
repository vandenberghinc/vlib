/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Color } from "../../generic/colors.js";
import { Date } from "../../primitives/date.js";
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
    private readonly frames: string[] = [
        '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'
    ];

    /** Handle for the running interval timer. */
    private interval_handle: NodeJS.Timeout | null = null;
    
    /** Index of the current frame in `frames`. */
    private frame_index = 0;
    
    /** The prefix message shown before the spinner. */
    private prefix: string;
    
    /** Milliseconds between spinner frame updates. */
    private readonly interval_ms: number;

    /** Show timestamps */
    private timestamps: boolean;

    /** Default start/stop/success message. */
    private start_message?: string;
    private stop_message?: string;
    private success_message?: string;

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
    constructor(opts: string | {
        message: string,
        interval?: number,
        auto_start?: boolean,
        timestamps?: boolean,
        start?: string,
        stop?: string,
        success?: string,
    }) {
        if (typeof opts === 'string') {
            opts = { message: opts };
        }
        this.prefix = opts.message ?? '';
        this.interval_ms = opts?.interval || 100;
        this.timestamps = opts?.timestamps ?? true; // @warning dont change default to false by default, vlib and other libs depend on this.
        this.start_message = opts?.start; 
        this.success_message = opts?.success; 
        this.stop_message = opts?.stop;
        if (opts?.auto_start !== false) {  // @warning dont change default to false by default, vlib and other libs depend on this.
            this.start();
        }
    }

    /** Is running. */
    get running(): boolean { return this.interval_handle != null; }
    get is_running(): boolean { return this.interval_handle != null; }

    /**
     * Start rendering the spinner to stdout.
     * If already started, this is a no-op.
     */
    start(): void {

        // Start the spinner.
        if (this.interval_handle) return;
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
    stop(message?: string): void {

        // Stop the spinner.
        if (!this.interval_handle) return;
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
    pause(): void {
        if (!this.interval_handle) return;
        clearInterval(this.interval_handle);
        this.interval_handle = null;
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
    }

    /**
     * Pause, then call callback, then resume the spinner.
     * Allowing for safe logging during the spinner.
     */
    safe_log(cb: () => void): void {
        this.pause();
        cb();
        this.resume();
    }

    /**
     * Resume the spinner from a paused state.
     * If already running, this is a no-op.
     */
    resume(): void {
        if (this.interval_handle) return;
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
    success(message?: string): void {
        message ??= this.success_message;
        this.stop();
        const text = message ?? this.prefix;
        this.opt_timestamp_write(`${Color.green_bold("✔")} ${text}\n`);
    }

    /**
     * Stop the spinner and mark it as failed.
     * @param message Optional message to display after the failure mark.
     */
    error(message?: string): void {
        this.stop();
        const text = message ?? this.prefix;
        this.opt_timestamp_write(`${Color.red_bold("✖")} ${text}\n`);
    }

    /**
     * Update the prefix message shown alongside the spinner.
     * @param prefix The new prefix text.
     */
    set_prefix(prefix: string): void {
        this.prefix = prefix;
    }

    /**
     * Render the current spinner frame plus prefix to stdout.
     * Clears the line first, then writes spinner + prefix.
     */
    private render_frame(): void {
        const frame = this.frames[this.frame_index];
        const text = this.prefix ? ` ${this.prefix}` : '';
        this.opt_timestamp_write(`${frame}${text}`);
    }

    /** write wrapper. */
    private raw_write(text: string): void {
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
        process.stdout.write(text); // write the text
    }
    private opt_timestamp_write(text: string): void {
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.raw_write(prefix + text);
    }
}
  