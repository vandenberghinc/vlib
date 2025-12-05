/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Base class to create callable class instances.
 * Subclass must implement the `call` method matching the signature.
 * The constructor returns a bound function preserving `this` and prototype.
 *
 * @typeParam T - argument tuple for the call signature
 * @typeParam R - return type of the call signature
 *
 * @example
 * ```ts
 * interface Multiplier extends Callable<[number, number], number> {}
 * class Multiplier extends Callable<[number, number], number> {
 *   call(a: number, b: number): number {
 *     return a * b;
 *   }
 *   description(): string { return 'Multiply two numbers'; }
 * }
 * const mul = new Multiplier();
 * console.log(mul(3, 4));        // 12
 * console.log(mul.description()); // 'Multiply two numbers'
 * ```
 * @docs
 */
export class Callable {
    constructor() {
        // Create a wrapper function that delegates to the subclass's `call` method
        const fn = (...args) => {
            // Invoke `call` on the wrapper, so `this` inside `call` refers to the wrapper
            return fn.call(...args);
        };
        // Preserve prototype chain so `instanceof` works
        Object.setPrototypeOf(fn, new.target.prototype);
        return fn;
    }
}
//# sourceMappingURL=callable.js.map