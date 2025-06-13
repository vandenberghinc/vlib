/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Neverify } from "../types/transform.js";
import { Cast } from "./cast.js";
/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>;
/** Get index/key type of array/obj */
type IndexOrKey<T extends ObjOrArr> = T extends any[] ? number : T extends Record<string, any> ? string : never;
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
export type Entry<T extends CastType = CastType, // type of entry
V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
Derived extends Entry.Derived = {}> = (Derived extends Entry.Derived ? Derived : {}) & {
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
     * @warning Never change the defaults to `true` behaviour.
     *          Also since we cast string/array input types to entries,
     *          which makes it even more illogical to have a default of `false`.
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
    schema?: Record<string, (T | Entry<any, any, any, Derived>)>;
    /**
     * A nested schema for the array items for when the attribute is an array.
     * Or a schema for the value's of an object.
     */
    value_schema?: (T | Entry<any, any, any, Derived>);
    /**
     * Tuple schema for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     *
     * Each index of the schema option corresponds to the index of the input array.
     *
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: (T | Entry<any, any, any, Derived>)[];
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
    verify?: (attr: V, parent: P, key?: IndexOrKey<P>) => string | void | null | undefined;
    /**
     * Pre process the attribute.
     * The callback should return the updated value.
     */
    preprocess?: (attr: V, parent: P, key: IndexOrKey<P>) => any;
    /**
     * Post process the attribute.
     * The callback should return the updated value.
     */
    postprocess?: (attr: V, parent: P, key: IndexOrKey<P>) => any;
    /**
     * Cast string to boolean/number.
     * Only allowed when type is exactly `boolean` or `number`.
     */
    cast?: T extends "boolean" ? boolean | Neverify<Cast.boolean.Opts, "preserve"> : T extends "number" ? boolean | Neverify<Cast.number.Opts, "preserve"> : never;
    /**
     * The allowed charset for string typed entries.
     * This should be some `^...$` formatted regex.
     * For instance `^[\w+]+$` will only allow alphanumeric and _ characters.
     */
    charset?: "string" extends Entry.Type.Cast<T> ? RegExp : never;
    /**
     * The type for how a field should called in error messages, defaults to `attribute`.
     * The field type is automatically capitalized to uppercase where needed.
     * Ensure that the word fits in a sentence like `Attribute X is ...`.
     * Since this is how this field will be used in error messages.
     */
    field_type?: string;
    /** Alias for `default`. */
    readonly def?: V | ((obj: any) => V);
};
/** Types for the `Entry` namespace. */
export declare namespace Entry {
    /** A small alias for the derived base type. */
    type Derived = Record<string, any>;
    /** Inferrable options for constructing an entry. */
    type Opts<T extends CastType = CastType, // type of entry
    V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
    D extends Entry.Derived = {}> = T | Entry<T, V, P, D>;
    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    type Infer<T extends Opts> = InferEntry<T>;
    /**
     * All supported argument types.
     * @note that we only need primitive types since we dont use it at runtime to cast to values.
     *       This is merely a map to perform casts.
     *       And the keys will be used as allowed types for validation.
     */
    type Types = {
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
    type Type = keyof Types;
    /** Types for the `Type` namespace. */
    namespace Type {
        /**
         * Cast a type name or type names union to its corresponding value type.
         * Also supports already casted value types as input.
         */
        type Cast<T extends never | undefined | Castable<"readonly"> | Entry.Value, Def extends any = string, // returned type for undefined | null
        Never extends any = unknown> = [
            T
        ] extends [never] ? Never : T extends null | undefined ? Def : T extends Function ? T : T extends readonly Type[] ? Types[T[number]] : T extends Type[] ? Types[T[number]] : T extends Type ? Types[T] : Never;
        /** The base type of castable type generics. */
        type Castable<Readonly extends "readonly" | "mutable"> = Readonly extends "readonly" ? (Castable.Base | readonly Castable.Base[]) : Readonly extends "mutable" ? (Castable.Base | Castable.Base[]) : never;
        namespace Castable {
            /** The castable non array type.  */
            type Base = Type | Function;
        }
    }
    /** The value type of type */
    type Value = Types[Type];
}
/**
 * Exports for the `index.*.ts` file.
 * Create a type utility for the most used inferrable `Opts` scheme.
 * Which is the `Entries.Opts` type.
 * @warning Never change the chosen default type.
 */
/** Alias for the most used inferrable `Opts` scheme. */
export type Opts<D extends Entry.Derived = {}> = Entries.Opts<D>;
/** Alias for the most used `Infer` type. */
export type Infer<T extends Entries.Opts> = InferEntries<T>;
/** Entries types. */
export declare namespace Entries {
    /**
     * Inferrable input options for constructing a new `schema: Entries` object.
     */
    type Opts<D extends Entry.Derived = {}> = NonNullable<Entry<any, any, any, D>["schema"]>;
    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    type Infer<T extends Opts> = InferEntries<T>;
}
/**
 * Value entries. Basically a single value entry.
 * However, still keep this as a seperate type because
 * The infer strategy treats it differently than a normal entry.
 */
export declare namespace ValueEntries {
    /**
     * Inferrable input options for constructing a new `value_schema: Entry` object.
     */
    type Opts<Derived extends Record<string, any> = {}> = NonNullable<Entry<any, any, any, Derived>["value_schema"]>;
    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    type Infer<ParentT extends "array" | "object", V extends Opts> = InferValueEntries<ParentT, V>;
}
/**
 * Tuple entries.
 * This can be used to verify a tuple array.
 * So a fixed length array with a specific type for each position.
 */
export declare namespace TupleEntries {
    /**
     * Inferrable input options for constructing a new `value_schema: Entry` object.
     */
    type Opts<Derived extends Record<string, any> = {}> = NonNullable<Entry<any, any, any, Derived>["tuple"]>;
    /** Extract the value‐type for a tuple, preserving tuple positions */
    type Infer<T extends Opts> = InferTupleEntries<T>;
}
/** Process the default value and return its type.
 *  - string‐literal → string
 *  - number‐literal → number
 *  - boolean‐literal → boolean
 *  - readonly [ … ] or Array<…> → (widened) array of the element type
 *  - everything else → itself (e.g. class instances, plain objects, etc.)
 */
type LiteralToType<D> = D extends string ? string : D extends number ? number : D extends boolean ? boolean : D extends readonly (infer U)[] ? U[] : D;
/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends Entry.Opts> = E extends Entry ? E extends {
    default: (obj: any) => infer R;
} ? R : E extends {
    default: infer D;
} ? LiteralToType<D> : E extends {
    def: (obj: any) => infer R;
} ? R : E extends {
    def: infer D;
} ? LiteralToType<D> : E extends {
    enum: infer U extends readonly any[];
} ? U[number] : E extends {
    schema: infer S extends Entries.Opts;
} ? InferEntries<S> : E extends {
    value_schema: infer V extends ValueEntries.Opts;
} ? InferValueEntries<ValueEntriesParentType<E>, V> : E extends {
    tuple: infer Tup extends readonly Entry.Opts[];
} ? InferTupleEntries<Tup> : E["type"] extends CastType ? Entry.Type.Cast<E["type"]> : unknown : E extends CastType ? Entry.Type.Cast<E> : never;
/**
 * Get the parent type for value entries.
 * From the parent entry.
 */
export type ValueEntriesParentType<E extends CastType | Entry, Default extends "array" | "object" = "array"> = E extends CastType ? Entry.Type.Cast<E> extends readonly any[] ? "array" : "object" : E extends Entry ? E extends {
    default: infer D;
} ? LiteralToType<D> extends readonly any[] ? "array" : "object" : E extends {
    def: infer D;
} ? LiteralToType<D> extends readonly any[] ? "array" : "object" : E["type"] extends CastType ? Entry.Type.Cast<E["type"]> extends readonly any[] ? "array" : "object" : Default : Default;
/** Infer a value scheme */
export type InferValueEntries<ParentT extends "array" | "object", V extends ValueEntries.Opts> = V extends Entry ? ParentT extends "array" ? InferEntry<V>[] : Record<string, InferEntry<V>> : V extends CastType ? ParentT extends "array" ? Entry.Type.Cast<V>[] : Record<string, Entry.Type.Cast<V>> : never;
/** Extract the value‐type for a tuple, preserving tuple positions */
export type InferTupleEntries<T extends readonly Entry.Opts[]> = {
    [I in keyof T]: T[I] extends Entry.Opts ? InferEntry<T[I]> : never;
};
/** Is entry optional */
type IsOptional<E extends Entry.Opts> = E extends Entry ? [
    E["required"]
] extends [false] ? true : E["required"] extends Function ? true : false : false;
/** infer the raw value for every key */
type RawEntries<S extends Entries.Opts> = {
    [K in keyof S]: S[K] extends Entry.Opts ? InferEntry<S[K]> : unknown;
};
/** split into an optional‐props & required‐props mapped type */
export type InferEntries<S extends Entries.Opts> = {
    [K in keyof S as IsOptional<S[K]> extends true ? K : never]?: RawEntries<S>[K];
} & {
    [K in keyof S as IsOptional<S[K]> extends true ? never : K]: RawEntries<S>[K];
};
export {};
