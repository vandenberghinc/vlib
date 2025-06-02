/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

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

/**
 * The base type for objects or arrays generics.
 */
export type ObjectOrArrayType = any[] | Record<any, any>;

/**
 * Is an object or an array type.
 */
export type ObjectOrArray<T extends any | ObjectOrArrayType> = T extends any[] ? any[] : Record<any, any>;

/**
 * Is never.
 * Equal to `[T] extends [never]`
 */
export type IsNever<T> = [T] extends [never] ? true : false;

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

// /**
//  * If `T` already includes `undefined`, return `T` itself.
//  * Otherwise, return `F` (defaults to `never`, or you can pick `unknown`).
//  */
// export type EnsureMaybe<T, F = never> = undefined extends T ? T : F;