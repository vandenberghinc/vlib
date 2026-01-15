/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * @todo create Compiled function for validating each entry
 */

// Imports.
import { Entries, Entry, TupleEntries, ValueEntries } from "../infer/entry.js";
import { String as StringUtils } from "../../primitives/string.js";
import { NoValue, ValidatorEntries, ValidatorEntry } from "./validator_entries.js";
import { Cast } from "./cast.js";
import { value_type } from "./throw.js";
import { MutableObject} from "../../types/literals.js";
import { suggest_attribute } from "./suggest_attr.js";
import { InvalidUsageError } from "@vlib/errors/errors.js";

/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>

/**
 * Infer the output type from input schemes from `Validate.Opts`.
 * @private
 */
export type InferOutput<
    Data extends ObjOrArr,
    Sch extends Entries.Opts = Entries.Opts,
    Val extends ValueEntries.Opts = ValueEntries.Opts,
    Tpl extends TupleEntries.Opts = TupleEntries.Opts,
> =
    Sch extends Entries.Opts ? Entries.Infer<Sch> :
    Val extends ValueEntries.Opts ? ValueEntries.Infer<Data extends any[] ? "array" : "object", Val> :
    Tpl extends TupleEntries.Opts ? TupleEntries.Infer<Tpl> :
    never;

/**
 * The minimum entry, a base version of `ValidatorEntry`.
 * This min entry is used to cast an object or array.
 * For instance for the root data, but also for objects
 * or arrays that are validated and have a schema.
 * @private
 */
type MinimumEntry = Pick<ValidatorEntry, "field_type" | "schema" | "value_schema" | "tuple_schema" | "unknown">;


// ------------------------------------------------------------

/**
 * Schema options for the `validate()` function.
 * One of the schemas must be defined.
 */
type Schemas<
    Data extends ObjOrArr,
    Sch extends Entries.Opts = Entries.Opts,
    Val extends ValueEntries.Opts = ValueEntries.Opts,
    Tpl extends TupleEntries.Opts = TupleEntries.Opts,
> =
    | (Data extends any[] ? never : {
        /** Schema for when input data is an object. */
        schema: Sch;
        value_schema?: never;
        tuple?: never;
    })
    | {
        schema?: never;
        /** Value schema for when input data is an object or array. */
        value_schema: Val
        tuple?: never;
    }
    | (Data extends any[] ? {
        schema?: never;
        value_schema?: never;
        /** Tuple schema for when input data is an array. */
        tuple: Data extends any[] ? Tpl : never
    } : never)
export namespace Schemas {
    /**
     * A type guard to check if a value is a valid `Schemas` object.
     * Note that this performs a shallow check.
     */
    export const is_fast = (value: any): value is Schemas<any, any, any, any> => {
        return typeof value === "object" && value != null && (
            (value.schema != null && typeof value.schema === "object")
            || (value.value_schema != null && typeof value.value_schema === "object")
            || (value.tuple != null && Array.isArray(value.tuple))
        )
    }
}

// ------------------------------------------------------------
// State.

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
    }
}
namespace State {
    /** 
     * Options for creating a new state object.
     */
    export type Opts<Throw extends boolean = boolean> = {
        /** The parent prefix for field names shown in errors, defaults to "" */
        parent?: string,
        /** The prefix for error messages, defaults to "". */
        error_prefix?: string,
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
    } : never)

    /**
     * Create a new state object.
     */
    export function create<Throw extends boolean = false>(opts?: Opts<Throw>): State<Throw> {
        return {
            parent: (typeof opts?.parent === "string" && opts.parent.length > 0 && /[a-zA-Z0-9]+/g.test(opts.parent.last()!))
                ? opts.parent + "."
                : (opts?.parent ?? ""),
            field_type: opts?.field_type ?? "attribute",
            unknown: opts?.unknown ?? true,
            shared: {
                error_prefix: opts?.error_prefix ?? "",
                throw: (opts?.throw ?? false) as Throw,
            }
        };
    }

    /** Create a new state from a system state and an override options object. */
    export function with_override<Throw extends boolean>(
        state: State,
        override: Partial<State.Opts<Throw>>,
    ): State {
        return {
            parent:
                (typeof override.parent === "string" && override.parent.length > 0 && /[a-zA-Z0-9]+/g.test(override.parent.last()!))
                    ? override.parent + "."
                    : override.parent ?? state.parent,
            field_type: override.field_type ?? state.field_type,
            unknown: override.unknown ?? state.unknown,
            shared: {
                error_prefix: override.error_prefix ?? state.shared.error_prefix,
                throw: override.throw ?? state.shared.throw,
            },
        };
    }
}

