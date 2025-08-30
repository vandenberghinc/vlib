/**
 * Object minify module
 * This module provides functions to minify and expand objects based on a given scheme.
 *
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { ObjectUtils } from "../primitives/object.js";
/**
 * Flatten a nested MinifyScheme into a dot-path → minified key map
 */
export function flatten_scheme(scheme, prefix = '', result = {}) {
    for (const key in scheme) {
        if (!Object.prototype.hasOwnProperty.call(scheme, key))
            continue;
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
 */
export function minify({ object, scheme, flat_scheme }) {
    if (scheme) {
        flat_scheme = flatten_scheme(scheme);
    }
    if (flat_scheme == null) {
        throw new Error('Either scheme or flat_scheme must be provided');
    }
    function _minify(obj, prefix = '') {
        if (Array.isArray(obj)) {
            return obj.map(item => (typeof item === 'object' && item !== null)
                ? _minify(item, prefix)
                : item);
        }
        else if (obj !== null && typeof obj === 'object') {
            const result = {};
            for (const prop in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, prop))
                    continue;
                const full_path = prefix ? `${prefix}.${prop}` : prop;
                const mapped_key = flat_scheme[full_path] || prop;
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
 */
export function expand({ object, scheme, flat_scheme, copy = true }) {
    // Initialize the flat scheme.
    if (scheme) {
        flat_scheme = flatten_scheme(scheme);
    }
    else if (flat_scheme) {
        // copy flat scheme since it might be mutated
        flat_scheme = { ...flat_scheme };
    }
    else {
        throw new Error('Either scheme or flat_scheme must be provided');
    }
    // Prepare the minified object reference
    const minified_obj = copy
        ? ObjectUtils.shallow_copy(object)
        : object;
    // Build flat entries with original and alias paths
    const flat_entries = Object.entries(flat_scheme).map((e) => [e[0].split('.'), e[0], e[1].split('.'), e[1]]);
    // Convert alias paths to absolute alias paths
    flat_entries.sort((a, b) => a[0].length - b[0].length);
    for (const entry of flat_entries) {
        const [og_path] = entry;
        if (og_path.length === 1)
            continue;
        const parent_path = og_path.slice(0, -1).join('.');
        const og_parent = flat_entries.find(x => x[1] === parent_path);
        if (og_parent) {
            // prepend parent alias segments to current alias path
            entry[2] = [...og_parent[2], ...entry[2]];
            entry[3] = entry[2].join('.');
        }
    }
    // Build a lookup for alias path → original full path array
    const alias_to_original = {};
    for (const [og_path_arr, , alias_arr, alias_str] of flat_entries) {
        alias_to_original[alias_str] = og_path_arr;
    }
    /**
     * Recursively expand a node based on alias path mappings.
     */
    function rec_expand(node, base_alias_path) {
        if (Array.isArray(node)) {
            return node.map(item => (typeof item === 'object' && item !== null)
                ? rec_expand(item, base_alias_path)
                : item);
        }
        else if (node !== null && typeof node === 'object') {
            const result = {};
            for (const key in node) {
                if (!Object.prototype.hasOwnProperty.call(node, key))
                    continue;
                const new_alias_path = [...base_alias_path, key];
                const alias_path_str = new_alias_path.join('.');
                // Determine original key name
                let original_key;
                if (alias_path_str in alias_to_original) {
                    const original_full_path = alias_to_original[alias_path_str];
                    original_key = original_full_path[original_full_path.length - 1];
                }
                else {
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
// --------------------------------------------------------------------------------
// Create the module `object` that is exported by the `index.m.ts` file.
// Still export the other exports directly as well for internal use.
// But `Object` and `object` are the only items exported by the `index.m.ts` file.
const fn_mod = minify;
fn_mod.flatten_scheme = flatten_scheme;
fn_mod.expand = expand;
export { fn_mod as Object };
export { fn_mod as object }; // snake_case compatibility
//# sourceMappingURL=object.js.map