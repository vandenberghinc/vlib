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

    /**
     * Create a new Spinner.
     * @param prefix Optional text to display before the spinner.
     * @param opts.interval Milliseconds between spinner frame updates (default: 100).
     * @param opts.start Start the spinner upon construction (default: true).
     * @param opts.timestamps Show timestamps (default: true).
     */
    constructor(prefix?: string, opts?: { interval?: number, start?: boolean, timestamps?: boolean }) {
        this.prefix = prefix ?? '';
        this.interval_ms = opts?.interval || 100;
        if (opts?.start !== false) {
            this.start();
        }
        this.timestamps = opts?.timestamps ?? true;
    }

    /** Is running. */
    get running(): boolean { return this.interval_handle != null; }
    get is_running(): boolean { return this.interval_handle != null; }

    /**
     * Start rendering the spinner to stdout.
     * If already started, this is a no-op.
     */
    start(): void {
        if (this.interval_handle) return;
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
    stop(): void {
        if (!this.interval_handle) return;
        clearInterval(this.interval_handle);
        this.interval_handle = null;
        process.stdout.write('\r\x1b[K');
    }

    /**
     * Stop the spinner and mark it as succeeded.
     * @param message Optional message to display after the success mark.
     */
    success(message?: string): void {
        this.stop();
        const text = message ?? this.prefix;
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${Color.green_bold("✔")} ${text}\n`);
    }

    /**
     * Stop the spinner and mark it as failed.
     * @param message Optional message to display after the failure mark.
     */
    error(message?: string): void {
        this.stop();
        const text = message ?? this.prefix;
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${Color.red_bold("✖")} ${text}\n`);
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
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${frame}${text}`);
    }

    /** write wrapper. */
    private write(text: string): void {
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
        process.stdout.write(text); // write the text
    }
}
  