// ------------------------------------------------------------
// Utility funcs.

/** Create an error object. */
function create_error(
    /** The state info. */
    state: State,
    /** The field name. */
    field: string,
    /** 
     * The full message including the field name, formatted like `Attribute 'name' is required.`
     * Suitable for REST API responses, logs, etc.
     */
    message: string,
    /**
     * The raw message without field name etc, formatted like `Invalid lenght, must be at least N chars.`
     * For instance suitable for showing in a UI beneath an invalid input field.
     * This will not include the shared error prefix.
     */
    raw: string,
): ValidateResponse<"error"> {
    return {
        error: state.shared.error_prefix + message,
        raw_error: raw,
        invalid_fields: {
            [field]: raw,
        },
    };
}

/** Helper to get the `field_type` from an entry / state. */
function get_field_type(
    state: State,
    entry?: ValidatorEntry | { field_type?: string | NoValue },
    capitalize_word: boolean = false,
): string {
    return capitalize_word
        ? StringUtils.capitalize_word(entry?.field_type === NoValue ? state.field_type : entry?.field_type || state.field_type)
        : (entry?.field_type === NoValue ? state.field_type : entry?.field_type || state.field_type);
}

// ------------------------------------------------------------
// Internal validation funcs.

/**
 * Check type of the parameter function.
 * Scheme key may also be an index for when object is an array. 
 */
function check_type(
    state: State,
    object: object | any[],
    obj_key: string | number,
    entry: ValidatorEntry,
    type: Entry.Type.Castable.Base,
): boolean | "empty" | ValidateResponse<"error"> {

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
            if (entry.requires_validation) {
                const res = validate_object_helper(
                    object[obj_key],
                    entry,
                    {
                        parent: `${state.parent}${obj_key}.`,
                        field_type: entry.field_type === NoValue ? state.field_type : entry.field_type,
                        unknown: entry.unknown === NoValue ? state.unknown : entry.unknown,
                        shared: state.shared,
                    }
                );
                if (res.error) return res;
                object[obj_key] = res.data;
            }
            
            // Check empty.
            if (!entry.allow_empty && object[obj_key].length === 0) {
                return "empty";
            }
            // Check min max items.
            if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`,
                    `Invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`,
                );
            }
            if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`,
                    `Invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`,
                );
            }
            return true;
        }

        // Object types.
        case "object": {
            if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
                return false;
            }
            if (entry.requires_validation) {
                const res = validate_object_helper(
                    object[obj_key],
                    entry,
                    {
                        parent: `${state.parent}${obj_key}.`,
                        field_type: entry.field_type === NoValue ? state.field_type : entry.field_type,
                        unknown: entry.unknown === NoValue ? state.unknown : entry.unknown,
                        shared: state.shared,
                    }
                );
                if (res.error) return res;
                object[obj_key] = res.data;
            }
            const key_length = Object.keys(object[obj_key]).length;
            // Check empty.
            if (!entry.allow_empty && key_length === 0) {
                return "empty";
            }
            // Check min max items.
            if (typeof entry.min === "number" && key_length < entry.min) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`,
                    `Invalid object entries length [${object[obj_key].length}], the minimum length is [${entry.min}].`,
                );
            }
            if (typeof entry.max === "number" && key_length > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`,
                    `Invalid object entries length [${object[obj_key].length}], the maximum length is [${entry.max}].`,
                );
            }
            return true;
        }

        // String types.
        case "string": {
            if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
                return false;
            }
            if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`,
                    `Invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`,
                );
            }
            if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`,
                    `Invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`,
                );
            }
            if (type !== typeof object[obj_key]) {
                return false;
            }
            if (!entry.allow_empty && object[obj_key].length === 0) {
                return "empty";
            }
            return true;
        }

        // Number type.
        case "number": {
            if (type !== typeof object[obj_key]) {
                return false;
            }
            if (!entry.allow_empty && isNaN(object[obj_key])) {
                return "empty";
            }
            if (typeof entry.min === "number" && object[obj_key] < entry.min) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid value [${object[obj_key].length}], the minimum is [${entry.min}].`,
                    `Invalid value [${object[obj_key].length}], the minimum is [${entry.min}].`,
                );
            }
            if (typeof entry.max === "number" && object[obj_key] > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`,
                    `Invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`,
                );
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
            throw new InvalidUsageError(`Unsupported type '${type.toString()}'.`);
    }
}

