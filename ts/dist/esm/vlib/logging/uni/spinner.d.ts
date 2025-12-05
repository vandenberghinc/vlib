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
 *
 * @nav Logging/Spinners
 * @docs
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
    /** Default start/stop/success message. */
    private start_message?;
    private stop_message?;
    private success_message?;
    /**
     * Create a new Spinner.
     * @param prefix Optional text to display before the spinner.
     * @param opts.interval Milliseconds between spinner frame updates (default: 100).
     * @param opts.auto_start Start the spinner upon construction (default: true).
     * @param opts.timestamps Show timestamps (default: true).
     * @param opts.start Optional default message to display when starting the spinner with `start()` or by `auto_start`.
     * @param opts.success Optional default message to display when stopping the spinner with `success()`.
     * @param opts.stop Optional default message to display when stopping the spinner with `stop()`.
     *
     * @docs
     */
    constructor(opts: string | {
        message: string;
        interval?: number;
        auto_start?: boolean;
        timestamps?: boolean;
        start?: string;
        stop?: string;
        success?: string;
    });
    /**
     * Is running.
     * @docs
     */
    get running(): boolean;
    /**
     * Is running.
     * @docs
     */
    get is_running(): boolean;
    /**
     * Start rendering the spinner to stdout.
     * If already started, this is a no-op.
     * @docs
     */
    start(): void;
    /**
     * Stop the spinner without marking success or failure.
     * Clears the current line.
     * @docs
     */
    stop(message?: string): void;
    /**
     * Pause the spinner, preserving the current frame.
     * If not running, this is a no-op.
     * @docs
     */
    pause(): void;
    /**
     * Pause, then call callback, then resume the spinner.
     * Allowing for safe logging during the spinner.
     * @docs
     */
    safe_log(cb: () => void): void;
    /**
     * Resume the spinner from a paused state.
     * If already running, this is a no-op.
     * @docs
     */
    resume(): void;
    /**
     * Stop the spinner and mark it as succeeded.
     * @param message Optional message to display after the success mark.
     * @docs
     */
    success(message?: string): void;
    /**
     * Stop the spinner and mark it as failed.
     * @param message Optional message to display after the failure mark.
     * @docs
     */
    error(message?: string): void;
    /**
     * Update the prefix message shown alongside the spinner.
     * @param prefix The new prefix text.
     * @docs
     */
    set_prefix(prefix: string): void;
    /**
     * Render the current spinner frame plus prefix to stdout.
     * Clears the line first, then writes spinner + prefix.
     */
    private render_frame;
    /** write wrapper. */
    private raw_write;
    private opt_timestamp_write;
}
