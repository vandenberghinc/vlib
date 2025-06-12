/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Cast } from "./cast.js";
import { Entries, Entry } from "./entry.js";
/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>;
/** Symbol to indicate there was no default value provided, instead of `undefined`. */
export declare const NoDefault: unique symbol;
export type NoDefault = typeof NoDefault;
/**
 * An initialized entry object that can be validated using the {@link Validator} class.
 * This class is not inferrable.
 * This class is for internal use only, ensure this is not exported in the `index.*.ts` file.
 * @note Keep this under a separate name then the public type util `Entry`.
 * @private
 */
export declare class ValidatorEntry<const T extends Entry.Type.Castable<"mutable"> = Entry.Type.Castable<"mutable">, // type of entry (use const for when T is an array of types).
V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
P extends ObjOrArr = ObjOrArr> {
    readonly type?: T;
    required: Entry.Plain<T, V, P>["required"];
    allow_empty: Entry.Plain<T, V, P>["allow_empty"];
    min: Entry.Plain<T, V, P>["min"];
    max: Entry.Plain<T, V, P>["max"];
    enum: Entry.Plain<T, V, P>["enum"];
    alias: Entry.Plain<T, V, P>["alias"];
    verify: Entry.Plain<T, V, P>["verify"];
    preprocess: Entry.Plain<T, V, P>["preprocess"];
    postprocess: Entry.Plain<T, V, P>["postprocess"];
    charset: Entry.Plain<T, V, P>["charset"];
    /**
     * The default value for the entry.
     * `NoDefault` will be used to indicate that no default value was provided.
     * This way we can also support `undefined` and `null` as a default value.
     */
    default: NoDefault | Entry.Plain<T, V, P>["default"];
    /**
     * A nested schema for when the attribute is an object.
     */
    schema?: ValidatorEntries;
    /**
     * A nested schema for the array items for when the attribute is an array.
     * Or a schema for the value's of an object.
     */
    value_schema?: ValidatorEntry;
    /**
     * Tuple schema for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     *
     * Each index of the schema option corresponds to the index of the input array.
     *
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: readonly ValidatorEntry[];
    /**
     * Cast string to boolean/number.
     * Only allowed when type is exactly `boolean` or `number`.
     */
    cast?: T extends "boolean" ? {
        type: "boolean";
        opts: Cast.boolean.Opts<"preserve">;
    } : T extends "number" ? {
        type: "number";
        opts: Cast.number.Opts<"preserve">;
    } : never;
    /** Constructor options. */
    constructor(opts: Entry.Opts<T, V, P>);
    /**
     * Get the type as a string.
     * Useful for generating type errors.
     */
    type_name(prefix?: string): string;
    /** Is required wrapper. */
    is_required(object: any): boolean;
}
/**
 * A record of entries, a.k.a a schema.
 * @note Keep this under a separate name then the public type util `Entries`.
 */
export declare class ValidatorEntries extends Map<string, ValidatorEntry> {
    /** Initialize a scheme object. */
    constructor(
    /** The scheme to initialize. */
    schema: Entries.Opts);
    /**
     * A map of aliases. Is initialized be initialized on demand.
     */
    get aliases(): Map<string, ValidatorEntry>;
    private _aliases?;
}
export {};
