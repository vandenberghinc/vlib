/**
 * Object minify module
 * This module provides functions to minify and expand objects based on a given scheme.
 *
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { ObjectUtils } from "../primitives/object.js";

/**
 * The Object minify namespace
 * @scope Minify
 * @name Object
 * 
 * @nav Minify
 * @docs
 */
namespace MinifyObject {

    /** Scheme types */
    export type Scheme = Record<string, Scheme.Entry>;
    export namespace Scheme {

        /** 
         * A default scheme entry.
         */
        export interface Entry {
            /** Optional minified key for this node */
            key: string;
            /** Nested child mappings */
            scheme?: Record<string, Entry>;
        }

        /**
         * A flat scheme, mapped as absolute original dot path to local minified key.
         * For example: `{"user.name": "n", "user.age": "a"}`.
         */
        export type Flat = Record<string, string>;

    }

    /**
     * Flatten a nested MinifyScheme into a dot-path → minified key map
     * @docs
     */
    export function flatten_scheme(
        scheme: Scheme,
        prefix: string = '',
        result: Record<string, string> = {}
    ): Record<string, string> {
        for (const key in scheme) {
            if (!Object.prototype.hasOwnProperty.call(scheme, key)) continue;
            const node = scheme[key];
            const full_path = prefix ? `${prefix}.${key}` : key;
            if (node.key) {
                result[full_path] = node.key;
            }
            if (node.scheme) {
                flatten_scheme(node.scheme, full_path, result);
            }
        }
        return result;
    }

    /**
     * Minify an object based on a given scheme.
     * @docs
     */
    export function minify({ object, scheme, flat_scheme }: {
        object: Record<string, any>;
        scheme?: Scheme;
        flat_scheme?: Scheme.Flat;
    }): Record<string, any> {
        if (scheme) {
            flat_scheme = flatten_scheme(scheme);
        }
        if (flat_scheme == null) {
            throw new Error('Either scheme or flat_scheme must be provided');
        }
        function _minify(obj: any, prefix: string = ''): any {
            if (Array.isArray(obj)) {
                return obj.map(item => (typeof item === 'object' && item !== null)
                    ? _minify(item, prefix)
                    : item
                );
            } else if (obj !== null && typeof obj === 'object') {
                const result: Record<string, any> = {};
                for (const prop in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, prop)) continue;
                    const full_path = prefix ? `${prefix}.${prop}` : prop;
                    const mapped_key = flat_scheme![full_path] || prop;
                    result[mapped_key] = _minify(obj[prop], full_path);
                }
                return result;
            }
            return obj;
        }

        return _minify(object);
    }

    /**
     * Expand a minified object back to its original form based on a given scheme.
     * @docs
     */
    export function expand({ object, scheme, flat_scheme, copy = true }: {
        object: Record<string, any>;
        scheme?: Scheme;
        flat_scheme?: Scheme.Flat;
        copy?: boolean; // Whether to copy the object before expanding
    }): Record<string, any> {
        // Initialize the flat scheme.
        if (scheme) {
            flat_scheme = flatten_scheme(scheme);
        } else if (flat_scheme) {
            // copy flat scheme since it might be mutated
            flat_scheme = { ...flat_scheme };
        } else {
            throw new Error('Either scheme or flat_scheme must be provided');
        }

        // Prepare the minified object reference
        const minified_obj: Record<string, any> = copy
            ? ObjectUtils.shallow_copy(object)
            : object;

        // Build flat entries with original and alias paths
        const flat_entries: [string[], string, string[], string][] =
            Object.entries(flat_scheme).map(
                (e): [string[], string, string[], string] => [e[0].split('.'), e[0], e[1].split('.'), e[1]]
            );

        // Convert alias paths to absolute alias paths
        flat_entries.sort((a, b) => a[0].length - b[0].length);
        for (const entry of flat_entries) {
            const [og_path] = entry;
            if (og_path.length === 1) continue;
            const parent_path = og_path.slice(0, -1).join('.');
            const og_parent = flat_entries.find(x => x[1] === parent_path);
            if (og_parent) {
                // prepend parent alias segments to current alias path
                entry[2] = [...og_parent[2], ...entry[2]];
                entry[3] = entry[2].join('.');
            }
        }

        // Build a lookup for alias path → original full path array
        const alias_to_original: Record<string, string[]> = {};
        for (const [og_path_arr, , alias_arr, alias_str] of flat_entries) {
            alias_to_original[alias_str] = og_path_arr;
        }

        /**
         * Recursively expand a node based on alias path mappings.
         */
        function rec_expand(node: any, base_alias_path: string[]): any {
            if (Array.isArray(node)) {
                return node.map(item => (typeof item === 'object' && item !== null)
                    ? rec_expand(item, base_alias_path)
                    : item
                );
            } else if (node !== null && typeof node === 'object') {
                const result: Record<string, any> = {};
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const new_alias_path = [...base_alias_path, key];
                    const alias_path_str = new_alias_path.join('.');
                    // Determine original key name
                    let original_key: string;
                    if (alias_path_str in alias_to_original) {
                        const original_full_path = alias_to_original[alias_path_str];
                        original_key = original_full_path[original_full_path.length - 1];
                    } else {
                        // No mapping found, keep alias key as original
                        original_key = key;
                    }
                    // Recurse into value
                    result[original_key] = rec_expand(node[key], new_alias_path);
                }
                return result;
            }
            return node;
        }

        // Perform expansion starting from root
        const expanded_obj = rec_expand(minified_obj, []);
        return expanded_obj;
    }

}
export { MinifyObject as Object }
export { MinifyObject as object }

// // --------------------------------------------------------------------------------
// // Create the module `object` that is exported by the `index.m.ts` file.
// // Still export the other exports directly as well for internal use.
// // But `Object` and `object` are the only items exported by the `index.m.ts` file.

// const fn_mod = minify as typeof minify & {
//     flatten_scheme: typeof flatten_scheme;
//     expand: typeof expand;
//     Scheme: Scheme;
// };
// fn_mod.flatten_scheme = flatten_scheme;
// fn_mod.expand = expand;
// type _Scheme = Scheme;
// namespace fn_mod {
//     export type Scheme = _Scheme;
// }
// export { fn_mod as Object };
// export { fn_mod as object }; // snake_case compatibility