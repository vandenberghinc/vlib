/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Built-in falsy primitives in JavaScript
 * @nav Types
 * @docs
 */
export type Falsy = false | 0 | 0n | "" | null | undefined;
/**
 * A value that is *not* falsy.
 * Could be any truthy value, including objects, arrays, non-zero numbers, non-empty strings, etc.
 * @nav Types
 * @docs
 */
export type Truthy = Exclude<unknown, Falsy>;
