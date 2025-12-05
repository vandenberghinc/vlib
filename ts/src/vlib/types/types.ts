/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */


// -----------------------------------------------------------
// Type transformation utilities

/**
 * Utility type to transform an object by setting only the specified keys to `never`,
 * while preserving all other properties as-is. Works on each member of a union individually.
 *
 * @template T - The source object type (or union of object types).
 * @template K - Subset of keys in T whose types should be replaced with `never`.
 *
 * @example
 * ```ts
 * interface Foo {
 *   a: string;
 *   b: number;
 *   c: boolean;
 * }
 *
 * // Only `a` becomes never; `b` and `c` remain unchanged
 * type FooNeverA = Neverify<Foo, 'a'>;
 * // { a: never; b: number; c: boolean; }
 *
 * // Works with unions
 * type Union = { x: number; y: string } | { x: string; z: boolean };
 * type NeverX = Neverify<Union, 'x'>;
 * // => { x: never; y: string } | { x: never; z: boolean }
 * ```
 * 
 * @nav Types
 * @docs
 */
export type Neverify<
    T,
    K extends keyof T
> =
    T extends any
    ? Omit<T, K> & Partial<{ [P in K]: never }>
    : never;

/**
 * Merge two object types by overriding properties in T with those in U.
 * Distributes over unions in the second argument U.
 * Leaves T intact when U is a single type.
 *
 * @template T - Base type.
 * @template U - Type or union of types whose properties override T.
 *
 * @example
 * ```ts
 * interface X { a: number; b: string; }
 * type U1 = { b: boolean };
 * type M1 = Merge<X, U1>;  // { a: number; b: boolean }
 *
 * type U2 = { b: boolean } | { c: Date };
 * type M2 = Merge<X, U2>;
 * // resolves to:
 * //   | { a: number; b: boolean }
 * //   | { a: number; c: Date; b: string }
 * ```
 * 
 * @nav Types
 * @docs
 */
export type Merge<
    T,
    U extends object | never
> = [U] extends [never]          // non-distributive check for exactly `never`
    ? T                          // if U is exactly never, just return T
    : U extends object           // otherwise if U is some object type
    ? Omit<T, keyof U> & U       // remove overridden keys then add U
    : T;                         // any other U (string/number/etc) fallback to T

/**
 * Merge alias for semantic clarity: override properties of T with U.
 * 
 * @nav Types
 * @docs
 */
export type Override<T, U extends object> = Merge<T, U>;

/**
 * Make only the specified keys optional, leaving other properties unchanged.
 * Distributes over unions of T.
 *
 * @template T - The source object type.
 * @template K - Keys of T to make optional.
 *
 * @example
 * ```ts
 * interface Foo {
 *   a: string;
 *   b?: number;
 *   c: boolean;
 * }
 * 
 * // a becomes optional, b and c unchanged
 * type FooOptA = Optional<Foo, 'a'>;
 * // { a?: string; b?: number; c: boolean; }
 * ```
 * 
 * @nav Types
 * @docs
 */
export type Optional<
    T,
    K extends keyof T
> = Omit<T, K> & Partial<Pick<T, K>>;


/**
 * Make only the specified keys required, leaving other properties unchanged.
 * Distributes over unions of T.
 * 
 * @note The same as default `Enforce` instead of `vlib.Enforce`.
 *       Merely exported for consistency with `Optional`.
 *
 * @template T - The source object type.
 * @template K - Keys of T to make required.
 *
 * @example
 * ```ts
 * interface Bar {
 *   x?: string;
 *   y?: number;
 *   z: boolean;
 * }
 * 
 * // x and y become required, z unchanged
 * type BarReqXY = RequiredKeys<Bar, 'x' | 'y'>;
 * // { x: string; y: number; z: boolean; }
 * ```
 * 
 * @nav Types
 * @docs
*/
export type RequiredKeys<
    T extends object,
    K extends keyof T
> = T extends any
    ? Omit<T, K> & Required<Pick<T, K>>
    : never;


/**
 * Utility type to make all properties of T required, except for the specified keys K.
 * This is useful when you want to enforce that all properties are required,
 * except for a few specific ones that can remain optional.
 * 
 * @nav Types
 * @docs
 */
export type RequiredExcept<
    T extends object,
    K extends keyof T
> = Required<Omit<T, K>> & Pick<T, K>

// ----------------------------------------------------------------------------
// Types useful for alias enforcement.

/**
 * Creates a union where at least one of the specified keys must be defined.
 * Other properties retain their original required/optional status.
 * Useful for enforcing constraints on specific subsets of properties.
 *
 * @template T - The source object type.
 * @template K - Subset of keys where at least one must be required.
 *
 * @example
 * ```ts
 * interface ContactInfo {
 *   id: string;        // stays required
 *   email?: string;
 *   phone?: string;
 *   address?: string;  // stays optional
 * }
 *
 * type ValidContact = AtLeastOneOf<ContactInfo, 'email' | 'phone'>;
 * // Must provide email OR phone (or both), id still required, address still optional
 * // Valid: { id: "1", email: "test@example.com", address: "123 St" }
 * // Valid: { id: "1", phone: "555-0123" }
 * // Invalid: { id: "1", address: "123 St" } // missing email/phone
 * ```
 * 
 * @nav Types
 * @docs
 */
export type AtLeastOneOf<
    T,
    K extends keyof T
> =
    T & {
        [P in K]: Required<Pick<T, P>>
    }[K];
    // [K] extends [never]          // non-distributive check for exactly `never`
    // ? K                          // if U is exactly never, just return T
    // : {
    //     [P in K]:
    //     // P must be required
    //     Required<Pick<T, P>>
    //     // other K keys remain optional
    //     & Partial<Pick<T, Exclude<K, P>>>
    //     // the rest of T unchanged
    //     & Omit<T, K>
    // }[K];

/**
 * Creates a union where exactly one property can be defined.
 * All other properties become `never` (mutually exclusive variants).
 * Useful for discriminated unions or exclusive configuration options.
 *
 * @template T - The source object type.
 *
 * @example
 * ```ts
 * interface StorageConfig {
 *   local?: string;
 *   remote?: string;
 *   memory?: boolean;
 * }
 *
 * type ExclusiveStorage = ExactlyOneOf<StorageConfig>;
 * // Can only use one storage type at a time
 * // Valid: { local: "/path/to/file" }
 * // Valid: { remote: "https://api.com" }
 * // Invalid: { local: "/path", remote: "https://api.com" } // can't mix
 * ```
 * 
 * @nav Types
 * @docs
 */
export type ExactlyOneOf<T extends object> = {
    [K in keyof T]: Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>>
}[keyof T];


// ----------------------------------------------------------------------------
// Utility types.

/**
 * Is never.
 * Equal to `[T] extends [never]`
 * 
 * @nav Types
 * @docs
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Utility type to ensure that only the keys of `T` may be defined.
 * All other keys are set to `never?`.
 * This is useful to ensure that no other keys than those in `T` are allowed.
 * 
 * @nav Types
 * @docs
 */
export type NoOtherKeys<T extends object> =
    T & { [K in Exclude<keyof any, keyof T>]?: never };

/**
 * Recursively make all properties required
 * @nav Types
 * @docs
 */
export type DeepRequired<T> = {
    [P in keyof T]-?: DeepRequired<T[P]>;
};

/**
 * Recursively make all properties optional
 * @nav Types
 * @docs
 */
export type DeepOptional<T> = {
    [P in keyof T]?: DeepOptional<T[P]>;
};