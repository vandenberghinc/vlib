/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Cast } from "./cast.js";
import { Scheme } from "./scheme.js";
/** Base object or array. */
type ObjOrArr<T = any> = T[] | Record<string, T>;
/** Get index/key type of array/obj */
type IndexOrKey<T extends ObjOrArr<any>> = T extends any[] ? number : T extends Record<string, any> ? string : never;
/**
 * Entry object
 * Requires a container because inside a constructor with ConstructorParemeters
 * See {@link Entry} for more information about attributes.
 */
export type EntryObject<T extends Cast.Castable = Cast.Castable, // type of entry
V extends Cast.Value = Cast.Value, // value of entry
P extends ObjOrArr = ObjOrArr> = {
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
    verify?: (attr: V, parent: P, key?: IndexOrKey<P>) => string | void | null | undefined;
    preprocess?: (attr: V, parent: P, key: IndexOrKey<P>) => any;
    postprocess?: (attr: V, parent: P, key: IndexOrKey<P>) => any;
    /** Alias for `default`. */
    def?: V | ((obj: any) => V);
} & ("boolean" extends Cast<T> ? {
    cast?: boolean | Cast.boolean.Opts<"preserve">;
} : "number" extends Cast<T> ? {
    cast?: boolean | Cast.number.Opts<"preserve">;
} : {
    cast?: never;
}) & ("string" extends Cast<T> ? {
    charset?: RegExp;
} : {
    charset?: never;
});
/**
 * Scheme entry.
 * The actual options for validating a value.
 */
export declare class Entry<T extends Cast.Castable = Cast.Castable, // type of entry
V extends Cast.Value = Cast.Value, // value of entry
P extends ObjOrArr = ObjOrArr> {
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
    /** Alias for `default`. */
    def?: any | ((obj: any) => any);
    /** Cast string to boolean/number. */
    cast: undefined | {
        type: "boolean";
        opts: Cast.boolean.Opts<"preserve">;
    } | {
        type: "number";
        opts: Cast.number.Opts<"preserve">;
    };
    /**
     * The allowed charset for string typed entries.
     * This should be some `^...$` formatted regex.
     * For instance `^[\w+]+$` will only allow alphanumeric and _ characters.
     */
    charset?: RegExp;
    /** Constructor options. */
    constructor(opts: T | EntryObject<T, V, P>);
    /**
     * Get the type as a string.
     * Useful for generating type errors.
     */
    type_name(prefix?: string): string;
}
export declare namespace Entry {
    /**
     * Constructor options for Entry.
     * So different from EntryObject since
     * We also support direct Cast.Castable casts in the constructor.
     */
    type Opts = ConstructorParameters<typeof Entry>[0];
}
export {};
