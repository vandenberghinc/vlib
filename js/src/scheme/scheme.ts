/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * @note Web - This file should also be accessable from the frontend / in a web environment.
 */

import { ObjectOrArray, ObjectOrArrayType } from "../types/types.js";
import { EnforceOneFor, Merge } from "../types/transform.js";


/** 
 * {Scheme}
 * The scheme validation module.
 * @libris
 */
export namespace Scheme {

    // -------------------------------------------------------
    // Types.

    /** Types for scheme validation */
    export type SchemeType = string | Function | (string | Function)[];

    /** User facing root scheme object */
    export type Scheme = { [field_name: string]: Scheme.SchemeOptions }

    /**
     * Scheme options.
     * @libris
     */
    export interface SchemeOptions {
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

    /** Internal error used for throwing errors with cached json responses. */
    class InternalError {
        constructor(public data: {
            error: string;
            invalid_fields: Record<string, string>;
            object: undefined
        }) {}
    }

    // -------------------------------------------------------
    // Utility functions.

    /**
     * Initialize scheme item.
     * Param `scheme` and `scheme` key should be assigned when validating non array objects.
     */
    function init_scheme_item(scheme_item: Scheme.SchemeOptions | string, scheme?: Record<string, string | Scheme.SchemeOptions>, scheme_key?: string): Scheme.SchemeOptions {
        
        // Convert scheme item into object.
        if (typeof scheme_item === "string") {
            scheme_item = {type: scheme_item};

            // Convert to object for subsequent requests, useful for vweb restapi callback.
            if (scheme !== undefined && scheme_key !== undefined) {
                scheme[scheme_key] = scheme_item;
            }
        }

        // Rename aliases.
        else {
            if (scheme_item.def !== undefined) {
                scheme_item.default = scheme_item.def;
                delete scheme_item.def;
            }
            // if (scheme_item.attrs !== undefined) {
            //     scheme_item.scheme = scheme_item.attrs;
            //     delete scheme_item.attrs;
            // }
            // else if (scheme_item.attributes !== undefined) {
            //     scheme_item.scheme = scheme_item.attributes;
            //     delete scheme_item.attributes;
            // }
            // if (scheme_item.enumerate !== undefined) {
            //     scheme_item.enum = scheme_item.enumerate;
            //     delete scheme_item.enumerate;
            // }
        }

        // Response.
        return scheme_item as Scheme.SchemeOptions;
    }

    /** 
     * Generate a type error string
     */
    function type_error_str(scheme_item: Scheme.SchemeOptions, prefix: string = " of type "): string {
        let type_error_str = "";
        if (Array.isArray(scheme_item.type)) {
            type_error_str = prefix;
            for (let i = 0; i < scheme_item.type.length; i++) {
                if (typeof scheme_item.type[i] === "function") {
                    try {
                        type_error_str += `"${(scheme_item.type[i] as unknown as Function).name}"`
                    } catch (e) {
                        type_error_str += `"${scheme_item.type[i]}"`
                    }
                } else {
                    type_error_str += `"${scheme_item.type[i]}"`
                }
                if (i === scheme_item.type.length - 2) {
                    type_error_str += " or "
                } else if (i < scheme_item.type.length - 2) {
                    type_error_str += ", "
                }
            }
        } else {
            type_error_str = `${prefix}"${scheme_item.type}"`
        }
        return type_error_str;
    }

    /** 
    * Create a type string from an array
    */
    function type_string(type: Scheme.SchemeType = [], prefix: string = ""): string {
        if (typeof type === "string") {
            return `${prefix}"${type}"`;
        }
        if (Array.isArray(type) && type.length > 0) {
            let str = prefix;
            for (let i = 0; i < type.length; i++) {
                if (typeof type[i] === "function") {
                    try {
                        str += `"${(type[i] as unknown as Function).name}"`
                    } catch (e) {
                        str += `"${type[i]}"`
                    }
                } else {
                    str += `"${type[i]}"`
                }
                if (i === type.length - 2) {
                    str += " or "
                } else if (i < type.length - 2) {
                    str += ", "
                }
            }
            return str;
        }
        return "";
    }

    // -------------------------------------------------------
    // Core verify function.

