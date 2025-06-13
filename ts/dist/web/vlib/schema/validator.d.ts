/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Entry } from "./entry.js";
import { ValidatorEntries, ValidatorEntry } from "./validator_entries.js";
import { Entries, ValueEntries, TupleEntries } from "./entry.js";
/** Object or array type as base type for `validate<T>` etc */
type ObjOrArr = any[] | Record<string, any>;
/**
 * A user-facing validation state.
 * This state can be passed to the `validate()` to provide additional validation settings.
 */
export type ValidateState<Throw extends boolean = boolean> = {
    /** The parent prefix for field names shown in errors, defaults to "" */
    parent?: string;
    /**
     * Allow unknown attributes, defaults to `true`.
     * When `false`, errors will be thrown when unknown attributes are found.
     */
    unknown?: boolean;
    /** The prefix for error messages, defaults to "". */
    error_prefix?: string;
    /**
     * The field type, e.g. `attribute`, `query`, `body`, etc, c
     * defaults to `attribute`.
     * The `Entry.field_type` precedes over this attribute.
     * Ensure the chosen word fits in sentences like: `Attribte X is ...`, etc.
     */
    field_type?: string;
    /**
     * When `true`, the `validate()` function will throw errors on validation failures,
     * and the validated data will be returned as response.
     * When `false`, the `validate()` function will return a response object with an error or the output data.
     * Defaults to `false`.
     * @todo This is temporarily required, since we wanna transition to a default of false.
     */
    throw: Throw;
};
/**
 * Schema options for the `validate()` function.
 * The `Schema.Entry` type should be castable to the `ValidateSchemaOpts` type.
 */
export type ValidateSchemaOpts<T extends ObjOrArr, E extends Entries.Opts = Entries.Opts, V extends Entry.Opts = Entry.Opts, Tpl extends Entry.Opts[] = Entry.Opts[]> = {
    /** Schema for when input data is an object. */
    schema?: T extends any[] ? never : E;
    /** Value schema for when input data is an object or array. */
    value_schema?: V;
    /** Tuple schema for when input data is an array. */
    tuple?: T extends any[] ? Tpl : never;
};
/** Infer the output type from input schemes from `Validate.Opts`. */
type InferOutput<T extends ObjOrArr, Etr extends Entries.Opts = Entries.Opts, Val extends Entry.Opts = Entry.Opts, Tpl extends Entry.Opts[] = Entry.Opts[]> = Etr extends Entries.Opts ? Entries.Infer<Etr> : Val extends ValueEntries.Opts ? ValueEntries.Infer<T extends any[] ? "array" : "object", Val> : Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> : never;
/**
 * The info mode response type for the `validate()` function.
 * Note that this is not always the returned type of the `validate()` function,
 * but rather the type of the response object when `throw` is `false`.
 */
export type ValidateResponse<Mode extends "error" | "success", Output extends object = object> = Mode extends "error" ? {
    error: string;
    invalid_fields: Record<string, string>;
    data?: never;
} : Mode extends "success" ? {
    error?: never;
    invalid_fields?: never;
    data: Output;
} : never;
/**
 * Run the validator.
 * @returns The verified object or array, while throwing errors upon verification failure.
 *          Or a response object when `throw` is `false`.
 */
export declare function validate<const T extends ObjOrArr, Throw extends boolean = false, const E extends Entries.Opts = Entries.Opts, const V extends Entry.Opts = Entry.Opts, Tpl extends Entry.Opts[] = Entry.Opts[]>(...args: [
    /** The data to validate, an object or array. */
    data: T,
    /** The validation state, which can be used to provide additional validation settings. */
    state: ValidateState<Throw>,
    /** The information for the validation schema */
    schema: ValidateSchemaOpts<T, E, V, Tpl> | ValidatorEntry | ValidatorEntries
] | [
    /** The data to validate, an object or array. */
    data: T,
    /** The information for the validation schema */
    schema: ValidatorEntry | ValidatorEntries | (ValidateSchemaOpts<T, E, V, Tpl> & ValidateState<Throw>)
]): Throw extends true ? InferOutput<T, E, V, Tpl> : ValidateResponse<"success" | "error", InferOutput<T, E, V, Tpl>>;
/** A user facing error class for user-facing errors from `validate` when `throw` is `true`. */
export declare class ValidateError<O extends object> extends globalThis.Error {
    info: ValidateResponse<"error", O>;
    constructor(info: ValidateResponse<"error", O>);
}
/** Error thrown when the user incorrectly utilizes the schema module. */
export declare class InvalidUsageError extends globalThis.Error {
    constructor(msg: string);
}
export {};
