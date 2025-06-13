/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import type { Entry, Entries, ValueEntries } from "./entry.js";

/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>

/** Get index/key type of array/obj */
type IndexOrKey<T extends ObjOrArr> =
    T extends any[] ? number :
    T extends Record<string, any> ? string :
    never;

// ------------------------------------------------------------
// A single inferrable entry object.

/** Type alias for a castable readonly entry type.  */
type CastType = Entry.Type.Castable<"readonly">;


// ------------------------------------------------------------
//
// Inferring the entry schemas.

/** Process the default value and return its type.
 *  - string‐literal → string
 *  - number‐literal → number
 *  - boolean‐literal → boolean
 *  - readonly [ … ] or Array<…> → (widened) array of the element type
 *  - everything else → itself (e.g. class instances, plain objects, etc.)
 */
type LiteralToType<D> =
    // if D is any kind of string literal, make it `string`
    D extends string ? string :
    // if D is any numeric literal, make it `number`
    D extends number ? number :
    // if D is a boolean literal, make it `boolean`
    D extends boolean ? boolean :
    // if D is a readonly tuple/array, infer U and return a plain U[]
    D extends readonly (infer U)[] ? U[] :
    // otherwise, leave D as‐is (e.g. class instances, POJOs, etc.)
    D;


/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends Entry.Opts> =
    // E extends readonly CastableType[] ? Entry.Type.Cast<E[number]> :
    // entry object / class.
    E extends Entry ?
        // explicit default or def
        E extends { default: (obj: any) => infer R } ? R : // dont do literal to type here since its the return type, so actual literal string flag-like unions must be kept.
        E extends { default: infer D } ? LiteralToType<D> :
        E extends { def: (obj: any) => infer R } ? R : // dont do literal to type here since its the return type, so actual literal string flag-like unions must be kept.
        E extends { def: infer D } ? LiteralToType<D> :
        // enum array
        E extends { enum: infer U extends readonly any[] } ? U[number] :
        // nested object‐scheme
        E extends { schema: infer S extends Entries.Opts } ? InferEntries<S> :
        // nested single value_scheme
        E extends { value_schema: infer V extends ValueEntries.Opts }
        ? InferValueEntries<ValueEntriesParentType<E>, V> :
        // nested tuple from entry
        E extends { tuple: infer Tup extends readonly Entry.Opts[] }
        ? InferTupleEntries<Tup> :
        // cast type
        E["type"] extends CastType ? Entry.Type.Cast<E["type"]> :
        // invalid.
        unknown :
    // castable type.
    E extends CastType ? Entry.Type.Cast<E> :
    // invalid.
    never

/**
 * Get the parent type for value entries.
 * From the parent entry.
 */
export type ValueEntriesParentType<
    E extends CastType | Entry,
    Default extends "array" | "object" = "array",
> =
    // castable type.
    E extends CastType ? Entry.Type.Cast<E> extends readonly any[] ? "array" : "object" :
    // entry object.
    E extends Entry ?
        // explicit default or def
        E extends { default: infer D } ? LiteralToType<D> extends readonly any[] ? "array" : "object" :
        E extends { def: infer D } ? LiteralToType<D> extends readonly any[] ? "array" : "object" :
        // bare type
        E["type"] extends CastType ? Entry.Type.Cast<E["type"]> extends readonly any[] ? "array" : "object" :
        // invalid.
        Default
    // invalid.
    : Default

/** Infer a value scheme */
export type InferValueEntries<
    ParentT extends "array" | "object",
    V extends ValueEntries.Opts,
> =
    V extends Entry
    ? ParentT extends "array"
        ? InferEntry<V>[]
        : Record<string, InferEntry<V>>
    : V extends CastType
        ? ParentT extends "array"
            ? Entry.Type.Cast<V>[]
            : Record<string, Entry.Type.Cast<V>>
        : never


/** Extract the value‐type for a tuple, preserving tuple positions */
export type InferTupleEntries<T extends readonly Entry.Opts[]> = {
    [I in keyof T]: T[I] extends Entry.Opts
    ? InferEntry<T[I]>
    : never
};
// export type InferTupleEntries<T extends readonly any[]> = {
//     [I in keyof T]:
//         // if it’s a full Entry, recurse
//         T[I] extends Entry ? InferEntry<T[I]> :
//         // else if it’s a primitive‐type name, cast it
//         T[I] extends CastableType ? Entry.Type.Cast<T[I]> :
//         // invald.
//         never
// };

