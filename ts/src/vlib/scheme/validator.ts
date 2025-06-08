/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// @ts-nocheck @todo

// Imports.
import type { AliasPick } from "../types/types.js";
import { EnforceOne, EnforceOneFor, Merge } from "../types/transform.js";
import { value_type } from "./throw.js";
import { Entry } from "./entry.js";
import { Entries, ValueEntries, TupleEntries } from "./entries.js";
import { Cast } from "./cast.js";
import type { ExtractFlag, IfFlag, IfFlags } from "../types/flags.js";

// -------------------------------------------------------

/**
 * Wrapper class to validate an object.
 * 
 * @note Always updates the object in place.
 * @note The Validate object is re-usable to validate different objects.
 * @note The Validate object should be thread safe but not tested so perhaps dont.
 */
export class Validator<
    /** The input type. */
    const T extends Validator.T = Validator.T,
> {

    /** The schema to validate. */
    readonly schema?: Entries;

    /** The value schema for object values or array items. */
    readonly value_schema?: Entry;

    /** The tuple schema from init, its not used but still required for `InferOutput`. */
    readonly tuple_schema?: Entry;

    /** Is an array with tuple mode enabled. */
    readonly is_tuple: boolean;

    /** Throw occurred errors, defaults to `false` */
    readonly throw: boolean;

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

    /** Constructor. */
    constructor(opts: {
        /**
         * Allow unknown attributes
         * When `false`, errors will be thrown when unknown attributes are found.
         * Defaults to `true`.
         */
        unknown?: boolean,
        /** The parent prefix. */
        parent?: string,
        /** The error prefix. */
        error_prefix?: string,
        /** Throw occurred errors, defaults to `false` */
        throw?: boolean,
        /** Schema for when input data is an object. */
        schema?: T extends any[] ? never : Entries.Opts | Entries,
        /** Value schema for when input data is an object or array. */
        value_schema?: Entry.Opts | Entry,
        /** Tuple schema for when input data is an array. */
        tuple?: T extends any[] ? Entry.Opts | Entry : never,
    }) {

        // Check if a schema is provided.
        if (!opts.schema && !opts.value_schema && !opts.tuple) {
            throw new Validator.InvalidUsageError(`No scheme or value_scheme or tuple provided, at least one of these must be provided.`);
        }

        // Attributes.
        this.unknown = opts.unknown ?? true;
        this.parent = opts.parent ?? "";
        this.error_prefix = opts.error_prefix ?? "";
        if (opts.schema) this.schema = opts.schema instanceof Entries ? opts.schema : new Entries(opts.schema);
        if (opts.value_schema) this.value_schema = opts.value_schema instanceof Entry ? opts.value_schema : new Entry(opts.value_schema);
        this.throw = opts.throw ?? false;

        // Add dot to parent.
        if (typeof this.parent === "string" && this.parent.length > 0 && /[a-zA-Z0-9]+/g.test(this.parent.charAt(this.parent.length - 1))) {
            this.parent += ".";
        }

        // Initialize scheme from a tuple scheme.
        // Create a scheme object and transform the source object into an object with `argument_0`, `argument_1`, etc. keys.
        this.is_tuple = false;
        if (Array.isArray(opts.tuple)) {
            this.is_tuple = true;
            const scheme: Entries.Opts = {};
            for (let i = 0; i < opts.tuple.length; i++) {
                if (typeof opts.tuple[i] === "object") {
                    scheme[`tuple_${i}`] = opts.tuple[i];
                } else {
                    scheme[`tuple_${i}`] = { type: opts.tuple[i] };
                }
            }
            this.schema = new Entries(scheme);
        }
    }

    /** Throw an error or return error object. */
    private throw_error(e: string, field: string): Validator.Info<"error", AutoInferOutput<T, this>> {
        const invalid_fields = {};
        invalid_fields[field] = e;
        return { error: this.error_prefix + e, invalid_fields };
    }

    /**
     * Check type of the parameter function.
     * Scheme key may also be an index for when object is an array. 
     */
    private check_type(
        object: object | any[],
        obj_key: string | number,
        entry: Entry,
        type: Cast.Castable.Base,
    ): boolean | "empty" | Validator.Info<"error", AutoInferOutput<T, Opts>> {

        // Check VS instance.
        if (typeof type === "function") {
            return object[obj_key] instanceof type;
        }

        // Check vs string named type.
        switch (type) {

            // Any so no filter.
            case "any":
                return true;

            // Null types.
            case "null":
                return object[obj_key] === null;
            case "undefined":
                return object[obj_key] === undefined;

            // Array types.
            case "array": {
                if (Array.isArray(object[obj_key]) === false) {
                    return false;
                }
                if (entry.schema || entry.value_schema) {
                    const validator = new Validator<any[]>({
                        // scheme: scheme_item.scheme,
                        value_schema: entry.value_schema,
                        tuple: entry.tuple as any,
                        unknown: this.unknown,
                        parent: `${this.parent}${obj_key}.`,
                        error_prefix: this.error_prefix,
                        throw: false, 
                    })
                    const res = validator.validate(object[obj_key]);
                    if (res.error) {
                        return res;
                    }
                    object[obj_key] = res.data;
                }

                // Check min max items.
                if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
                    const field = `${this.parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`, field);
                }
                if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                    const field = `${this.parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`, field);
                }
                return true;
            }

            // Object types.
            case "object": {
                if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
                    return false;
                }
                if (entry.schema || entry.value_schema) {
                    const validator = new Validator({
                        schema: entry.schema as any,
                        value_schema: entry.value_schema as any,
                        tuple: entry.tuple as any,
                        unknown: this.unknown,
                        parent: `${this.parent}${obj_key}.`,
                        error_prefix: this.error_prefix,
                        throw: false, 
                    });
                    const res = validator.validate(object[obj_key]);
                    if (res.error) {
                        return res;
                    }
                    object[obj_key] = res.data;
                }
                return true;
            }

            // String types.
            case "string": {
                if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
                    return false;
                }
                if (entry.allow_empty !== true && object[obj_key].length === 0) {
                    return "empty";
                }
                if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
                    const field = `${this.parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`, field);
                }
                if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                    const field = `${this.parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`, field);
                }
                if (type !== typeof object[obj_key]) {
                    return false;
                }
                if (entry.allow_empty !== true && object[obj_key].length === 0) {
                    return "empty";
                }
                return true;
            }

            // Number type.
            case "number": {
                if (type !== typeof object[obj_key]) {
                    return false;
                }
                if (entry.allow_empty !== true && isNaN(object[obj_key])) {
                    return "empty";
                }
                if (typeof entry.min === "number" && object[obj_key] < entry.min) {
                    const field = `${this.parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an value [${object[obj_key].length}], the minimum is [${entry.min}].`, field);
                }
                if (typeof entry.max === "number" && object[obj_key] > entry.max) {
                    const field = `${this.parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`, field);
                }
                return true;
            }

            // Boolean
            case "boolean": {
                if (type !== typeof object[obj_key]) {
                    return false;
                }
                return true;
            }

            default:
                // @ts-expect-error
                throw new Validator.InvalidUsageError(`Unsupported type "${type.toString()}".`);
        }
    }

    /** Validate a value ban entry. */
    private validate_entry(
        entry: Entry,
        key: string | number,
        object: object | any[],
        value_scheme_key?: string,
    ): void | Validator.Info<"error", AutoInferOutput<T, Opts>> {

        // Cast entry.
        if (entry.cast && typeof object[key] === "string") {
            if (entry.cast.type === "boolean") {
                const v = Cast.boolean(object[key], entry.cast.opts);
                if (v !== undefined) {
                    object[key] = v;
                }
            } else if (entry.cast.type === "number") {
                const v = Cast.number(object[key], entry.cast.opts);
                if (v !== undefined) {
                    object[key] = v;
                }
            }
        }

        // Execute the pre process callback.
        if (typeof entry.preprocess === "function") {
            const res = entry.preprocess(object[key], object, key);
            if (res !== undefined) {
                object[key] = res;
            }
        }

        // Do a type check.
        if (entry.type && entry.type !== "any") {
            const is_required = entry.required ?? true;

            // Skip when value is `null / undefined` and default is `null`.
            if (!((entry.default == null || !is_required) && object[key] == null)) {

                // Multiple types supported.
                if (Array.isArray(entry.type)) {
                    let correct_type = false;
                    let is_empty = false;
                    for (let i = 0; i < entry.type.length; i++) {
                        const res = this.check_type(object, key, entry, entry.type[i]);
                        if (typeof res === "object") { // json error.
                            return res;
                        }
                        else if (res === true) {
                            correct_type = true;
                            break;
                        }
                        else if (res === "empty") {
                            correct_type = true;
                            is_empty = true;
                            break;
                        }
                    }
                    if (correct_type === false) {
                        const field = `${this.parent}${value_scheme_key || key}`;
                        const current_type = value_type(object[key]);
                        return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
                    }
                    else if (is_empty && is_required && entry.default !== "") {
                        const field = `${this.parent}${value_scheme_key || key}`;
                        return this.throw_error(`Attribute "${field}" is an empty string.`, field);
                    }
                }

                // Single type supported.
                else {
                    const res = this.check_type(object, key, entry, entry.type);
                    if (typeof res === "object") { // json error.
                        return res;
                    }
                    else if (res === false) {
                        const field = `${this.parent}${value_scheme_key || key}`;
                        const current_type = value_type(object[key]);
                        return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
                    }
                    else if (res === "empty" && is_required && entry.default !== "") {
                        const field = `${this.parent}${value_scheme_key || key}`;
                        return this.throw_error(`Attribute "${field}" is an empty string.`, field);
                    }
                }
            }
        }

        // Set default.
        if (object[key] === undefined && entry.default !== undefined) {
            if (typeof entry.default === "function") {
                object[key] = entry.default(object);
            } else {
                object[key] = entry.default;
            }
        }

        // Validate the charset.
        if (entry.charset && typeof object[key] === "string") {
            if (!entry.charset.test(object[key])) {
                const field = `${this.parent}${value_scheme_key || key}`;
                return this.throw_error(`Attribute "${field}" has an invalid charset, expected: ${entry.charset.toString()}.`, field);
            }
        }

        // Check enum.
        if (entry.enum) {
            if (!entry.enum.includes(object[key])) {
                const field = `${this.parent}${value_scheme_key || key}`;
                const joined = entry.enum.map(item => {
                    if (item == null) {
                        return 'null';
                    } else if (typeof item !== "string" && !(item instanceof String)) {
                        return item.toString();
                    }
                    return `"${item.toString()}"`;
                }).join(", ");
                return this.throw_error(`Attribute "${field}" must be one of the following enumerated values [${joined}].`, field);
            }
        }

        // Execute the verify callback.
        if (typeof entry.verify === "function") {
            const err = entry.verify(object[key], object, key);
            if (err) {
                return this.throw_error(err, `${this.parent}${value_scheme_key || key}`);
            }
        }

        // Execute the post process callback.
        if (typeof entry.postprocess === "function") {
            const res = entry.postprocess(object[key], object, key);
            if (res !== undefined) {
                object[key] = res;
            }
        }
    }

    /** Perform the validation on the data. */
    private validate_data(data: T): Validator.Info<"success" | "error", AutoInferOutput<T, Opts>> {

        // When object is an array.
        if (!this.is_tuple && Array.isArray(data)) {

            // Always use value scheme.
            // Never use scheme for arrays since if a param may be both an array and obj, there must be a distinction possible to verify the scheme of the possible object vs the value scheme of a possible array.
            if (this.value_schema != null) {

                // Iterate array.
                for (let index = 0; index < data.length; index++) {
                    const err = this.validate_entry(this.value_schema, index, data);
                    if (err) { return err; }
                }
            }

            // Invalid.
            else {
                throw new Validator.InvalidUsageError(`Invalid scheme for array, expected value_scheme, got: ${JSON.stringify({ scheme: this.schema, value_scheme: this.value_schema })}`);
            }
        }

        // When object is an object.
        else if (data != null && typeof data === "object" && !Array.isArray(data)) {

            // Verify object's value scheme.
            // So only check the values of the object, not the object itself.
            if (this.value_schema != null) {

                // Iterate the object.
                const keys = Object.keys(data);
                for (let i = 0; i < keys.length; i++) {

                    // Verify the values of the object by scheme.
                    const err = this.validate_entry(this.value_schema, keys[i], data);
                    if (err) { return err; }
                }
            }

            // Verify the object itself.
            else if (this.schema instanceof Entries) {

                // Map aliases.
                const aliases = this.schema.aliases;

                // Iterate all object to check if there are any undefined object passed.
                // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
                if (!this.unknown) {
                    const object_keys = Object.keys(data);
                    for (let x = 0; x < object_keys.length; x++) {
                        if (
                            !this.schema.has(object_keys[x])
                            && !aliases.has(object_keys[x])
                        ) {
                            const field = `${this.parent}${object_keys[x]}`;
                            return this.throw_error(`Attribute "${field}" is not a valid attribute name.`, field);
                        }
                    }
                }

                // Iterate all entries.
                for (const [entry_key, entry] of this.schema.entries()) {
                    if (entry == null) {
                        continue;
                    }

                    // Convert aliases.
                    if (Array.isArray(entry.alias)) {
                        for (let i = 0; i < entry.alias.length; i++) {
                            if (data[entry.alias[i]] !== undefined) {
                                data[entry_key] = data[entry.alias[i]];
                                delete data[entry.alias[i]];
                            }
                        }
                    } else if (typeof entry.alias === "string") {
                        if (data[entry.alias] !== undefined) {
                            data[entry_key] = data[entry.alias];
                            delete data[entry.alias];
                        }
                    }

                    // Parameter is not found in passed object.
                    if (entry_key in data === false) {

                        // Set default.
                        if (entry.default !== undefined) {
                            if (typeof entry.default === "function") {
                                data[entry_key] = entry.default(data);
                            } else {
                                data[entry_key] = entry.default;
                            }
                        }

                        // Required unless specified otherwise.
                        else {
                            if (entry.required === false) {
                                continue;
                            }
                            else if (typeof entry.required === "function") {
                                const required = entry.required(data);
                                if (required) {
                                    const field = `${this.parent}${entry_key}`;
                                    return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
                                }
                            } else {
                                const field = `${this.parent}${entry_key}`;
                                return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
                            }
                        }

                        // Continue.
                        continue;
                    }

                    // Verify value.
                    const err = this.validate_entry(entry, entry_key, data);
                    if (err) { return err; }
                }
            }

            // Invalid.
            else {
                throw new Validator.InvalidUsageError(`Invalid scheme for object, expected scheme or value_scheme, got: ${JSON.stringify({ scheme: this.schema, value_scheme: this.value_schema })}`);
            }
        }

        // Return when no throw err.
        return { data: data as unknown as AutoInferOutput<T, Opts> };
    }

    /**
     * Run the validator. 
     * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
     */
    validate(data: T): Validator.Response<T, this> {

        // Convert the data into an object if we are in tuple mode.
        if (this.is_tuple && Array.isArray(data)) {
            const new_data: Record<string, any> = {};
            for (let i = 0; i < data.length; i++) {
                new_data[`tuple_${i}`] = data[i];
            }
            data = new_data as T;
        }

        // Run.
        const res = this.validate_data(data);

        // Check errors.
        if (res.error) {
            if (this.throw) { throw new Validator.Error(res) }
            return res as Validator.Response<T, this>;
        }

        // Convert the data back into an array.
        if (res.data && this.is_tuple && Array.isArray(res.data)) {
            const new_data: any[] = [];
            const keys = Object.keys(res.data);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].startsWith("tuple_")) {
                    const index = parseInt(keys[i].substring(6), 10);
                    new_data[index] = res.data[keys[i]];
                } else {
                    // If the key is not a tuple key, we can just ignore it.
                    // This is useful for when the object has additional attributes that are not part of the tuple.
                }
            }
            res.data = new_data as AutoInferOutput<T, Opts>;
        }

        // Response.
        if (this.throw) {
            // Return the object as a response if we are in `throw` mode.
            return res.data as Validator.Response<T, this>;
        }
        return res as Validator.Response<T, this>;
    }
}
export namespace Validator {

