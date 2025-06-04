/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
export declare class TimeLimiter {
    private _duration;
    private _limit;
    private _counts;
    private _expiration;
    constructor({ duration, limit, }?: {
        duration?: number;
        limit?: number;
    });
    limit(): boolean;
}
