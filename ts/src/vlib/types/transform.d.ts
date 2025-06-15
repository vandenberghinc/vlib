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
 */
export type Neverify<
    T,
    K extends keyof T
> =
    T extends any
        ? Omit<T, K> & Partial<{ [P in K]: never }>
        : never;
    // [K] extends [never] ? T : Transform<T, never, never, K, {}, never>;

/**
 * Neverify keys K (set to never) in each object type in T.
 */
export type NeverifyFor<
    T extends object,
    K extends PropertyKey
> = TransformFor<
    T,
    never,
    never,
    K,
    {},
    never
>;

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
 */
export type Merge<
    T,
    U extends object | never
    > = [U] extends [never]          // non-distributive check for exactly `never`
    ? T                          // if U is exactly never, just return T
    : U extends object           // otherwise if U is some object type
    ? Omit<T, keyof U> & U       // remove overridden keys then add U
    : T;                         // any other U (string/number/etc) fallback to T
// > = [U] extends [never] ? T : Transform<T, never, never, never, U, never>; // not allowed since Merge is used in TransformFor

/**
 * Merge alias for semantic clarity: override properties of T with U.
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
 * type FooOptA = OptionalBy<Foo, 'a'>;
 * // { a?: string; b?: number; c: boolean; }
 * ```
 */
export type Optional<
    T,
    K extends keyof T
> = Omit<T, K> & Partial<Pick<T, K>>;
// export type Optional<
//     T,
//     K extends keyof T
// > = [K] extends [never] ? T : Transform<T, never, K, never, {}, never>;
// > = T extends any
//     ? Omit<T, K> & Partial<Pick<T, K>>
//     : never;

/**
 * Make keys K optional in each object type in T.

 @todo GENERATE BETTER DOCS HERE 
 */
export type OptionalFor<
    T extends object,
    K extends PropertyKey
> = TransformFor<
    T,
    never,
    K,
    never,
    {},
    never
