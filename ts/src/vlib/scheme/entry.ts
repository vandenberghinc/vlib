/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Cast } from "./cast.js";
import { Entries, TupleEntries, ValueEntries } from "./entries.js";

/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>

/** Get index/key type of array/obj */
type IndexOrKey<T extends ObjOrArr> =
    T extends any[] ? number :
    T extends Record<string, any> ? string :
    never;

/**
 * Entry object
 * Requires a container because inside a constructor with ConstructorParemeters
 * See {@link Entry} for more information about attributes.
 * 
 * @warning This class is supported by the `infer.ts` file.
 *          Therefore ensure that the attributes are kept in sync with the `EntryObject` type.
 *          And when changing the attributes, ensure that the `infer.ts` file is updated accordingly.
 */
export interface EntryObject<
    T extends Cast.Castable = Cast.Castable, // type of entry
    V extends Cast.Value = Cast.Value, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent object for callbacks.
> {
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
     * Is required, when `true` the attribute must be or an error will be thrown.
     */
    required?: boolean | ((parent: P) => boolean);
    /**
     * Allow empty strings, arrays or objects.
     * By default `true`.
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
    schema?: Entries.Opts;
    /**
     * A nested schema for the array items for when the attribute is an array.
     * Or a schema for the value's of an object.
     */
    value_schema?: ValueEntries.Opts;
    /**
     * Tuple schema for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     * 
     * Each index of the schema option corresponds to the index of the input array.
     * 
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: TupleEntries.Opts;
    /**
     * A list of valid values for the attribute.
     */
    enum?: any[];
    /**
     * Aliases for this atttribute.
     * When any of these alias attributes is encountered the attribute will be renamed to the current attribute name.
     * Therefore this will edit the input object.
     */
    alias?: string | string[];
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
        /** Cast string to boolean/number. */
    cast?: "boolean" extends Cast<T>
        ? boolean | Cast.boolean.Opts<"preserve">
        : "number" extends Cast<T>
            ? boolean | Cast.number.Opts<"preserve">
            : never
    /**
     * The allowed charset for string typed entries.
     * This should be some `^...$` formatted regex.
     * For instance `^[\w+]+$` will only allow alphanumeric and _ characters.
     */
    charset?: "string" extends Cast<T>
        ? RegExp
        : never;
    /** Alias for `default`. */
    def?: V | ((obj: any) => V);
}

/**
 * Scheme entry.
 * The actual options for validating a value.
 * @warning This class is supported by the `infer.ts` file.
 *          Therefore ensure that the attributes are kept in sync with the `EntryObject` type.
 *          And when changing the attributes, ensure that the `infer.ts` file is updated accordingly.
 */
export class Entry<
    T extends Cast.Castable = Cast.Castable, // type of entry
    V extends Cast<T> = Cast<T>, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent
> implements Omit<
    EntryObject<T, V, P>,
    | "schema" | "value_schema" | "tuple"
