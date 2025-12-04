/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Truthy } from "../types/truthy.js";
import { Color, Colors } from "../generic/colors.js";

export namespace ObjectUtils {

    /** Check if an object is a raw plain `object` so with the prototype of Object. */
    export const is_plain = (val: any): val is Record<string, any> =>
        val !== null && typeof val === 'object' && !Array.isArray(val)
        && Object.getPrototypeOf(val) === Object.prototype;

    // Internal helper: deep equality / change detection
    function obj_eq(
        x: any,
        y: any,
        detect_keys = false,
        detect_keys_nested = false
    ): boolean | string[] | null {
        if (typeof x !== typeof y) {
            return false;
        } else if (x instanceof String) {
            return x.toString() === y.toString();
        } else if (Array.isArray(x)) {
            if (!Array.isArray(y) || x.length !== y.length) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (!obj_eq(x[i], y[i])) {
                    return false;
                }
            }
            return true;
        } else if (x && typeof x === 'object') {
            const changes: string[] = [];
            const x_keys = Object.keys(x);
            const y_keys = Object.keys(y);
            if (x_keys.length !== y_keys.length) {
                return false;
            }
            for (const key of x_keys) {
                const result = obj_eq(
                    x[key],
                    (y as any)[key],
                    detect_keys,
                    detect_keys_nested
                );
                if (detect_keys) {
                    if (result === true) {
                        changes.push(key);
                    } else if (
                        Array.isArray(result) && result.length > 0
                    ) {
                        changes.push(key);
                        if (detect_keys_nested) {
                            changes.push(...result);
                        }
                    }
                } else if (result !== true) {
                    return false;
                }
            }
            return detect_keys ? (changes.length ? changes : null) : true;
        } else {
            return x === y;
        }
    }

    /**
     * Performs a deep equality check between two values.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns True if x and y are deeply equal, false otherwise.
     */
    export function eq(x: any, y: any): boolean {
        return obj_eq(x, y) as boolean;
    }

    /**
     * Create a partial copy of an object with only the specified keys.
     */
    export function partial_copy<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        const out: Partial<T> = {};
        for (const key of keys) {
            if (key in obj) {
                out[key] = obj[key];
            }
        }
        return out as Pick<T, K>;
    }


    /**
     * Perform a shallow copy of an object.
     * Recursively copies all nested arrays and `raw` objects, not functions, classes or other non-primitive types.
     */
    export function shallow_copy<T>(input: T): T {

        const visit = (value: any): any => {
            if (Array.isArray(value)) {
                // Shallow copy the array and visit each element
                return value.map(item => {
                    if (Array.isArray(item) || is_plain(item)) {
                        return visit(item);
                    }
                    return item;
                });
            }

            if (is_plain(value)) {
                // Shallow copy object and visit its properties
                const copy: Record<string, any> = {};
                for (const key in value) {
                    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
                    const val = value[key];
                    if (Array.isArray(val) || is_plain(val)) {
                        copy[key] = visit(val);
                    } else {
                        copy[key] = val;
                    }
                }
                return copy;
            }

            return value; // Primitive or other non-copyable type
        };

        return visit(input);
    }
    
    /**
     * Performs a deep copy of an object.
     * Does not support classes, only primitive objects.
     * Using {@link structuredClone} when available.
     * @param obj The object to deep copy.
     * @returns A deep copy of the object.
     */
    export function deep_copy<T>(obj: T): T {
        if (typeof globalThis.structuredClone === "function") {
            return structuredClone(obj);
        }
        return deep_copy_internal(obj);
    }

    /**
     * Deeply freezes an object recursively.
     */
    export function deep_freeze<T>(obj: T): T {
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach((prop) => {
            const value: any = (obj as any)[prop];
            if (value && (typeof value === "object" || typeof value === "function") && !Object.isFrozen(value)) {
                deep_freeze(value);
            }
        });
        return obj;
    }

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
     */
    export function deep_merge<T extends Record<string, any>, U extends Record<string, any>>(
        defaults: T,
        overrides: U
    ): T & U {
        const is_object = (value: unknown): value is Record<string, any> =>
            value !== null && typeof value === "object" && !Array.isArray(value);

        const merge_recursive = (base: any, override: any): any => {
            if (is_object(base) && is_object(override)) {
                const result: Record<string, any> = { ...base };
                for (const key of Object.keys(override)) {
                    result[key] =
                        override[key] === undefined
                            ? base[key]
                            : merge_recursive(base[key], override[key]);
                }
                return result;
            }
            return override;
        };

        return merge_recursive(defaults, overrides);
    }

    // Internal helper: deep copy implementation
    function deep_copy_internal(obj: any): any {
        if (Array.isArray(obj)) {
            const copy: any[] = [];
            for (const item of obj) {
                copy.push(deep_copy_internal(item));
            }
            return copy;
        } else if (obj && obj instanceof String) {
            return new String(obj.toString());
        } else if (obj && typeof obj === 'object') {
            const copy: any = {};
            for (const key of Object.keys(obj)) {
                copy[key] = deep_copy_internal((obj as any)[key]);
            }
            return copy;
        } else {
            return obj;
        }
    }

    /**
     * Detects changed keys between two objects.
     * @param x The original object.
     * @param y The modified object.
     * @param include_nested Whether to include nested changed keys.
     * @returns An array of changed keys or null if no changes.
     */
    export function detect_changes(x: any, y: any, include_nested = false): string[] | null {
        return obj_eq(x, y, true, include_nested) as string[] | null;
    }

    /**
    * Deletes keys from an object recursively, including nested objects and arrays.
    * @param obj The object to modify.
    * @param remove_keys An array of keys to remove.
    * @returns The modified object.
    */
    export function delete_recursively<T>(obj: T, remove_keys: string[] = []): T {
        function clean(o: any): void {
            if (Array.isArray(o)) {
                for (const item of o) {
                    if (item && typeof item === 'object') clean(item);
                }
            } else if (o && typeof o === 'object') {
                for (const key of Object.keys(o)) {
                    if (remove_keys.includes(key)) {
                        delete o[key];
                    } else if (o[key] && typeof o[key] === 'object') {
                        clean(o[key]);
                    }
                }
            }
        }
        clean(obj);
        return obj;
    }

    /**
     * Expands object x with properties from object y.
     * Modifies x in place and returns it.
     * @param x The target object to expand.
     * @param y The source object with properties to add to x.
     * @returns The expanded object x.
     */
    export function expand<T extends object, U extends object>(x: T, y: U): T & U {
        const keys = Object.keys(y) as (keyof U)[];
        for (const key of keys) {
            (x as any)[key] = y[key];
        }
        return x as T & U;
    }

    /**
     * Merge two objects in place.
     * Can be useful for casting an options object to an initialization object.
     */
    export function merge<T extends object, U extends object>(ref: T, override: U): Omit<T, keyof U> & U {
        for (const key in Object.keys(override)) {
            if (Object.prototype.hasOwnProperty.call(override, key)) {
                (ref as any)[key] = override[key];
            }
        }
        return ref as unknown as Omit<T, keyof U> & U;
    }

    /**
     * Merge two objects in place, but only if the key does not exist in the first object or if its `undefined`.
     */
    export function merge_missing<T extends object, U extends object>(ref: T, override: U): Omit<T, keyof U> & U {
        for (const key in Object.keys(override)) {
            if (Object.prototype.hasOwnProperty.call(override, key) && (!(key in ref) || ref[key] === undefined)) {
                (ref as any)[key] = override[key];
            }
        }
        return ref as unknown as Omit<T, keyof U> & U;
    }

    /**
     * Runtime implementation of TypeScript's Pick utility type.
     * Creates a new object with only the specified keys from the source object.
     * 
     * @param obj - The source object to pick properties from
     * @param keys - Array of keys to pick from the source object
     * @returns A new object containing only the specified properties
     */
    export function pick<T extends object, K extends keyof T>(
        obj: T,
        ...keys: K[]
    ): Pick<T, K> {
        const result = {} as Pick<T, K>;
        for (const key of keys) {
            if (key in obj) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    // ---------------------------------------------------------
    // Stringify functions.

    /** Stringify options. */
    export interface StringifyOpts {
        /** The indent size, amount of spaces per indent level, defaults to `4`. Use `false` or `-1` to disable all indentation. */
        indent?: number | false | -1;
        /** The start indent level `number` or `false` to disable indentation. */
        start_indent?: number,
        /** Max nested depth to show, defaults to `undefined`. */
        max_depth?: number,
        /** Max output length, defaults to `undefined`. */
        max_length?: number,
        /** Filter options for the input object. See {@link FilterOpts} for more information. */
        filter?: FilterCallback | (FilterOpts & { callback: FilterCallback }),
        /** JSON mode, defaults to `false`. */
        json?: boolean,
        /** Colored mode, defaults to `false`. */
        colored?: boolean,
        /** System attributes. */
        _indent_str?: string;
    }

    /** Helper to stringify any input value. */
    function _stringify_helper(
        value: any,
        /** The active indent level, or false for no indentation, -1 is not supported. */
        indent_level: false | number,
        /** The nested depth for tracking nested limits */
        nested_depth: number,
        opts: Omit<StringifyOpts, "filter">, // attribute `_indent_str` should be assigned by stringify().
        circular_cache: Set<any>
    ): string {
        /**
         * @note dont use a color map instead of ternary expressions for colors, ternary has better performance because no key lookup.
         */

        // Indentation vars.
        let indent = indent_level === false ? '' : opts._indent_str?.repeat(indent_level) ?? "";
        let next_indent = indent_level === false ? '' : opts._indent_str?.repeat(indent_level + 1) ?? "";
        let line_break_or_space = indent_level === false ? ' ' : '\n';
        
        // null / undefined
        if (value === null || (opts.json && value === undefined)) {
            return opts.colored ? `${Colors.gray}null${Colors.end}` : "null";
        }
        if (value === undefined) {
            return opts.colored ? `${Colors.gray}undefined${Colors.end}` : "undefined";
        }

        // Date
        if (value instanceof Date) {
            return opts.colored ? `${Colors.magenta}Date(${value.toLocaleDateString()})${Colors.end}` : `Date(${value.toLocaleDateString()})`;
        }

        // minify primitive array/obj.
        const is_raw_array = Array.isArray(value)// && Object.getPrototypeOf(value) === Array.prototype;
        let proto;
        const is_raw_obj = !is_raw_array && value != null && typeof value === 'object'
            && (
                (proto = Object.getPrototypeOf(value)) === Object.prototype
                || proto === null
            )
        if (
            (is_raw_array && value.length > 0 && value.length <= 3) ||
            (typeof value === 'object' && Object.keys(value).length <= 3)
        ) {
            const keys = Object.keys(value);
            let len = 0, max_len = 100;
            for (const key of keys) {
                len += key.length + 2; // +2 for quotes
                if (len > max_len) {
                    len = -1; // dont minify.
                    break;
                }
                const t = typeof value[key];
                if (t === 'string') {
                    len += value[key].length;
                } else if (t === 'number' || t === 'boolean') {
                    len += value[key].toString().length;
                } else {
                    len = -1; // dont minify.
                    break;
                }
            }
            if (len !== -1 && len < max_len) {
                indent_level = false
                indent = '';
                next_indent = '';
                line_break_or_space = ' ';
            }
        }

        // raw array
        if (is_raw_array) {
            if (value.length === 0) {
                return opts.colored ? Colors.light_gray + '[]' + Colors.end : "[]";
            }
            else if (opts.max_depth != null && nested_depth > opts.max_depth) {
                return opts.colored
                    ? `${Colors.cyan}[Array]${Colors.end}`
                    : `[Array]`;
            }
            else if (circular_cache.has(value)) {
                return opts.colored
                    ? `${Colors.cyan}[Circular Array]${Colors.end}`
                    : `[Circular Array]`;
            }
            circular_cache.add(value);
            const items = value
                .map(v => `${next_indent}${_stringify_helper(
                    v,
                    indent_level === false ? indent_level : indent_level + 1,
                    nested_depth + 1,
                    opts,
                    circular_cache,
                )}`)
                .join(opts.colored
                    ? Colors.light_gray + ',' + Colors.end + line_break_or_space
                    : ',' + line_break_or_space
                );
            return [
                opts.colored ? Colors.light_gray + '[' + Colors.end : "[",
                items,
                opts.colored ? `${indent}${Colors.light_gray}]${Colors.end}` : `${indent}]`
            ].join(line_break_or_space);
        }

        // raw object
        if (is_raw_obj) {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return opts.colored ? `${Colors.light_gray}{}${Colors.end}`: "{}";
            }
            else if (opts.max_depth != null && nested_depth > opts.max_depth) {
                return opts.colored ? `${Colors.cyan}[Object]${Colors.end}` : "[Object]";
            }
            else if (circular_cache.has(value)) {
                return opts.colored ? `${Colors.cyan}[Circular Object]${Colors.end}` : "[Circular Object]";
            }
            circular_cache.add(value);
            const items: string[] = []
            let total_len = 0;
            for (const key of keys) {
                const formatted_key = opts.json/* || !/^[\w]+$/.test(key)*/ ? JSON.stringify(key) : key;
                const colored_key = opts.colored && opts.json // only color keys in JSON mode
                    ? `${Colors.cyan}${formatted_key}${Colors.end}`
                    : `${formatted_key}`;
                const colored_val = _stringify_helper(
                    value[key],
                    indent_level === false ? indent_level : indent_level + 1,
                    nested_depth + 1,
                    opts,
                    circular_cache,
                );
                const item = `${next_indent}${colored_key}${
                    opts.colored ? Colors.light_gray : ""
                }: ${
                    opts.colored ? Colors.end : ""
                }${colored_val}`;
                if (opts.max_length != null && item.length + total_len > opts.max_length) {
                    if (total_len < opts.max_length) {
                        items.push(
                            `${indent}${item.slice(0, opts.max_length - total_len)}${Colors.end} ${opts.colored
                                ? Color.red_bold("... [truncated]")
                                : "... [truncated]"
                            }`
                        );
                    } else {
                        items.push(`${next_indent}${opts.colored
                            ? Color.red_bold("... [truncated]")
                            : "... [truncated"
                        }`);
                    }
                    break;
                }
                items.push(item);
                total_len += item.length;
            }
            const items_str = items.join(opts.colored 
                ? Colors.light_gray + ',' + Colors.end + line_break_or_space
                : ',' + line_break_or_space
            );
            const header = opts.colored ? 
                `${Colors.light_gray}{${Colors.end}`
                : "{";
            return [
                header,
                items_str,
                indent + (opts.colored ?
                    `${Colors.light_gray}}${Colors.end}`
                    : "}"
                )
            ].join(line_break_or_space);
        }

        // primitives
        switch (typeof value) {
            case 'string':
                return opts.colored 
                    ? `${Colors.green}${JSON.stringify(value)}${Colors.end}`
                    : JSON.stringify(value);
            case 'number':
                return opts.colored 
                    ? `${Colors.yellow}${value.toString()}${Colors.end}`
                    : value.toString();
            case 'boolean':
                return opts.colored 
                    ? `${Colors.yellow}${value.toString()}${Colors.end}`
                    : value.toString();
            case 'function':
                return opts.colored 
                    ? `${Colors.cyan}[Function]${Colors.end}`
                    : "[Function]";
            default:
                // Cast to string.
                if (
                    value instanceof String
                    || value instanceof Number
                    || value instanceof Boolean
                    || value instanceof RegExp
                ) {
                    value = value.toString();
                }
                // classes, symbols, bigints, etc.
                if (opts.json) {
                    return opts.colored
                        ? `"${Colors.magenta}${String(value)}${Colors.end}"`
                        : `"${String(value)}"`;    
                }
                return opts.colored 
                    ? `${Colors.magenta}${String(value)}${Colors.end}`
                    : String(value);
        }
    }

    /**
     * Stringify an object or any other type.
     * @param value The value to stringify.
     * @param opts The options for stringification. See {@link StringifyOpts} for more information.
     * 
     * @note That when `opts.json` is true, it still might produce an invalid JSON string since it produces a string that shows circular references as `[Circular X]` etc.
     */
    export function stringify(value: any, opts?: StringifyOpts): string {
        if (opts?.filter && typeof value === 'object' && value !== null) {
            value = filter(value, opts.filter); // also supports arrays.
        }
        const circular_cache = new Set<any>();
        opts ??= {};
        opts.indent ??= 4;
        if (typeof opts.indent === "number" && opts.indent < 0) {
            opts.indent = false;
        }
        opts.start_indent ??= 0;
        if (opts.indent !== false) {
            opts._indent_str ??= " ".repeat(opts.indent);
        }
        return _stringify_helper(
            value,
            opts.indent === false ? false : opts.start_indent,
            0,
            opts,
            circular_cache,
        );
    }

    // ---------------------------------------------------------
    // Filtering objects.

    /**
    * Filter options.
    * Also used by `Color`.
    */
    export interface FilterOpts {
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
    export type FilterCallback = (value: any, key: string, parents?: [string, any][]) => boolean;

    /**
     * Filter an object by a callback.
     */
    export function filter(...args:
        | [Record<string, any>, FilterCallback | (FilterOpts & { callback: FilterCallback })]
        | [Record<string, any>, FilterOpts, FilterCallback]
    ): Record<string, any> {
        const obj = args[0];
        if (typeof args[1] === "function") {
            return filter_helper(obj, args[1], undefined, [])
        }
        else if (args.length === 2) {
            if (typeof args[1] === "object" && args[1] != null && "callback" in args[1]) {
                return filter_helper(obj, args[1].callback, args[1], [])
            }
            throw new TypeError(`ObjectUtils.filter: Invalid second argument, expected FilterCallback or FilterOpts with callback, received ${typeof args[1]}.`);
        } else if (args.length === 3) {
            if (typeof args[1] === "object" && args[1] != null) {
                return filter_helper(obj, args[2], args[1], []);
            }
            throw new TypeError(`ObjectUtils.filter: Invalid second argument, expected FilterOpts or FilterCallback, received ${typeof args[1]}.`);
        }
        // @ts-expect-error
        throw new TypeError(`ObjectUtils.filter: Invalid arguments, received ${args.length} arguments, expected 2 or 3.`);
    }
    function filter_helper(
        obj: Record<string, any>,
        /** The callback, keep value first so we can also use callbacks as `Boolean` */
        callback: FilterCallback,
        opts: undefined | FilterOpts,
        _parents: [string, any][]
    ): Record<string, any> {
        if (obj == null) {
            throw new TypeError("ObjectUtils.filter: The object to filter must not be null or undefined.");
        }
        const added: Record<string, any> = {};
        const keys = Object.keys(obj);
        for (const key of keys) {
            if (!callback(obj[key], key, _parents)) {
                if (opts?.update) {
                    delete obj[key];
                }
                continue;
            }
            let v = obj[key];
            if (Array.isArray(v)) {
                const nested_parents: [string, any][] = [..._parents, [key, obj[key]]];
                for (let i = 0; i < v.length; i++) {
                    if (typeof v[i] === 'object' && v[i] !== null) {
                        v[i] = filter_helper(
                            v[i],
                            callback,
                            opts,
                            [...nested_parents, [i.toString(), v[i]]],
                        );
                    }
                }
            }
            else if (
                opts?.recursive
                && typeof v === 'object'
                && v !== null
            ) {
                v = filter_helper(
                    v,
                    callback,
                    opts,
                    [..._parents, [key, obj[key]]],
                );
            }
            if (opts?.update) {
                obj[key] = v;
            } else {
                added[key] = v;
            }

        }
        if (opts?.update) { return obj; }
        return added;
    }

    // ---------------------------------------------------------
    // Transforming objects.

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
     */
    export function transform<
        T extends Record<any, any>,
        O extends Record<any, any> = Record<any, any>,
    >(
        obj: T,
        visitor: (
            value: T[keyof T],
            key: keyof T,
            out: O,
            original: T
        ) => Truthy
    ): O {
        const out = {} as O;
        for (const k in obj) {
            if (
                has_own_prop.call(obj, k)
                && visitor(obj[k], k, out, obj)
            ) { break; }
        }
        return out;
    }
    const has_own_prop = Object.prototype.hasOwnProperty;


    // ---------------------------------------------------------
    // (Semi) deprecated.

    // /**
    // * Renames keys in an object, updates the object in place.
    // * @param obj The object to rename keys in.
    // * @param rename An array of [oldKey, newKey] pairs.
    // * @param remove An array of keys to remove from the object.
    // * @returns The modified object reference.
    // * @legacy
    // */
    // export function rename_keys(
    //     obj: Record<string, any>,
    //     rename: [string, string][] = [],
    //     remove: string[] = []
    // ): Record<string, any> {
    //     // remove keys
    //     for (const key of remove) {
    //         delete obj[key];
    //     }
    //     // rename pairs
    //     for (const [oldKey, newKey] of rename) {
    //         if (oldKey in obj) {
    //             obj[newKey] = obj[oldKey];
    //             delete obj[oldKey];
    //         }
    //     }
    //     return obj;
    // }
}
export { ObjectUtils as Object };
export { ObjectUtils as object }; // for snake_case compatibility

// declare global {
//     interface ObjectConstructor {
//         /**
//          * Expands object x with properties from object y.
//          * Modifies x in place and returns it.
//          * @param x The target object to expand.
//          * @param y The source object with properties to add to x.
//          * @returns The expanded object x.
//          */
//         expand<T extends object, U extends object>(x: T, y: U): any;

//         /**
//          * Performs a deep equality check between two values.
//          * @param x The first value to compare.
//          * @param y The second value to compare.
//          * @returns True if x and y are deeply equal, false otherwise.
//          */
//         eq(x: any, y: any): boolean;

//         /**
//          * Detects changed keys between two objects.
//          * @param x The original object.
//          * @param y The modified object.
//          * @param include_nested Whether to include nested changed keys.
//          * @returns An array of changed keys or null if no changes.
//          */
//         detect_changes(x: any, y: any, include_nested?: boolean): string[] | null;

//         /**
//          * Renames keys in an object.
//          * @param obj The object to rename keys in.
//          * @param rename An array of [oldKey, newKey] pairs.
//          * @param remove An array of keys to remove from the object.
//          * @returns The modified object.
//          */
//         rename_keys(
//             obj: Record<string, any>,
//             rename?: [string, string][],
//             remove?: string[]
//         ): Record<string, any>;

//         /**
//          * Performs a deep copy of an object.
//          * Does not support classes, only primitive objects.
//          * @param obj The object to deep copy.
//          * @returns A deep copy of the object.
//          */
//         deep_copy<T>(obj: T): T;

//         /**
//          * Deletes keys from an object recursively, including nested objects and arrays.
//          * @param obj The object to modify.
//          * @param remove_keys An array of keys to remove.
//          * @returns The modified object.
//          */
//         delete_recursively<T>(obj: T, remove_keys?: string[]): T;
//     }
// }
// export {} // is required.

// // Internal function to check equals.
// function obj_eq(x: any, y: any): boolean;
// function obj_eq(x: any, y: any, detect_keys?: boolean, detect_keys_nested?: boolean): string[] | null;
// function obj_eq(x: any, y: any, detect_keys: boolean = false, detect_keys_nested: boolean = false) : boolean | string[] | null {
//     if (typeof x !== typeof y) { return false; }
//     else if (x instanceof String) {
//         return x.toString() === y.toString();
//     }
//     else if (Array.isArray(x)) {
//         if (!Array.isArray(y) || x.length !== y.length) { return false; }
//         for (let i = 0; i < x.length; i++) {
//             if (!obj_eq(x[i], y[i])) {
//                 return false;
//             }
//         }
//         return true;
//     }
//     else if (x != null && typeof x === "object") {
//         const changes: string[] = [];
//         const x_keys: string[] = Object.keys(x);
//         const y_keys: string[] = Object.keys(y);
//         if (x_keys.length !== y_keys.length) {
//             return false;
//         }
//         for (const key of x_keys) {
//             if (!y.hasOwnProperty(key)) {
//                 const result: any = obj_eq(x[key], y[key], detect_keys, detect_keys_nested)
//                 if (detect_keys) {
//                     if (result === true) {
//                         changes.append(key)
//                     }
//                     else if (result !== false && result != null && result.length > 0) {
//                         changes.append(key)
//                         if (detect_keys_nested) {
//                             changes.append(...result)
//                         }   
//                     }
//                 } else if (!result) {
//                     return false
//                 }
//             }
//         }
//         if (detect_keys) {
//             return changes.length === 0 ? null : changes;
//         }
//         return true;
//     }
//     else {
//         return x === y;
//     }
// }

// // Perform a deep copy on any type, except it does not support classes, only primitive objects.
// function deep_copy(obj) {
//     if (Array.isArray(obj)) {
//         const copy: any[] = [];
//         obj.walk((item) => {
//             copy.append(deep_copy(item));
//         })
//         return copy;
//     }
//     else if (obj !== null && obj instanceof String) {
//         return new String(obj.toString());
//     }
//     else if (obj !== null && typeof obj === "object") {
//         const copy = {};
//         const keys = Object.keys(obj);
//         const values = Object.values(obj);
//         for (let i = 0; i < keys.length; i++) {
//             copy[keys[i]] = deep_copy(values[i]);
//         }
//         return copy;
//     }
//     else {
//         return obj;
//     }
// }

// // Expand object x with object y, does not create a copy and returns nothing.
// Object.expand = function(x, y) {
//     const keys = Object.keys(y);
//     for (let i = 0; i < keys.length; i++) {
//         x[keys[i]] = y[keys[i]];
//     }
//     return x;
// }

// // Check if an object equals another object.
// // Causes UB wit actual classes.
// Object.eq = function(x, y): boolean {
//     return obj_eq(x, y);
// }

// // Detect changed keys between two objects, optionally include the changed nested object keys.
// // Returns `null` when no keys have changed.
// // Causes undefined behaviour when one of the x, y parameters is not an object.
// Object.detect_changes = function(x, y, include_nested = false) {
//     return obj_eq(x, y, true, include_nested);
// }

// // Rename object keys.
// Object.rename_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
//     remove.iterate((key) => {
//         delete obj[key];
//     })
//     rename.iterate((key) => {
//         obj[key[1]] = obj[key[0]];
//         delete obj[key[0]];
//     })
//     return obj;
// }

// // Perform a deep copy on any type, except it does not support classes, only primitive objects.
// /*  @docs:
//     @nav: Frontend
//     @chapter: Utils
//     @title: Deep copy
//     @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
//  */
// Object.deep_copy = (obj) => {
//     return deep_copy(obj);
// }

// // Delete keys from an object recursively, so also from the nested objects and from the nested objects nested within nested arrays.
// Object.delete_recursively = (obj, remove_keys: string[] = []) => {
//     const clean = (obj) => {
//         if (Array.isArray(obj)) {
//             obj.iterate((item: any) => {
//                 if (Array.isArray(item) || (typeof item === "object" && item != null)) {
//                     clean(item);
//                 }
//             })
//         } else {
//             Object.keys(obj).iterate((key: string) => {
//                 if (remove_keys.includes(key)) {
//                     delete obj[key];
//                 }
//                 else if (Array.isArray(obj[key]) || (typeof obj[key] === "object" && obj[key] != null)) {
//                     clean(obj[key]);
//                 }
//             })
//         }
//     }
//     clean(obj);
//     return obj;
// }



// console.log(ObjectUtils.stringify(
//     {
//         null: null,
//         undefined: undefined,
//         bool: true,
//         num: 42,
//         str: "Hello, World!",
//         arr: [1, 2, 3, { nested: "value" }],
//         obj: {
//             key1: "value1",
//             key2: "value2",
//             nested: {
//                 key3: "value3",
//                 key4: [1, 2, 3],
//             },
//         },
//         func: function () { return "I am a function"; },
//         date: new Date(),
//         regex: /abc/i,
//         symbol: Symbol("mySymbol"),
//         bigint: BigInt(12345678901234567890),

//     },
//     {
//         colored: true,
//     },
// ));
// process.exit(1);