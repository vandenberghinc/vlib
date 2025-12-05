/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Color } from "../../generic/colors.js";
import { Date } from "../../primitives/date.js";

/**
 * A CLI percentage‐based progress loader.
 *
 * Example:
 * ```ts
 * const loader = new PercentageLoader("Downloading", {
 *   min: 0,
 *   max: 100,
 *   width: 40,
 *   fill: "█",
 *   empty: " ",
 *   show_percent: true,
 *   show_count: true
 * });
 * loader.start();
 * for (let i = 0; i <= 100; i++) {
 *   loader.next();
 *   await sleep(50);
 * }
 * loader.succeed("Download complete");
 * ```
 * 
 * @nav Logging
 * @docs
 */
export class Loader {
    
    /** Minimum value of the range. */
    private min_value: number;
    
    /** Maximum value of the range. */
    private max_value: number;
    
    /** Current progress value. */
    private current_value: number;
    
    /** Total width (in chars) of the progress bar. */
    private width: number;
    
    /** Character used for filled portion of the bar. */
    private fill: string;
    
    /** Character used for empty portion of the bar. */
    private empty: string;
    
    /** Prefix message shown before the bar. */
    private prefix: string;
    
    /** Whether to display numeric percentage. */
    private show_percent: boolean;
    
    /** Whether to display raw count [current/max]. */
    private show_count: boolean;

    /** Show timestamps */
    private timestamps: boolean;

    /**
     * Create a new PercentageLoader.
     * @param prefix Optional prefix text.
     * @param opts Configuration options.
     * @param opts.min start of the range (default 0)
     * @param opts.max end of the range (default 100)
     * @param opts.width number of characters for the bar (default 30)
     * @param opts.fill character for filled portion (default '█')
     * @param opts.empty character for empty portion (default ' ')
     * @param opts.show_percent display percentage number (default true)
     * @param opts.show_count display [current/max] (default false)
     * @param opts.timestamps Show timestamps (default: true).
     * 
     * @docs
     */
    constructor(
        prefix?: string,
        opts?: {
            min?: number;
            max?: number;
            width?: number;
            fill?: string;
            empty?: string;
            show_percent?: boolean;
            show_count?: boolean;
            timestamps?: boolean;
        }
    ) {
        this.prefix = prefix ?? "";
        this.min_value = opts?.min ?? 0;
        this.max_value = opts?.max ?? 100;
        this.current_value = this.min_value;
        this.width = opts?.width ?? 30;
        this.fill = opts?.fill ?? "█";
        this.empty = opts?.empty ?? " ";
        this.show_percent = opts?.show_percent ?? true;
        this.show_count = opts?.show_count ?? false;
        this.timestamps = opts?.timestamps ?? true;
    }

    /**
     * Start the loader: resets to minimum and renders initial bar.
     * 
     * @docs
     */
    start(): void {
        this.current_value = this.min_value;
        this.render();
    }

    /**
     * Advance the loader by `step` (default = 1) and re-render.
     * @param step Amount to increment (default 1).
     * 
     * @docs
     */
    next(step: number = 1): void {
        this.update(this.current_value + step);
    }

    /**
     * Set the loader to an absolute value and re-render.
     * Clamps between min and max.
     * @param value New progress value.
     * 
     * @docs
     */
    update(value: number): void {
        this.current_value = Math.min(
            this.max_value,
            Math.max(this.min_value, value)
        );
        this.render();
    }

    /**
     * Stop the loader without success/failure, clearing the line.
     * 
     * @docs
     */
    stop(): void {
        process.stdout.write("\r\x1b[K");
    }

    /**
     * Stop the loader and mark as succeeded.
     * @param message Optional completion message.
     * 
     * @docs
     */
    success(message?: string): void {
        this.stop();
        const text = message ?? this.prefix;
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${Color.green_bold("✔")} ${text}\n`);
    }

    /**
     * Stop the loader and mark as failed.
     * @param message Optional error message.
     * 
     * @docs
     */
    error(message?: string): void {
        this.stop();
        const text = message ?? this.prefix;
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write(`${prefix}${Color.green_bold("✖")} ${text}\n`);
    }

    /**
     * Update the prefix message.
     * @param prefix New prefix text.
     * 
     * @docs
     */
    set_prefix(prefix: string): void {
        this.prefix = prefix;
        this.render();
    }

    /**
     * Get the current progress ratio in [0,1].
     * 
     * @docs
     */
    get ratio(): number {
        return (this.current_value - this.min_value) /
            (this.max_value - this.min_value);
    }

    /**
     * Get the current percentage (0–100).
     * 
     * @docs
     */
    get percent(): number {
        return Math.round(this.ratio * 100);
    }

    /**
     * Render the progress bar line.
     * Clears the current line, then writes prefix + bar + optional stats.
     */
    private render(): void {
        const filled_length = Math.round(this.ratio * this.width);
        const bar =
            this.fill.repeat(filled_length) +
            this.empty.repeat(this.width - filled_length);
        const parts = [`[${bar}]`];
        if (this.show_percent) parts.push(`${this.percent}%`);
        if (this.show_count)
            parts.push(`[${this.current_value}/${this.max_value}]`);
        const prefix = !this.timestamps ? '' : `${Color.gray(new Date().format("%d-%m-%y %H:%M:%S"))}: `;
        this.write([prefix, this.prefix, ...parts].filter(Boolean).join(" "));
    }

    /** write wrapper. */
    private write(text: string): void {
        process.stdout.write('\r'); // move to column 0
        process.stdout.write('\x1b[K'); // clear from cursor to end of line
        process.stdout.write(text); // write the text
    }
}
  