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
export class TimeLimiter {
    private _duration: number;
    private _limit: number;
    private _counts: number;
    private _expiration: number;

    /**
     * Construct a new time limiter instance.
     * @docs
     */
    constructor(
        {
            duration = 60 * 1000,
            limit = 10,
        }: {
            duration?: number;
            limit?: number;
        } = {}
    ) {
        
        // Arguments.
        this._duration = duration;
        this._limit = limit;
        
        // Attributes.
        this._counts = 0;
        this._expiration = Date.now() + this._duration;
    }

    /**
     * Check if the current process is within the limit of the specified time frame.
     * @returns Returns true if the process is within limits, false otherwise
     * @docs
     */
    public limit(): boolean {
        const now = Date.now();
        if (now > this._expiration) {
            this._expiration = now + this._duration;
            this._counts = 0;
        }
        ++this._counts;
        return this._counts < this._limit;
    }
}
