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
/** Or query. */
export class Or extends Array {
    /** Readonly items for `InferArgs`. */
    items;
    /** Set for `match()`. */
    set;
    /** Constructor. */
    constructor(...items) { super(...items); this.items = items; this.set = new Set(items); }
    /** Convert to string. */
    str() { and_or_str(this); }
    /** Match against argv. */
    match(argv, start_index = 0) {
        if (this.length === 0)
            return undefined;
        const i = argv.findIndex(a => this.set.has(a), start_index);
        return i === -1 ? undefined : i;
    }
}
export const or = (...args) => new Or(...args);
/** And query. */
export class And extends Array {
    /** Readonly items for `InferArgs`. */
    items;
    /** Constructor. */
    constructor(...items) { super(...items); ; this.items = items; }
    /** Convert to string. */
    str() { and_or_str(this); }
    /**
     * Match against argv.
     * The sequence must be appear in the exact order as in the array.
     * Without any other args inbetween. So avoid command + arg conflicts.
     */
    match(argv, start_index = 0) {
        if (this.length === 0 || argv.length < this.length)
            return undefined;
        const first = this[0];
        const i = argv.findIndex((a, i) => a === first
            && ArrayUtils.eq(argv, this.items, i), start_index);
        return i === -1 ? undefined : i;
    }
}
export const and = (...args) => new And(...args);
/** Convert a query / identifier to a string. */
export function and_or_str(id) {
    return typeof id === "string"
        ? id
        : id instanceof And
            ? id.join(" ")
            : id instanceof Or || Array.isArray(id)
                ? id.join(", ")
                : (() => { throw new TypeError(`Invalid query identifier: ${id}`); })();
}
//# sourceMappingURL=query.js.map