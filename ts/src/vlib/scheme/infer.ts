/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Infer a scheme item to a type.
 */

import type { Cast } from "./cast.js"
import type { Entry, EntryObject } from "./entry.js";
import type { Entries, TupleEntries, ValueEntries } from "./entries.js";

/** Type alias for entry or entry object union. */
type EntryOrEntryObj = Entry | EntryObject;

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

/** Is scheme item optional */
type IsOptional<E extends Entry.Opts> =
    E extends EntryOrEntryObj
    ?
        // Explicit `false` ➜ optional
        [E["required"]] extends [false] ? true :
        // Callback ➜ we cannot evaluate ➜ optional
        E["required"] extends Function ? true :
        // Missing / `true` ➜ required
        false
    : false // always required since default is required unless otherwise provided.

/** Wrap maybe as optional. */
type MaybeOptional<E extends Entry.Opts, T extends any> =
    IsOptional<E> extends true
        ? T | undefined
        : T

/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends EntryOrEntryObj> =
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
    E extends { value_schema: infer V }
        ? V extends ValueEntries.Opts
            ? InferValueEntries<CastsToArray<E["type"], "array", "object">, V>
            : never
        :
    // nested tuple
    E extends { tuple: infer Tup }
        ? Tup extends TupleEntries.Opts
            ? InferTupleEntries<Tup>
            : never
        :
    // bare type
    E["type"] extends Cast.Castable
        ? Cast<E["type"], "string", undefined>
        : never;

/**
 * Check if a castable type results in an array or not.
 */
export type CastsToArray<T extends undefined | Cast.Castable, True = true, False = false> =
    T extends undefined ? False :
    Cast<T> extends any[]
    ? True
    : False;

/** Infer a value scheme */
export type InferValueEntries<
    ParentT extends "array" | "object",
    V extends ValueEntries.Opts,
> =
    V extends EntryObject
        ? ParentT extends "array"
            ? InferEntry<V>[]
            : Record<string, InferEntry<V>>
        : V extends Cast.Castable
            ? ParentT extends "array"
                ? Cast<V, "string", never>[]
                : Record<string, Cast<V, "string", never>>
            : never

/** Extract the value‐type for a normal (named) Entries.Opts object */
export type InferEntries<S extends Entries.Opts> = {
    [K in keyof S]:
        S[K] extends EntryObject
            ? MaybeOptional<S[K], InferEntry<S[K]>>
            : MaybeOptional<S[K], Cast<S[K], never, "string">>
};

/** Extract the value‐type for a tuple, preserving tuple positions */
export type InferTupleEntries<T extends TupleEntries.Opts> = {
    [I in keyof T]:
        T[I] extends EntryObject
            ? MaybeOptional<T[I], InferEntry<T[I]>>
            : MaybeOptional<T[I], Cast<T[I], never, "string">>
};

// -------------------------------------------------------------
// INTERNAL TESTS
function test_infer_scheme<
    const S extends Entries.Opts
>(s: S, callback: (i: InferEntries<S>) => void) {}
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
        my_tuple_1: { tuple: ["string", "number", "boolean"] },
        my_array_1: { type: "array", value_schema: "number" },
        my_array_2: { value_schema: "number" },
        my_val_scheme_1: { value_schema: "number" },// err
        my_val_scheme_2: { type: "object", value_schema: "number" },
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
        const my_tuple_1: [string, number, boolean] = args.my_tuple_1;
        const my_array_1: number[] = args.my_array_1;
        const my_array_2: number[] = args.my_array_2;
        // @ts-expect-error
        const my_val_scheme_1: Record<string, number> = args.my_val_scheme_1;
        const my_val_scheme_2: Record<string, number> = args.my_val_scheme_2;
    }
);


