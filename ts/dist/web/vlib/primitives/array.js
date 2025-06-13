/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
/**
 * Refactored array utilities: namespace-based implementations.
 */
export var ArrayUtils;
(function (ArrayUtils) {
    /**
     * Appends items to the array.
     */
    function append(arr, ...items) {
        return arr.push(...items);
    }
    ArrayUtils.append = append;
    /**
     * Executes a handler for each element in the array.
     */
    function walk(arr, handler) {
        return arr.forEach(handler);
    }
    ArrayUtils.walk = walk;
    /**
     * Gets the first element of the array.
     */
    function first(arr) {
        return arr[0];
    }
    ArrayUtils.first = first;
    /**
     * Gets the last element of the array.
     */
    function last(arr) {
        return arr[arr.length - 1];
    }
    ArrayUtils.last = last;
    /**
     * Iteration function for arrays.
     */
    function iterate(arr, start, end, handler) {
        if (typeof start === "function") {
            handler = start;
            start = null;
        }
        if (start == null)
            start = 0;
        if (end == null)
            end = arr.length;
        for (let i = start; i < end; i++) {
            const res = handler(arr[i]);
            if (res != null && !(res instanceof Promise)) {
                return res;
            }
        }
        return null;
    }
    ArrayUtils.iterate = iterate;
    /**
     * Is any array, mutable or readonly.
     * Since Array.isArray only supports mutable arrays.
     */
    function is_any(x) {
        return Array.isArray(x);
    }
    ArrayUtils.is_any = is_any;
    /**
     * Asynchronous iteration function for arrays.
     */
    // export function iterate_async<T>(arr: T[], start: any, end?: any, handler?: (item: T) => Promise<any>): Promise<any>[] {
    //     if (typeof start === "function") {
    //         handler = start;
    //         start = null;
    //     }
    //     if (start == null) start = 0;
    //     if (end == null) end = arr.length;
    //     const promises: Promise<any>[] = [];
    //     for (let i = start; i < end; i++) {
    //         const res = handler!(arr[i]);
    //         if (res != null && res instanceof Promise) {
    //             promises.push(res);
    //         }
    //     }
    //     return promises;
    // }
    /**
     * Async-await iteration function for arrays.
     */
    // export async function iterate_async_await<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => Promise<R>): Promise<R | null> {
    //     if (typeof start === "function") {
    //         handler = start;
    //         start = null;
    //     }
    //     if (start == null) start = 0;
    //     if (end == null) end = arr.length;
    //     for (let i = start; i < end; i++) {
    //         const res = handler!(arr[i]);
    //         if (res != null && res instanceof Promise) {
    //             const pres = await res;
    //             if (pres != null) return pres;
    //         }
    //     }
    //     return null;
    // }
    /**
     * Iteration function that collects handler results.
     */
    // export function iterate_append<T, U>(arr: T[], start: any, end?: any, handler?: (item: T) => U): U[] {
    //     if (typeof start === "function") {
    //         handler = start;
    //         start = null;
    //     }
    //     if (start == null) start = 0;
    //     if (end == null) end = arr.length;
    //     const items: U[] = [];
    //     for (let i = start; i < end; i++) {
    //         items.push(handler!(arr[i]));
    //     }
    //     return items;
    // }
    /**
     * Iterate an array reversed.
     */
    function iterate_reversed(arr, start, end, handler) {
        if (handler == null && start != null) {
            handler = start;
            start = null;
        }
        if (start == null)
            start = 0;
        if (end == null)
            end = arr.length;
        for (let i = end - 1; i >= start; i--) {
            const res = handler(arr[i]);
            if (res != null && !(res instanceof Promise)) {
                return res;
            }
        }
        return null;
    }
    ArrayUtils.iterate_reversed = iterate_reversed;
    /**
     * Asynchronous reversed iteration.
     */
    // export function iterate_reversed_async<T>(arr: T[], start: any, end?: any, handler?: (item: T) => Promise<any>): Promise<any>[] {
    //     if (handler == null && start != null) {
    //         handler = start;
    //         start = null;
    //     }
    //     if (start == null) start = 0;
    //     if (end == null) end = arr.length;
    //     const promises: Promise<any>[] = [];
    //     for (let i = end - 1; i >= start; i--) {
    //         const res = handler!(arr[i]);
    //         if (res != null && res instanceof Promise) promises.push(res);
    //     }
    //     return promises;
    // }
    /**
     * Async-await reversed iteration.
     */
    // export async function iterate_reversed_async_await<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => Promise<R>): Promise<R | null> {
    //     if (handler == null && start != null) {
    //         handler = start;
    //         start = null;
    //     }
    //     if (start == null) start = 0;
    //     if (end == null) end = arr.length;
    //     for (let i = end - 1; i >= start; i--) {
    //         const res = handler!(arr[i]);
    //         if (res != null && res instanceof Promise) {
    //             const pres = await res;
    //             if (pres != null) return pres;
    //         }
    //     }
    //     return null;
    // }
    /**
     * Drop an item by value.
     */
    function drop(arr, item) {
        const dropped = [];
        for (const el of arr) {
            if (el !== item)
                dropped.push(el);
        }
        return dropped;
    }
    ArrayUtils.drop = drop;
    /**
     * Drop an item by index.
     */
    function drop_index(arr, index) {
        const dropped = [];
        for (let i = 0; i < arr.length; i++) {
            if (i !== index)
                dropped.push(arr[i]);
        }
        return dropped;
    }
    ArrayUtils.drop_index = drop_index;
    /**
     * Drop duplicate items from an array.
     */
    function drop_duplicates(arr) {
        return arr.reduce((acc, val) => {
            if (!acc.includes(val))
                acc.push(val);
            return acc;
        }, []);
    }
    ArrayUtils.drop_duplicates = drop_duplicates;
    /**
     * Limit from end, always creates a new array.
     */
    function limit_from_end(arr, limit) {
        const limited = [];
        if (arr.length > limit) {
            for (let i = arr.length - limit; i < arr.length; i++) {
                limited.push(arr[i]);
            }
        }
        else {
            limited.push(...arr);
        }
        return limited;
    }
    ArrayUtils.limit_from_end = limit_from_end;
    /**
     * Remove all items equal to the given item.
     */
    function remove(arr, item) {
        const removed = [];
        for (const el of arr) {
            if (el !== item)
                removed.push(el);
        }
        return removed;
    }
    ArrayUtils.remove = remove;
    /**
     * Returns `true` when `needle` appears in `haystack` as a **contiguous**
     * sub-array, scanning from `from` (default 0) up to `to` (inclusive).
     */
    function eq(haystack, needle, from = 0, to = haystack.length - 1) {
        if (needle.length === 0)
            return true; // empty set matches trivially
        if (needle.length > haystack.length)
            return false;
        const start = Math.max(0, from);
        const lastPossible = Math.min(to, haystack.length - 1) - needle.length + 1;
        for (let i = start; i <= lastPossible; i++) {
            let j = 0;
            for (; j < needle.length && haystack[i + j] === needle[j]; j++) { }
            if (j === needle.length)
                return true; // full match found
        }
        return false;
    }
    ArrayUtils.eq = eq;
    /**
     * Check if two arrays or nested structures are equal.
     */
    function deep_eq(x, y) {
        const compare = (a, b) => {
            if (Array.isArray(a)) {
                if (!Array.isArray(b) || a.length !== b.length)
                    return false;
                for (let i = 0; i < a.length; i++) {
                    if (typeof a[i] === 'object' || typeof b[i] === 'object') {
                        if (!compare(a[i], b[i]))
                            return false;
                    }
                    else if (a[i] !== b[i]) {
                        return false;
                    }
                }
                return true;
            }
            else if (typeof a === 'object') {
                if (typeof b !== 'object' || Array.isArray(b))
                    return false;
                const a_keys = Object.keys(a);
                const b_keys = Object.keys(b);
                if (!compare(a_keys, b_keys))
                    return false;
                for (const key of a_keys) {
                    if (typeof a[key] === 'object' || typeof b[key] === 'object') {
                        if (!compare(a[key], b[key]))
                            return false;
                    }
                    else if (a[key] !== b[key]) {
                        return false;
                    }
                }
                return true;
            }
            else {
                return a === b;
            }
        };
        return compare(x, y);
    }
    ArrayUtils.deep_eq = deep_eq;
    /**
     * Divide into nested arrays.
     */
    function divide(arr, x) {
        if (typeof x !== 'number' || x <= 0) {
            throw new Error('Number of nested arrays must be a positive number');
        }
        const result = [];
        const nested_len = Math.ceil(arr.length / x);
        for (let i = 0; i < arr.length; i += nested_len) {
            result.push(arr.slice(i, i + nested_len));
        }
        return result;
    }
    ArrayUtils.divide = divide;
})(ArrayUtils || (ArrayUtils = {}));
export { ArrayUtils as Array };
export { ArrayUtils as array }; // for snake_case compatibility
Array.prototype.append = Array.prototype.push;
Array.prototype.walk = Array.prototype.forEach;
Array.prototype.first = function () { return this[0]; };
Array.prototype.last = function () { return this[this.length - 1]; };
/** @deprecated Use `vlib.Array.iterate()` instead. */
Array.prototype.iterate = function (...args) { return ArrayUtils.iterate(this, ...args); };
//# sourceMappingURL=array.js.map