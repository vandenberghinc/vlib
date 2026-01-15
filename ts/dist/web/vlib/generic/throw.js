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
 * @nav Utils
 * @name throw
 * @docs
 */
function throw_(error) {
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(error);
}
export { throw_ as throw };
//# sourceMappingURL=throw.js.map