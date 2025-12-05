/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @todo create Compiled function for validating each entry
 */
import { Entries, Entry, TupleEntries, ValueEntries } from "../infer/entry.js";
import { ValidatorEntry } from "./validator_entries.js";
import { MutableObject } from "../../types/literals.js";
/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>;
/**
 * Infer the output type from input schemes from `Validate.Opts`.
 * @private
 */
export type InferOutput<Data extends ObjOrArr, Sch extends Entries.Opts = Entries.Opts, Val extends ValueEntries.Opts = ValueEntries.Opts, Tpl extends TupleEntries.Opts = TupleEntries.Opts> = Sch extends Entries.Opts ? Entries.Infer<Sch> : Val extends ValueEntries.Opts ? ValueEntries.Infer<Data extends any[] ? "array" : "object", Val> : Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> : never;
/**
 * The minimum entry, a base version of `ValidatorEntry`.
 * This min entry is used to cast an object or array.
 * For instance for the root data, but also for objects
 * or arrays that are validated and have a schema.
 * @private
 */
type MinimumEntry = Pick<ValidatorEntry, "field_type" | "schema" | "value_schema" | "tuple_schema" | "unknown">;
/**
 * Schema options for the `validate()` function.
 * One of the schemas must be defined.
 */
type Schemas<Data extends ObjOrArr, Sch extends Entries.Opts = Entries.Opts, Val extends ValueEntries.Opts = ValueEntries.Opts, Tpl extends TupleEntries.Opts = TupleEntries.Opts> = (Data extends any[] ? never : {
    /** Schema for when input data is an object. */
    schema: Sch;
    value_schema?: never;
    tuple?: never;
}) | {
    schema?: never;
    /** Value schema for when input data is an object or array. */
    value_schema: Val;
    tuple?: never;
} | (Data extends any[] ? {
    schema?: never;
    value_schema?: never;
    /** Tuple schema for when input data is an array. */
    tuple: Data extends any[] ? Tpl : never;
} : never);
export declare namespace Schemas {
    /**
     * A type guard to check if a value is a valid `Schemas` object.
     * Note that this performs a shallow check.
     */
    const is_fast: (value: any) => value is Schemas<any, any, any, any>;
}
/**
 * State object passed down to the validate function.
 * Note that this is `{...spread}` copied when validating nested objects.
 */
type State<Throw extends boolean = boolean> = {
    /**
     * The parent prefix of the current entry.
     * This value should be "" when there is no parent,
     * and it should always end with a dot (.) when there is a parent.
     */
    readonly parent: string;
    /**
     * Unknown, wether to throw errs on unknown fields (false).
     * Or not (true).
     */
    readonly unknown: boolean;
    /**
     * The current field type. When parsing nested objects,
     * the `Entry.field_type` precedes over this attribute.
     */
    readonly field_type: string;
    /**
     * Shared data, only copied by reference.
     */
    readonly shared: {
        /** The prefix for error messages, defaults to "". */
        readonly error_prefix: string;
        /** Throw error messages. */
        readonly throw: Throw;
    };
};
declare namespace State {
    /**
     * Options for creating a new state object.
     */
    type Opts<Throw extends boolean = boolean> = {
        /** The parent prefix for field names shown in errors, defaults to "" */
        parent?: string;
        /** The prefix for error messages, defaults to "". */
        error_prefix?: string;
        /**
         * Allow unknown attributes, defaults to `true`.
         * When `false`, errors will be thrown when unknown attributes are found.
         * The `Entry.unknown` field precedes this field.
         */
        unknown?: boolean;
        /**
         * The field type, e.g. `attribute`, `query`, `body`, etc, defaults to `attribute`.
         * The `Entry.field_type` field precedes over this field.
         * Ensure the chosen word fits in sentences like: `Attribte X is ...`, etc.
         */
        field_type?: string;
    } & (Throw extends true ? {
        /**
         * When `throw` is `true`, the `validate()` function will throw errors on validation failures,
         * and the validated data will be returned as response.
         */
        throw: Throw;
    } : Throw extends false ? {
        /**
         * By default, throw is `false`.
         * When `throw` is `false, the `validate()` function will return a response object with an error or the output data.
         */
        throw?: Throw;
    } : never);
    /**
     * Create a new state object.
     */
    function create<Throw extends boolean = false>(opts?: Opts<Throw>): State<Throw>;
    /** Create a new state from a system state and an override options object. */
    function with_override<Throw extends boolean>(state: State, override: Partial<State.Opts<Throw>>): State;
}
/**
 * The validator class.
 * A pre-constructed entry-like object containing all information
 * required to validate data. This class is used to avoid the overhead
 * of creating a new `Validator` object each time.
 * @nav Schema
 * @docs
 */
