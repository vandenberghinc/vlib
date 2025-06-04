/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { AliasPick } from "../types/types.js";
import { Entry } from "./entry.js";
import { Scheme } from "./scheme.js";
/**
 * Wrapper class to validate an object.
 * @note Always updates the object in place.
 * @note The Validate object is re-usable to validate different objects.
 * @note The Validate object should be thread safe but not tested so perhaps dont.
 */
declare class Validate<
/** The input type. */
T extends object, 
/** The output type. */
O extends object = T, 
/**
 * Mode, either the raw object is the output, or an info object
 * Inferred from the `throw` attribute. Defaults to `object` when ommited.
 */
M extends Validate.Mode = Validate.Mode> {
    /** The data object to validate. */
    data: T;
    /** The scheme to validate. */
    scheme?: Scheme;
    /** The value scheme for object values or array items. */
    value_scheme?: Entry;
    /** The tuple scheme for when the object is an array. */
    tuple?: Entry;
    /** Throw an error or return a response with a potential error attr. */
    throw: M extends "error" ? true : M extends "info" ? false : never;
    /**
     * Strict mode, enabled the following features.
     * 1) Errors will be thrown for unknown attributes.
     */
    strict: boolean;
    /** The parent prefix. */
    parent: string;
    /** The error prefix. */
    error_prefix: string;
    /** Constructor. */
    constructor(opts: {
        strict?: boolean;
        parent?: string;
        error_prefix?: string;
        err_prefix?: string | null;
    } & (M extends "error" ? {
        throw?: true;
    } : M extends "info" ? {
        throw: false;
    } : never) & AliasPick<{
        object: T;
        data: T;
    }> & AliasPick<{
        err_prefix?: string;
        error_prefix?: string;
    }> & AliasPick<{
        scheme: Scheme.Opts | Scheme;
        value_scheme: Entry.Opts | undefined;
        tuple: Entry.Opts | undefined;
    }>);
    /** Throw an error or return error object. */
    private throw_error;
    /**
     * Check type of the parameter function.
     * Scheme key may also be an index for when object is an array.
     */
    private check_type;
    /** Verify a value ban entry. */
    private verify_entry;
    /**
     * Run the validation.
     */
    run(): M extends "object" ? O : Validate.Info<O>;
}
/** Validate types. */
export declare namespace Validate {
    /**
     * The validate modes.
     * @enum {"info"} In info mode the response will be an object with an `error` attribute and an `invalid_fields` attribute, or an object with a validated nested object.
     * @enum {"error"} In error mode the returned value will be the validated object or array, while throwing errors upon verification failure.
     */
    type Mode = "info" | "error";
    /** Constructor options. */
    type Opts<T extends object, O extends object = T, M extends Mode = Mode> = ConstructorParameters<typeof Validate<T, O, M>>[0];
    /** Verify response type. */
    type Res<T extends object, O extends object = T, M extends Mode = Mode> = M extends "object" ? O : Validate.Info<O>;
    /** Info mode response */
    interface Info<T extends object> {
        error?: string;
        invalid_fields?: Record<string, string>;
        object?: T;
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
export declare function validate<T extends object, O extends object, M extends Validate.Mode = Validate.Mode>(opts: Validate.Opts<T, O, M>): Validate.Res<T, O, M>;
export {};
