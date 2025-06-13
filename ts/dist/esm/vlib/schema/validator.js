/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { value_type } from "./throw.js";
import { NoDefault, ValidatorEntries, ValidatorEntry } from "./validator_entries.js";
import { Cast } from "./cast.js";
import { String as StringUtils } from "../primitives/string.js";
// --------------------------------------------------------------
// Private functions
/** Create an error object. */
function create_error(state, field, message) {
    return {
        error: state.shared.error_prefix + message,
        invalid_fields: {
            [field]: state.shared.error_prefix + message,
        },
    };
}
/** Helper to get the `field_type` from an entry / state. */
function get_field_type(state, entry, capitalize_word = false) {
    return capitalize_word
        ? StringUtils.capitalize_word(entry?.field_type || state.shared.field_type || "attribute")
        : entry?.field_type || state.shared.field_type || "attribute";
}
/**
 * Check type of the parameter function.
 * Scheme key may also be an index for when object is an array.
 */
function check_type(state, object, obj_key, entry, type) {
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
                const res = validate_internal(object[obj_key], entry, {
                    parent: `${state.parent}${obj_key}.`,
                    shared: state.shared,
                });
                if (res.error)
                    return res;
                object[obj_key] = res.data;
            }
            // Check min max items.
            if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
                const field = `${state.parent}${obj_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
            }
            if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
            }
            return true;
        }
        // Object types.
        case "object": {
            if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
                return false;
            }
            if (entry.requires_validation) {
                const res = validate_internal(object[obj_key], entry, {
                    parent: `${state.parent}${obj_key}.`,
                    shared: state.shared,
                });
                if (res.error)
                    return res;
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
                const field = `${state.parent}${obj_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
            }
            if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
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
                const field = `${state.parent}${obj_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an value [${object[obj_key].length}], the minimum is [${entry.min}].`);
            }
            if (typeof entry.max === "number" && object[obj_key] > entry.max) {
                const field = `${state.parent}${obj_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`);
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
/** Validate a value ban entry. */
function validate_entry(state, entry, key, object) {
    // Cast entry.
    if (entry.cast != null && typeof object[key] === "string") {
        if (entry.cast.type === "boolean") {
            const v = Cast.boolean(object[key], entry.cast.opts);
            if (v !== undefined) {
                object[key] = v;
            }
        }
        else if (entry.cast.type === "number") {
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
    if (
    // Only when type is defined and not "any".
    entry.type && entry.type !== "any"
        // Pass when the value is `undefined` and the entry is not required.
        // Dont match for `null` here as well, only `undefined`.
        // Since we are going to pass `undefined` when its not required
        // It would be illogical to throw an error when the value is `undefined` and the entry is not required.
        && !(object[key] === undefined && !entry.is_required(object))) {
        // Multiple types supported.
        if (Array.isArray(entry.type)) {
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
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid type '${current_type}', the valid type is ${entry.type_name("")}.`);
            }
            else if (is_empty && entry.is_required(object) && entry.default !== "") {
                const field = `${state.parent}${key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is an empty string.`);
            }
        }
        // Single type supported.
        else {
            const res = check_type(state, object, key, entry, entry.type);
            const f = `${state.parent}${key}`;
            // console.log(f, "result:", res, "type:", entry.type);
            if (typeof res === "object") { // json error.
                return res;
            }
            else if (res === false) {
                const field = `${state.parent}${key}`;
                const current_type = value_type(object[key]);
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid type '${current_type}', the valid type is ${entry.type_name("")}.`);
            }
            else if (res === "empty" && entry.is_required(object) && entry.default !== "") {
                const field = `${state.parent}${key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is an empty string.`);
            }
        }
    }
    // Set default.
    if (object[key] === undefined && entry.default !== NoDefault) {
        if (typeof entry.default === "function") {
            object[key] = entry.default(object);
        }
        else {
            object[key] = entry.default;
        }
    }
    // Validate the charset.
    if (entry.charset && typeof object[key] === "string") {
        if (!entry.charset.test(object[key])) {
            const field = `${state.parent}${key}`;
            return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid charset, expected: ${entry.charset.toString()}.`);
        }
    }
    // Check enum.
    if (entry.enum) {
        if (!entry.enum.includes(object[key])) {
            const field = `${state.parent}${key}`;
            const joined = entry.enum.map(item => {
                if (item == null) {
                    return 'null';
                }
                else if (typeof item !== "string" && !(item instanceof String)) {
                    return item.toString();
                }
                return `'${item.toString()}'`;
            }).join(", ");
            return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' must be one of the following enumerated values [${joined}].`);
        }
    }
    // Execute the verify callback.
    if (typeof entry.verify === "function") {
        const err = entry.verify(object[key], object, key);
        if (err) {
            return create_error(state, `${state.parent}${key}`, err);
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
 * @private
 */
function validate_internal(data, 
/**
 * A minimum entry with the schema info
 * Class `ValidatorEntry` must be castable to this parameter type.
 */
entry, 
/** Validation options for the current entry. */
state) {
    // When object is an array.
    if (Array.isArray(data)) {
        // Tuple scheme.
        if (entry.tuple_schema != null) {
            // Check if the array is a tuple.
            if (data.length !== entry.tuple_schema.length) {
                const field = `${state.parent || "tuple"}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid tuple length [${data.length}], expected [${entry.tuple_schema.length}].`);
            }
            // Iterate array.
            for (let index = 0; index < data.length; index++) {
                const err = validate_entry(state, entry.tuple_schema[index], index, data);
                if (err) {
                    return err;
                }
            }
        }
        // Always use value scheme.
        // Never use scheme for arrays since if a param may be both an array and obj, there must be a distinction possible to verify the scheme of the possible object vs the value scheme of a possible array.
        else if (entry.value_schema != null) {
            // Iterate array.
            for (let index = 0; index < data.length; index++) {
                const err = validate_entry(state, entry.value_schema, index, data);
                if (err) {
                    return err;
                }
            }
        }
        // Invalid.
        else
            throw new InvalidUsageError(`Invalid scheme for array, expected tuple_schema or value_schema, got: ${entry}`);
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
                const err = validate_entry(state, entry.value_schema, keys[i], data);
                if (err) {
                    return err;
                }
            }
        }
        // Verify the object itself.
        else if (entry.schema instanceof ValidatorEntries) {
            // Map aliases.
            const aliases = entry.schema.aliases;
            // Iterate all object to check if there are any undefined object passed.
            // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
            if (!state.shared.unknown) {
                // console.log("Validating unknown attrs")
                // console.log("Aliases:", Array.from(aliases.keys()));
                const object_keys = Object.keys(data);
                for (let x = 0; x < object_keys.length; x++) {
                    // console.log("Validating unknown attr:", object_keys[x]);
                    if (!entry.schema.has(object_keys[x])
                        && !aliases.has(object_keys[x])) {
                        const field = `${state.parent}${object_keys[x]}`;
                        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is not allowed.`);
                    }
                }
            }
            // Iterate all entries.
            for (const [entry_key, schema_entry] of entry.schema.entries()) {
                if (schema_entry == null)
                    continue;
                // Convert aliases.
                if (Array.isArray(schema_entry.alias)) {
                    for (let i = 0; i < schema_entry.alias.length; i++) {
                        if (data[schema_entry.alias[i]] !== undefined) {
                            data[entry_key] = data[schema_entry.alias[i]];
                            delete data[schema_entry.alias[i]];
                        }
                    }
                }
                else if (typeof schema_entry.alias === "string") {
                    if (data[schema_entry.alias] !== undefined) {
                        data[entry_key] = data[schema_entry.alias];
                        delete data[schema_entry.alias];
                    }
                }
                // Parameter is not found in passed object.
                if (entry_key in data === false) {
                    // Set default.
                    if (schema_entry.default !== NoDefault) {
                        if (typeof schema_entry.default === "function") {
                            data[entry_key] = schema_entry.default(data);
                        }
                        else {
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
                                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' should be a defined value${schema_entry.type_name(" of type ")}.`);
                            }
                        }
                        else {
                            const field = `${state.parent}${entry_key}`;
                            return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' should be a defined value${schema_entry.type_name(" of type ")}.`);
                        }
                    }
                    // Continue.
                    continue;
                }
                // Verify value.
                const err = validate_entry(state, schema_entry, entry_key, data);
                if (err) {
                    return err;
                }
            }
        }
        // Invalid.
        else
            throw new InvalidUsageError(`Invalid scheme for object, expected scheme or value_scheme, got: ${entry}`);
    }
    // Return when no throw err.
    return { data };
}
// export function validate<
//     const T extends ObjOrArr,
//     Throw extends false = false,
//     const E extends Entries.Opts = Entries.Opts,
//     const V extends Entry.Opts = Entry.Opts,
//     Tpl extends Entry.Opts[] = Entry.Opts[],
// >(
//     data: T,
//     schema: 
//         /** A type with `schema`, `value_schema` like fields to provide a validation schema. */
//         | ValidateSchemaOpts<T, E, V, Tpl>
//         // /** Use the `schema` `value_schema` and `tuple` etc from an already initialized validator entry. */
//         | ValidatorEntry
//         // /** Use an initialized validator entries instance as the `schema`, only when `T` is an `object` */
//         | ValidatorEntries,
// ): Throw extends true
//     ? InferOutput<T, E, V, Tpl>
//     : ValidateResponse<"success" | "error", InferOutput<T, E, V, Tpl>>;
// export function validate<
//     const T extends ObjOrArr,
//     Throw extends boolean = false,
//     const E extends Entries.Opts = Entries.Opts,
//     const V extends Entry.Opts = Entry.Opts,
//     Tpl extends Entry.Opts[] = Entry.Opts[],
// >(
//     data: T,
//     state: ValidateState<Throw>,
//     schema: 
//         /** A type with `schema`, `value_schema` like fields to provide a validation schema. */
//         | ValidateSchemaOpts<T, E, V, Tpl>
//         // /** Use the `schema` `value_schema` and `tuple` etc from an already initialized validator entry. */
//         | ValidatorEntry
//         // /** Use an initialized validator entries instance as the `schema`, only when `T` is an `object` */
//         | ValidatorEntries,
// ): Throw extends true
//     ? InferOutput<T, E, V, Tpl>
//     : ValidateResponse<"success" | "error", InferOutput<T, E, V, Tpl>>;
/**
 * Run the validator.
 * @returns The verified object or array, while throwing errors upon verification failure.
 *          Or a response object when `throw` is `false`.
 */
