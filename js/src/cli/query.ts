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
export class Or<const A extends Arr = Arr> extends Array<string> {
    readonly items: A;
    constructor(...items: A) { super(...items); this.items = items; }
    str() { and_or_str(this) }
}
export const or = <const A extends Arr = string[]>(...args: A) => new Or<A>(...args);

/** And query. */
export class And<const A extends Arr = Arr> extends Array<string> {
    readonly items: A;
    constructor(...items: A) { super(...items);; this.items = items; }
    str() { and_or_str(this) }
}
export const and = <const A extends Arr = Arr>(...args: A) => new And<A>(...args);

/** Convert a query / identifier to a string. */
export function and_or_str(id: string | string[] | And | Or): string {
    return typeof id === "string"
        ? id
        : id instanceof And
            ? id.join(" ")
            : id instanceof Or || Array.isArray(id)
                ? id.join(", ")
                : (() => { throw new TypeError(`Invalid query identifier: ${id}`) })();
}
