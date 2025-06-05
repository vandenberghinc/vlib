/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Super simple throw function, maily to avoid IIFE in ternary like expressions.
 * @example
 * ```ts
 * const map: Record<string, string> = {}
 * ...
 * const value: string = map.my_key ?? vlib.throw(`Key not found`);
 * ```
 * @name throw
 */
declare function throw_(error: string | Error): never;
export { throw_ as throw };
