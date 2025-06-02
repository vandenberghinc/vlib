/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Cast } from "./cast.js";
import { Scheme } from "./scheme.js";
import type { InferScheme } from "./infer.js";

/** Base object or array. */
type ObjOrArr<T = any> = T[] | Record<string, T>

/** Get index/key type of array/obj */
type IndexOrKey<T extends ObjOrArr<any>> =
    T extends any[] ? number :
    T extends Record<string, any> ? string :
    never;

/**
 * Entry object
 * Requires a container because inside a constructor with ConstructorParemeters
 * See {@link Entry} for more information about attributes.
 */
export type EntryObject<
    T extends Cast.Castable = Cast.Castable, // type of entry
    V extends Cast.Value = Cast.Value, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent
> = {
    type?: T;
    default?: V | ((obj: any) => V);
    required?: boolean | ((parent: P) => boolean);
    allow_empty?: boolean;
    min?: number;
    max?: number;
    scheme?: Record<string, EntryObject | Cast.Castable>;
    value_scheme?: EntryObject | Cast.Castable;
    tuple?: (EntryObject | Cast.Castable)[];
    enum?: any[];
    alias?: string | string[];
    verify?: (
        attr: V,
        parent: P,
        key?: IndexOrKey<P>
    ) => string | void | null | undefined;
    preprocess?: (
        attr: V,
        parent: P,
        key: IndexOrKey<P>
    ) => any;
    postprocess?: (
        attr: V,
        parent: P,
        key: IndexOrKey<P>
    ) => any;
    /** Alias for `default`. */
    def?: V | ((obj: any) => V);
} & (
    T extends "boolean" ? { cast?: boolean |  Omit<Cast.boolean.Opts, "preserve">} :
    T extends "number" ? { cast?: boolean | Omit<Cast.number.Opts, "preserve">} :
    { cast?: never }
)

/**
 * Scheme entry.
 * The actual options for validating a value.
 */
export class Entry<
    T extends Cast.Castable = Cast.Castable, // type of entry
    V extends Cast.Value = Cast.Value, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent
> {
    
    /**
     * The value type.
     * @note When the type is `any`, then all filters such as `allow_empty`, `max` etc are disabled.
     */
    type?: Cast.Castable;
    
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
     * A nested scheme for when the attribute is an object.
     */
    scheme?: Scheme;
    
    /**
     * A nested scheme for the array items for when the attribute is an array.
     * Or a scheme for the value's of an object.
     */
    value_scheme?: Entry;
    
    /**
     * Tuple scheme for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     * 
     * Each index of the scheme option corresponds to the index of the input array.
     * 
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: Entry[];
    
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

    /** Alias for `default`. */
    def?: any | ((obj: any) => any);

    /** Constructor options. */
    constructor(opts: Cast.Castable | EntryObject) {
        if (typeof opts === "string" || typeof opts === "function" || Array.isArray(opts)) {
            opts = { type: opts };
        }
        this.type = opts.type;
        this.default = opts.default ?? opts.def;
        this.required = opts.required;
        this.allow_empty = opts.allow_empty ?? true;
        this.min = opts.min;
        this.max = opts.max;
        if (opts.scheme) this.scheme = new Scheme(opts.scheme);
        if (opts.value_scheme) this.value_scheme = new Entry(opts.value_scheme);
        if (opts.tuple) this.tuple = opts.tuple.map(e => new Entry(e));
        this.enum = opts.enum;
        this.alias = opts.alias;
        this.verify = opts.verify;
        this.preprocess = opts.preprocess;
        this.postprocess = opts.postprocess;
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
export namespace Entry {
    /**
     * Constructor options for Entry.
     * So different from EntryObject since
     * We also support direct Cast.Castable casts in the constructor.
     */
    export type Opts = ConstructorParameters<typeof Entry>[0]

    // /** Types for scheme validation */
    // export type SingleType = Cast.Castable.Base;
    // export type Type = Cast.Castable;

}




// Cast test.
const _cast_test_boolean: Entry.Opts = {
    type: "boolean",
    required: false,
    cast: true,
    // preprocess: v => vlib.scheme.cast.boolean(v, { preserve: true }),
}