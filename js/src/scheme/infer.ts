/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Infer a scheme item to a type.
 */

import type { Entry, EntryObject } from "./entry.js";
import type { Cast } from "./cast.js"
import type { Scheme } from "./scheme.js";

/** Is scheme item optional */
type IsOptional<E extends Cast.Castable | EntryObject> =
    E extends EntryObject
    ?
        // Explicit `false` ➜ optional
        [E["required"]] extends [false] ? true :
        // Callback ➜ we cannot evaluate ➜ optional
        E["required"] extends Function ? true :
        // Missing / `true` ➜ required
        false
    : false // always required since default is required unless otherwise provided.

/** Wrap maybe as optional. */
type MaybeOptional<E extends Cast.Castable | EntryObject, T extends any> =
    IsOptional<E> extends true
        ? T | undefined
        : T

/** Wrap in an object or record type if based on object/array type. */
type ValueSchemeHelper<E extends EntryObject, V extends Cast.Value> =
    E["type"] extends "object"
    ? Record<string, V>
    : V[]

/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends EntryObject> =
    // explicit default or def
    E extends { default: (obj: any) => infer R } ? R :
    E extends { default: infer D } ? D :
    E extends { def: (obj: any) => infer R } ? R :
    E extends { def: infer D } ? D :
    // enum array
    E extends { enum: infer U extends readonly any[] } ? U[number] :
    // nested object‐scheme
    E extends { scheme: infer S extends Record<string, EntryObject | Cast.Castable> } ? InferScheme<S> :
    // nested single value_scheme
    E extends { value_scheme: infer V }
        ? V extends EntryObject
            ? ValueSchemeHelper<E, InferEntry<V>>
            : V extends Cast.Castable
                ? ValueSchemeHelper<E, Cast<V, "string", undefined>>
                : never
        :
    // nested tuple
    E extends { tuple: infer Tup }
        ? Tup extends readonly (EntryObject | Cast.Castable)[]
            ? InferTupleScheme<Tup>
            : never
        :
    // bare type
    E["type"] extends Cast.Castable
        ? Cast<E["type"], "string", undefined>
        : never;

/** Extract the value‐type for a normal (named) Scheme.Opts object */
export type InferScheme<
    S extends Record<string, EntryObject | Cast.Castable>
> = {
    [K in keyof S]:
        S[K] extends EntryObject
            ? MaybeOptional<S[K], InferEntry<S[K]>>
            : MaybeOptional<S[K], Cast<S[K], never, "string">>
};

/** Extract the value‐type for a tuple, preserving tuple positions */
export type InferTupleScheme<
    T extends readonly (EntryObject | Cast.Castable)[]
> = {
    [I in keyof T]:
        T[I] extends EntryObject
            ? MaybeOptional<T[I], InferEntry<T[I]>>
            : MaybeOptional<T[I], Cast<T[I], never, "string">>
};

/**
 * Can be used as follows.
 */


// ————————————————————————————————————————————————————————
// INTERNAL TESTS
function test_infer_scheme<
    const S extends Record<string, EntryObject | Cast.Castable>
>(s: S, callback: (i: InferScheme<S>) => void) {}
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
        my_array_1: { type: "array", value_scheme: "number" },
        my_array_2: { value_scheme: "number" },
        my_val_scheme_1: { value_scheme: "number" },// err
        my_val_scheme_2: { type: "object", value_scheme: "number" },
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


