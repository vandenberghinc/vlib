/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Truthy } from "../types/truthy.js";
/**
 * Object utilities.
 * @name Object
 * @nav System
 * @docs
 */
export declare namespace ObjectUtils {
    /**
     * Check if an object is a raw plain `object` so with the prototype of Object.
     * @docs
     */
    const is_plain: (val: any) => val is Record<string, any>;
    /**
     * Performs a deep equality check between two values.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns True if x and y are deeply equal, false otherwise.
     * @docs
     */
    function eq(x: any, y: any): boolean;
    /**
     * Create a partial copy of an object with only the specified keys.
     * @docs
     */
    function partial_copy<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
    /**
     * Perform a shallow copy of an object.
     * Recursively copies all nested arrays and `raw` objects, not functions, classes or other non-primitive types.
     * @docs
     */
    function shallow_copy<T>(input: T): T;
    /**
     * Performs a deep copy of an object.
     * Does not support classes, only primitive objects.
     * Using {@link structuredClone} when available.
     * @param obj The object to deep copy.
     * @returns A deep copy of the object.
     * @docs
     */
    function deep_copy<T>(obj: T): T;
    /**
     * Deeply freezes an object recursively.
     * @docs
     */
    function deep_freeze<T>(obj: T): T;
    /**
     * Recursively merges two object values.
     *
     * - If both values are objects, their keys are merged recursively.
     * - If both values are arrays, the override replaces the default.
     * - Otherwise, the override replaces the default.
     *
     * This function does not mutate its inputs; it returns a new merged object.
     *
     * @param defaults The base object containing default values.
     * @param overrides The object containing values to override defaults.
     * @returns A new object that is the deep merge of defaults and overrides.
     * @docs
     */
    function deep_merge<T extends Record<string, any>, U extends Record<string, any>>(defaults: T, overrides: U): T & U;
    /**
     * Detects changed keys between two objects.
     * @param x The original object.
     * @param y The modified object.
     * @param include_nested Whether to include nested changed keys.
     * @returns An array of changed keys or null if no changes.
     * @docs
     */
    function detect_changes(x: any, y: any, include_nested?: boolean): string[] | null;
    /**
    * Deletes keys from an object recursively, including nested objects and arrays.
    * @param obj The object to modify.
    * @param remove_keys An array of keys to remove.
    * @returns The modified object.
    * @docs
    */
    function delete_recursively<T>(obj: T, remove_keys?: string[]): T;
    /**
     * Expands object x with properties from object y.
     * Modifies x in place and returns it.
     * @param x The target object to expand.
     * @param y The source object with properties to add to x.
     * @returns The expanded object x.
     * @docs
     */
    function expand<T extends object, U extends object>(x: T, y: U): T & U;
    /**
     * Merge two objects in place.
     * Can be useful for casting an options object to an initialization object.
     * @docs
     */
    function merge<T extends object, U extends object>(ref: T, override: U): Omit<T, keyof U> & U;
    /**
     * Merge two objects in place, but only if the key does not exist in the first object or if its `undefined`.
     * @docs
     */
    function merge_missing<T extends object, U extends object>(ref: T, override: U): Omit<T, keyof U> & U;
    /**
     * Runtime implementation of TypeScript's Pick utility type.
     * Creates a new object with only the specified keys from the source object.
     *
     * @param obj - The source object to pick properties from
     * @param keys - Array of keys to pick from the source object
     * @returns A new object containing only the specified properties
     * @docs
     */
    function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
    /**
     * Stringify options.
     * @docs
     */
    interface StringifyOpts {
        /** The indent size, amount of spaces per indent level, defaults to `4`. Use `false` or `-1` to disable all indentation. */
        indent?: number | false | -1;
        /** The start indent level `number` or `false` to disable indentation. */
        start_indent?: number;
        /** Max nested depth to show, defaults to `undefined`. */
        max_depth?: number;
        /** Max output length, defaults to `undefined`. */
        max_length?: number;
        /** Filter options for the input object. See {@link FilterOpts} for more information. */
        filter?: FilterCallback | (FilterOpts & {
            callback: FilterCallback;
        });
        /** JSON mode, defaults to `false`. */
        json?: boolean;
        /** Colored mode, defaults to `false`. */
        colored?: boolean;
        /** System attributes. */
        _indent_str?: string;
    }
    /**
     * Stringify an object or any other type.
     * @param value The value to stringify.
     * @param opts The options for stringification. See {@link StringifyOpts} for more information.
     *
     * @note That when `opts.json` is true, it still might produce an invalid JSON string since it produces a string that shows circular references as `[Circular X]` etc.
     *
     * @docs
     */
    function stringify(value: any, opts?: StringifyOpts): string;
    /**
    * Filter options.
    * Also used by `Color`.
    *
    * @docs
    */
    interface FilterOpts {
        /**
         * If true, modifies the object in place, otherwise returns a new object.
         * Defaults to `false`.
         */
        update?: boolean;
        /**
         * If true, it handles nested objects as well.
         * Defaults to `false`.
         */
        recursive?: boolean;
    }
    /**
     * Filter callback type.
     *
     * @docs
     */
    type FilterCallback = (value: any, key: string, parents?: [string, any][]) => boolean;
    /**
     * Filter an object by a callback.
     *
     * @docs
     */
    function filter(...args: [Record<string, any>, FilterCallback | (FilterOpts & {
        callback: FilterCallback;
    })] | [Record<string, any>, FilterOpts, FilterCallback]): Record<string, any>;
    /**
     * Transform an object through a visit callback.
     *
     * - Visits each own enumerable property of obj in insertion order.
     * - For every property the callback may assign to out (the accumulating object).
     * - The walk aborts as soon as the callback returns a Truthy value.
     *
     * @template T Shape of the input object.
     * @template O Shape of the output object (optional).
     *
     * @param obj Source object to iterate.
     * @param visitor Visitor invoked for every key until it returns truthy.
     *
     * @returns The populated out object, typed as O.
     *
     * @example
     * ```ts
     * const out = transform(
     *   { a: 1, b: 2, c: 3 },
     *   (v, k, out) => {
     *     out[k] = v * 10;
     *     return v === 2;                // stop when we hit `b`
     *   }
     * ); // -> { a: 10, b: 20 }
     * ```
     *
     * @docs
     */
    function transform<T extends Record<any, any>, O extends Record<any, any> = Record<any, any>>(obj: T, visitor: (value: T[keyof T], key: keyof T, out: O, original: T) => Truthy): O;
}
export { ObjectUtils as Object };
export { ObjectUtils as object };
