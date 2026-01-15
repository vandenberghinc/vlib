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
declare namespace NumberUtils {
    /**
     * Generates a random integer between x and y, inclusive.
     * @param x The lower bound.
     * @param y The upper bound.
     * @returns A random integer between x and y.
     * @docs
     */
    function random(x: number, y: number): number;
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
    function round(value: number, decimals?: number): number;
}
export { NumberUtils as Number };
export { NumberUtils as number };
