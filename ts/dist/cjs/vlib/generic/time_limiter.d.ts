/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * The `TimeLimiter` class.
 * This class can be used to limit a process based on a number of attempts during a specified timeframe. When the timeframe expires the attempts reset.
 * @param duration The duration of one time window in milliseconds.
 * @param limit The limit of attempts within the specified duration.
 * @nav System
 * @docs
 */
export declare class TimeLimiter {
    private _duration;
    private _limit;
    private _counts;
    private _expiration;
    /**
     * Construct a new time limiter instance.
     * @docs
     */
    constructor({ duration, limit, }?: {
        duration?: number;
        limit?: number;
    });
    /**
     * Check if the current process is within the limit of the specified time frame.
     * @returns Returns true if the process is within limits, false otherwise
     * @docs
     */
    limit(): boolean;
}
