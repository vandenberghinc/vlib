/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Neverify } from "../../types/types.js";
import { Cast } from "../validate/cast.js";
import { InferEntries, InferEntry, InferTupleEntries, InferValueEntries } from "./infer.js";

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

/**
 * A plain entry object.
 * Currently only a `plain` entry is inferrable, not the `Entry` class.
 * 
 * @todo rename to `Entry` instead of `Entry`.
 * 
 * See {@link Entry} for more information about attributes.
 * 
 * @template Derived -
 *      This is an experimental feature, allowing to create extended `Record<string, DerivedEntry>` types.
 *      However, note that this feature is only supported by the `Entry` type.
 *      No type in the `Schema` namespace consideres this type, except for `Entry`.
 *      Therefore it can be used to initialize a custom entries object,
 *      Which can be validated, but still hold derived attributes, including under its nested schemas.
 *      Which is the main reason for this type to exist.
 * 
 * @warning This class is supported by the `infer.ts` file.
 *          Therefore ensure that the attributes are kept in sync with the `Entry` type.
 *          When changing the attributes, ensure that the `infer.ts` file is updated accordingly.
 */
export type Entry<
    T extends CastType = CastType, // type of entry
    V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
    Derived extends Entry.Derived = {}, // a derived object with additional attributes.
> = (Derived extends Entry.Derived ? Derived : {}) & {
    /**
     * The value type.
     * @note When the type is `any`, then all filters such as `allow_empty`, `max` etc are disabled.
     */
    type?: T;
    /**
     * The default value or callback to create default value
     * When defined this attribute will be considered as optional.
     */
    default?: V | ((parent: P) => V);
    /**
     * Is required, when `true` the attribute must be defined or an error will be thrown.
     * Defaults to `true`. 
     * @warning Never change the defaults to `true` behaviour.
     *          Also since we cast string/array input types to entries,
     *          which makes it even more illogical to have a default of `false`.
     */
    required?: boolean | ((parent: P) => boolean);
    /**
     * Allow empty strings, arrays, objects or numbers (NaN).
     * Defaults to `true`.
     */
    allow_empty?: boolean;
    /**
     * Set a minimum (length) for numbers, strings, arrays or object entries, and min `x >= min` value of number.
     */
    min?: number;
    /**
     * Set a maximum (length) for numbers, strings, arrays or object entries, and max `x <= max` value of number.
     */
    max?: number;
    /**
     * A nested schema for when the attribute is an object.
     */
    schema?: Record<string, (T | DerivedEntry<Derived>)>;
    // schema?: Entries.Opts;
    /**
     * A nested schema for the array items for when the attribute is an array.
     * Or a schema for the value's of an object.
     */
    value_schema?: (T | DerivedEntry<Derived>);
    // value_schema?: ValueEntries.Opts;
    /**
     * Tuple schema for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     * 
     * Each index of the schema option corresponds to the index of the input array.
     * 
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: (T | DerivedEntry<Derived>)[];
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
    ) => void | null | undefined | string | { error: string; raw?: string };
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
    /**
     * The field type, e.g. `attribute`, `query`, `body`, etc, used in error messages.
     * The field type is automatically capitalized to uppercase where needed.
     * Ensure that the word fits in a sentence like `Attribute X is ...`.
     * Since this is how this field will be used in error messages.
     * Defaults to `attribute`.
     */
    field_type?: string;
    /**
     * For when the data type is an object, the `unknown` flag can be
     * used indicate whether to unknown attributes are allowed.
     * When `false`, errors will be thrown when unknown attributes are found.
     * Defaults to `true`.
     * @note The passed value will also be used for the validation
     *       of all attributes in the object, recursively.
     *       Until another object entry is encountered with a different `unknown` value.
     */
    unknown?: boolean;
    /** Alias for `default`. */
    readonly def?: V | ((obj: any) => V);
};
export type DerivedEntry<D extends Entry.Derived = {}> = Entry<CastType, Entry.Type.Cast<CastType>, ObjOrArr, D>;


/** Types for the `Entry` namespace. */
export namespace Entry {

    
    // ------------------------------------------------------------
    // Generic types.

    /** A small alias for the derived base type. */
    export type Derived = Record<string, any>;

    /** Extract the scema type for a given entry. */
    export type ExtractSchema<E extends Entry.Opts> = 
        E extends { schema: infer S extends Entries.Opts }
            ? S
            : unknown;

    /** Extract the scema type for a given entry. */
    export type ExtractValueSchema<E extends Entry.Opts> =
        E extends { value_schema: infer V extends ValueEntries.Opts }
            ? V
            : unknown;

    /** Extract the scema type for a given entry. */
    export type ExtractTupleSchema<E extends Entry.Opts> =
        E extends { tuple: infer T extends TupleEntries.Opts }
            ? T
            : unknown;

    // ------------------------------------------------------------
    // TYpes

