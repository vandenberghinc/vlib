/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
/**
 * Array utilities.
 * @name Array
 * @nav System
 * @docs
 */
export declare namespace ArrayUtils {
    /**
     * Appends items to the array.
     * @docs
     */
    function append<T>(arr: T[], ...items: T[]): number;
    /**
     * Executes a handler for each element in the array.
     * @docs
     */
    function walk<T>(arr: T[], handler: (item: T, index: number, array: T[]) => void): void;
    /**
     * Gets the first element of the array.
     * @docs
     */
    function first<T>(arr: T[]): T | undefined;
    /**
     * Gets the last element of the array.
     * @docs
     */
    function last<T>(arr: T[]): T | undefined;
    /**
     * Iteration function for arrays.
     * @docs
     */
    function iterate<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => R): R | null;
    /**
     * Is any array, mutable or readonly.
     * Since Array.isArray only supports mutable arrays.
     * @docs
     */
    function is_any<T>(x: any): x is T[] | readonly T[];
    /**
     * Iterate an array reversed.
     * @docs
     */
    function iterate_reversed<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => R): R | null;
    /**
     * Drop an item by value.
     * @docs
     */
    function drop<T>(arr: T[], item: T): T[];
    /**
     * Drop an item by index.
     * @docs
     */
    function drop_index<T>(arr: T[], index: number): T[];
    /**
     * Drop duplicate items from an array.
     * @docs
     */
    function drop_duplicates<T>(arr: T[]): T[];
    /**
     * Truncate an array to max length, the array remains the same
     * if the array's length is below `max`, otherwise its truncated to `max`.
     *
     * @param arr The array to truncate.
     * @param max The maximum length of the array.
     *
     * @docs
     */
    function truncate<T>(arr: T[], max: number): T[];
    /**
     * Limit from end, always creates a new array.
     * @docs
     */
    function limit_from_end<T>(arr: T[], limit: number): T[];
    /**
     * Remove all items equal to the given item.
     * @docs
     */
    function remove<T>(arr: T[], item: T): T[];
    /**
     * Returns `true` when `needle` appears in `haystack` as a **contiguous**
     * sub-array, scanning from `from` (default 0) up to `to` (inclusive).
     * @docs
     */
    function eq<T>(haystack: readonly T[], needle: readonly T[], from?: number, to?: number): boolean;
    /**
     * Check if two arrays or nested structures are equal.
     * @docs
     */
    function deep_eq(x: any[], y: any[]): boolean;
    /**
     * Divide into nested arrays.
     * @param arr The array to divide.
     * @param x The number of nested arrays to create.
     * @returns The nested arrays.
     * @docs
     */
    function divide<T>(arr: T[], x: number): T[][];
}
export { ArrayUtils as Array };
export { ArrayUtils as array };
/** Global array utilities. */
declare global {
    interface Array<T> {
        /** Alias for `push`. */
        append(...items: T[]): number;
        /** Alias for `forEach`. */
        walk(callback: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    }
}
export {};
