/**
 * Object minify module
 * This module provides functions to minify and expand objects based on a given scheme.
 *
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * The Object minify namespace
 * @scope Minify
 * @name Object
 *
 * @nav Minify
 * @docs
 */
declare namespace MinifyObject {
    /** Scheme types */
    type Scheme = Record<string, Scheme.Entry>;
    namespace Scheme {
        /**
         * A default scheme entry.
         */
        interface Entry {
            /** Optional minified key for this node */
            key: string;
            /** Nested child mappings */
            scheme?: Record<string, Entry>;
        }
        /**
         * A flat scheme, mapped as absolute original dot path to local minified key.
         * For example: `{"user.name": "n", "user.age": "a"}`.
         */
        type Flat = Record<string, string>;
    }
    /**
     * Flatten a nested MinifyScheme into a dot-path → minified key map
     * @docs
     */
    function flatten_scheme(scheme: Scheme, prefix?: string, result?: Record<string, string>): Record<string, string>;
    /**
     * Minify an object based on a given scheme.
     * @docs
     */
    function minify({ object, scheme, flat_scheme }: {
        object: Record<string, any>;
        scheme?: Scheme;
        flat_scheme?: Scheme.Flat;
    }): Record<string, any>;
    /**
     * Expand a minified object back to its original form based on a given scheme.
     * @docs
     */
    function expand({ object, scheme, flat_scheme, copy }: {
        object: Record<string, any>;
        scheme?: Scheme;
        flat_scheme?: Scheme.Flat;
        copy?: boolean;
    }): Record<string, any>;
}
export { MinifyObject as Object };
export { MinifyObject as object };