    /** Base type options. */
    export type T = any[] | Record<string, any>;
    
    /** Constructor options. */
    // export type Opts<
    //     T extends object = object,
    //     O extends object = T,
    //     M extends Mode = T extends any[] ? "array" : "object",
    // > = ConstructorParameters<typeof Validator<T, O, M>>[1]
    export interface Opts<T extends Validator.T = Validator.T> {
        /**
         * Allow unknown attributes
         * When `false`, errors will be thrown when unknown attributes are found.
         * Defaults to `true`.
         */
        unknown?: boolean,
        /** The parent prefix. */
        parent?: string,
        /** The error prefix. */
        error_prefix?: string,
        /** Throw occurred errors, defaults to `false` */
        throw?: boolean,
        /** Scheme for when input data is an object. */
        scheme?: T extends any[] ? never : Entries.Opts | Entries,
        /** Value scheme for when input data is an object or array. */
        value_scheme?: Entry.Opts | Entry,
        /** Tuple scheme for when input data is an array. */
        tuple?: T extends any[] ? Entry.Opts | Entry : never,
    }
        // {
        //     /**
        //      * Allow unknown attributes
        //      * When `false`, errors will be thrown when unknown attributes are found.
        //      * Defaults to `true`.
        //      */
        //     unknown?: boolean,
        //     /** The parent prefix. */
        //     parent?: string,
        //     /** The error prefix. */
        //     error_prefix?: string,
        //     err_prefix?: string | null,
        //     /** Throw occurred errors, defaults to `false` */
        //     throw?: boolean,
        // }
        // // Default `err_prefix` or `error_prefix` alias.
        // & AliasPick<{ err_prefix?: string, error_prefix?: string }>
        // // Variants for scheme/value_scheme for objects and value_scheme/tuple for arrays.
        // & (T extends any[]
        //     ? (
        //         AliasPick<{
        //             value_scheme: Entry | Entry.Opts | undefined,
        //             tuple: Entry | Entry.Opts | undefined,
        //         }>
        //         & { scheme?: never }
        //     )
        //     : (
        //         AliasPick<{
        //             scheme: Scheme.Opts | Scheme,
        //             value_scheme: Entry | Entry.Opts | undefined,
        //         }>
        //         & { tuple?: never }
        //     )
        // );


