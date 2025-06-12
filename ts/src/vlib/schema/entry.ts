/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Neverify } from "../types/transform.js";
import { Cast } from "./cast.js";

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

/** Types for the `Entry` namespace. */
export namespace Entry {

    /**
     * The input options for an inferrable entry.
     * Note that `Entry` is not included in this type.
     * This is due to the fact that an initialized entry is currently not inferrable.
     * @warning Dont change this from `EntryInputOpts`
     *          Dont add `Entry` to this, as that will break the `infer.ts` file.
     */
    export type Inferrable<
        T extends CastType = CastType, // type of entry
        V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
        P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
        Derived extends Record<string, any> = {},
    > = T | Entry.Plain<T, V, P, Derived>

    /** Inferrable options for constructing an entry. */
    export type Opts<
        T extends CastType = CastType, // type of entry
        V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
        P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
        Derived extends Record<string, any> = {},
    > = Inferrable<T, V, P, Derived>;

    /**
     * A plain entry object.
     * Currently only a `plain` entry is inferrable, not the `Entry` class.
     * 
     * @todo rename to `Entry` instead of `Entry.Plain`.
     * 
     * See {@link Entry} for more information about attributes.
     * 
     * @template Dervied -
     *      This is an experimental feature, allowing to create extended `Record<string, DerivedEntry.Plain>` types.
     *      However, note that this feature is only supported by the `Entry.Plain` type.
     *      No type in the `Schema` namespace consideres this type, except for `Entry.Plain`.
     *      Therefore it can be used to initialize a custom entries object,
     *      Which can be validated, but still hold derived attributes, including under its nested schemas.
     *      Which is the main reason for this type to exist.
     * 
     * @warning This class is supported by the `infer.ts` file.
     *          Therefore ensure that the attributes are kept in sync with the `Entry.Plain` type.
     *          When changing the attributes, ensure that the `infer.ts` file is updated accordingly.
     */
    export type Plain<
        T extends CastType = CastType, // type of entry
        V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
        P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
        Derived extends Record<string, any> = {},

        // T extends CastableType.Readonly = CastableType.Readonly, // type of entry
        // V extends Cast.Value = Cast.Value, // value of entry
    > = (
        (Derived extends Record<string, any> ? Derived : {})
        & {
            /**
             * The value type.
             * @note When the type is `any`, then all filters such as `allow_empty`, `max` etc are disabled.
             */
            readonly type?: T;
            /**
             * The default value or callback to create default value
             * When defined this attribute will be considered as optional.
             */
            default?: V | ((parent: P) => V);
            /**
             * Is required, when `true` the attribute must be defined or an error will be thrown.
             * Defaults to `true`.
             */
            required?: boolean | ((parent: P) => boolean);
            /**
             * Allow empty strings, arrays or objects.
             * Defaults to `true`.
             */
            allow_empty?: boolean;
            /**
             * Set a minimum length for strings or arrays, and min `x >= min` value of number.
             */
            min?: number;
            /**
             * Set a maximum length for strings or arrays, and max `x <= max` value of number.
             */
            max?: number;
            /**
             * A nested schema for when the attribute is an object.
             */
            schema?: Record<string, Inferrable<any, any, any, Derived>>;
            // schema?: Entries.Opts;
            /**
             * A nested schema for the array items for when the attribute is an array.
             * Or a schema for the value's of an object.
             */
            value_schema?: Inferrable<any, any, any, Derived>;
            // value_schema?: ValueEntries.Opts;
            /**
             * Tuple schema for when the input object is an array.
             * This can be used to verify each item in an array specifically with a predefined length.
             * 
             * Each index of the schema option corresponds to the index of the input array.
             * 
             * @note this attribute is ignored when the input object is not an array.
             */
            tuple?: Inferrable<any, any, any, Derived>[];
            // tuple?: TupleEntries.Opts;
            /**
             * A list of valid values for the attribute.
             */
            enum?: readonly any[];
            /**
             * Aliases for this atttribute.
             * When any of these alias attributes is encountered the attribute will be renamed to the current attribute name.
             * Therefore this will edit the input object.
             */
            alias?: string | readonly string[];
            /**
             * Verify the attribute, optionally return an error string.
             */
            verify?: (
                attr: V,
                parent: P,
                key?: IndexOrKey<P>
            ) => string | void | null | undefined;
            /**
             * Pre process the attribute.
             * The callback should return the updated value.
             */
            preprocess?: (
                attr: V,
                parent: P,
                key: IndexOrKey<P>
            ) => any;
            /**
             * Post process the attribute.
             * The callback should return the updated value.
             */
            postprocess?: (
                attr: V,
                parent: P,
                key: IndexOrKey<P>
            ) => any;
            /**
             * Cast string to boolean/number.
             * Only allowed when type is exactly `boolean` or `number`.
             */
            cast?: T extends "boolean" // only for strict boolean types.
                ? boolean | Neverify<Cast.boolean.Opts, "preserve">
                : T extends "number" // only for strict number types.
                    ? boolean | Neverify<Cast.number.Opts, "preserve">
                    : never
            /**
             * The allowed charset for string typed entries.
             * This should be some `^...$` formatted regex.
             * For instance `^[\w+]+$` will only allow alphanumeric and _ characters.
             */
            charset?: "string" extends Entry.Type.Cast<T>
                ? RegExp
                : never;
            /** Alias for `default`. */
            readonly def?: V | ((obj: any) => V);
        }
    );

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Infer<T extends Opts> = InferEntry<T>;

    /**
     * All supported argument types.
     * @note that we only need primitive types since we dont use it at runtime to cast to values.
     *       This is merely a map to perform casts.
     *       And the keys will be used as allowed types for validation.
     */
    export type Types = {
        any: any;
        undefined: undefined;
        null: null;
        boolean: boolean;
        number: number;
        string: string;
        array: string[];
        object: Record<string, any>;
    };

