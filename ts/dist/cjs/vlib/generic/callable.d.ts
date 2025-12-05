/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Provides a function-call signature on class instances.
 * Subclasses merge this interface and the abstract class to become callable.
 *
 * @typeParam T - argument tuple for the call signature
 * @typeParam R - return type of the call signature
 *
 * @example
 * ```ts
 * interface Greeter extends Callable<[string], void> {}  // interface merge
 * class Greeter extends Callable<[string], void> {
 *   call(name: string): void { console.log(`Hello, ${name}`); }
 * }
 * const g = new Greeter();
 * g('World');  // Hello, World
 * console.log(g instanceof Greeter);  // true
 * ```
 */
export interface Callable<T extends any[] = any[], R = any> {
    /** Call signature: invoked when the instance is called as a function */
    (...args: T): R;
}
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
export declare abstract class Callable<T extends any[] = any[], R = any> {
    /** Implementation of the function invocation. */
    abstract call(...args: T): R;
    constructor();
}