export function validate(...args) {
    // Parse args.
    let data;
    let state;
    let schema;
    if (args.length === 2) {
        // When only two arguments are passed, the first is the data and the second is the state.
        data = args[0];
        const arg1 = args[1];
        schema = arg1;
        state = { throw: false };
        if (arg1 instanceof ValidatorEntry === false
            && arg1 instanceof ValidatorEntries === false) {
            if (arg1.parent !== undefined)
                state.parent = arg1.parent;
            if (arg1.unknown !== undefined)
                state.unknown = arg1.unknown;
            if (arg1.error_prefix !== undefined)
                state.error_prefix = arg1.error_prefix;
            if (arg1.field_type !== undefined)
                state.field_type = arg1.field_type;
            if (arg1.throw !== undefined)
                state.throw = arg1.throw;
        }
    }
    else if (args.length === 3) {
        // When three arguments are passed, the first is the data, the second is the state and the third is the schema.
        data = args[0];
        state = args[1];
        schema = args[2];
    }
    // @ts-expect-error
    else
        throw new InvalidUsageError(`Invalid number of arguments passed to validate(), expected 2 or 3, got ${args.length}.`);
    // Initialize the schema and value schema.
    let entry_opts;
    // Init by validator entries instance.
    if (schema instanceof ValidatorEntry) {
        entry_opts = schema;
    }
    // Init by validator entries instance (schema).
    else if (schema instanceof ValidatorEntries) {
        if (Array.isArray(data)) {
            throw new InvalidUsageError(`Cannot use a ValidatorEntries instance as schema for an array, use a tuple or value_schema instead.`);
        }
        entry_opts = { schema: schema };
    }
    // Init by schema.
    else if (schema.schema) {
        entry_opts = {
            schema: schema.schema instanceof ValidatorEntries
                ? schema.schema
                : new ValidatorEntries(schema.schema),
        };
    }
    // Init by value schema.
    else if (schema.value_schema) {
        entry_opts = {
            value_schema: schema.value_schema instanceof ValidatorEntry
                ? schema.value_schema
                : new ValidatorEntry(schema.value_schema) // cast to mutable.
        };
    }
    // Initialize schema from a tuple scheme.
    // Create a schema object and transform the source object into an object with `argument_0`, `argument_1`, etc. keys.
    else if (Array.isArray(data) && Array.isArray(schema.tuple)) {
        entry_opts = {
            tuple_schema: schema.tuple.map(v => new ValidatorEntry(v)) // cast to mutable.
        };
    }
    // Invalid usage.
    else
        throw new InvalidUsageError(`No scheme or value_scheme or tuple provided, at least one of these must be provided.`);
    // Run.
    const res = validate_internal(data, entry_opts, {
        parent: typeof state.parent === "string" && state.parent.length > 0 && /[a-zA-Z0-9]+/g.test(state.parent.last())
            ? state.parent + "."
            : state.parent || "",
        shared: {
            unknown: state.unknown ?? true,
            error_prefix: state.error_prefix ?? "",
            field_type: entry_opts.field_type,
        }
    });
    // Check errors.
    if (res.error) {
        if (state.throw) {
            throw new ValidateError(res);
        }
        return res;
    }
    // Response.
    if (state.throw) {
        // Return the object as a response if we are in `throw` mode.
        return res.data;
    }
    return res;
}
// --------------------------------------------------------------
// Errors.
/** A user facing error class for user-facing errors from `validate` when `throw` is `true`. */
export class ValidateError extends globalThis.Error {
    info;
    constructor(info) {
        super(info.error);
        this.info = info;
        this.name = "ValidateError";
        this.message = info.error;
    }
}
/** Error thrown when the user incorrectly utilizes the schema module. */
export class InvalidUsageError extends globalThis.Error {
    constructor(msg) {
        super(msg);
        this.name = "InvalidUsageError";
        this.message = msg;
    }
}
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
//# sourceMappingURL=validator.js.map