    /** Argument options for verify() */
    export type VerifyOptions<
        T extends object,
        DataAlias extends boolean = boolean,
        ErrorAlias extends boolean = boolean,
    > =
    // EnforceOneFor<
        {
            scheme?: Record<string, Scheme.SchemeOptions | string>;
            value_scheme?: Scheme.SchemeOptions | string | null;
            tuple_scheme?: SchemeOptions["tuple_scheme"];
            strict?: boolean;
            parent?: string;
            error_prefix?: string;
            err_prefix?: string | null;
            throw?: boolean;
        } & ( DataAlias extends true
            ? { object: T; data?: never;}
            : { object?: never; data: T; }
        ) & (ErrorAlias extends true
            ? { error_prefix?: string; }
            : { object?: never; data: T; }
        )
    // , "scheme" | "value_scheme" | "tuple_scheme" >

    /** Verify response */
    export interface VerifyResponse<T extends object> {
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
    export function verify<T extends object, O extends object = T>(opts: Merge<Scheme.VerifyOptions<T>, { throw: false; }>): VerifyResponse<O>;
    export function verify<T extends object, O extends object = T>(opts: Merge<Scheme.VerifyOptions<T>, { throw?: true; }>): O;
    export function verify<T extends object, O extends object = T>({
        object,
        data,
        scheme = {},
        value_scheme,
        tuple_scheme,
        strict = false,
        parent = "",
        error_prefix = "",
        err_prefix,
        throw: throw_err = true,
    }: Scheme.VerifyOptions<T>): O | VerifyResponse<O> {

        // Set aliases.
        if (data != null) object = data; 
        if (err_prefix != null) error_prefix = err_prefix;
        
        // Add parent separator.
        if (typeof parent === "string" && parent.length > 0 && /[a-zA-Z0-9]+/g.test(parent.charAt(parent.length - 1))) {
            parent += ".";
        }

        // Throw an error and pop the verify_object from the stacktrace.
        const throw_err_h = (e: string, field: string) => {
            const invalid_fields = {};
            invalid_fields[field] = e;
            if (throw_err === false) {
                return {error: e, invalid_fields, object: undefined};
            }
            throw new InternalError({ error: e, invalid_fields, object: undefined });
        }

        // Check type of the parameter function.
        // Scheme key may also be an index for when object is an array.
        const check_type = (object, obj_key, scheme_item, type) => {

            // Check VS instance.
            if (typeof type === "function") {
                return object[obj_key] instanceof type;
            }

            // Check vs string named type.
            switch (type) {
                case "null":
                    return object[obj_key] == null;
                case "array": {
                    if (Array.isArray(object[obj_key]) === false) {
                        return false;
                    }
                    if (scheme_item.scheme || scheme_item.value_scheme) {
                        try {
                            object[obj_key] = Scheme.verify({
                                object: object[obj_key],
                                scheme: scheme_item.scheme,
                                value_scheme: scheme_item.value_scheme,
                                strict: strict,
                                parent: `${parent}${obj_key}.`,
                                error_prefix,
                                throw: true,
                            });
                        } catch (e: any) {
                            if (!throw_err && e instanceof InternalError && e.data) { return e.data; }
                            else { throw e; }
                        }
                    }

                    // Check min max items.
                    if (typeof scheme_item.min_length === "number" && object[obj_key].length < scheme_item.min_length) {
                        const field = `${parent}${obj_key}`;
                        return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${scheme_item.min_length}].`, field);
                    }
                    if (typeof scheme_item.max_length === "number" && object[obj_key].length > scheme_item.max_length) {
                        const field = `${parent}${obj_key}`;
                        return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${scheme_item.max_length}].`, field);
                    }
                    return true;
                }
                case "object": {
                    if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
                        return false;
                    }
                    if (scheme_item.scheme || scheme_item.value_scheme) {
                        try {
                            object[obj_key] = Scheme.verify({
                                object: object[obj_key],
                                scheme: scheme_item.scheme,
                                value_scheme: scheme_item.value_scheme,
                                strict: strict,
                                parent: `${parent}${obj_key}.`,
                                error_prefix,
                                throw: true,
                            });
                        } catch (e: any) {
                            if (!throw_err && e.json) { return e.json; }
                            else { throw e; }
                        }
                    }
                    return true;
                }
                case "string": {
                    if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
                        return false;
                    }
                    if (scheme_item.allow_empty !== true && object[obj_key].length === 0) {
                        return 1;
                    }
                    if (typeof scheme_item.min_length === "number" && object[obj_key].length < scheme_item.min_length) {
                        const field = `${parent}${obj_key}`;
                        return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${scheme_item.min_length}].`, field);
                    }
                    if (typeof scheme_item.max_length === "number" && object[obj_key].length > scheme_item.max_length) {
                        const field = `${parent}${obj_key}`;
                        return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${scheme_item.max_length}].`, field);
                    }
                }
                default:
                    if (type !== typeof object[obj_key]) {
                        return false;
                    }
                    if (type === "string" && scheme_item.allow_empty !== true && object[obj_key].length === 0) {
                        return 1;
                    }
                    return true;
            }
        }

        // Verify a value by scheme.
        const verify_value_scheme = (scheme_item, key, object, value_scheme_key = undefined) => {

            // Execute the pre process callback.
            if (typeof scheme_item.preprocess === "function") {
                const res = scheme_item.preprocess(object[key], object, key);
                if (res !== undefined) {
                    object[key] = res;
                }
            }

            // Do a type check.
            if (scheme_item.type && scheme_item.type !== "any") {
                const is_required = scheme_item.required ?? true;

                // Skip when value is `null / undefined` and default is `null`.
                if (!((scheme_item.default == null || !is_required) && object[key] == null)) {

                    // Multiple types supported.
                    if (Array.isArray(scheme_item.type)) {
                        let correct_type = false;
                        let is_empty = false;
                        for (let i = 0; i < scheme_item.type.length; i++) {
                            const res = check_type(object, key, scheme_item, scheme_item.type[i]);
                            if (typeof res === "object") { // json error.
                                return res;
                            }
                            else if (res === true) {
                                correct_type = true;
                                break;
                            }
                            else if (res === 1) {
                                correct_type = true;
                                is_empty = true;
                                break;
                            }
                        }
                        if (correct_type === false) {
                            const field = `${parent}${value_scheme_key || key}`;
                            const current_type = Scheme.value_type(object[key]);
                            return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
                        }
                        else if (is_empty && is_required && scheme_item.default !== "") {
                            const field = `${parent}${value_scheme_key || key}`;
                            return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`, field);
                        }
                    }

                    // Single type supported.
                    else {
                        const res = check_type(object, key, scheme_item, scheme_item.type);
                        if (typeof res === "object") { // json error.
                            return res;
                        }
                        else if (res === false) {
                            const field = `${parent}${value_scheme_key || key}`;
                            const current_type = Scheme.value_type(object[key]);
                            return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
                        }
                        else if (res === 1 && is_required && scheme_item.default !== "") {
                            const field = `${parent}${value_scheme_key || key}`;
                            return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`, field);
                        }
                    }
                }
            }

            // Set default.
            if (object[key] === undefined && scheme_item.default !== undefined) {
                if (typeof scheme_item.default === "function") {
                    object[key] = scheme_item.default(object);
                } else {
                    object[key] = scheme_item.default;
                }
            }

            // Check enum.
            if (scheme_item.enum) {
                if (!scheme_item.enum.includes(object[key])) {
                    const field = `${parent}${value_scheme_key || key}`;
                    const joined = scheme_item.enum.map(item => {
                        if (item == null) {
                            return 'null';
                        } else if (typeof item !== "string" && !(item instanceof String)) {
                            return item.toString();
                        }
                        return `"${item.toString()}"`;
                    }).join(", ");
                    return throw_err_h(`${error_prefix}Attribute "${field}" must be one of the following enumerated values [${joined}].`, field);
                }
            }

            // Execute the verify callback.
            if (typeof scheme_item.verify === "function") {
                const err = scheme_item.verify(object[key], object, key);
                if (err) {
                    return throw_err_h(`${error_prefix}${err}`, `${parent}${value_scheme_key || key}`);
                }
            }

            // Execute the post process callback.
            if (typeof scheme_item.postprocess === "function") {
                const res = scheme_item.postprocess(object[key], object, key);
                if (res !== undefined) {
                    object[key] = res;
                }
            }
        }
        
        // Check tuple scheme.
        // If so create a scheme object and transform the source object into an object with `argument_0`, `argument_1`, etc. keys.
        if (Array.isArray(object) && Array.isArray(tuple_scheme)) {
            scheme = {};
            let out_obj: any = {};
            for (let i = 0; i < tuple_scheme.length; i++) {
                out_obj[`argument_${i}`] = object[i];
                if (typeof tuple_scheme[i] === "object") {
                    scheme[`tuple_${i}`] = tuple_scheme[i];
                } else {
                    scheme[`tuple_${i}`] = { type: tuple_scheme[i] as string };
                }
            }
        }

        // When object is an array.
        if (Array.isArray(object)) {

            // @deprecated: No longer use scheme for arrays since if a param may be both an array and obj, there must be a distinction possible to verify the scheme of the possible object vs the value scheme of a possible array.
            //
            // Always use value scheme.
            if (value_scheme != null) {

                // Use the scheme as a scheme item for the entire array.
                const scheme_item = init_scheme_item(value_scheme); 

                // Iterate array.
                for (let index = 0; index < object.length; index++) {
                    const err = verify_value_scheme(scheme_item, index, object);
                    if (err) { return err; }
                }
            }
        }

        // When object is an object.
        else if (typeof object === "object" && object != null) {

            // Verify object's value scheme.
            // So only check the values of the object, not the object itself.
            if (value_scheme != null) {

                // Convert scheme item into object.
                const scheme_item = init_scheme_item(value_scheme);

                // Iterate the object.
                const keys = Object.keys(object);
                for (let i = 0; i < keys.length; i++) {

                    // Verify the values of the object by scheme.
                    const err = verify_value_scheme(scheme_item, keys[i], object);
                    if (err) { return err; }
                }
            }

            // Verify the object itself.
            else {

                // Map aliases.
                const aliases = new Map<string, SchemeOptions>();
                Object.values(scheme).walk(s => {
                    if (typeof s === "object" && s.alias?.length) {
                        for (let i = 0; i < s.alias.length; i++) {
                            aliases.set(s.alias[i], s);
                        }
                    }
                })

                // Iterate all object to check if there are any undefined object passed.
                // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
                if (strict) {
                    const object_keys = Object.keys(object);
                    for (let x = 0; x < object_keys.length; x++) {
                        if (
                            object_keys[x] in scheme === false
                            && !aliases.has(object_keys[x])
                        ) {
                            const field = `${parent}${object_keys[x]}`;
                            return throw_err_h(`${error_prefix}Attribute "${field}" is not a valid attribute name.`, field);
                        }
                    }
                }

                // Iterate all scheme object to check if any object are missing.
                const scheme_keys = Object.keys(scheme);
                for (let scheme_index = 0; scheme_index < scheme_keys.length; scheme_index++) {
                    const scheme_key = scheme_keys[scheme_index];
                    if (scheme[scheme_key] == null) {
                        continue;
                    }
                    const scheme_item = init_scheme_item(scheme[scheme_key], scheme, scheme_key);

                    // Convert aliases.
                    if (Array.isArray(scheme_item.alias)) {
                        for (let i = 0; i < scheme_item.alias.length; i++) {
                            if (object[scheme_item.alias[i]] !== undefined) {
                                object[scheme_key] = object[scheme_item.alias[i]];
                                delete object[scheme_item.alias[i]];
                            }
                        }
                    } else if (typeof scheme_item.alias === "string") {
                        if (object[scheme_item.alias] !== undefined) {
                            object[scheme_key] = object[scheme_item.alias];
                            delete object[scheme_item.alias];
                        }
                    }

                    // Parameter is not found in passed object.
                    if (scheme_key in object === false) {

                        // Set default.
                        if (scheme_item.default !== undefined) {
                            if (typeof scheme_item.default === "function") {
                                object[scheme_key] = scheme_item.default(object);
                            } else {
                                object[scheme_key] = scheme_item.default;
                            }
                        }

                        // Required unless specified otherwise.
                        else {
                            if (scheme_item.required === false) {
                                continue;
                            }
                            else if (typeof scheme_item.required === "function") {
                                const required = scheme_item.required(object);
                                if (required) {
                                    const field = `${parent}${scheme_key}`;
                                    return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${type_error_str(scheme_item)}.`, field);
                                }
                            } else {
                                const field = `${parent}${scheme_key}`;
                                return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${type_error_str(scheme_item)}.`, field);
                            }
                        }

                        // Continue.
                        continue;
                    }

                    // Verify value.
                    const err = verify_value_scheme(scheme_item, scheme_key, object);
                    if (err) { return err; }
                }
            }
        }

        // Return when no throw err.
        if (throw_err === false) {
            return { error: undefined, invalid_fields: {}, object: object as unknown as O };
        }
        return object as unknown as O;
    }

    // -------------------------------------------------------
    // Other public functions.

    /** 
     * Get a value type for error reporting
     * @libris
     */
    export function value_type(value: any): string {
        if (value == null) { return "null"; }
        else if (typeof value === "object" && Array.isArray(value)) { return "array"; }
        else { return typeof value; }
    }

    /**
     * Base type for `throw_x` functions.
     */
    export interface ThrowType {
        name: string;
        value?: any;
        type?: Scheme.SchemeType;
        throw?: boolean;
    }

    /** 
     * Throw an error for undefined arguments
     * @libris
     */
    export function throw_undefined(
        name: string,
        type?: Scheme.SchemeType,
        throw_err?: boolean,
    ): never;
    export function throw_undefined(
        name: ThrowType | string,
        type: Scheme.SchemeType,
        throw_err: false
    ): string;
    export function throw_undefined(
        opts: ThrowType
    ): never;
    export function throw_undefined(
        opts: Merge<ThrowType, { throw: false }>,
    ): never;
    export function throw_undefined(): never | string {
        // Support keyword assignment params.
        let opts: ThrowType;
        if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
            opts = arguments[0] as ThrowType;
        } else {
            // dont check types here since errors here are weird.
            opts = {
                name: arguments[0] as string,
                type: arguments[1] as Scheme.SchemeType | undefined,
                throw: arguments[2] !== false,
            }
        }
        const err = `Argument "${opts.name as string}" should be a defined value${type_string(opts.type, " of type ")}.`
        if (opts.throw !== false) {
            throw new Error(err);
        }
        return err;
    }

    /** 
     * Throw an error for invalid type arguments
     * @libris
     */

    export function throw_invalid_type(
        name: string,
        value?: any,
        type?: Scheme.SchemeType,
        throw_err?: boolean,
    ): never;
    export function throw_invalid_type(
        name: ThrowType | string,
        value: any,
        type: Scheme.SchemeType,
        throw_err: false
    ): string;
    export function throw_invalid_type(
        opts: ThrowType
    ): never;
    export function throw_invalid_type(
        opts: Merge<ThrowType, { throw: false }>,
    ): never;
    export function throw_invalid_type(): string {
        let opts: ThrowType;
        if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
            opts = arguments[0] as ThrowType;
        } else {
            // dont check types here since errors here are weird.
            opts = {
                name: arguments[0] as string,
                value: arguments[1],
                type: arguments[2] as Scheme.SchemeType | undefined,
                throw: arguments[3] !== false,
            }
        }
        const err = `Invalid type "${Scheme.value_type(opts.value)}" for argument "${opts.name as string}"${type_string(opts.type, ", the valid type is ")}.`
        if (opts.throw) {
            throw new Error(err);
        }
        return err;   
    }

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
    export function cast_bool(str: string, opts: { preserve?: false, strict: false }): boolean;
    export function cast_bool(str: string, opts: { preserve: true, strict?: false }): string | boolean;
    export function cast_bool(str: string, opts?: { preserve?: false, strict?: boolean }): boolean | undefined;
    export function cast_bool(str: string, opts?: { preserve?: boolean, strict?: boolean }): boolean | string | undefined {
        switch (str) {
            case "true":
            case "True":
            case "TRUE":
            case "1":
                return true;
            case "false":
            case "False":
            case "FALSE":
            case "0":
                return false;
            default:
                if (opts?.preserve) {
                    return str;
                }
                if (opts?.strict) {
                    return undefined;
                }
                return false;
        }
    }

    /**
     * Try to parse a number from a string, optionally strict with a regex check.
     * @param str - The string to parse.
     * @param opts.strict - When true a regex check will be performed to check if the string is a valid number. Default is false.
     * @param opts.preserve - When true a failed parse will return the original string.
     * @note The opts.preserve option is useful when applying value casts inside a scheme preprocessor, since this will return the original string in case of a failed parsing. Which might result in a type error instead of an undefined ignored value.
     * @returns the parsed number or undefined when the string is not a valid number.
     * @libris
     */
    export function cast_number(str: string, opts: { strict?: boolean, preserve: true }): string | number;
    export function cast_number(str: string, opts?: { strict?: boolean, preserve?: false }): number | undefined;
    export function cast_number(str: string, opts?: { strict?: boolean, preserve?: boolean }): string | number | undefined {
        if (opts?.strict) {
            const regex = /^[+-]?\d+(\.\d+)?$/;
            if (!regex.test(str)) {
                if (opts?.preserve) {
                    return str;
                }
                return undefined;
            }
        }
        const num = Number(str);
        if (isNaN(num)) {
            if (opts?.preserve) {
                return str;
            }
            return undefined;
        }
        return num;
    }

};
export { Scheme as scheme }; // also export as lowercase for compatibility.
