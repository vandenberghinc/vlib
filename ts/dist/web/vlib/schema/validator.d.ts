/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Entry } from "./entry.js";
import { ValidatorEntries, ValidatorEntry } from "./validator_entries.js";
import { Entries, ValueEntries, TupleEntries } from "./entry.js";
/**
 * Class to validate an object.
 *
 * @note Always updates the object in place.
 * @note The Validate object is re-usable to validate different objects.
 * @note The Validate object should be thread safe but not tested so perhaps dont.
 *
 * @note We require all generics so that `validate()` can still create an opts from the generic and infer the output type correctly.
 */
export declare class Validator<
/** The input type. */
const T extends Validator.T, 
/** Whether to throw errors or not. */
Throw extends boolean = boolean, 
/** The `schema` input type, required so we can infer correctly in `validate()` */
E extends Entries.Opts = Entries.Opts, 
/** The value schema input type, required so we can infer correctly in `validate()` */
V extends Entry.Opts = Entry.Opts, 
/** The tuple schema input type, required so we can infer correctly in `validate()` */
Tpl extends Entry.Opts[] = Entry.Opts[]> {
    /** The schema to validate. */
    readonly schema?: ValidatorEntries;
    /** The value schema for object values or array items. */
    readonly value_schema?: ValidatorEntry;
    /** Is an array with tuple mode enabled. */
    readonly is_tuple: boolean;
    /** Throw occurred errors, defaults to `false` */
    readonly throw: Throw;
    /**
     * Allow unknown attributes.
     * When `false`, errors will be thrown when unknown attributes are found.
     * Defaults to `true`.
     */
    unknown: boolean;
    /** The parent prefix. */
    parent: string;
    /** The error prefix. */
    error_prefix: string;
    /** Constructor. */
    constructor(opts: {
        /** Schema for when input data is an object. */
        schema?: T extends any[] ? never : E;
        /** Value schema for when input data is an object or array. */
        value_schema?: V;
        /** Tuple schema for when input data is an array. */
        tuple?: T extends any[] ? Tpl : never;
        /** Throw occurred errors, defaults to `false` when ommitted or preprocessed by `validate()`. */
        /**
         * @dev_note keep required so it can be inferred correctly
         * @warning When none of the attributes are required, a user can accidentally pass a scheme like obj and ts will not complain.
         */
        throw: Throw;
        /**
         * Allow unknown attributes.
         * When `false`, errors will be thrown when unknown attributes are found.
         * Defaults to `true`.
        */
        unknown?: boolean;
        /** The prefix for error messages. */
        error_prefix?: string;
        /** The parent prefix for field names shown in errors. */
        parent?: string;
    });
    /** Create an error object. */
    private create_error;
    /**
     * Check type of the parameter function.
     * Scheme key may also be an index for when object is an array.
     */
    private check_type;
    /** Validate a value ban entry. */
    private validate_entry;
    /** Perform the validation on the data. */
    private validate_data;
    /**
     * Run the validator.
     * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
     */
    validate(data: T): Validator.Response<T, Throw, E, V, Tpl>;
}
export declare namespace Validator {
    /** Base input type options. */
    type T = any[] | Record<string, any>;
    /**
     * Constructor options.
     * We require all generics so that `validate()` can still create an opts from the generic and infer the output type correctly.
     */
    type Opts<T extends Validator.T = Validator.T, Throw extends boolean = boolean, E extends Entries.Opts = Entries.Opts, V extends Entry.Opts = Entry.Opts, Tpl extends Entry.Opts[] = Entry.Opts[]> = ConstructorParameters<typeof Validator<T, Throw, E, V, Tpl>>[0];
    /**
     * The response type returned by {@link Validator.validate} and the
     * {@link validate} helper function.
     *
     * It should reflect the options supplied at validation time rather than the
     * generic {@link Validator.Opts} interface itself.  The previous
     * implementation used the interface directly which resulted in `never`
     * being inferred for the output type.
     */
    type Response<T extends Validator.T, Throw extends boolean = boolean, E extends Entries.Opts = Entries.Opts, V extends Entry.Opts = Entry.Opts, Tpl extends Entry.Opts[] = Entry.Opts[]> = Throw extends true ? InferOutput<T, E, V, Tpl> : Validator.InfoResponse<"success" | "error", InferOutput<T, E, V, Tpl>>;
    /** Info mode response */
    type InfoResponse<Mode extends "error" | "success", Output extends object = object> = Mode extends "error" ? {
        error: string;
        invalid_fields: Record<string, string>;
        data?: never;
    } : Mode extends "success" ? {
        error?: never;
        invalid_fields?: never;
        data: Output;
    } : never;
    /** A user facing error class for user-facing errors from `Validate` when `throw: true`. */
    class Error<O extends object> extends globalThis.Error {
        info: InfoResponse<"error", O>;
        constructor(info: InfoResponse<"error", O>);
    }
    /** Error thrown when the user incorrectly utilizes the scheme module. */
    class InvalidUsageError extends globalThis.Error {
        constructor(msg: string);
    }
}
/** Infer the output type from input schemes from `Validate.Opts`. */
type InferOutput<T extends Validator.T, Etr extends Entries.Opts = Entries.Opts, Val extends Entry.Opts = Entry.Opts, Tpl extends Entry.Opts[] = Entry.Opts[]> = Etr extends Entries.Opts ? Entries.Infer<Etr> : Val extends ValueEntries.Opts ? ValueEntries.Infer<T extends any[] ? "array" : "object", Val> : Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> : never;
/**
 * Validate an object or array by scheme.
 *
 * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
 *
 * @template I The input type of the object or array to validate.
 * @template O The output type of the returned object or array.

 * @param opts The options for the verification.
 *             See {@link ValidatorEntry} and {@link VerifyOpts} for more details.
 * @docs
 */
export declare function validate<T extends Validator.T, Throw extends boolean = boolean, const E extends Entries.Opts = Entries.Opts, const V extends Entry.Opts = Entry.Opts, const Tpl extends Entry.Opts[] = Entry.Opts[]>(data: T, opts: Validator.Opts<T, Throw, E, V, Tpl>): Validator.Response<T, Throw, E, V, Tpl>;
export {};
