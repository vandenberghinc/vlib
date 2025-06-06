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

import { ArrayUtils } from "../primitives/array.js";

/**
 * Type alias for `items: Arr` this is required for the `InferArgs` type to work correctly.
 * @warning Dont use `readonly` here since that will break `InferArgs`.
 */
type Arr = string[];

/** Or query. */
export class Or<const A extends Arr = Arr> extends Array<string> {

    /** Readonly items for `InferArgs`. */
    readonly items: A;

    /** Set for `match()`. */
    private set: Set<string>;

    /** Constructor. */
    constructor(...items: A) { super(...items); this.items = items; this.set = new Set(items); }
    
    /** Convert to string. */
    str() { and_or_str(this) }

    /** Match against argv. */
    match(argv: string[], start_index = 0): number | undefined {
        if (this.length === 0) return undefined;
        const i = argv.findIndex(a => this.set.has(a), start_index)
        return i === -1 ? undefined : i;
    }
}
export const or = <const A extends Arr = string[]>(...args: A) => new Or<A>(...args);

/** And query. */
export class And<const A extends Arr = Arr> extends Array<string> {

    /** Readonly items for `InferArgs`. */
    readonly items: A;

    /** Constructor. */
    constructor(...items: A) { super(...items);; this.items = items; }
    
    /** Convert to string. */
    str() { and_or_str(this) }

    /**
     * Match against argv.
     * The sequence must be appear in the exact order as in the array.
     * Without any other args inbetween. So avoid command + arg conflicts.
     */
    match(argv: string[], start_index = 0): number | undefined {
        if (this.length === 0 || argv.length < this.length) return undefined;
        const first = this[0];
        const i = argv.findIndex(
            (a, i) => 
                a === first
                && ArrayUtils.eq(argv, this.items, i),
            start_index,
        );
        return i === -1 ? undefined : i;
    }
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
