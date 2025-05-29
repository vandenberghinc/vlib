/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { throw_error } from "./error.js";
/** CLI.Query types. */
export var Query;
(function (Query) {
    /**
     * And operation for argument identifiers.
     */
    class And extends Array {
        constructor(...args) { super(...args); }
        match(fn) {
            return this.every(fn);
        }
    }
    Query.And = And;
    (function (And) {
        And.is = (x) => x instanceof And;
    })(And = Query.And || (Query.And = {}));
    /**
     * Or operation for argument identifiers.
     * A nested string[] is considered as another OR operation.
     */
    class Or extends Array {
        constructor(...args) { super(...args); }
        match(fn) {
            return this.some(fn);
        }
    }
    Query.Or = Or;
    (function (Or) {
        Or.is = (x) => x instanceof And === false && Array.isArray(x);
    })(Or = Query.Or || (Query.Or = {}));
    /**
     * Convert a query / identifier to a string.
     */
    Query.to_str = (id) => id instanceof And
        ? id.map(Query.to_str).join(" ")
        : Array.isArray(id)
            ? id.map(Query.to_str).join(", ")
            : id;
    /**
     * Match identifier against a query.
     * @note only Supports Or<string> and And<string | string[]> queries.
     */
    function match(id, query) {
        if (id instanceof And) {
            return id.every((item, index) => {
                if (typeof query === "string") {
                    return match_str(item, query);
                }
                const q = query[index];
                return Array.isArray(q)
                    ? q.includes(item)
                    : match_str(item, q);
            });
        }
        else if (id instanceof Or || Array.isArray(id)) {
            return id.some(item => match_str(query, item));
        }
        else if (typeof id === "string") {
            return match_str(query, id);
        }
        else {
            // @ts-expect-error
            throw_error(`Invalid query type: ${id.toString()}`);
        }
    }
    Query.match = match;
    function match_str(id, query) {
        if (id instanceof And) {
            return id.every(i => i === query);
        }
        else if (id instanceof Or) {
            return id.includes(query);
        }
        else if (Array.isArray(id)) {
            return id.includes(query);
        }
        else if (typeof query === "string") {
            return id === query;
        }
        else {
            // @ts-expect-error
            throw_error(`Invalid query type: ${query.toString()}`);
        }
    }
    Query.match_str = match_str;
})(Query || (Query = {}));
//# sourceMappingURL=query.js.map