/**
 * Perform validation on a single entry inside an object or array.
 * @internal
 */
function validate_entry_helper(
    state: State,
    entry: ValidatorEntry,
    key: string | number,
    object: object | any[],
): void | ValidateResponse<"error"> {

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
    // const field = `${parent.parent}${value_scheme_key || key}`;
    // console.log(`Validating entry '${field}' with value:`, object[key], "and entry:", entry);

    // Do a type check.
    // console.log("Validating key:", {key}, "with value:", {value: object[key], required: entry.is_required(object) });
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
        if (entry.is_union_type) {
            let correct_type = false;
            let is_empty = false;
            for (let i = 0; i < entry.type.length; i++) {
                const res = check_type(state, object, key, entry, entry.type[i]);
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
                const field = `${state.parent}${key}`;
                const current_type = value_type(object[key]);
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid type '${current_type}', the valid type is ${entry.type_name("")}.`,
                    `Invalid type '${current_type}', the valid type is ${entry.type_name("")}.`,
                );
            }
            else if (is_empty && entry.is_required(object) && entry.default !== "") {
                const field = `${state.parent}${key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' is empty.`,
                    `Invalid value, may not be empty.`,
                );
            }
        }

        // Single type supported.
        // else if (typeof entry.type === "string" || typeof entry.type === "function") {
        else if (entry.is_single_type) {
            const res = check_type(state, object, key, entry, entry.type);
            const f = `${state.parent}${key}`;
            // console.log(f, "result:", res, "type:", entry.type);
            if (typeof res === "object") { // json error.
                return res;
            }
            else if (res === false) {
                const field = `${state.parent}${key}`;
                const current_type = value_type(object[key]);
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid type '${current_type}', the valid type is ${entry.type_name("")}.`,
                    `Invalid type '${current_type}', the valid type is ${entry.type_name("")}.`,
                );
            }
            else if (res === "empty" && entry.is_required(object) && entry.default !== "") {
                const field = `${state.parent}${key}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' is empty.`,
                    `Invalid value, may not be empty.`,
                );
            }
        }
        else {
            throw new InvalidUsageError(`Invalid type '${entry.type}' for entry '${state.parent}${key}'. Expected a string or function.`);
        }
    }

    // Set default.
    if (object[key] === undefined && entry.default !== NoValue) {
        if (typeof entry.default === "function") {
            object[key] = entry.default(object);
        } else {
            object[key] = entry.default;
        }
    }

    // Validate the charset.
    if (entry.charset && typeof object[key] === "string") {
        if (!entry.charset.test(object[key])) {
            const field = `${state.parent}${key}`;
            return create_error(
                state,
                field,
                `${get_field_type(state, entry, true)} '${field}' has an invalid charset, expected: ${entry.charset.toString()}.`,
                `Invalid charset, expected: ${entry.charset.toString()}.`,
            );
        }
    }

    // Check enum.
    if (entry.enum) {
        if (!entry.enum.includes(object[key])) {
            const field = `${state.parent}${key}`;
            const joined = entry.enum.map(item => {
                if (item == null) {
                    return 'null';
                } else if (typeof item !== "string" && !(item instanceof String)) {
                    return item.toString();
                }
                return `'${item.toString()}'`;
            }).join(", ");
            return create_error(
                state,
                field,
                `${get_field_type(state, entry, true)} '${field}' must be one of the following enumerated values [${joined}].`,
                `Invalid value, must be one of the following enumerated values [${joined}].`,
            );
        }
    }

    // Execute the verify callback.
    if (typeof entry.verify === "function") {
        const err = entry.verify(object[key], object, key);
        if (err) {
            if (typeof err === "object") {
                return create_error(
                    state,
                    `${state.parent}${key}`,
                    err.error,
                    err.raw ?? err.error,
                );
            } else {
                return create_error(
                    state,
                    `${state.parent}${key}`,
                    err,
                    err,
                );
            }
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

/**
 * Perform validation on an array or object.
 * For instance the `root` data object.
 * But also for validating the content of an validated object or array.
 * Note that this function does not infer, the outer function should
 * capture the entry / entries as a const generic and infer it. 
 * @internal
 */
function validate_object_helper<const T extends ObjOrArr>(
    data: T,
    /**
     * A minimum entry with the schema info
     * Class `ValidatorEntry` must be castable to this parameter type.
     */
    entry: MinimumEntry | ValidatorEntry,
    /** Validation options for the current entry. */
    state: State,
): ValidateResponse<any, any> {

    // When object is an array.
    if (Array.isArray(data)) {

        // Tuple scheme.
        if (entry.tuple_schema != null) {
            // Check if the array is a tuple.
            if (data.length !== entry.tuple_schema.length) {
                const field = `${state.parent || "tuple"}`;
                return create_error(
                    state,
                    field,
                    `${get_field_type(state, entry, true)} '${field}' has an invalid tuple length [${data.length}], expected [${entry.tuple_schema.length}].`,
                    `Invalid tuple length [${data.length}], expected [${entry.tuple_schema.length}].`,
                );
            }

            // Iterate array.
            for (let index = 0; index < data.length; index++) {
                const err = validate_entry_helper(state, entry.tuple_schema[index], index, data);
                if (err) { return err; }
            }
        }

        // Always use value scheme.
        // Never use scheme for arrays since if a param may be both an array and obj, there must be a distinction possible to verify the scheme of the possible object vs the value scheme of a possible array.
        else if (entry.value_schema != null) {

            // Iterate array.
            for (let index = 0; index < data.length; index++) {
                const err = validate_entry_helper(state, entry.value_schema, index, data);
                if (err) { return err; }
            }
        }

        // Invalid.
        else throw new InvalidUsageError(`Invalid scheme for array, expected tuple_schema or value_schema, got: ${entry}`);
    }

    // When object is an object.
    else if (data != null && typeof data === "object" && !Array.isArray(data)) {

        // Verify object's value scheme.
        // So only check the values of the object, not the object itself.
        if (entry.value_schema != null) {

            // Iterate the object.
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {

                // Verify the values of the object by scheme.
                const err = validate_entry_helper(state, entry.value_schema, keys[i], data);
                if (err) { return err; }
            }
        }

        // Verify the object itself.
        else if (entry.schema instanceof ValidatorEntries) {

            // Map aliases.
            const aliases = entry.schema.aliases;

            // Iterate all object to check if there are any undefined object passed.
            // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
            // Also check `entry.unknown` since it can be another new value from `state.unknown`.
            if (
                (entry.unknown === NoValue && !state.unknown)
                || (entry.unknown !== NoValue && !entry.unknown)
            ) {
                // console.log("Validating unknown attrs")
                // console.log("Aliases:", Array.from(aliases.keys()));
                const object_keys = Object.keys(data);
                for (let x = 0; x < object_keys.length; x++) {
                    // console.log("Validating unknown attr:", object_keys[x]);
                    if (
                        !entry.schema.has(object_keys[x])
                        && !aliases.has(object_keys[x])
                    ) {
                        // console.log("Known fields:", Array.from(entry.schema.keys()));
                        const field = `${state.parent}${object_keys[x]}`;
                        const suggested_key = suggest_attribute(
                            object_keys[x],
                            Array.from(entry.schema.keys()),
                        );
                        return create_error(state,
                            field,
                            `${get_field_type(state, entry, true)} '${field}' is not allowed` +
                            (suggested_key ? `, did you mean ${get_field_type(state, entry, false)} '${suggested_key}'?` : "."),
                            "Not allowed" + (suggested_key ? `, did you mean '${suggested_key}'?` : ".")
                        );
                    }
                }
            }

            // Iterate all entries.
            for (const [entry_key, schema_entry] of entry.schema.entries()) {
                if (schema_entry == null) continue;

                // Convert aliases.
                if (Array.isArray(schema_entry.alias)) {
                    for (let i = 0; i < schema_entry.alias.length; i++) {
                        if (data[schema_entry.alias[i]] !== undefined) {
                            data[entry_key] = data[schema_entry.alias[i]];
                            delete data[schema_entry.alias[i]];
                        }
                    }
                } else if (typeof schema_entry.alias === "string") {
                    if (data[schema_entry.alias] !== undefined) {
                        data[entry_key] = data[schema_entry.alias];
                        delete data[schema_entry.alias];
                    }
                }

                // Parameter is not found in passed object.
                if (entry_key in data === false) {

                    // Set default.
                    if (schema_entry.default !== NoValue) {
                        if (typeof schema_entry.default === "function") {
                            data[entry_key] = schema_entry.default(data);
                        } else {
                            data[entry_key] = schema_entry.default;
                        }
                    }

                    // Required unless specified otherwise.
                    else {
                        if (schema_entry.required === false) {
                            continue;
                        }
                        else if (typeof schema_entry.required === "function") {
                            const required = schema_entry.required(data);
                            if (required) {
                                const field = `${state.parent}${entry_key}`;
                                return create_error(
                                    state,
                                    field,
                                    `${get_field_type(state, entry, true)} '${field}' should be a defined value${schema_entry.type_name(" of type ")}.`,
                                    `Invalid value, should be a defined value${schema_entry.type_name(" of type ")}.`,
                                );
                            }
                        } else {
                            const field = `${state.parent}${entry_key}`;
                            return create_error(
                                state,
                                field,
                                `${get_field_type(state, entry, true)} '${field}' should be a defined value${schema_entry.type_name(" of type ")}.`,
                                `Invalid value, should be a defined value${schema_entry.type_name(" of type ")}.`,
                            );
                        }
                    }

                    // Continue.
                    continue;
                }

                // Verify value.
                const err = validate_entry_helper(state, schema_entry, entry_key, data);
                if (err) { return err; }
            }
        }

        // Invalid.
        else throw new InvalidUsageError(`Invalid scheme for object, expected scheme or value_scheme, got: ${entry}`);
    }

    // Return when no throw err.
    return { data };
}

// ------------------------------------------------------------
// The validator.

/**
 * The validator class.
 * A pre-constructed entry-like object containing all information
 * required to validate data. This class is used to avoid the overhead 
 * of creating a new `Validator` object each time.
 * @nav Schema
 * @docs
 */
export class Validator<
    Data extends ObjOrArr,
    Throw extends boolean = false,
    const Sch extends Entries.Opts = Entries.Opts,
    const Val extends ValueEntries.Opts = ValueEntries.Opts,
    const Tpl extends TupleEntries.Opts = TupleEntries.Opts,
> {

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
    validated!: MutableObject<InferOutput<Data, Sch, Val, Tpl>>;

    /**
     * The `Schemas` object from the constructor, used to extract the input schemas.
     * Kept public public so users can do `create_json_schema({..., schema: validator.schemas.schema})` to create a JSON schema.
     */
    schemas: Schemas<Data, Sch, Val, Tpl>;

    /** Constructor. */
    constructor(opts: Schemas<Data, Sch, Val, Tpl> & State.Opts<Throw>) {
        this.schemas = opts;
        this.state = State.create<Throw>(opts);
        this.entry = {
            schema: opts.schema ? new ValidatorEntries(opts.schema) : undefined,
            // @todo fix `as unknown as` conversion
            value_schema: opts.value_schema ? new ValidatorEntry(opts.value_schema) as unknown as ValidatorEntry : undefined,
            tuple_schema: opts.tuple ? opts.tuple.map(v => new ValidatorEntry(v)) : undefined,
            field_type: this.state.field_type ?? "attribute",
            unknown: this.state.unknown,
        }
    }

    /**
     * Validate the given data against the entry.
     * @param data The data to validate.
     * @param state Optionally provide a state object to override the current state.
     * @docs
     */
    validate<const T extends ObjOrArr>(
        data: T,
        state?: Partial<State.Opts<Throw>>
    ): ValidateResponse.Thrown<Data, Throw, Sch, Val, Tpl> {
        type Res = ValidateResponse.Thrown<Data, Throw, Sch, Val, Tpl>;
        let res: ValidateResponse<any, any>;
        if (state == null) {
            res = validate_object_helper(
                data,
                this.entry,
                this.state,
            );
        } else {
            res = validate_object_helper(
                data,
                this.entry,
                State.with_override(this.state, state),
            );
        }

        // Check errors.
        if (res.error) {
            if (this.state.shared.throw) { throw new ValidateError(res) }
            return res as Res;
        }

        // Response.
        if (this.state.shared.throw) {
            return res.data as Res;
        }
        return res as Res;
    }
}
export namespace Validator {

    /**
     * The constructor options for the `Validator` class.
     * This is a merged type of `Schemas` and `State.Opts`.
     */
    export type Opts<
        Data extends ObjOrArr = ObjOrArr,
        Throw extends boolean = boolean,
        Sch extends Entries.Opts = Entries.Opts,
        Val extends ValueEntries.Opts = ValueEntries.Opts,
        Tpl extends TupleEntries.Opts = TupleEntries.Opts,
    > = ConstructorParameters<typeof Validator<Data, Throw, Sch, Val, Tpl>>[0];
}


// ------------------------------------------------------------
// Public validation funcs.


/**
 * Perform validation on a single entry inside an object or array.
 * @returns A validation response containing the validated data or an error.
 * @nav Schema
 * @docs
 */
export function validate_entry<Throw extends boolean = false>(
    value: any,
    entry: Entry | ValidatorEntry<any, any>,
    state?: State.Opts<Throw>
): ValidateResponse<any, any> {
    if (!(entry instanceof ValidatorEntry)) {
        entry = new ValidatorEntry(entry);
    }
    const obj = { value };
    const res = validate_entry_helper(
        State.create(state),
        entry,
        "value",
        obj,
    );
    if (res) { return res; } // error.
    return { data: obj.value };
}


/**
 * Perform validation on a single entry inside an object or array.
 * @returns A validation response containing the validated data or an error.
 * @nav Schema
 * @docs
 */
export function validate_object<const T extends ObjOrArr>(
    data: T,
    /**
     * A minimum entry with the schema info
     * Class `ValidatorEntry` must be castable to this parameter type.
     */
    entry: Entry | ValidatorEntry<any, any>,
    /** Validation options for the current entry. */
    state?: State.Opts,
): ValidateResponse<any, any> {
    if (!(entry instanceof ValidatorEntry)) {
        entry = new ValidatorEntry(entry);
    }
    return validate_object_helper(
        data,
        entry,
        State.create(state),
    )
}

/**
 * Perform validation a given array or object.
 * @nav Schema
 * @docs
 */
export function validate<
    Data extends ObjOrArr,
    Throw extends boolean = false,
    const Sch extends Entries.Opts = Entries.Opts,
    const Val extends ValueEntries.Opts = ValueEntries.Opts,
    const Tpl extends TupleEntries.Opts = TupleEntries.Opts,
>(
    data: Data,
    val:
        /**
         * Optimal performance, validate against a pre-constructed `Validator` object.
         * This is the recommended way to validate data, since it avoids the overhead of creating a new `Validator` object each time.
         */
        | Validator<Data, Throw, Sch, Val, Tpl>
        /**
         * Provide validator options through a merged `Schemas` & `State.Opts` object.
         */
        | Validator.Opts<Data, Throw, Sch, Val, Tpl>,
): ValidateResponse.Thrown<Data, Throw, Sch, Val, Tpl> {
    let res: ValidateResponse<any, any>;
    type Res = ValidateResponse.Thrown<Data, Throw, Sch, Val, Tpl>;

    // By root entry.
    if (val instanceof Validator) {
        return val.validate(data) as Res;
    }

    // By schema options, note that State.Opts is fully optional.
    else if (val && typeof val === "object") {
        return new Validator<Data, Throw, Sch, Val, Tpl>(val).validate(data) as Res;
    }

    // @ts-expect-error Invalid entry
    else throw new InvalidUsageError(`Invalid entry type, expected Validator, got: ${val.toString()}`);
}

// ------------------------------------------------------------
// Types.

/**
 * The object response form of validation operations.
 * Note that this is not always the returned type of the `validate()` function,
 * but rather the type of the response object when `throw` is `false`.
 * @nav Schema
 * @docs
 */
export type ValidateResponse<
    Mode extends "error" | "success",
    Output extends object = object
> =
    Mode extends "error" ? {
        error: string;
        raw_error: string;
        invalid_fields: Record<string, string>;
        data?: never;
    }
    : Mode extends "success" ? {
        error?: never;
        raw_error?: never;
        invalid_fields?: never;
        data: Output;
    }
    : never

/** Types for the `Response` type. */
export namespace ValidateResponse {

    /**
     * The thrown-like response type, considering the `Throw` option.
     * When `Throw` is `true`, the response will be a validated data object.
     * When `Throw` is `false`, the response will be a response object with an error or the validated data.
     */
    export type Thrown<
        Data extends ObjOrArr,
        Throw extends boolean = false,
        Sch extends Entries.Opts = Entries.Opts,
        Val extends ValueEntries.Opts = ValueEntries.Opts,
        Tpl extends TupleEntries.Opts = TupleEntries.Opts,
    > =
        Throw extends true
        ? InferOutput<Data, Sch, Val, Tpl>
        : ValidateResponse<"error"> | ValidateResponse<"success", InferOutput<Data, Sch, Val, Tpl>>;
}

// ------------------------------------------------------------
// Errors.

/**
 * A user facing error class for user-facing errors from `validate` when `throw` is `true`.
 * @nav Schema/Errors
 * @docs
 */
export class ValidateError<O extends object> extends globalThis.Error {
    constructor(public info: ValidateResponse<"error", O>) {
        super(info.error);
        this.name = "ValidateError";
        this.message = info.error;
    }
}




// ------------------------------------------------------------
// DEPRECATED.



// /**
//  * A user-facing validation state.
//  * This state can be passed to the `validate()` to provide additional validation settings.
//  */
// export type State<Throw extends boolean = boolean> = {
//     /** The parent prefix for field names shown in errors, defaults to "" */
//     parent?: string,
//     /**
//      * Allow unknown attributes, defaults to `true`.
//      * When `false`, errors will be thrown when unknown attributes are found.
//      */
//     unknown?: boolean;
//     /** The prefix for error messages, defaults to "". */
//     error_prefix?: string,
//     /**
//      * The field type, e.g. `attribute`, `query`, `body`, etc, c
//      * defaults to `attribute`.
//      * The `Entry.field_type` precedes over this attribute.
//      * Ensure the chosen word fits in sentences like: `Attribte X is ...`, etc.
//      */
//     field_type?: string;
//     /**
//      * When `true`, the `validate()` function will throw errors on validation failures,
//      * and the validated data will be returned as response.
//      * When `false`, the `validate()` function will return a response object with an error or the output data.
//      * Defaults to `false`.
//      * @todo its tmp not a `?` but required, since we wanna transition to a default of false.
//      */
//     throw: Throw;
// }
// export namespace State {
//     /**
//      * Type guard to check if a value is a valid `State` object.
//      * @warning This will return `true` when an empty object is passed.
//      */
//     export const is = (value: any): value is State => {
//         return typeof value === "object" && value != null
//             && (value.parent == null || typeof value.parent === "string")
//             && (value.unknown == null || typeof value.unknown === "boolean")
//             && (value.error_prefix == null || typeof value.error_prefix === "string")
//             && (value.field_type == null || typeof value.field_type === "string")
//             && (value.throw == null || typeof value.throw === "boolean");
//     }
// }


