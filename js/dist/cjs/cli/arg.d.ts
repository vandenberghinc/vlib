/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Query } from "./query.js";
/**
 * {Arg}
 * Argument options for {@link CLI.get}.
 * Note that this is an uninitialized argument type,
 * Serving as a base for the initialized command argument.
 * And as a query object for the CLI.get/info methods.
 *
 * @template T The type to cast the argument to, defaults to `string`.
 * @template D System template to check against casted T.
 *
 * @attr id The identifier query.
 *          This id will be used for the argument name in the callback argument options.
 *          The first encountered string identifier will be used as name.
 *          Unless the id is an AND query, in which case the last identifier will be used.
 *          Also required for index arguments, in this case just define a plain string to indicate the name of the argument for the callback argument options.
 * @attr index The index of the argument to get. This option precedes the id option. Also this ignores the `exclude_dash` option, since it is only used for non-index arguments.
 * @attr type The type to cast the argument to, if not defined the argument is returned as is.
 * @attr def The default value to return when the argument is not found.
 * @attr exclude_dash Whether to exclude values that start with a dash (-) when searching for a non index argument, defaults to true.
 *
 * @libris
 */
export type Arg<T extends Arg.Castable = Arg.Castable, D extends Arg.Cast<T> = Arg.Cast<T>, Variant extends Arg.Variant = Arg.Variant> = {
    /** exclude dash-prefixed values */
    exclude_dash?: boolean;
    /** explicit cast type; if omitted we treat it as undefined→string */
    type?: T;
    /** The default value, when the argument is not found. */
    def?: Arg.Cast<T>;
} & (Variant extends "main" ? {
    id?: never;
    index?: never;
} : Variant extends "id" ? {
    id: string | string[] | Query.Or<string>;
    index?: never;
} : {
    id?: never;
    index: number;
});
/**
 * Argument types for the CLI.
 */
export declare namespace Arg {
    /**
     * All variants.
     */
    type Variant = "id" | "index" | "main";
    /**
     * All supported argument types.
     */
    type Types = {
        /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */
        /** Primitive types. */
        string: string;
        number: number;
        boolean: boolean;
        /**
         * Arrays.
         * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
         */
        array: string[];
        "boolean[]": boolean[];
        "number[]": number[];
        "string[]": string[];
        /** Object.s */
        object: Record<string, any>;
        /** Maps. */
        "string:boolean": Map<string, boolean>;
        "string:number": Map<string, number>;
        "string:string": Map<string, string>;
        "string:boolean|number|string": Map<string, boolean | number | string>;
        "string:boolean|number": Map<string, boolean | number>;
        "string:boolean|string": Map<string, boolean | string>;
        "string:number|string": Map<string, number | string>;
        "string:boolean|number|string|array": Map<string, boolean | number | string | string[]>;
        "number:boolean": Map<number, number>;
        "number:number": Map<number, number>;
        "number:string": Map<number, string>;
    };
    /**
     * Argument string types.
     */
    type Type = keyof Types;
    /**
     * The value type of
     */
    type Value = Types[Type];
    /**
     * The base type of castable type generics.
     * @warning never add `undefined` etc here, do that on specific types only.
     */
    type Castable = Type | Type[];
    /**
     * Cast a type name or type names union to its corresponding value type.
     * Also supports already casted value types as input.
     */
    type Cast<T extends never | undefined | Castable | Value> = [
        T
    ] extends [never] ? string : T extends null | undefined ? string : T extends Type[] ? Types[T[number]] : T extends Type ? Types[T] : never;
}
