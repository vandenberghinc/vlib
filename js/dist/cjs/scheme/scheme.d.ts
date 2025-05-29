/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note Web - This file should also be accessable from the frontend / in a web environment.
 */
import { Merge } from "../types/transform.js";
/**
 * {Scheme}
 * The scheme validation module.
 * @libris
 */
export declare namespace Scheme {
    /** Types for scheme validation */
    type SchemeType = string | Function | (string | Function)[];
    /** User facing root scheme object */
    type Scheme = {
        [field_name: string]: Scheme.SchemeOptions;
    };
    /**
     * Scheme options.
     * @libris
     */
    interface SchemeOptions {
        /** The value type. */
        type?: SchemeType;
        /**
         * The default value or callback to create default value
         * When defined this attribute will be considered as optional.
         */
        default?: any | ((obj: any) => any);
        /**
         * Is required, when `true` the attribute must be or an error will be thrown.
         */
        required?: boolean | ((attrs: any) => boolean);
        /**
         * Allow empty strings, arrays or objects.
         * By default `true`.
         */
        allow_empty?: boolean;
        /**
         * Set a minimum length for strings or arrays.
         */
        min_length?: number;
        /**
         * Set a maximum length for strings or arrays.
         */
        max_length?: number;
        /**
         * A nested scheme for when the attribute is an object.
         */
        scheme?: Record<string, SchemeOptions | string>;
        /**
         * A nested scheme for the array items for when the attribute is an array.
         * Or a scheme for the value's of an object.
         */
        value_scheme?: SchemeOptions | string;
        /**
         * Tuple scheme for when the input object is an array.
         * This can be used to verify each item in an array specifically with a predefined length.
         *
         * Each index of the scheme option corresponds to the index of the input array.
         *
         * @note this attribute is ignored when the input object is not an array.
         */
        tuple_scheme?: (string | SchemeOptions)[];
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
        verify?: (attr: any, attrs: any, key?: string | number) => string | void | null | undefined;
        /**
         * Pre process the attribute.
         * The callback should return the updated value.
         */
        preprocess?: (attr: any, parent_obj: any, key: string | number) => any;
        /**
         * Post process the attribute.
         * The callback should return the updated value.
         */
        postprocess?: (attr: any, parent_obj: any, key: string | number) => any;
        /** Alias for `default`. */
        def?: any | ((obj: any) => any);
    }
    /** Argument options for verify() */
    type VerifyOptions<T extends object, DataAlias extends boolean = boolean, ErrorAlias extends boolean = boolean> = {
        scheme?: Record<string, Scheme.SchemeOptions | string>;
        value_scheme?: Scheme.SchemeOptions | string | null;
        tuple_scheme?: SchemeOptions["tuple_scheme"];
        strict?: boolean;
        parent?: string;
        error_prefix?: string;
        err_prefix?: string | null;
        throw?: boolean;
    } & (DataAlias extends true ? {
        object: T;
        data?: never;
    } : {
        object?: never;
        data: T;
    }) & (ErrorAlias extends true ? {
        error_prefix?: string;
    } : {
        object?: never;
        data: T;
    });
    /** Verify response */
    interface VerifyResponse<T extends object> {
        error?: string;
        invalid_fields?: Record<string, string>;
        object?: T;
    }
    /**
     * Verify an object or array by scheme.
     *
     * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
     *
     * @template O The output type of the returned object or array.
     * @template T The type of the object or array to verify.
     *
     * @param opts The options for the verification.
     *             See {@link Scheme.SchemeOptions} and {@link Scheme.VerifyOptions} for more details.
     *
     * @libris
     */
    function verify<T extends object, O extends object = T>(opts: Merge<Scheme.VerifyOptions<T>, {
        throw: false;
    }>): VerifyResponse<O>;
    function verify<T extends object, O extends object = T>(opts: Merge<Scheme.VerifyOptions<T>, {
        throw?: true;
    }>): O;
    /**
     * Get a value type for error reporting
     * @libris
     */
    function value_type(value: any): string;
    /**
     * Base type for `throw_x` functions.
     */
    interface ThrowType {
        name: string;
        value?: any;
        type?: Scheme.SchemeType;
        throw?: boolean;
    }
    /**
     * Throw an error for undefined arguments
     * @libris
     */
    function throw_undefined(name: string, type?: Scheme.SchemeType, throw_err?: boolean): never;
    function throw_undefined(name: ThrowType | string, type: Scheme.SchemeType, throw_err: false): string;
    function throw_undefined(opts: ThrowType): never;
    function throw_undefined(opts: Merge<ThrowType, {
        throw: false;
    }>): never;
    /**
     * Throw an error for invalid type arguments
     * @libris
     */
    function throw_invalid_type(name: string, value?: any, type?: Scheme.SchemeType, throw_err?: boolean): never;
    function throw_invalid_type(name: ThrowType | string, value: any, type: Scheme.SchemeType, throw_err: false): string;
    function throw_invalid_type(opts: ThrowType): never;
    function throw_invalid_type(opts: Merge<ThrowType, {
        throw: false;
    }>): never;
    /**
     * Cast a boolean string to a boolean value.
     * So all `true True TRUE 1` strings will be cast to true and likewise for false.
     *
     * @param str - The string to parse.
     *
     * @param opts.preserve - When true a failed parse will return the original string.
     * @note opts.preserve The` opts.preserve` option is useful when applying value casts inside a scheme preprocessor, since this will return the original string in case of a failed parsing. Which might result in a type error instead of an undefined ignored value.
     * @note opts.preserve Note that `opts.preserve` and `opts.strict` can not be combined.
     *
     * @param opts.strict - When true, undefined will be returned when the string is not a valid boolean. Default is false.
     * @note opts.strict Note that `opts.preserve` and `opts.strict` can not be combined.
     *
     * @returns the parsed boolean or undefined when the string is not a valid boolean.
     *
     * @libris
     */
    function cast_bool(str: string, opts: {
        preserve?: false;
        strict: false;
    }): boolean;
    function cast_bool(str: string, opts: {
        preserve: true;
        strict?: false;
    }): string | boolean;
    function cast_bool(str: string, opts?: {
        preserve?: false;
        strict?: boolean;
    }): boolean | undefined;
    /**
     * Try to parse a number from a string, optionally strict with a regex check.
     * @param str - The string to parse.
     * @param opts.strict - When true a regex check will be performed to check if the string is a valid number. Default is false.
     * @param opts.preserve - When true a failed parse will return the original string.
     * @note The opts.preserve option is useful when applying value casts inside a scheme preprocessor, since this will return the original string in case of a failed parsing. Which might result in a type error instead of an undefined ignored value.
     * @returns the parsed number or undefined when the string is not a valid number.
     * @libris
     */
    function cast_number(str: string, opts: {
        strict?: boolean;
        preserve: true;
    }): string | number;
    function cast_number(str: string, opts?: {
        strict?: boolean;
        preserve?: false;
    }): number | undefined;
}
export { Scheme as scheme };