export declare class Validator<Data extends ObjOrArr, Throw extends boolean = false, const Sch extends Entries.Opts = Entries.Opts, const Val extends ValueEntries.Opts = ValueEntries.Opts, const Tpl extends TupleEntries.Opts = TupleEntries.Opts> {
    /**
     * A minimum entry with the schema info
     * Class `ValidatorEntry` must be castable to this parameter type.
     * Therefore we can use this as the uniform `MinimumEntry` for `validate_object()`.
     */
    entry: MinimumEntry | ValidatorEntry;
    /** Validation options for the current entry. */
    state: State;
    /**
     * The type of the validated data.
     * Can be used as `typeof validator.validated`.
     * @warning This is a compile-time only type attribute.
     *          The runtime value is `undefined`.
     */
    validated: MutableObject<InferOutput<Data, Sch, Val, Tpl>>;
    /**
     * The `Schemas` object from the constructor, used to extract the input schemas.
     * Kept public public so users can do `create_json_schema({..., schema: validator.schemas.schema})` to create a JSON schema.
     */
    schemas: Schemas<Data, Sch, Val, Tpl>;
    /** Constructor. */
    constructor(opts: Schemas<Data, Sch, Val, Tpl> & State.Opts<Throw>);
    /**
     * Validate the given data against the entry.
     * @param data The data to validate.
     * @param state Optionally provide a state object to override the current state.
     * @docs
     */
    validate<const T extends ObjOrArr>(data: T, state?: Partial<State.Opts<Throw>>): ValidateResponse.Thrown<Data, Throw, Sch, Val, Tpl>;
}
export declare namespace Validator {
    /**
     * The constructor options for the `Validator` class.
     * This is a merged type of `Schemas` and `State.Opts`.
     */
    type Opts<Data extends ObjOrArr = ObjOrArr, Throw extends boolean = boolean, Sch extends Entries.Opts = Entries.Opts, Val extends ValueEntries.Opts = ValueEntries.Opts, Tpl extends TupleEntries.Opts = TupleEntries.Opts> = ConstructorParameters<typeof Validator<Data, Throw, Sch, Val, Tpl>>[0];
}
/**
 * Perform validation on a single entry inside an object or array.
 * @returns A validation response containing the validated data or an error.
 * @nav Schema
 * @docs
 */
export declare function validate_entry<Throw extends boolean = false>(value: any, entry: Entry | ValidatorEntry<any, any>, state?: State.Opts<Throw>): ValidateResponse<any, any>;
/**
 * Perform validation on a single entry inside an object or array.
 * @returns A validation response containing the validated data or an error.
 * @nav Schema
 * @docs
 */
export declare function validate_object<const T extends ObjOrArr>(data: T, 
/**
 * A minimum entry with the schema info
 * Class `ValidatorEntry` must be castable to this parameter type.
 */
entry: Entry | ValidatorEntry<any, any>, 
/** Validation options for the current entry. */
state?: State.Opts): ValidateResponse<any, any>;
/**
 * Perform validation a given array or object.
 * @nav Schema
 * @docs
 */
export declare function validate<Data extends ObjOrArr, Throw extends boolean = false, const Sch extends Entries.Opts = Entries.Opts, const Val extends ValueEntries.Opts = ValueEntries.Opts, const Tpl extends TupleEntries.Opts = TupleEntries.Opts>(data: Data, val: 
/**
 * Optimal performance, validate against a pre-constructed `Validator` object.
 * This is the recommended way to validate data, since it avoids the overhead of creating a new `Validator` object each time.
 */
Validator<Data, Throw, Sch, Val, Tpl>
/**
 * Provide validator options through a merged `Schemas` & `State.Opts` object.
 */
 | Validator.Opts<Data, Throw, Sch, Val, Tpl>): ValidateResponse.Thrown<Data, Throw, Sch, Val, Tpl>;
/**
 * The object response form of validation operations.
 * Note that this is not always the returned type of the `validate()` function,
 * but rather the type of the response object when `throw` is `false`.
 * @nav Schema
 * @docs
 */
export type ValidateResponse<Mode extends "error" | "success", Output extends object = object> = Mode extends "error" ? {
    error: string;
    raw_error: string;
    invalid_fields: Record<string, string>;
    data?: never;
} : Mode extends "success" ? {
    error?: never;
    raw_error?: never;
    invalid_fields?: never;
    data: Output;
} : never;
/** Types for the `Response` type. */
export declare namespace ValidateResponse {
    /**
     * The thrown-like response type, considering the `Throw` option.
     * When `Throw` is `true`, the response will be a validated data object.
     * When `Throw` is `false`, the response will be a response object with an error or the validated data.
     */
    type Thrown<Data extends ObjOrArr, Throw extends boolean = false, Sch extends Entries.Opts = Entries.Opts, Val extends ValueEntries.Opts = ValueEntries.Opts, Tpl extends TupleEntries.Opts = TupleEntries.Opts> = Throw extends true ? InferOutput<Data, Sch, Val, Tpl> : ValidateResponse<"error"> | ValidateResponse<"success", InferOutput<Data, Sch, Val, Tpl>>;
}
/**
 * A user facing error class for user-facing errors from `validate` when `throw` is `true`.
 * @nav Schema/Errors
 * @docs
 */
export declare class ValidateError<O extends object> extends globalThis.Error {
    info: ValidateResponse<"error", O>;
    constructor(info: ValidateResponse<"error", O>);
}
/**
 * Error thrown when the user incorrectly utilizes the schema module.
 * @nav Schema/Errors
 * @docs
 */
export declare class InvalidUsageError extends globalThis.Error {
    constructor(msg: string);
}
export {};
