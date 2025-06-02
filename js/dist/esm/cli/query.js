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
/** Or query. */
export class Or extends Array {
    items;
    constructor(...items) { super(...items); this.items = items; }
    str() { and_or_str(this); }
}
export const or = (...args) => new Or(...args);
/** And query. */
export class And extends Array {
    items;
    constructor(...items) { super(...items); ; this.items = items; }
    str() { and_or_str(this); }
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