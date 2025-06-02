/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Query for And/Or operation.
 * We need a compile time parsable query for the InferArgs type.
 *
 * @warning
 *      We only use native string's as T items not nested arrays.
 *      This was the case in the past, but this
 *      Became very confusing due to InferArgs and everything.
 *      And due to the different Arg variant / modes + queries etc, just dont.
 */
/**
 * Type alias for `items: Arr` this is required for the `InferArgs` type to work correctly.
 * @warning Dont use `readonly` here since that will break `InferArgs`.
 */
type Arr = string[];
/** Or query. */
export declare class Or<const A extends Arr = Arr> extends Array<string> {
    readonly items: A;
    constructor(...items: A);
    str(): void;
}
export declare const or: <const A extends Arr = string[]>(...args: A) => Or<A>;
/** And query. */
export declare class And<const A extends Arr = Arr> extends Array<string> {
    readonly items: A;
    constructor(...items: A);
    str(): void;
}
export declare const and: <const A extends Arr = Arr>(...args: A) => And<A>;
/** Convert a query / identifier to a string. */
export declare function and_or_str(id: string | string[] | And | Or): string;
export {};
