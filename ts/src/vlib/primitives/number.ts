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
}
export { NumberUtils as Number };
export { NumberUtils as number }; // for snake_case compatibility