/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/** Query types. */
export namespace Query {

    /** And operation for argument identifiers. */
    export class And<T = string | string[] | Or> extends Array<T> {
        constructor(...args: T[]) { super(...args); }
        match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean {
            return this.every(fn);
        }
    }
    export namespace And {
        export const is = (x: any): x is And => x instanceof And;
    }

    /**
     * Or operation for argument identifiers.
     * A nested string[] is considered as another OR operation.
     */
    export class Or<T = string> extends Array<T> {
        constructor(...args: T[]) { super(...args); }
        match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean {
            return this.some(fn);
        }
    }
    export namespace Or {
        export const is = (x: any): x is Or => x instanceof And === false && Array.isArray(x);
    }

    /** Convert a query / identifier to a string. */
    export const to_str = (id: string | string[] | Query.Or<string> | Query.And<string | Query.Or<string> | string[]>): string => id instanceof And
        ? id.map(to_str).join(" ")
        : Array.isArray(id)
            ? id.map(to_str).join(", ")
            : id;
}