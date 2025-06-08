/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
export declare namespace ObjectUtils {
    /**
     * Expands object x with properties from object y.
     * Modifies x in place and returns it.
     * @param x The target object to expand.
     * @param y The source object with properties to add to x.
     * @returns The expanded object x.
     */
    function expand<T extends object, U extends object>(x: T, y: U): T & U;
    /**
     * Performs a deep equality check between two values.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns True if x and y are deeply equal, false otherwise.
     */
    function eq(x: any, y: any): boolean;
    /**
     * Merge two objects in place.
     * Can be useful for casting an options object to an initialization object.
     */
    function merge<T extends object, U extends object>(ref: T, override: U): Omit<T, keyof U> & U;
    /**
     * Merge two objects in place, but only if the key does not exist in the first object or if its `undefined`.
     */
    function merge_missing<T extends object, U extends object>(ref: T, override: U): Omit<T, keyof U> & U;
    /**
     * Detects changed keys between two objects.
     * @param x The original object.
     * @param y The modified object.
     * @param include_nested Whether to include nested changed keys.
     * @returns An array of changed keys or null if no changes.
     */
    function detect_changes(x: any, y: any, include_nested?: boolean): string[] | null;
    /**
     * Filter options.
     * Also used by `Color`.
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
     */
    type FilterCallback = (value: any, key: string, parents?: [string, any][]) => boolean;
    /**
     * Filter an object by a callback.
     */
    function filter(obj: Record<string, any>, opts: FilterCallback | (FilterOpts & {
        callback: FilterCallback;
    })): Record<string, any>;
    function filter(obj: Record<string, any>, callback: FilterCallback, opts?: FilterOpts): Record<string, any>;
    /**
    * Deletes keys from an object recursively, including nested objects and arrays.
    * @param obj The object to modify.
    * @param remove_keys An array of keys to remove.
    * @returns The modified object.
    */
    function delete_recursively<T>(obj: T, remove_keys?: string[]): T;
    /**
     * Create a partial copy of an object with only the specified keys.
     */
    function partial_copy<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
    /** Check if an object is a raw record `object` so with the prototype of Object. */
    const is_record: (val: any) => val is Record<string, any>;
    /**
     * Perform a shallow copy of an object.
     * Recursively copies all nested arrays and `raw` objects, not functions, classes or other non-primitive types.
     */
    function shallow_copy<T>(input: T): T;
    /**
     * Performs a deep copy of an object.
     * Does not support classes, only primitive objects.
     * @param obj The object to deep copy.
     * @returns A deep copy of the object.
     */
    function deep_copy<T>(obj: T): T;
    /** Stringify options. */
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
     */
    function stringify(value: any, opts?: StringifyOpts): string;
    /**
    * Renames keys in an object, updates the object in place.
    * @param obj The object to rename keys in.
    * @param rename An array of [oldKey, newKey] pairs.
    * @param remove An array of keys to remove from the object.
    * @returns The modified object reference.
    * @legacy
    */
    function rename_keys(obj: Record<string, any>, rename?: [string, string][], remove?: string[]): Record<string, any>;
}
export { ObjectUtils as Object };
export { ObjectUtils as object };