    /** Info mode response */
    export type Info<
        M extends "error" | "success",
        O extends object
    > =
        M extends "error" ? {
            error: string;
            invalid_fields?: Record<string, string>;
            data?: never;
        } :
        M extends "success" ? {
            error?: never;
            invalid_fields?: never;
            data: O;
        } : never

    /** The response type of `Validator.validate()` */
    export type Response<
        T extends Validator.T,
        V extends Validator = Validator,
    > = 
        V extends { throw: true } // default is `false` so dont use `?`.
        ? AutoInferOutput<T, Opts>
        : Validator.Info<"success" | "error", AutoInferOutput<T, Opts>>


    /** A user facing error class for user-facing errors from `Validate` when `throw: true`. */
    export class Error<O extends object> extends globalThis.Error {
        constructor(public info: Info<"error", O>) {
            super(info.error);
            this.name = "ValidatorError";
            this.message = info.error;
        }
    }

    /** Error thrown when the user incorrectly utilizes the scheme module. */
    export class InvalidUsageError<O extends object> extends globalThis.Error {
        constructor(msg: string) {
            super(msg);
            this.name = "InvalidUsageError";
            this.message = msg;
        }
    }
}

// -------------------------------------------------------

/** Helper types to extract the scheme types from validator opts. */
type SchemeFromOpts<T extends Validator.T, O extends Validator.Opts<T>> =
    O extends { scheme: infer S extends Entries | Entries.Opts }
    ? S : never;
