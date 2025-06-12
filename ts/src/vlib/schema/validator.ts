/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { value_type } from "./throw.js";
import { Entry } from "./entry.js";
import { NoDefault, ValidatorEntries, ValidatorEntry } from "./validator_entries.js";
import { Entries, ValueEntries, TupleEntries } from "./entry.js";
import { Cast } from "./cast.js";

// -------------------------------------------------------

/**
 * Class to validate an object.
 * 
 * @note Always updates the object in place.
 * @note The Validate object is re-usable to validate different objects.
 * @note The Validate object should be thread safe but not tested so perhaps dont.
 * 
 * @note We require all generics so that `validate()` can still create an opts from the generic and infer the output type correctly.
 */
export class Validator<
    /** The input type. */
    const T extends Validator.T,
    /** Whether to throw errors or not. */
    Throw extends boolean = boolean,
    /** The `schema` input type, required so we can infer correctly in `validate()` */
    E extends Entries.Opts = Entries.Opts,
    /** The value schema input type, required so we can infer correctly in `validate()` */
    V extends Entry.Opts = Entry.Opts,
    /** The tuple schema input type, required so we can infer correctly in `validate()` */
    Tpl extends Entry.Opts[] = Entry.Opts[],
> {

    /** The schema to validate. */
    readonly schema?: ValidatorEntries;

    /** The value schema for object values or array items. */
    readonly value_schema?: ValidatorEntry;

    /** Is an array with tuple mode enabled. */
    readonly is_tuple: boolean = false;

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
    constructor(opts:
        {
            /** Schema for when input data is an object. */
            schema?: T extends any[] ? never : E,
            /** Value schema for when input data is an object or array. */
            value_schema?: V,
            /** Tuple schema for when input data is an array. */
            tuple?: T extends any[] ? Tpl : never,
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
            unknown?: boolean,
            /** The prefix for error messages. */
            error_prefix?: string,
            /** The parent prefix for field names shown in errors. */
            parent?: string,
        }
    ) {

        // Attributes.
        this.unknown = opts.unknown ?? true;
        this.parent = opts.parent ?? "";
        this.error_prefix = opts.error_prefix ?? "";
        this.throw = (opts.throw ?? false) as Throw;

        // Add dot to parent.
        if (typeof this.parent === "string" && this.parent.length > 0 && /[a-zA-Z0-9]+/g.test(this.parent.charAt(this.parent.length - 1))) {
            this.parent += ".";
        }

        // Init by schema.
        if (opts.schema) {
            this.schema = opts.schema instanceof ValidatorEntries ? opts.schema : new ValidatorEntries(opts.schema);
        }
        // Init by value schema.
        else if (opts.value_schema) {
            this.value_schema = opts.value_schema instanceof ValidatorEntry
                ? opts.value_schema
                : new ValidatorEntry(opts.value_schema as ValueEntries.Opts); // cast to mutable.
        }
        // Initialize schema from a tuple scheme.
        // Create a schema object and transform the source object into an object with `argument_0`, `argument_1`, etc. keys.
        else if (Array.isArray(opts.tuple)) {
            this.is_tuple = true;
            const scheme: Entries.Opts = {};
            for (let i = 0; i < opts.tuple.length; i++) {
                if (typeof opts.tuple[i] === "object") {
                    scheme[`tuple_${i}`] = opts.tuple[i];
                } else {
                    scheme[`tuple_${i}`] = { type: opts.tuple[i] };
                }
            }
            this.schema = new ValidatorEntries(scheme);
        }
        // Invalid usage.
        else throw new Validator.InvalidUsageError(`No scheme or value_scheme or tuple provided, at least one of these must be provided.`);
    }

    /** Create an error object. */
    private create_error(field: string, message: string): Validator.InfoResponse<"error"> {
        return {
            error: this.error_prefix + message,
            invalid_fields: {
                [field]: this.error_prefix + message,
            },
        };
    }

    /**
     * Check type of the parameter function.
     * Scheme key may also be an index for when object is an array. 
     */
    private check_type(
        object: object | any[],
        obj_key: string | number,
        entry: ValidatorEntry,
        type: Entry.Type.Castable.Base,
    ): boolean | "empty" | Validator.InfoResponse<"error"> {

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
                    const validator = new Validator<any[], false>({
                        // scheme: scheme_item.scheme,
                        value_schema: entry.value_schema as any,
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
                    return this.create_error(field, `Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
                }
                if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                    const field = `${this.parent}${obj_key}`;
                    return this.create_error(field, `Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
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
                    return this.create_error(field, `Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
                }
                if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                    const field = `${this.parent}${obj_key}`;
                    return this.create_error(field, `Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
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
                    return this.create_error(field, `Attribute "${field}" has an value [${object[obj_key].length}], the minimum is [${entry.min}].`);
                }
                if (typeof entry.max === "number" && object[obj_key] > entry.max) {
                    const field = `${this.parent}${obj_key}`;
                    return this.create_error(field, `Attribute "${field}" has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`);
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
        entry: ValidatorEntry,
        key: string | number,
        object: object | any[],
        value_scheme_key?: string,
    ): void | Validator.InfoResponse<"error"> {

        // Cast entry.
        if (entry.cast != null && typeof object[key] === "string") {
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
        const field = `${this.parent}${value_scheme_key || key}`;
        // console.log(`Validating entry "${field}" with value:`, object[key], "and entry:", entry);

        // Do a type check.
        if (
            // Only when type is defined and not "any".
            entry.type && entry.type !== "any"
            // Pass when the value is `undefined` and the entry is not required.
            // Dont match for `null` here as well, only `undefined`.
            // Since we are going to pass `undefined` when its not required
            // It would be illogical to throw an error when the value is `undefined` and the entry is not required.
            && !(object[key] === undefined && !entry.is_required(object))
        ) {

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
                    return this.create_error(field, `Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`);
                }
                else if (is_empty && entry.is_required(object) && entry.default !== "") {
                    const field = `${this.parent}${value_scheme_key || key}`;
                    return this.create_error(field, `Attribute "${field}" is an empty string.`);
                }
            }

            // Single type supported.
            else {
                const res = this.check_type(object, key, entry, entry.type);
                const f = `${this.parent}${value_scheme_key || key}`;
                // console.log(f, "result:", res, "type:", entry.type);
                if (typeof res === "object") { // json error.
                    return res;
                }
                else if (res === false) {
                    const field = `${this.parent}${value_scheme_key || key}`;
                    const current_type = value_type(object[key]);
                    return this.create_error(field, `Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`);
                }
                else if (res === "empty" && entry.is_required(object) && entry.default !== "") {
                    const field = `${this.parent}${value_scheme_key || key}`;
                    return this.create_error(field, `Attribute "${field}" is an empty string.`);
                }
            }
        }

        // Set default.
        if (object[key] === undefined && entry.default !== NoDefault) {
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
                return this.create_error(field, `Attribute "${field}" has an invalid charset, expected: ${entry.charset.toString()}.`);
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
                return this.create_error(field, `Attribute "${field}" must be one of the following enumerated values [${joined}].`);
            }
        }

        // Execute the verify callback.
        if (typeof entry.verify === "function") {
            const err = entry.verify(object[key], object, key);
            if (err) {
                return this.create_error(`${this.parent}${value_scheme_key || key}`, err);
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
    private validate_data(data: T): Validator.InfoResponse<"success" | "error", InferOutput<T, E, V, Tpl>> {

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
            else if (this.schema instanceof ValidatorEntries) {

                // Map aliases.
                const aliases = this.schema.aliases;

                // Iterate all object to check if there are any undefined object passed.
                // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
                if (!this.unknown) {
                    // console.log("Validating unknown attrs")
                    const object_keys = Object.keys(data);
                    for (let x = 0; x < object_keys.length; x++) {
                        // console.log("Validating unknown attr:", object_keys[x]);
                        if (
                            !this.schema.has(object_keys[x])
                            && !aliases.has(object_keys[x])
                        ) {
                            const field = `${this.parent}${object_keys[x]}`;
                            return this.create_error(field, `Attribute "${field}" is not a valid attribute name.`);
                        }
                    }
                }

                // Iterate all entries.
                for (const [entry_key, entry] of this.schema.entries()) {
                    if (entry == null) {
                        // console.log(`Skipping entry "${entry_key}" because it is null or undefined.`);
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
                        if (entry.default !== NoDefault) {
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
                                    return this.create_error(field, `Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`);
                                }
                            } else {
                                const field = `${this.parent}${entry_key}`;
                                return this.create_error(field, `Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`);
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
        return { data: data as unknown as InferOutput<T, E, V, Tpl> };
    }

    /**
     * Run the validator. 
     * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
     */
    validate(data: T): Validator.Response<T, Throw, E, V, Tpl> {

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
            return res as Validator.Response<T, Throw, E, V, Tpl>;
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
            res.data = new_data as InferOutput<T, E, V, Tpl>;
        }

        // Response.
        if (this.throw) {
            // Return the object as a response if we are in `throw` mode.
            return res.data as Validator.Response<T, Throw, E, V, Tpl>;
        }
        return res as Validator.Response<T, Throw, E, V, Tpl>;
    }
}
export namespace Validator {

    /** Base input type options. */
    export type T = any[] | Record<string, any>;
    
    /**
     * Constructor options.
     * We require all generics so that `validate()` can still create an opts from the generic and infer the output type correctly.
     */
    export type Opts<
        T extends Validator.T = Validator.T,
        Throw extends boolean = boolean,
        E extends Entries.Opts = Entries.Opts,
        V extends Entry.Opts = Entry.Opts,
        Tpl extends Entry.Opts[] = Entry.Opts[],
    > = ConstructorParameters<typeof Validator<T, Throw, E, V, Tpl>>[0]
        
    /**
     * The response type returned by {@link Validator.validate} and the
     * {@link validate} helper function.
     *
     * It should reflect the options supplied at validation time rather than the
     * generic {@link Validator.Opts} interface itself.  The previous
     * implementation used the interface directly which resulted in `never`
     * being inferred for the output type.
     */
    export type Response<
        T extends Validator.T,
        Throw extends boolean = boolean,
        E extends Entries.Opts = Entries.Opts,
        V extends Entry.Opts = Entry.Opts,
        Tpl extends Entry.Opts[] = Entry.Opts[],
    > =
        Throw extends true
        ? InferOutput<T, E, V, Tpl>
        : Validator.InfoResponse<"success" | "error", InferOutput<T, E, V, Tpl>>

    /** Info mode response */
    export type InfoResponse<
        Mode extends "error" | "success",
        Output extends object = object
    > =
        Mode extends "error" ? {
            error: string;
            invalid_fields: Record<string, string>;
            data?: never;
        } :
        Mode extends "success" ? {
            error?: never;
            invalid_fields?: never;
            data: Output;
        } : never

    /** A user facing error class for user-facing errors from `Validate` when `throw: true`. */
    export class Error<O extends object> extends globalThis.Error {
        constructor(public info: InfoResponse<"error", O>) {
            super(info.error);
            this.name = "ValidatorError";
            this.message = info.error;
        }
    }

    /** Error thrown when the user incorrectly utilizes the scheme module. */
    export class InvalidUsageError extends globalThis.Error {
        constructor(msg: string) {
            super(msg);
            this.name = "InvalidUsageError";
            this.message = msg;
        }
    }
}

// -------------------------------------------------------

/** Infer the output type from input schemes from `Validate.Opts`. */
type InferOutput<
    T extends Validator.T,
    Etr extends Entries.Opts = Entries.Opts,
    Val extends Entry.Opts = Entry.Opts,
    Tpl extends Entry.Opts[] = Entry.Opts[],
> =
    Etr extends Entries.Opts ? Entries.Infer<Etr> :
    Val extends ValueEntries.Opts ? ValueEntries.Infer<T extends any[] ? "array" : "object", Val> :
    Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> :
    never;

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
export function validate<
    T extends Validator.T,
    Throw extends boolean = boolean,
    const E extends Entries.Opts = Entries.Opts,
    const V extends Entry.Opts = Entry.Opts,
    const Tpl extends Entry.Opts[] = Entry.Opts[],
>(
    data: T,
    opts: Validator.Opts<T, Throw, E, V, Tpl>
): Validator.Response<T, Throw, E, V, Tpl> {
    return new Validator<T, Throw, E, V, Tpl>(opts).validate(data);
}


// /** Helper types to extract the scheme types from validator opts. */
// type SchemeFromOpts<
//     T extends Validator.T,
//     O extends Validator.Opts<T> | Validator<T>,
// > =
//     O extends { schema: infer S extends Entries | Entries.Opts }
//     ? S : never;
// type ValueSchemeFromOpts<
//     T extends Validator.T,
//     O extends Validator.Opts<T> | Validator<T>,
// > =
//     O extends { value_schema: infer S extends Entry | Entry.Opts }
//     ? S : never;
// type TupleFromOpts<
//     T extends Validator.T,
//     O extends Validator.Opts<T> | Validator<T>,
// > =
//     O extends { tuple: infer S extends Entry | Entry.Opts[] }
//     ? S : never;
// /** Infer the output type from a `Validator` instance or its opts. */
// type InferOutputFromVal<
//     T extends Validator.T,
//     O extends Validator.Opts<T> | Validator<T>,
//     S extends SchemeFromOpts<T, O> = SchemeFromOpts<T, O>,
//     V extends ValueSchemeFromOpts<T, O> = ValueSchemeFromOpts<T, O>,
//     Tpl extends TupleFromOpts<T, O> = TupleFromOpts<T, O>,
// > = 
//     S extends Entries.Opts ? Entries.Infer<S> :
//     V extends ValueEntries.Opts ? ValueEntries.Infer<T extends any[] ? "array" : "object", V> :
//     Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> :
//     never;


// -------------------------------------------------------
// Tests

// const unknown_opts_1 = validate({}, {
//     // @ts-expect-error
//     WRONG_schema: {},
// });
// const unknown_opts_2 = validate({}, {
//     // @ts-expect-error
//     WRONG_schema: {
//     },
//     throw: true, // throw impacted the unknown opts in the past, so check it.
// });
// const x = validate({ }, {
//     schema: {
//         version: { type: "string", required: true, default: "1.0.0" },
//         name: { type: "string", required: true, default: "vtest" },
//         description: { type: "string", required: false, default: "" },
//     },
//     throw: true,
// });
// const _version:string = x.version;

// const y = validate({}, {
//     schema: {
//         version: { type: "number" },
//     },
//     throw: false,
// });
// const _y_version: number = y.data!.version;