    /** Inferrable options for constructing an entry. */
    export type Opts<
        T extends CastType = CastType, // type of entry
        V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
        P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
        D extends Entry.Derived = {},
    > = T | Entry<T, V, P, D>

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Infer<T extends Opts> = InferEntry<T>;

    /** Cast an `Opts` type to an `Entry`. */
    export type FromOpts<T extends Opts<any, any, any, any>> =
        T extends CastType ? Entry<T> :
        T extends Entry ? T :
        unknown;


    // ------------------------------------------------------------
    // Casting types to their corresponding value types.

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
    const types_set = new Set<keyof Types>([
        "any", "undefined", "null", "boolean", "number", "string", "array", "object"
    ]);

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
            
            /**
             * The castable non array type. 
             * Note that we add the `Function` type here to support class instances as well.
             */
            export type Base = Type | Function;

            /** Check if a given input type is a `Castable` */
            export const is = (type: any): type is Castable<"readonly" | "mutable"> => (
                (typeof type === "string" && types_set.has(type as Type))
                || typeof type === "function"
                || (Array.isArray(type) && type.every(Castable.is))
            );
            export const is_fast = (type: any): type is Castable<"readonly" | "mutable"> => (
                (typeof type === "string" && types_set.has(type as Type))
                || typeof type === "function"
                || (Array.isArray(type))
            );
        }
    }

    /** The value type of type */
    export type Value = Types[Type];











    // /**
    //  * A type guard to check if a given input is an `Entry` type.
    //  * @note That this expects that at least one Entry attribute is defined.
    //  *       This is to prevent false positives for empty objects.
    //  * @param entry - The input to check.
    //  * @returns `true` if the input is an `Entry` type, otherwise `false`.
    //  */
    // export function is(entry: any): entry is Entry {
    //     if (entry == null || typeof entry !== "object") {
    //         return false; // not an object or null
    //     }
        
    //     // Ensure all attributes are of the correct type.
    //     if (
    //         (entry.type != null && !Entry.Type.Castable.is_fast(entry.type)) ||
    //         // entry.default skip since that can be anything
    //         (entry.required != null && typeof entry.required !== "boolean" && typeof entry.required !== "function") ||
    //         (entry.allow_empty != null && typeof entry.allow_empty !== "boolean") ||
    //         (entry.min != null && typeof entry.min !== "number") ||
    //         (entry.max != null && typeof entry.max !== "number") ||
    //         (entry.schema != null && typeof entry.schema !== "object") ||
    //         (entry.value_schema != null && !Entry.Type.Castable.is_fast(entry.value_schema) && !Entry.is(entry.value_schema)) ||
    //         (entry.tuple != null && !Array.isArray(entry.tuple)) ||
    //         (entry.enum != null && !Array.isArray(entry.enum)) ||
    //         (entry.alias != null && !Array.isArray(entry.alias) && typeof entry.alias !== "string") ||
    //         // not done...
    //     ) { return false;}

    //     // Check if the entry has at least one attribute defined.
    //     return (
    //         typeof entry.type === "string" ||
    //         typeof entry.default === "function" ||
    //         typeof entry.required === "boolean" ||
    //         typeof entry.allow_empty === "boolean" ||
    //         typeof entry.min === "number" ||
    //         typeof entry.max === "number" ||
    //         Array.isArray(entry.enum) ||
    //         typeof entry.schema === "object" && entry.schema != null ||
    //         typeof entry.value_schema === "string" ||
    //         Array.isArray(entry.tuple) ||
    //         Array.isArray(entry.alias) ||
    //         typeof entry.verify === "function" ||
    //         typeof entry.preprocess === "function" ||
    //         typeof entry.postprocess === "function" ||
    //         typeof entry.cast === "boolean" ||
    //         entry.charset instanceof RegExp ||
    //         typeof entry.field_type === "string"
    //     );
    // }

}

// ---------------------------------------------------------
/**
 * Exports for the `index.*.ts` file.
 * Create a type utility for the most used inferrable `Opts` scheme.
 * Which is the `Entries.Opts` type.
 * @warning Never change the chosen default type.
 */

/** Alias for the most used inferrable `Opts` scheme. */
export type Opts<D extends Entry.Derived = {}> =
    Entries.Opts<D>

/** Alias for the most used `Infer` type. */
export type Infer<T extends Entries.Opts> = InferEntries<T>;

// ------------------------------------------------------------
// A record of entries.

/** Entries types. */
export namespace Entries {

    /**
     * Inferrable input options for constructing a new `schema: Entries` object.
     */
    export type Opts<D extends Entry.Derived = {}> =
        NonNullable<DerivedEntry<D>["schema"]>

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
        NonNullable<DerivedEntry<Derived>["value_schema"]>

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
        NonNullable<DerivedEntry<Derived>["tuple"]>

    /** Extract the value‐type for a tuple, preserving tuple positions */
    export type Infer<T extends Opts> = InferTupleEntries<T>;
}