type ValueSchemeFromOpts<T extends Validator.T, O extends Validator.Opts<T>> =
    O extends { value_scheme: infer S extends Entry | Entry.Opts }
    ? S : never;
type TupleFromOpts<T extends Validator.T, O extends Validator.Opts<T>> =
    O extends { tuple: infer S extends Entry | Entry.Opts }
    ? S : never;
type AutoInferOutput<
    T extends Validator.T,
    O extends Validator.Opts<T>,
    S extends SchemeFromOpts<T, O> = SchemeFromOpts<T, O>,
    V extends ValueSchemeFromOpts<T, O> = ValueSchemeFromOpts<T, O>,
    Tpl extends TupleFromOpts<T, O> = TupleFromOpts<T, O>,
> = 
    S extends Entries.Opts ? Entries.Infer<S> :
    V extends ValueEntries.Opts ? ValueEntries.Infer<V> :
    Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> :
    never;


type SchemeFromVal<T extends Validator.T, V extends Validator<T>> =
    V extends { schema: infer S extends Entries | Entries.Opts }
    ? S : never;
type ValueSchemeFromVal<T extends Validator.T, V extends Validator<T>> =
    V extends { value_schema: infer S extends Entry | Entry.Opts }
    ? S : never;
type TupleFromVal<T extends Validator.T, V extends Validator<T>> =
    V extends { tuple_schema: infer S extends Entry | Entry.Opts }
    ? S : never;
type InferOutput<
    T extends Validator.T,
    V extends Validator<T>,
    S extends SchemeFromVal<T, O> = SchemeFromVal<T, O>,
    V extends ValueSchemeFromVal<T, O> = ValueSchemeFromVal<T, O>,
    Tpl extends TupleFromOpts<T, O> = TupleFromOpts<T, O>,
> =
    S extends Entries.Opts ? Entries.Infer<S> :
    V extends ValueEntries.Opts ? ValueEntries.Infer<V> :
    Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> :
    never;

/**
 * Validate an object or array by scheme.
 * 
 * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
 * 
 * @template I The input type of the object or array to validate.
 * @template O The output type of the returned object or array.
 * 
 * @param opts The options for the verification.
 *             See {@link Entry} and {@link VerifyOpts} for more details.
 * 
 * @libris
 */
export function validate<
    /** The input type. */
    T extends Validator.T = Validator.T,
    /** The input options, capture as generic so we can infer from it. */
    const Opts extends Validator.Opts<T> = Validator.Opts<T>,
>(data: T, opts: Opts): Validator.Response<T, Opts> {
    /** @todo also support non array/obj by wrapping inside a container and then validating. */
    return new Validator<T, Opts>(
        opts,
    ).validate(data);
}