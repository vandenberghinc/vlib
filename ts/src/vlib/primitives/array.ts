/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * @note FRONTEND - This file should also be accessable from the frontend.
 */

/**
 * Refactored array utilities: namespace-based implementations.
 */
export namespace ArrayUtils {
    /**
     * Appends items to the array.
     */
    export function append<T>(arr: T[], ...items: T[]): number {
        return arr.push(...items);
    }

    /**
     * Executes a handler for each element in the array.
     */
    export function walk<T>(arr: T[], handler: (item: T, index: number, array: T[]) => void): void {
        return arr.forEach(handler);
    }

    /**
     * Gets the first element of the array.
     */
    export function first<T>(arr: T[]): T | undefined {
        return arr[0];
    }

    /**
     * Gets the last element of the array.
     */
    export function last<T>(arr: T[]): T | undefined {
        return arr[arr.length - 1];
    }

    /**
     * Iteration function for arrays.
     */
    export function iterate<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => R): R | null {
        if (typeof start === "function") {
            handler = start;
            start = null;
        }
        if (start == null) start = 0;
        if (end == null) end = arr.length;
        for (let i = start; i < end; i++) {
            const res = handler!(arr[i]);
            if (res != null && !(res instanceof Promise)) {
                return res;
            }
        }
        return null;
    }

    /**
     * Is any array, mutable or readonly.
     * Since Array.isArray only supports mutable arrays.
     */
    export function is_any<T>(x: any): x is T[] | readonly T[] {
        return Array.isArray(x);
    }

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
    export function iterate_reversed<T, R>(arr: T[], start: any, end?: any, handler?: (item: T) => R): R | null {
        if (handler == null && start != null) {
            handler = start;
            start = null;
        }
        if (start == null) start = 0;
        if (end == null) end = arr.length;
        for (let i = end - 1; i >= start; i--) {
            const res = handler!(arr[i]);
            if (res != null && !(res instanceof Promise)) {
                return res;
            }
        }
        return null;
    }

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
    export function drop<T>(arr: T[], item: T): T[] {
        const dropped: T[] = [];
        for (const el of arr) {
            if (el !== item) dropped.push(el);
        }
        return dropped;
    }

    /**
     * Drop an item by index.
     */
    export function drop_index<T>(arr: T[], index: number): T[] {
        const dropped: T[] = [];
        for (let i = 0; i < arr.length; i++) {
            if (i !== index) dropped.push(arr[i]);
        }
        return dropped;
    }

    /**
     * Drop duplicate items from an array.
     */
    export function drop_duplicates<T>(arr: T[]): T[] {
        return arr.reduce((acc: T[], val) => {
            if (!acc.includes(val)) acc.push(val);
            return acc;
        }, []);
    }

    /**
     * Limit from end, always creates a new array.
     */
    export function limit_from_end<T>(arr: T[], limit: number): T[] {
        const limited: T[] = [];
        if (arr.length > limit) {
            for (let i = arr.length - limit; i < arr.length; i++) {
                limited.push(arr[i]);
            }
        } else {
            limited.push(...arr);
        }
        return limited;
    }

    /**
     * Remove all items equal to the given item.
     */
    export function remove<T>(arr: T[], item: T): T[] {
        const removed: T[] = [];
        for (const el of arr) {
            if (el !== item) removed.push(el);
        }
        return removed;
    }

    /**
     * Returns `true` when `needle` appears in `haystack` as a **contiguous**
     * sub-array, scanning from `from` (default 0) up to `to` (inclusive).
     */
    export function eq<T>(
        haystack: readonly T[],
        needle: readonly T[],
        from = 0,
        to: number = haystack.length - 1
    ): boolean {
        if (needle.length === 0) return true;                // empty set matches trivially
        if (needle.length > haystack.length) return false;

        const start = Math.max(0, from);
        const lastPossible = Math.min(to, haystack.length - 1) - needle.length + 1;

        for (let i = start; i <= lastPossible; i++) {
            let j = 0;
            for (; j < needle.length && haystack[i + j] === needle[j]; j++) { }
            if (j === needle.length) return true;              // full match found
        }
        return false;
    }

    /**
     * Check if two arrays or nested structures are equal.
     */
    export function deep_eq(x: any[], y: any[]): boolean {
        const compare = (a: any, b: any): boolean => {
            if (Array.isArray(a)) {
                if (!Array.isArray(b) || a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                    if (typeof a[i] === 'object' || typeof b[i] === 'object') {
                        if (!compare(a[i], b[i])) return false;
                    } else if (a[i] !== b[i]) {
                        return false;
                    }
                }
                return true;
            } else if (typeof a === 'object') {
                if (typeof b !== 'object' || Array.isArray(b)) return false;
                const a_keys = Object.keys(a);
                const b_keys = Object.keys(b);
                if (!compare(a_keys, b_keys)) return false;
                for (const key of a_keys) {
                    if (typeof a[key] === 'object' || typeof b[key] === 'object') {
                        if (!compare(a[key], b[key])) return false;
                    } else if (a[key] !== b[key]) {
                        return false;
                    }
                }
                return true;
            } else {
                return a === b;
            }
        };
        return compare(x, y);
    }

    /**
     * Divide into nested arrays.
     */
    export function divide<T>(arr: T[], x: number): T[][] {
        if (typeof x !== 'number' || x <= 0) {
            throw new Error('Number of nested arrays must be a positive number');
        }
        const result: T[][] = [];
        const nested_len = Math.ceil(arr.length / x);
        for (let i = 0; i < arr.length; i += nested_len) {
            result.push(arr.slice(i, i + nested_len));
        }
        return result;
    }
}
export { ArrayUtils as Array };
export { ArrayUtils as array }; // for snake_case compatibility

/** Extend global array with some basic methods. */
declare global {
    interface Array<T> {
        append(...items: T[]): number;
        walk: Array<T>["forEach"];
        first(): T | undefined;
        last(): T | undefined;
        /** @deprecated Use `vlib.Array.iterate()` instead. */
        iterate(handler: (item: T, index: number, array: T[]) => any): any;
        /** @deprecated Use `vlib.Array.iterate()` instead. */
        iterate(start: number, handler: (item: T, index: number, array: T[]) => any): any;
        /** @deprecated Use `vlib.Array.iterate()` instead. */
        iterate(start: number, end: number, handler: (item: T, index: number, array: T[]) => any): any;
    }
}
Array.prototype.append = Array.prototype.push; 
Array.prototype.walk = Array.prototype.forEach; 
Array.prototype.first = function <T>(): T | undefined { return this[0]; };
Array.prototype.last = function <T>(): T | undefined { return this[this.length - 1]; };
/** @deprecated Use `vlib.Array.iterate()` instead. */
Array.prototype.iterate = function <T>(this: Array<T>, ...args: any[]): any { return ArrayUtils.iterate(this, ...args as [any]); };
