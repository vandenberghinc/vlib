/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { value_type } from "./throw.js";
import { Entry } from "./entry.js";
import { Scheme } from "./scheme.js";
/**
 * Wrapper class to validate an object.
 * @note Always updates the object in place.
 * @note The Validate object is re-usable to validate different objects.
 * @note The Validate object should be thread safe but not tested so perhaps dont.
 */
class Validate {
    /** The data object to validate. */
    data;
    /** The scheme to validate. */
    scheme;
    /** The value scheme for object values or array items. */
    value_scheme;
    /** The tuple scheme for when the object is an array. */
    tuple;
    /** Throw an error or return a response with a potential error attr. */
    throw;
    /**
     * Strict mode, enabled the following features.
     * 1) Errors will be thrown for unknown attributes.
     */
    strict;
    /** The parent prefix. */
    parent;
    /** The error prefix. */
    error_prefix;
    /** Constructor. */
    constructor(opts) {
        this.data = (opts.data ?? opts.object);
        if (opts.scheme)
            this.scheme = opts.scheme instanceof Scheme ? opts.scheme : new Scheme(opts.scheme);
        if (opts.value_scheme)
            this.value_scheme = new Entry(opts.value_scheme);
        if (opts.tuple)
            this.tuple = new Entry(opts.tuple);
        this.throw = (opts.throw ?? true);
        this.strict = opts.strict ?? false;
        this.parent = opts.parent ?? "";
        this.error_prefix = opts.error_prefix ?? opts.err_prefix ?? "";
        // Check throw.
        // if (this.throw && R === "info") {
        //     throw new Error("Response mode is 'info' but 'throw' is set to true, this is not allowed.");
        // }
        // Add dot to parent.
        if (typeof this.parent === "string" && this.parent.length > 0 && /[a-zA-Z0-9]+/g.test(this.parent.charAt(this.parent.length - 1))) {
            this.parent += ".";
        }
        // Check tuple scheme.
        // If so create a scheme object and transform the source object into an object with `argument_0`, `argument_1`, etc. keys.
        if (Array.isArray(this.data) && Array.isArray(this.tuple)) {
            const scheme = {};
            // const out_obj: any = {};
            for (let i = 0; i < this.tuple.length; i++) {
                // out_obj[`argument_${i}`] = this.data[i];
                if (typeof this.tuple[i] === "object") {
                    scheme[`tuple_${i}`] = this.tuple[i];
                }
                else {
                    scheme[`tuple_${i}`] = { type: this.tuple[i] };
                }
            }
            this.scheme = new Scheme(scheme);
        }
    }
    /** Throw an error or return error object. */
    throw_error(e, field) {
        const invalid_fields = {};
        invalid_fields[field] = e;
        if (this.throw) {
            throw new InternalError({ error: this.error_prefix + e, invalid_fields, object: undefined });
        }
        return { error: this.error_prefix + e, invalid_fields, object: undefined };
    }
    /**
     * Check type of the parameter function.
     * Scheme key may also be an index for when object is an array.
     */
    check_type(object, obj_key, scheme_item, type) {
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
                if (scheme_item.scheme || scheme_item.value_scheme) {
                    try {
                        object[obj_key] = validate({
                            object: object[obj_key],
                            scheme: scheme_item.scheme,
                            value_scheme: scheme_item.value_scheme,
                            tuple: scheme_item.tuple,
                            strict: this.strict,
                            parent: `${parent}${obj_key}.`,
                            error_prefix: this.error_prefix,
                            throw: true,
                        });
                    }
                    catch (e) {
                        if (!this.throw && e instanceof InternalError && e.data) {
                            return e.data;
                        }
                        else {
                            throw e;
                        }
                    }
                }
                // Check min max items.
                if (typeof scheme_item.min === "number" && object[obj_key].length < scheme_item.min) {
                    const field = `${parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${scheme_item.min}].`, field);
                }
                if (typeof scheme_item.max === "number" && object[obj_key].length > scheme_item.max) {
                    const field = `${parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${scheme_item.max}].`, field);
                }
                return true;
            }
            // Object types.
            case "object": {
                if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
                    return false;
                }
                if (scheme_item.scheme || scheme_item.value_scheme) {
                    try {
                        object[obj_key] = new Validate({
                            object: object[obj_key],
                            scheme: scheme_item.scheme,
                            value_scheme: scheme_item.value_scheme,
                            tuple: scheme_item.tuple,
                            strict: this.strict,
                            parent: `${parent}${obj_key}.`,
                            error_prefix: this.error_prefix,
                            throw: true,
                        }).run();
                    }
                    catch (e) {
                        if (!this.throw && e.json) {
                            return e.json;
                        }
                        else {
                            throw e;
                        }
                    }
                }
                return true;
            }
            // String types.
            case "string": {
                if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
                    return false;
                }
                if (scheme_item.allow_empty !== true && object[obj_key].length === 0) {
                    return "empty";
                }
                if (typeof scheme_item.min === "number" && object[obj_key].length < scheme_item.min) {
                    const field = `${parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${scheme_item.min}].`, field);
                }
                if (typeof scheme_item.max === "number" && object[obj_key].length > scheme_item.max) {
                    const field = `${parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${scheme_item.max}].`, field);
                }
                if (type !== typeof object[obj_key]) {
                    return false;
                }
                if (scheme_item.allow_empty !== true && object[obj_key].length === 0) {
                    return "empty";
                }
                return true;
            }
            // Number type.
            case "number": {
                if (type !== typeof object[obj_key]) {
                    return false;
                }
                if (scheme_item.allow_empty !== true && isNaN(object[obj_key])) {
                    return "empty";
                }
                if (typeof scheme_item.min === "number" && object[obj_key] < scheme_item.min) {
                    const field = `${parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an value [${object[obj_key].length}], the minimum is [${scheme_item.min}].`, field);
                }
                if (typeof scheme_item.max === "number" && object[obj_key] > scheme_item.max) {
                    const field = `${parent}${obj_key}`;
                    return this.throw_error(`Attribute "${field}" has an invalid value [${object[obj_key].length}], the maximum is [${scheme_item.max}].`, field);
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
                throw new Error(`Unsupported type "${type.toString()}".`);
        }
    }
    /** Verify a value ban entry. */
    verify_entry(entry, key, object, value_scheme_key) {
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
                        const field = `${parent}${value_scheme_key || key}`;
                        const current_type = value_type(object[key]);
                        return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
                    }
                    else if (is_empty && is_required && entry.default !== "") {
                        const field = `${parent}${value_scheme_key || key}`;
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
                        const field = `${parent}${value_scheme_key || key}`;
                        const current_type = value_type(object[key]);
                        return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
                    }
                    else if (res === "empty" && is_required && entry.default !== "") {
                        const field = `${parent}${value_scheme_key || key}`;
                        return this.throw_error(`Attribute "${field}" is an empty string.`, field);
                    }
                }
            }
        }
        // Set default.
        if (object[key] === undefined && entry.default !== undefined) {
            if (typeof entry.default === "function") {
                object[key] = entry.default(object);
            }
            else {
                object[key] = entry.default;
            }
        }
        // Check enum.
        if (entry.enum) {
            if (!entry.enum.includes(object[key])) {
                const field = `${parent}${value_scheme_key || key}`;
                const joined = entry.enum.map(item => {
                    if (item == null) {
                        return 'null';
                    }
                    else if (typeof item !== "string" && !(item instanceof String)) {
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
                return this.throw_error(err, `${parent}${value_scheme_key || key}`);
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
     * Run the validation.
     */
    run() {
        // When object is an array.
        if (Array.isArray(this.data)) {
            // Always use value scheme.
            // Never use scheme for arrays since if a param may be both an array and obj, there must be a distinction possible to verify the scheme of the possible object vs the value scheme of a possible array.
            if (this.value_scheme != null) {
                // Iterate array.
                for (let index = 0; index < this.data.length; index++) {
                    const err = this.verify_entry(this.value_scheme, index, this.data);
                    if (err) {
                        return err;
                    }
                }
            }
            // Invalid.
            else {
                throw new Error(`Invalid scheme for array, expected value_scheme or tuple, got: ${JSON.stringify({ scheme: this.scheme, value_scheme: this.value_scheme, tuple: this.tuple })}`);
            }
        }
        // When object is an object.
        else if (typeof this.data === "object" && this.data != null) {
            // Verify object's value scheme.
            // So only check the values of the object, not the object itself.
            if (this.value_scheme != null) {
                // Iterate the object.
                const keys = Object.keys(this.data);
                for (let i = 0; i < keys.length; i++) {
                    // Verify the values of the object by scheme.
                    const err = this.verify_entry(this.value_scheme, keys[i], this.data);
                    if (err) {
                        return err;
                    }
                }
            }
            // Verify the object itself.
            else if (this.scheme instanceof Scheme) {
                // Map aliases.
                const aliases = this.scheme.aliases;
                // Iterate all object to check if there are any undefined object passed.
                // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
                if (this.strict) {
                    const object_keys = Object.keys(this.data);
                    for (let x = 0; x < object_keys.length; x++) {
                        if (!this.scheme.has(object_keys[x])
                            && !aliases.has(object_keys[x])) {
                            const field = `${parent}${object_keys[x]}`;
                            return this.throw_error(`Attribute "${field}" is not a valid attribute name.`, field);
                        }
                    }
                }
                // Iterate all entries.
                for (const [entry_key, entry] of this.scheme.entries()) {
                    if (entry == null) {
                        continue;
                    }
                    // Convert aliases.
                    if (Array.isArray(entry.alias)) {
                        for (let i = 0; i < entry.alias.length; i++) {
                            if (this.data[entry.alias[i]] !== undefined) {
                                this.data[entry_key] = this.data[entry.alias[i]];
                                delete this.data[entry.alias[i]];
                            }
                        }
                    }
                    else if (typeof entry.alias === "string") {
                        if (this.data[entry.alias] !== undefined) {
                            this.data[entry_key] = this.data[entry.alias];
                            delete this.data[entry.alias];
                        }
                    }
                    // Parameter is not found in passed object.
                    if (entry_key in this.data === false) {
                        // Set default.
                        if (entry.default !== undefined) {
                            if (typeof entry.default === "function") {
                                this.data[entry_key] = entry.default(this.data);
                            }
                            else {
                                this.data[entry_key] = entry.default;
                            }
                        }
                        // Required unless specified otherwise.
                        else {
                            if (entry.required === false) {
                                continue;
                            }
                            else if (typeof entry.required === "function") {
                                const required = entry.required(this.data);
                                if (required) {
                                    const field = `${parent}${entry_key}`;
                                    return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
                                }
                            }
                            else {
                                const field = `${parent}${entry_key}`;
                                return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
                            }
                        }
                        // Continue.
                        continue;
                    }
                    // Verify value.
                    const err = this.verify_entry(entry, entry_key, this.data);
                    if (err) {
                        return err;
                    }
                }
            }
            // Invalid.
            else {
                throw new Error(`Invalid scheme for object, expected scheme or value_scheme, got: ${JSON.stringify({ scheme: this.scheme, value_scheme: this.value_scheme, tuple: this.tuple })}`);
            }
        }
        // Return when no throw err.
        if (!this.throw) {
            return { error: undefined, invalid_fields: {}, object: this.data };
        }
        return this.data;
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
export function validate(opts) {
    return new Validate(opts).run();
}
// -------------------------------------------------------
// Error
/** Internal error used for throwing errors with cached json responses. */
class InternalError {
    data;
    constructor(data) {
        this.data = data;
    }
}
//# sourceMappingURL=validate.js.map