>;

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
 * type BarReqXY = RequiredBy<Bar, 'x' | 'y'>;
 * // { x: string; y: number; z: boolean; }
 * ```
 */
export type Enforce<
    T,
    K extends keyof T
> = T extends any
    ? Omit<T, K> & Required<Pick<T, K>>
    : never;
// > = [K] extends [never] ? T : Transform<T, K, never, never, {}, never>;

/**
 * Construct a union of object types from T where at least one key in K is defined (non-nullable).
 * Distributes over unions of T. Useful to enforce that one of several optional properties is present.
 *
 * @template T - The source object type.
 * @template K - Subset of keys in T that at least one must be defined.
 *
 * @example
 * ```ts
 * interface ModeArgs {
 *   id?: string;
 *   name?: string;
 *   index?: number;
 * }
 *
 * // Enforce that either 'id' or 'name' or 'index' is provided:
 * type EnforceOneModeArg = EnforceOne<ModeArgs, 'id'|'name'|'index'>;
 * // resolves to:
 * // | { id: string; name?: string; index?: number }
 * // | { name: string; id?: string; index?: number }
 * // | { index: number; id?: string; name?: string }
 * ```
 */
export type EnforceOne<
    T,
    K extends keyof T
> = [K] extends [never]          // non-distributive check for exactly `never`
    ? K                          // if U is exactly never, just return T
    : {
        [P in K]:
        // P must be required
        Required<Pick<T, P>>
        // other K keys remain optional
        & Partial<Pick<T, Exclude<K, P>>>
        // the rest of T unchanged
        & Omit<T, K>
    }[K];

/**
* Apply `AtLeastOne` to each member of a union type T.
* Distributes over unions of T automatically.
*
* @template T - The union of object types to enforce.
* @template K - Subset of keys in T that at least one must be present.
*/
export type EnforceOneFor<
    T,
    K extends PropertyKey
> = [Extract<K, keyof T>] extends [never]
    ? T
    : EnforceOne<T, Extract<K, keyof T>>;

/**
 * Type transformer utility type to transform an object type and enforce that at least one key is present.
 * @template T - The source object type (or union of object types).
 * @template Req - Keys of `T` to make required. Defaults to never.
 * @template Opt - Keys of `T` to make optional. Defaults to never.
 * @template Nev - Keys of `T` to nullify (optional never). Defaults to never.
 * @template Override - Additional overrides or new properties to merge in. Defaults to {}.
 * @template EnfrcOne - Keys of `T` among which at least one must be present. Defaults to never.
 *
 * Distributes over unions in `T`.
 *
 * @example
 * ```ts
 * interface Foo {
 *   a?: string;
 *   b: number;
 *   c: boolean;
 *   d: number;
 *   e: Date;
 *   f: string;
 * }
 * type E = Transform<
 *   Foo,           // input type
 *   'a',           // make required
 *   'b',           // make optional
 *   'c' | 'd',     // make null
 *   { f: number }, // override attributes
 *   'a' | 'b'      // enforce at least one of these keys present
 * >;
 * ```
 */
export type Transform<
    T,
    Req extends keyof T,
    Opt extends keyof T,
    Nev extends keyof T,
    Override extends object,
    EnfrcOne extends keyof T = never
> = T extends any
    ? [EnfrcOne] extends [never]
    // no enforcement keys: just do the merge
    ? Merge<
        Omit<T, Req | Opt | Nev>
        & Required<Pick<T, Req>>
        & Partial<Pick<T, Opt>>
        & { [K in Nev]?: never },
        Override
    >
    // enforcement keys present: apply EnforceOneFor
    : EnforceOneFor<
        Merge<
            Omit<T, Req | Opt | Nev>
            & Required<Pick<T, Req>>
            & Partial<Pick<T, Opt>>
            & { [K in Nev]?: never },
            Override
        >,
        EnfrcOne
    >
    : never;

/**
 * Apply `Transform` to each member of a union type T when T is an object.
 * Non-object variants (e.g., undefined) are passed through unchanged.
 * Distributes over unions of T automatically.
 *
 * @template T - The union of types to transform; object variants are transformed.
 * @template Req - Keys to make required.
 * @template Opt - Keys to make optional.
 * @template Nev - Keys to nullify.
 * @template Override - Overrides or additional properties.
 * @template EnfrcOne - Creates additional type variants where at least one of these keys is present.
 */
export type TransformFor<
    T extends object | never,
    Req extends PropertyKey,
    Opt extends PropertyKey,
    Nev extends PropertyKey,
    Override extends object,
    EnfrcOne extends PropertyKey = never
> = NonNullable<Transform<
    T,
    Extract<Req, keyof T>,
    Extract<Opt, keyof T>,
    Extract<Nev, keyof T>,
    Override,
    Extract<EnfrcOne, keyof T>
>>;

/**
 * Create an alias union of object type T.
 * Where a variant of T is created for each key K in T where
 * the value of K has the same type as T[K] and all others `other?: never`.
 * So in essence, creating a union of variants where only one attribute may be defined.
 */
export type AliasPick<T extends object> = {
    [K in keyof T]:
    Pick<T, K> &
    Partial<Record<Exclude<keyof T, K>, never>>
}[keyof T];

/** 
 * Convert a snake_case (e.g. `hello_world`) type string to a PascalCase type string (e.g. `HelloWorld`).
 */
export type SnakeToPascalCase<S extends string> =
    S extends `${infer Head}_${infer Tail}`
? `${Capitalize<Head>}${SnakeToPascalCase<Tail>}`
    : Capitalize<S>;

/**
 * Utility type to ensure that only the keys of `T` may be defined.
 * All other keys are set to `never?`.
 * This is useful to ensure that no other keys than those in `T` are allowed.
 */
export type NoOtherKeys<T extends object> =
    T & { [K in Exclude<keyof any, keyof T>]?: never };


/** Make all fields non readonly in an object type. */
export type MutableObject<T> = { -readonly [P in keyof T]: T[P] }


/**
 * Utility type to make all properties of T required, except for the specified keys K.
 * This is useful when you want to enforce that all properties are required,
 * except for a few specific ones that can remain optional.
 */
export type RequiredExcept<
    T extends object,
    K extends keyof T
> = Required<Omit<T, K>> & Pick<T, K>

/**
 * Utility type to make the properties K of T required,
 * while keeping all other properties unchanged.
 * Duplicate of {@link Enforce}.
 */
export type RequiredFor<
    T extends object,
    K extends keyof T
> = T extends any
    ? Omit<T, K> & Required<Pick<T, K>>
    : never;