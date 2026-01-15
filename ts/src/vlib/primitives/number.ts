/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * @note FRONTEND - This file should also be accessable from the frontend.
 */


/**
 * Number utilities.
 * @name Number
 * @docs
 */
namespace NumberUtils {
    /**
     * Generates a random integer between x and y, inclusive.
     * @param x The lower bound.
     * @param y The upper bound.
     * @returns A random integer between x and y.
     * @docs
     */
    export function random(x: number, y: number): number {
        if (typeof x !== 'number' || typeof y !== 'number' || x >= y) {
            throw new Error('Invalid input. x and y must be numbers, and x should be less than y.');
        }
        return Math.floor(Math.random() * (y - x + 1)) + x;
    }

    /**
     * Rounds a number using round half-up logic to a specified number of decimal places.
     * Positive decimals shifts precision to the right of the decimal point.
     * Negative decimals shifts precision to the left(e.g., tens, hundreds).
     * Half values(e.g., 1.2345 with decimals = 3) always round away from zero.
     * @param value - The number to round.
     * @param decimals - Number of decimal places to round to(can be negative).
     * @returns The rounded number.
     * @example
     * round(1.2345, 2); // → 1.23
     * round(1.2355, 2); // → 1.24
     * round(-1.2355, 2); // → -1.24
     * round(123.45, -1); // → 120
     * @docs
     */
    export function round(value: number, decimals = 0): number {
        if (!Number.isFinite(value)) return value;
        if (!Number.isFinite(decimals) || decimals === 0) {
            // Manual half-away-from-zero when decimals = 0
            return value === 0
                ? 0
                : (value > 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5));
        }

        
        // Shift, round manually half-up, then shift back
        const factor = Math.pow(10, decimals);
        const shifted = value * factor;
        const rounded = shifted === 0
                ? 0
                : shifted > 0
                    ? Math.floor(shifted + 0.5)
                    : Math.ceil(shifted - 0.5);
        return rounded / factor;
    }
}
export { NumberUtils as Number };
export { NumberUtils as number }; // for snake_case compatibility