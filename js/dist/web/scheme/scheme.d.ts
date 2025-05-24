/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note Web - This file should also be accessable from the frontend / in a web environment.
 */
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
    /** Scheme options. */
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
    interface VerifyOptions<T extends object> {
        object: T;
        scheme?: Record<string, Scheme.SchemeOptions | string>;
        value_scheme?: Scheme.SchemeOptions | string | null;
        check_unknown?: boolean;
        parent?: string;
        error_prefix?: string;
        err_prefix?: string | null;
        throw_err?: boolean;
    }
    /** Verify response */
    interface VerifyResponse<T extends object> {
        error?: string;
        invalid_fields?: Record<string, string>;
        object?: T;
    }
    /**
     * Verify an object or array by scheme.
     * @libris
     */
    function verify<T extends object>(opts: Omit<Scheme.VerifyOptions<T>, "throw_err"> & {
        throw_err: false;
    }): VerifyResponse<T>;
    function verify<T extends object>(opts: Omit<Scheme.VerifyOptions<T>, "throw_err"> & {
        throw_err?: true;
    }): T;
    /**
     * Get a value type for error reporting
     * @libris
     */
    function value_type(value: any): string;
    /**
     * Throw an error for undefined arguments
     * @libris
     */
    function throw_undefined(name: string | {
        name: string;
        type?: Scheme.SchemeType;
        throw_err?: boolean;
    }, type?: Scheme.SchemeType, throw_err?: boolean): string;
    /**
     * Throw an error for invalid type arguments
     * @libris
     */
    function throw_invalid_type(name: string | {
        name: string;
        value: any;
        type?: Scheme.SchemeType;
        throw_err?: boolean;
    }, value?: any, type?: Scheme.SchemeType, throw_err?: boolean): string;
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
export default Scheme;
