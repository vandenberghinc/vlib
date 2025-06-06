/**
 * Object minify module
 * This module provides functions to minify and expand objects based on a given scheme.
 *
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
/** Scheme types */
export type Scheme = Record<string, Scheme.Entry>;
export declare namespace Scheme {
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
 * Minify an object based on a given scheme.
 */
export declare function minify({ object, scheme, flat_scheme }: {
    object: Record<string, any>;
    scheme?: Scheme;
    flat_scheme?: Scheme.Flat;
}): Record<string, any>;
/**
 * Expand a minified object back to its original form based on a given scheme.
 */
export declare function expand({ object, scheme, flat_scheme, copy }: {
    object: Record<string, any>;
    scheme?: Scheme;
    flat_scheme?: Scheme.Flat;
    copy?: boolean;
}): Record<string, any>;
declare const fn_mod: typeof minify & {
    expand: typeof expand;
    Scheme: Scheme;
};
type _Scheme = Scheme;
declare namespace fn_mod {
    type Scheme = _Scheme;
}
export { fn_mod as Object };
export { fn_mod as object };
