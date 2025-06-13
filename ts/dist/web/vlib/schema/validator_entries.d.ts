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
    required: Entry<T, V, P>["required"];
    allow_empty: Entry<T, V, P>["allow_empty"];
    min: Entry<T, V, P>["min"];
    max: Entry<T, V, P>["max"];
    enum: Entry<T, V, P>["enum"];
    alias: Entry<T, V, P>["alias"];
    verify: Entry<T, V, P>["verify"];
    preprocess: Entry<T, V, P>["preprocess"];
    postprocess: Entry<T, V, P>["postprocess"];
    charset: Entry<T, V, P>["charset"];
    /**
     * The field type, e.g. "attribute", "query", "body", etc.
     * Ensure the chosen word fits in sentences like: `Attribte X is ...`, etc.
     * The word is automatically capitalized where needed.
     * @dev_note Keep this `?` and cast to `attribute` in the calls.
     *           So we can use a `this.field_type || state.field_type || 'attributes'` strategy in the validator.
     */
    field_type?: string;
    /**
     * The default value for the entry.
     * `NoDefault` will be used to indicate that no default value was provided.
     * This way we can also support `undefined` and `null` as a default value.
     */
    default: NoDefault | Entry<T, V, P>["default"];
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
     * It is inputted as an array of entries,
     * However, its stored as `tuple_1: Entry, tuple_2: Entry, ...` etc.
     * This is how it needs to be validated.
     *
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple_schema?: ValidatorEntry[];
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
    /**
     * A boolean flag indicating if the `array` or `object` type requires validation.
     * For instance, nested arrays and objects without any schema do not require validation.
     * Note that this is a readonly attribute, hence it is changed, also not once validated.
     */
    readonly requires_validation: boolean;
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
 *
 * For optimal performance, this class should be initialized
 * and re-used as an argument for the `validate()` fuction.
 *
 * @note Keep this under a separate name then the public type util `Entries`.
 */
export declare class ValidatorEntries<const S extends Entries.Opts = Entries.Opts> extends Map<string, ValidatorEntry> {
    /**
     * A map of all aliases from the direct entries.
     * The alias name is used as key, pointing to the original entry.
     */
    aliases: Map<string, ValidatorEntry<Entry.Type.Castable.Base | Entry.Type.Castable.Base[], any, ObjOrArr>>;
    /**
     * An attribute with the inferred type of the entries.
     * Note that this value is undefined at runtime.
     * @example
     * ```
     * const validated_data: typeof val_entries.validated ...
     * ```
     */
    validated: Entries.Infer<S>;
    /** Initialize a scheme object. */
    constructor(
    /**
     * The scheme to initialize.
     * Note that we only support inferrable entries here.
     * This is because the entire tree of nested entries will be initialized.
     * Therefore we dont need to accept any validator instances,
     * allowing us to infer the entries type.
     */
    schema: S);
}
export {};
