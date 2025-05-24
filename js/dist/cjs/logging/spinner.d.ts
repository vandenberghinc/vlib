/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
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
export declare class Spinner {
    /** The spinner frames to cycle through. */
    private readonly frames;
    /** Handle for the running interval timer. */
    private interval_handle;
    /** Index of the current frame in `frames`. */
    private frame_index;
    /** The prefix message shown before the spinner. */
    private prefix;
    /** Milliseconds between spinner frame updates. */
    private readonly interval_ms;
    /** Show timestamps */
    private timestamps;
    /**
     * Create a new Spinner.
     * @param prefix Optional text to display before the spinner.
     * @param opts.interval Milliseconds between spinner frame updates (default: 100).
     * @param opts.start Start the spinner upon construction (default: true).
     * @param opts.timestamps Show timestamps (default: true).
     */
    constructor(prefix?: string, opts?: {
        interval?: number;
        start?: boolean;
        timestamps?: boolean;
    });
    /** Is running. */
    get running(): boolean;
    get is_running(): boolean;
    /**
     * Start rendering the spinner to stdout.
     * If already started, this is a no-op.
     */
    start(): void;
    /**
     * Stop the spinner without marking success or failure.
     * Clears the current line.
     */
    stop(): void;
    /**
     * Stop the spinner and mark it as succeeded.
     * @param message Optional message to display after the success mark.
     */
    success(message?: string): void;
    /**
     * Stop the spinner and mark it as failed.
     * @param message Optional message to display after the failure mark.
     */
    error(message?: string): void;
    /**
     * Update the prefix message shown alongside the spinner.
     * @param prefix The new prefix text.
     */
    set_prefix(prefix: string): void;
    /**
     * Render the current spinner frame plus prefix to stdout.
     * Clears the line first, then writes spinner + prefix.
     */
    private render_frame;
    /** write wrapper. */
    private write;
}