> {
    
    // ------------------------------------------------------------------
    // Attributes with the same type as the EntryObject type.
    // Ensure we dont change the name between EntryObject, so we keep it universal for `infer.ts`.

    type?: T;
    default?: EntryObject<T, V, P>["default"];
    required?: EntryObject<T, V, P>["required"];
    allow_empty?: EntryObject<T, V, P>["allow_empty"];
    min?: EntryObject<T, V, P>["min"];
    max?: EntryObject<T, V, P>["max"];
    enum?: EntryObject<T, V, P>["enum"];
    alias?: EntryObject<T, V, P>["alias"];
    verify?: EntryObject<T, V, P>["verify"];
    preprocess?: EntryObject<T, V, P>["preprocess"];
    postprocess?: EntryObject<T, V, P>["postprocess"];
    cast?: EntryObject<T, V, P>["cast"];
    charset?: EntryObject<T, V, P>["charset"];
    // def: EntryObject<T, V, P>["def"]; // ignore the alias.

    // ------------------------------------------------------------------
    // Attributes with a different type from the EntryObject type.
    // Ensure these types are also inferred by the `infer.ts` file.
    // Also ensure we dont change the name between EntryObject, so we keep it universal for `infer.ts`.

    /**
     * A nested schema for when the attribute is an object.
     */
    schema?: Entries;
    
    /**
     * A nested schema for the array items for when the attribute is an array.
     * Or a schema for the value's of an object.
     */
    value_schema?: Entry;
    
    /**
     * Tuple schema for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     * 
     * Each index of the schema option corresponds to the index of the input array.
     * 
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: Entry[];

    /** Constructor options. */
    constructor(opts: T | EntryObject<T, V, P> | Entry<T, V, P>) {
        if (opts instanceof Entry) {
            this.type = opts.type;
            this.default = opts.default;
            this.required = opts.required;
            this.allow_empty = opts.allow_empty;
            this.min = opts.min;
            this.max = opts.max;
            this.schema = opts.schema;
            this.value_schema = opts.value_schema;
            this.tuple = opts.tuple;
            this.enum = opts.enum;
            this.alias = opts.alias;
            this.verify = opts.verify;
            this.preprocess = opts.preprocess;
            this.postprocess = opts.postprocess;
            this.cast = opts.cast;
            this.charset = opts.charset;
        } else {
            if (typeof opts === "string" || typeof opts === "function" || Array.isArray(opts)) {
                opts = { type: opts as T };
            }
            this.type = opts.type;
            this.default = opts.default ?? opts.def;
            this.required = opts.required;
            this.allow_empty = opts.allow_empty ?? true;
            this.min = opts.min;
            this.max = opts.max;
            if (opts.schema) this.schema = new Entries(opts.schema);
            if (opts.value_schema) this.value_schema = new Entry(opts.value_schema);
            if (opts.tuple) this.tuple = opts.tuple.map(e => new Entry(e));
            this.enum = opts.enum;
            this.alias = opts.alias;
            this.verify = opts.verify;
            this.preprocess = opts.preprocess;
            this.postprocess = opts.postprocess;
            if (opts.cast != null && opts.cast !== false) {
                if (this.type === "boolean" || this.type === "number") {
                    const cast: Cast.number.Opts | Cast.boolean.Opts =
                        typeof opts.cast === "object"
                            ? opts.cast
                            : { strict: true }
                    cast.preserve = true;
                    this.cast = { type: this.type, opts: cast, } as unknown as Entry<T, V, P>["cast"];
                } else {
                    throw new TypeError(`Cannot cast type "${this.type}" with cast options.`);
                }
            } else {
                this.cast = undefined as never;
            }
            this.charset = opts.charset;
        }
    }

    /**
     * Get the type as a string.
     * Useful for generating type errors.
     */
    type_name(prefix: string = ""): string {
        let type_error_str = "";
        if (Array.isArray(this.type)) {
            type_error_str = prefix;
            for (let i = 0; i < this.type.length; i++) {
                if (typeof this.type[i] === "function") {
                    try {
                        type_error_str += `"${(this.type[i] as unknown as Function).name}"`
                    } catch (e) {
                        type_error_str += `"${this.type[i]}"`
                    }
                } else {
                    type_error_str += `"${this.type[i]}"`
                }
                if (i === this.type.length - 2) {
                    type_error_str += " or "
                } else if (i < this.type.length - 2) {
                    type_error_str += ", "
                }
            }
        } else {
            type_error_str = `${prefix}"${this.type}"`
        }
        return type_error_str;
    }
}

/** Entry types. */
export namespace Entry {
    
    /**
     * Inferrable input options.
     * @warning When adding types to this, ensure the `infer.ts` file is updated accordingly.
     * @note This type is used as the base type for ANY entry while inferring, therefore dont use ConstructorParameters here.
     */
    export type Opts<
        T extends Cast.Castable = Cast.Castable, // type of entry
        V extends Cast<T> = Cast<T>, // value of entry
        P extends ObjOrArr = ObjOrArr, // parent
    > = T | EntryObject<T, V, P> | Entry<T, V, P>;
    // export type Opts = Cast.Castable | EntryObject | Entry;
}

// // Cast test.
// const _cast_test_boolean: Entry.Opts = {
//     type: "boolean",
//     required: false,
//     cast: true,
//     // preprocess: v => vlib.scheme.cast.boolean(v, { preserve: true }),
// }