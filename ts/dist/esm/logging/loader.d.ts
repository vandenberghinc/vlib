/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
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
 */
export declare class Loader {
    /** Minimum value of the range. */
    private min_value;
    /** Maximum value of the range. */
    private max_value;
    /** Current progress value. */
    private current_value;
    /** Total width (in chars) of the progress bar. */
    private width;
    /** Character used for filled portion of the bar. */
    private fill;
    /** Character used for empty portion of the bar. */
    private empty;
    /** Prefix message shown before the bar. */
    private prefix;
    /** Whether to display numeric percentage. */
    private show_percent;
    /** Whether to display raw count [current/max]. */
    private show_count;
    /** Show timestamps */
    private timestamps;
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
     */
    constructor(prefix?: string, opts?: {
        min?: number;
        max?: number;
        width?: number;
        fill?: string;
        empty?: string;
        show_percent?: boolean;
        show_count?: boolean;
        timestamps?: boolean;
    });
    /**
     * Start the loader: resets to minimum and renders initial bar.
     */
    start(): void;
    /**
     * Advance the loader by `step` (default = 1) and re-render.
     * @param step Amount to increment (default 1).
     */
    next(step?: number): void;
    /**
     * Set the loader to an absolute value and re-render.
     * Clamps between min and max.
     * @param value New progress value.
     */
    update(value: number): void;
    /**
     * Stop the loader without success/failure, clearing the line.
     */
    stop(): void;
    /**
     * Stop the loader and mark as succeeded.
     * @param message Optional completion message.
     */
    success(message?: string): void;
    /**
     * Stop the loader and mark as failed.
     * @param message Optional error message.
     */
    error(message?: string): void;
    /**
     * Update the prefix message.
     * @param prefix New prefix text.
     */
    set_prefix(prefix: string): void;
    /**
     * Get the current progress ratio in [0,1].
     */
    get ratio(): number;
    /**
     * Get the current percentage (0–100).
     */
    get percent(): number;
    /**
     * Render the progress bar line.
     * Clears the current line, then writes prefix + bar + optional stats.
     */
    private render;
    /** write wrapper. */
    private write;
}