// -------------------------------------------------------------
// Inferring the entries record.

/** Is entry optional */
type IsOptional<E extends Entry.Opts> =
    E extends Entry
    ?
        // Explicit `false` ➜ optional
        [E["required"]] extends [false] ? true :
        // Callback ➜ we cannot evaluate ➜ optional
        E["required"] extends Function ? true :
        // Missing / `true` ➜ required
        false
    : false // always required since default is required unless otherwise provided.

/** Wrap maybe as optional (old). */
type MaybeOptional<E extends Entry.Opts, T extends any> =
    IsOptional<E> extends true
    ? T | undefined
    : T

// /** Extract the value‐type for a normal (named) Entries.Opts object */
// // export type InferEntries<S extends Entries.Opts> = {
// export type InferEntries<S extends Entries.Opts> = {
//     [K in keyof S]: S[K] extends Entry.Opts
//         ? MaybeOptional<S[K], InferEntry<S[K]>>
//         : unknown
// };

/** infer the raw value for every key */
type RawEntries<S extends Entries.Opts> = {
    [K in keyof S]:
    S[K] extends Entry.Opts
    ? InferEntry<S[K]>
    : unknown;
};

/** split into an optional‐props & required‐props mapped type */
export type InferEntries<S extends Entries.Opts> =
    // 1) all the keys that are optional, with the `?` modifier
    { [K in keyof S as IsOptional<S[K]> extends true ? K : never]?: RawEntries<S>[K] }
    // 2) intersected with all the keys that are required (no `?`)
    & { [K in keyof S as IsOptional<S[K]> extends true ? never : K]: RawEntries<S>[K] };

// -------------------------------------------------------------
// INTERNAL TESTS

function test_infer_scheme<const S extends Entries.Opts>(s: S, callback: (i: InferEntries<S>) => void) { }
test_infer_scheme(
    {
        my_str: "string",
        my_nr: "number",
        my_opt_nr_1: { type: "number", required: false },
        my_opt_nr_2: { type: "number", required: () => true }, // cant resolve funcs
        my_opt_nr_3: { type: "number", required: () => false }, // cant resolve funcs
        my_non_opt_nr_1: { type: "number", def: 0 },
        my_non_opt_nr_2: { type: "number", def: () => 0 },
        my_enum_1: { enum: ["a", "b", "c"] },
        // my_tuple_1: { tuple: ["string", "number", "boolean"] },
        my_array_1: { type: "array", value_schema: "number" },
        my_array_2: { value_schema: "number" },
        my_val_scheme_1: { value_schema: "number" }, // ERR - should be have type `object` otherwise it will be an array.
        my_val_scheme_2: { type: "object", value_schema: "number" },
        my_union_1: { type: ["string", "number", "boolean"] },
    },
    (args) => {
        const my_str: string = args.my_str;
        const my_nr: number = args.my_nr;
        // @ts-expect-error
        const my_opt_nr_1: number = args.my_opt_nr_1;
        // @ts-expect-error
        const my_opt_nr_2: number = args.my_opt_nr_2;
        // @ts-expect-error
        const my_opt_nr_3: number = args.my_opt_nr_3;
        const my_non_opt_nr_1: number = args.my_non_opt_nr_1;
        const my_non_opt_nr_2: number = args.my_non_opt_nr_2;
        const my_enum_1: "a" | "b" | "c" = args.my_enum_1;
        // const my_tuple_1: [string, number, boolean] = args.my_tuple_1;
        const my_array_1: number[] = args.my_array_1;
        const my_array_2: number[] = args.my_array_2;
        // @ts-expect-error
        const my_val_scheme_1: Record<string, number> = args.my_val_scheme_1;
        const my_val_scheme_2: Record<string, number> = args.my_val_scheme_2;
        const my_union_1: string | number | boolean = args.my_union_1;
        // const my_union_3: string | number | boolean = {} as InferEntry<["string", "number", "boolean"]>;

        const X: InferTupleEntries<["string", "number", "boolean"]> = undefined as any;
        const _x: [string, number, boolean] = X; // should be a tuple type
    }
);


