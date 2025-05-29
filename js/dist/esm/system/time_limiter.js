/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/*  @docs:
    @chapter: System
    @title: Time Limiter
    @desc:
        The `TimeLimiter` class.
        This class can be used to limit a process based on a number of attempts during a specified timeframe. When the timeframe expires the attempts reset.
    @param:
        @name: duration
        @desc: The duration of one time window in milliseconds.
        @type: number
    @param:
        @name: limit
        @desc: The limit of attempts within the specified duration.
        @type: number
*/
export class TimeLimiter {
    _duration;
    _limit;
    _counts;
    _expiration;
    constructor({ duration = 60 * 1000, limit = 10, } = {}) {
        // Arguments.
        this._duration = duration;
        this._limit = limit;
        // Attributes.
        this._counts = 0;
        this._expiration = Date.now() + this._duration;
    }
    /*  @docs:
        @title: Limit
        @desc: Check if the current process is within the limit of the specified time frame.
        @returns:
            @type: boolean
            @desc: Returns true if the process is within limits, false otherwise
    */
    limit() {
        const now = Date.now();
        if (now > this._expiration) {
            this._expiration = now + this._duration;
            this._counts = 0;
        }
        ++this._counts;
        return this._counts < this._limit;
    }
}
//# sourceMappingURL=time_limiter.js.map