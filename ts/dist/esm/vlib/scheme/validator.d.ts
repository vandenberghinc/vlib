/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import type { AliasPick } from "../types/types.js";
import { Entry } from "./entry.js";
import { Scheme } from "./scheme.js";
import type { ExtractFlag, IfFlag, IfFlags } from "../types/flags.js";
/**
 * Data mode flag.
 * This is required for the `tuple` attribute to be initialized from in the constructor.
 * @enum {"object"} In object mode the `scheme` attribute will be used to validate the object attributes.
 * @enum {"array"} In array mode the `tuple` attribute will be used to validate the array items.
 */
export type Mode = "object" | "array";
export declare namespace Mode {
    /** Universal flag utilities after `T` is defined. */
    type T = Mode;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
    export {};
}
/**
 * Wrapper class to validate an object.
 * @note Always updates the object in place.
 * @note The Validate object is re-usable to validate different objects.
 * @note The Validate object should be thread safe but not tested so perhaps dont.
 */
export declare class Validator<
/** The input type. */
T extends object, 
/** The output type. */
O extends object = T, 
/**
 * Mode, array or object.
 * This is required for the `tuple` attribute to be initialized from in the constructor.
 */
M extends Mode = T extends any[] ? "array" : "object"> {
    /** The scheme to validate. */
    scheme?: Scheme;
    /** The value scheme for object values or array items. */
    value_scheme?: Entry;
    /** Is an array with tuple mode enabled. */
    is_tuple: boolean;
    /**
     * Allow unknown attributes
     * When `false`, errors will be thrown when unknown attributes are found.
     * Defaults to `true`.
     */
    unknown: boolean;
    /** The parent prefix. */
    parent: string;
    /** The error prefix. */
    error_prefix: string;
    /** Throw occurred errors, defaults to `false` */
    throw: boolean;
    /** Constructor. */
    constructor(
    /**
     * Data mode.
     * Dont support "auto" so we can infer the M generic from this parameter.
     */
    mode: M, 
    /** Options. */
    opts: {
        unknown?: boolean;
        parent?: string;
        error_prefix?: string;
        err_prefix?: string | null;
        /** Throw occurred errors, defaults to `false` */
        throw: boolean;
    } & AliasPick<{
        err_prefix?: string;
        error_prefix?: string;
    }> & Mode.If<M, "array", AliasPick<{
        value_scheme: Entry | Entry.Opts | undefined;
        tuple: Entry | Entry.Opts | undefined;
    }> & {
        scheme?: never;
    }, AliasPick<{
        scheme: Scheme.Opts | Scheme;
        value_scheme: Entry | Entry.Opts | undefined;
    }> & {
        tuple?: never;
    }>);
    /** Throw an error or return error object. */
    private throw_error;
    /**
     * Check type of the parameter function.
     * Scheme key may also be an index for when object is an array.
     */
    private check_type;
    /** Validate a value ban entry. */
    private validate_entry;
    /** Perform the validation on the data. */
    private validate_data;
    /** Run the validator. */
    validate(data: T): Validator.Info<"success" | "error", O>;
}
export declare namespace Validator {
    /** Constructor options. */
    type Opts<T extends object, O extends object = T, M extends Mode = T extends any[] ? "array" : "object"> = ConstructorParameters<typeof Validator<T, O, M>>[1];
    /** Info mode response */
    type Info<M extends "error" | "success", O extends object> = M extends "error" ? {
        error: string;
        invalid_fields?: Record<string, string>;
        data?: never;
    } : M extends "success" ? {
        error?: never;
        invalid_fields?: never;
        data: O;
    } : never;
    /** A user facing error class for user-facing errors from `Validate` when `throw: true`. */
    class Error<O extends object> extends globalThis.Error {
        info: Info<"error", O>;
        constructor(info: Info<"error", O>);
    }
    /** Error thrown when the user incorrectly utilizes the scheme module. */
    class InvalidUsageError<O extends object> extends globalThis.Error {
        constructor(msg: string);
    }
}
/**
 * Validate an object or array by scheme.
 *
 * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
 *
 * @template T The type of the object or array to validate.
 * @template O The output type of the returned object or array.
 *
 * @param opts The options for the verification.
 *             See {@link Entry} and {@link VerifyOpts} for more details.
 *
 * @libris
 */
export declare function validate<T extends object, O extends object, M extends Mode = T extends any[] ? "array" : "object">(data: T, opts: Validator.Opts<T, O, M>): Validator.Info<"success" | "error", O>;
