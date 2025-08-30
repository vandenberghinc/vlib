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
* Convert a snake_case (e.g. `hello_world`) type string to a PascalCase type string (e.g. `HelloWorld`).
*/
export type SnakeToPascalCase<S extends string> =
    S extends `${infer Head}_${infer Tail}`
    ? `${Capitalize<Head>}${SnakeToPascalCase<Tail>}`
    : Capitalize<S>;


/** Make all fields non readonly in an object type. */
export type MutableObject<T> = { -readonly [P in keyof T]: T[P] }