    /** Argument string types. */
    export type Type = keyof Types;

    /** Types for the `Type` namespace. */
    export namespace Type {

        /**
         * Cast a type name or type names union to its corresponding value type.
         * Also supports already casted value types as input.
         */
        export type Cast<
            T extends never | undefined | Castable<"readonly"> | Entry.Value,
            Def extends any = string, // returned type for undefined | null
            Never extends any = unknown, // returned type for never
        > =
            [T] extends [never] ? Never :
            T extends | null | undefined ? Def :
            T extends Function ? T : // since we support funcs / class types
            T extends readonly Type[] ? Types[T[number]] :
            T extends Type[] ? Types[T[number]] :
            T extends Type ? Types[T] :
            Never; // never; - from old version

        /** The base type of castable type generics. */
        export type Castable<Readonly extends "readonly" | "mutable"> =
            Readonly extends "readonly" ? (Castable.Base | readonly Castable.Base[]) :
            Readonly extends "mutable" ? (Castable.Base | Castable.Base[]) :
            never;
        export namespace Castable {
            /** The castable non array type.  */
            export type Base = Type | Function;
        }
    }

    /** The value type of type */
    export type Value = Types[Type];
}

// ------------------------------------------------------------
// A record of entries.

/** Entries types. */
export namespace Entries {

    /**
     * Inferrable input options for constructing a new `schema: Entries` object.
     */
    export type Opts<Derived extends Record<string, any> = {}> =
        NonNullable<Entry.Plain<any, any, any, Derived>["schema"]>

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Infer<T extends Opts> = InferEntries<T>;
}

// ------------------------------------------------------------
/**
 * Value entries. Basically a single value entry.
 * However, still keep this as a seperate type because 
 * The infer strategy treats it differently than a normal entry.
 */
export namespace ValueEntries {

    /**
     * Inferrable input options for constructing a new `value_schema: Entry` object.
     */
    export type Opts<Derived extends Record<string, any> = {}> =
        NonNullable<Entry.Plain<any, any, any, Derived>["value_schema"]>

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Infer<
        ParentT extends "array" | "object",
        V extends Opts,
    > = InferValueEntries<ParentT, V>;
}

// ------------------------------------------------------------
/**
 * Tuple entries.
 * This can be used to verify a tuple array.
 * So a fixed length array with a specific type for each position.
 */
export namespace TupleEntries {

    /**
     * Inferrable input options for constructing a new `value_schema: Entry` object.
     */
    export type Opts<Derived extends Record<string, any> = {}> =
        NonNullable<Entry.Plain<any, any, any, Derived>["tuple"]>

    /** Extract the value‐type for a tuple, preserving tuple positions */
    export type Infer<T extends Opts> = InferTupleEntries<T>;
}





// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
//
// Inferring the entry schemas.
// Keep this in the same file since it so heavily dependent on each other.

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
    E extends Entry.Plain ?
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
    E extends CastType | Entry.Plain,
    Default extends "array" | "object" = "array",
> =
    // castable type.
    E extends CastType ? Entry.Type.Cast<E> extends readonly any[] ? "array" : "object" :
    // entry object.
    E extends Entry.Plain ?
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
    V extends Entry.Plain
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
//         // if it’s a full Entry.Plain, recurse
//         T[I] extends Entry.Plain ? InferEntry<T[I]> :
//         // else if it’s a primitive‐type name, cast it
//         T[I] extends CastableType ? Entry.Type.Cast<T[I]> :
//         // invald.
//         never
// };

// -------------------------------------------------------------
// Inferring the entries record.

/** Is entry optional */
type IsOptional<E extends Entry.Opts> =
    E extends Entry.Plain
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

/**
 * Determine which entries are required vs. optional based on the `required` flag.
 */
type RequiredEntries<S extends Entries.Opts> = {
    [K in keyof S as IsOptional<S[K]> extends false ? K : never]-?:
    S[K] extends Entry.Plain
    ? InferEntry<S[K]>
    : Entry.Type.Cast<S[K]>;
};
type OptionalEntries<S extends Entries.Opts> = {
    [K in keyof S as IsOptional<S[K]> extends true ? K : never]?:
    S[K] extends Entry.Plain
    ? InferEntry<S[K]>
    : Entry.Type.Cast<S[K]>;
};

// /** Extract the value‐type for a normal (named) Entries.Opts object */
// export type InferEntries<S extends Entries.Opts> =
//     RequiredEntries<S> &
//     OptionalEntries<S>;

/** Extract the value‐type for a normal (named) Entries.Opts object */
// export type InferEntries<S extends Entries.Opts> = {
export type InferEntries<S extends Entries.Opts> = {
    [K in keyof S]:
    S[K] extends Entry.Plain ? MaybeOptional<S[K], InferEntry<S[K]>> :
    S[K] extends CastType ? MaybeOptional<S[K], Entry.Type.Cast<S[K]>> :
    unknown
};
// // export type InferEntries<S extends Entries.Opts> = {
// export type InferEntries<S extends Record<string, CastableType | Entry.Plain>> = {
//     [K in keyof S]:
//     S[K] extends Entry.Plain ? MaybeOptional<S[K], InferEntry<S[K]>> :
//     // [S[K]] extends [Entry] ? MaybeOptional<S[K], InferEntry<S[K]>> :
//     S[K] extends CastableType ? MaybeOptional<S[K], Entry.Type.Cast<S[K]>> :
//     unknown
// // S[K] extends Entry.Opts
// //         ? MaybeOptional<Sd[K], InferEntry<S[K]>>
// //         : MaybeOptional<S[K], Entry.Type.Cast<S[K]>>
//     };


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


