/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Infer a scheme item to a type.
 */

import type { Entry, EntryObject } from "./entry.js";
import type { Cast } from "./cast.js"
import type { Scheme } from "./scheme.js";

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

/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends EntryObject> =
    // explicit default or def
    E extends { default: (obj: any) => infer R } ? R : // dont do literal to type here since its the return type, so actual literal string flag-like unions must be kept.
    E extends { default: infer D } ? LiteralToType<D> :
    E extends { def: (obj: any) => infer R } ? R : // dont do literal to type here since its the return type, so actual literal string flag-like unions must be kept.
    E extends { def: infer D } ? LiteralToType<D> :
    // enum array
    E extends { enum: infer U extends readonly any[] } ? U[number] :
    // nested object‐scheme
    E extends { scheme: infer S extends Record<string, EntryObject | Cast.Castable> } ? InferScheme<S> :
    // nested single value_scheme
    E extends { value_scheme: infer V }
        ? V extends EntryObject | Cast.Castable
            ? InferValueScheme<V>
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

/** Infer a value scheme */
type InferValueScheme<V extends Infer.ValueScheme.T> =
    V extends EntryObject
        ? InferEntry<V>[]
        : V extends Cast.Castable
            ? Cast<V, "string", never>[]
            : never

/** Extract the value‐type for a normal (named) Scheme.Opts object */
type InferScheme<S extends Infer.Scheme.T> = {
    [K in keyof S]:
        S[K] extends EntryObject
            ? MaybeOptional<S[K], InferEntry<S[K]>>
            : MaybeOptional<S[K], Cast<S[K], never, "string">>
};

/** Extract the value‐type for a tuple, preserving tuple positions */
type InferTupleScheme<T extends Infer.Tuple.T> = {
    [I in keyof T]:
        T[I] extends EntryObject
            ? MaybeOptional<T[I], InferEntry<T[I]>>
            : MaybeOptional<T[I], Cast<T[I], never, "string">>
};

// ---------------------------------------------------------

/** Public infer module. */
export namespace Infer {

    /** Extract the created value type of an entry, recursing into nested schemes & tuples */
    export type Entry<T extends Entry.T> = T extends Cast.Castable
        ? Cast<T, "string", never>
        : InferEntry<T>;
    export namespace Entry {
        /** Base for generic, could be useful for user. */
        export type T = EntryObject | Cast.Castable;
    }

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Scheme<T extends Scheme.T> = InferScheme<T>;
    export namespace Scheme {
        /** Base for generic, could be useful for user. */
        export type T = Record<string, Cast.Castable | EntryObject>;
    }

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type ValueScheme<T extends ValueScheme.T> = InferValueScheme<T>;
    export namespace ValueScheme {
        /** Base for generic, could be useful for user. */
        export type T = Cast.Castable | EntryObject;
    }

    /** Extract the value‐type for a tuple, preserving tuple positions */
    export type Tuple<T extends Tuple.T> =
        InferTupleScheme<T>;
    export namespace Tuple {
        /** Base for generic, could be useful for user. */
        export type T = readonly (Cast.Castable | EntryObject)[];
    }
}
export { Infer as infer }; // snake_case compatibility


// // -------------------------------------------------------------
// // INTERNAL TESTS
// function test_infer_scheme<
//     const S extends Record<string, EntryObject | Cast.Castable>
// >(s: S, callback: (i: InferScheme<S>) => void) {}
// test_infer_scheme(
//     {
//         my_str: "string",
//         my_nr: "number",
//         my_opt_nr_1: { type: "number", required: false },
//         my_opt_nr_2: { type: "number", required: () => true }, // cant resolve funcs
//         my_opt_nr_3: { type: "number", required: () => false }, // cant resolve funcs
//         my_non_opt_nr_1: { type: "number", def: 0 },
//         my_non_opt_nr_2: { type: "number", def: () => 0 },
//         my_enum_1: { enum: ["a", "b", "c"] },
//         my_tuple_1: { tuple: ["string", "number", "boolean"] },
//         my_array_1: { type: "array", value_scheme: "number" },
//         my_array_2: { value_scheme: "number" },
//         my_val_scheme_1: { value_scheme: "number" },// err
//         my_val_scheme_2: { type: "object", value_scheme: "number" },
//     },
//     (args) => {
//         const my_str: string = args.my_str;
//         const my_nr: number = args.my_nr;
//         // @ts-expect-error
//         const my_opt_nr_1: number = args.my_opt_nr_1;
//         // @ts-expect-error
//         const my_opt_nr_2: number = args.my_opt_nr_2;
//         // @ts-expect-error
//         const my_opt_nr_3: number = args.my_opt_nr_3;
//         const my_non_opt_nr_1: number = args.my_non_opt_nr_1;
//         const my_non_opt_nr_2: number = args.my_non_opt_nr_2;
//         const my_enum_1: "a" | "b" | "c" = args.my_enum_1;
//         const my_tuple_1: [string, number, boolean] = args.my_tuple_1;
//         const my_array_1: number[] = args.my_array_1;
//         const my_array_2: number[] = args.my_array_2;
//         // @ts-expect-error
//         const my_val_scheme_1: Record<string, number> = args.my_val_scheme_1;
//         const my_val_scheme_2: Record<string, number> = args.my_val_scheme_2;
//     }
// );


