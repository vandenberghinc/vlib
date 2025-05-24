/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Functions.

// Time limiter.
/*  @docs:
    @chapter: System
    @title: Time Limiter.
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
vlib.TimeLimiter = class TimeLimiter {
    
    // Constructor.
    constructor({
        duration = 60 * 1000,
        limit = 10,

    }) {

        // Arguments.
        this._duration = duration;
        this._limit = limit;

        // Attributes.
        this._counts = 0;
        this._expiration = Date.now() + this._duration;
    }

    // Limit.
    /*  @docs:
        @title: Limit
        @desc: Check if the current process is within the limit of the specified time frame.
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