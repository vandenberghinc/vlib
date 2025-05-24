/**
 * Make only the keys in K required (leave everything else as it was),
 * and distribute over unions of T.
 *
 * @example
 * ```ts
 *     interface Foo {
 *         a?: string
 *         b?: number
 *         c?: boolean   
 *     }
 *     type RequiredFoo = RequiredOnly<Foo, 'a' | 'b'> // { a: string; b: number; c?: boolean; }
 * ```
 */
export type RequiredOnly<
    T,
    K extends PropertyKey
> = T extends any
    ? Omit<T, Extract<K, keyof T>>
    & Required<Pick<T, Extract<K, keyof T>>>
    : never

/**
 * Merge two object types, with properties from U
 * overriding those in T. Distributes over unions in T.
 *
 * @example
 * ```ts
 * interface A { id: number; foo?: string; bar: boolean; }
 * interface B { foo: string; baz: number; }
 *
 * // Resulting type:
 * // { id: number; bar: boolean; foo: string; baz: number; }
 * type AB = Merge<A, B>;
 * ```
 */
export type Merge<T, U> = T extends any
    ? Omit<T, keyof U> & U
    : never;


/** Types for default `Map` class. */
export namespace Map {
        
    /**
     * Extracts the value type from a Map.
     *
     * @template M - A Map whose value type you want to extract.
     * @example
     *   type MyMap   = Map<string, number>;
     *   type ValueOf = MapValue<MyMap>; // number
     */
    export type Value<M extends Map<any, any>> = M extends Map<any, infer V> ? V : never;

    /**
     * Extracts the key type from a Map.
     *
     * @template M - A Map whose key type you want to extract.
     * @example
     *   type MyMap = Map<string, number>;
     *   type KeyOf = MapKey<MyMap>; // string
     */
    export type Key<M extends Map<any, any>> = M extends Map<infer K, any> ? K : never;
}

/**
 * Extracts only the literal‐string types from T.
 * 
 * - If you pass a literal (e.g. `"foo"`), you get `"foo"`.
 * - If you pass the general `string` type, you get `never`.
 * - If you pass a union that includes `string`, you also get `never`.
 *
 * @example
 *   type L1 = StringLiteral<"hello">;        // "hello"
 *   type L2 = StringLiteral<string>;          // never
 *   type L3 = StringLiteral<"foo" | "bar">;   // "foo" | "bar"
 *   type L4 = StringLiteral<string | "baz">;  // never
 */
export type StringLiteral<T extends string> = string extends T ? never : T;

/**
 * Like StringLiteral<T>, but also ensures T really is a string‐primitive
 * (and not some subclassed String object).
 */
export type PrimitiveStringLiteral<T extends string> =
    T extends `${infer _}`            // T is a string‐primitive
    ? (string extends T             // but not the broad `string`
        ? never
        : T)
    : never;

/**
 * Filters a type to only tuple (array literal) types.
 *
 * If T is a general array type (e.g., string[]), it resolves to never.
 * Only fixed-length tuple types pass through.
 *
 * @template T - The array type to filter.
 * @example
 *   type L1 = ArrayLiteral<[number, string]>; // [number, string]
 *   type L2 = ArrayLiteral<string[]>;         // never
 *   type L3 = ArrayLiteral<any[]>;            // never
 */
export type ArrayLiteral<T extends readonly any[]> = number extends T['length'] ? never : T;