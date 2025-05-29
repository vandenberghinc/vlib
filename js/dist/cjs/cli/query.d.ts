/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** CLI.Query types. */
export declare namespace Query {
    /** Any query type. */
    type Query = string | string[] | Query.Or<string> | Query.And<string | Query.Or<string>>;
    /**
     * And operation for argument identifiers.
     */
    class And<T = string | Or> extends Array<T> {
        constructor(...args: T[]);
        match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean;
    }
    namespace And {
        const is: (x: any) => x is And;
    }
    /**
     * Or operation for argument identifiers.
     * A nested string[] is considered as another OR operation.
     */
    class Or<T = string> extends Array<T> {
        constructor(...args: T[]);
        match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean;
    }
    namespace Or {
        const is: (x: any) => x is Or;
    }
    /**
     * Convert a query / identifier to a string.
     */
    const to_str: (id: Query) => string;
    /**
     * Match identifier against a query.
     * @note only Supports Or<string> and And<string | string[]> queries.
     */
    function match(id: Query, query: Query): boolean;
    function match_str(id: Query, query: string): boolean;
}
