/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

export namespace ObjectUtils {
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
     * Performs a deep equality check between two values.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns True if x and y are deeply equal, false otherwise.
     */
    export function eq(x: any, y: any): boolean {
        return obj_eq(x, y) as boolean;
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
     * Renames keys in an object, updates the object in place.
     * @param obj The object to rename keys in.
     * @param rename An array of [oldKey, newKey] pairs.
     * @param remove An array of keys to remove from the object.
     * @returns The modified object reference.
     */
    export function rename_keys(
        obj: Record<string, any>,
        rename: [string, string][] = [],
        remove: string[] = []
    ): Record<string, any> {
        // remove keys
        for (const key of remove) {
            delete obj[key];
        }
        // rename pairs
        for (const [oldKey, newKey] of rename) {
            if (oldKey in obj) {
                obj[newKey] = obj[oldKey];
                delete obj[oldKey];
            }
        }
        return obj;
    }

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
    export function filter(
        obj: Record<string, any>,
        opts: FilterCallback | (FilterOpts & { callback: FilterCallback })
    ): Record<string, any>;
    export function filter(
        obj: Record<string, any>,
        callback: FilterCallback,
        opts?: FilterOpts,
    ): Record<string, any>;
    export function filter(
        obj: Record<string, any>,
        callback: FilterCallback | (FilterOpts & { callback: FilterCallback }),
        opts?: FilterOpts,
    ): Record<string, any> {
        return typeof callback === "function"
            ? filter_helper(obj, callback, opts, [])
            : filter_helper(obj, callback.callback, callback, [])
    }
    function filter_helper(
        obj: Record<string, any>,
        /** The callback, keep value first so we can also use callbacks as `Boolean` */
        callback: FilterCallback,
        opts: undefined | FilterOpts,
        _parents: [string, any][]
    ): Record<string, any> {
        const added: Record<string, any> = {};
        const keys = Object.keys(obj);
        for (const key in keys) {
            if (!callback(obj[key], key, _parents)) {
                if (opts?.update) {
                    delete obj[key];
                }
                continue;
            }
            let v = obj[key];
            if (opts?.recursive && typeof v === 'object' && v !== null) {
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
     * Performs a deep copy of an object.
     * Does not support classes, only primitive objects.
     * @param obj The object to deep copy.
     * @returns A deep copy of the object.
     */
    export function deep_copy<T>(obj: T): T {
        return deep_copy_internal(obj);
    }


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
}
export { ObjectUtils as Object };

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

