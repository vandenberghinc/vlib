/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 *
 * WARNING:
 *  This script is also embedded into vweb.
 *  Therefore, it must be a standalone script not depending on anything from vlib except for Array.iterate.
 *  And beware that `vlib` will be replaced with `vweb`.
 */

/*  @docs:
    @title: Scheme
    @name: vlib.scheme
    @chapter: Scheme
    @desc: The scheme module.
    @parse: false
*/
vlib.scheme = {};

// Get a value type for error dumpings.
vlib.scheme.value_type = function (value) {
    if (value == null) { return "null"; } // for both undefined and null.
    else if (typeof value === "object" && Array.isArray(value)) { return "array"; }
    else { return typeof value; }
}

// Initialize scheme item.
// Param `scheme` and `scheme` key should be assigned when validating non array objects.
vlib.scheme.init_scheme_item = (scheme_item, scheme = undefined, scheme_key = undefined) => {

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
        if (scheme_item.attrs !== undefined) {
            scheme_item.scheme = scheme_item.attrs;
            delete scheme_item.attrs;
        }
        else if (scheme_item.attributes !== undefined) {
            scheme_item.scheme = scheme_item.attributes;
            delete scheme_item.attributes;
        }
        if (scheme_item.enumerate !== undefined) {
            scheme_item.enum = scheme_item.enumerate;
            delete scheme_item.enumerate;
        }
    }

    // Response.
    return scheme_item;
}

// Get type error string.
vlib.scheme.type_error_str = (scheme_item, prefix = " of type ") => {
    let type_error_str = "";
    if (Array.isArray(scheme_item.type)) {
        type_error_str = prefix;
        for (let i = 0; i < scheme_item.type.length; i++) {
            if (typeof scheme_item.type[i] === "function") {
                try {
                    type_error_str += `"${scheme_item.type[i].name}"`
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

// Verify object/array scheme.
/*  @docs:
    @title: Verify scheme
    @desc:
        Verify object parameters.
        
        This function can also be used to verify array items. Pass the array in parameter `object` and pass a `AttributeScheme` object in parameter `scheme`.
    @param: 
        @name: object
        @desc: The object parameters.
        @type: object
    @param: 
        @name: scheme
        @desc: 
            The object or array scheme.
        @type: Scheme
        @attribute:
            @name: [key]
            @desc: The matching parameter key from parameter `object`.
        @attribute:
            @name: property
            @desc: 
                The parameter information. It can either be a string or an object.

                When the property is a string, then it will be assigned as to the parameter's type value.
            @type: string, AttributeScheme
            @attributes_type: AttributeScheme
            @attribute:
                @name: type
                @desc: The type(s) of the parameter.
                @type: string, array[string]
            @attribute:
                @name: def
                @type: any, function
                @desc:
                    The default value of the parameter.
                    A function may also be passed to this attribute to compute the default value. The function takes a single argument `object`, the parent object of the attribute that will be set. The returned value will be assigned to the missing attribute.
            @attribute:
                @name: required
                @desc:
                    A flag to indicate if the parameter is required. However, when attribute `def` is defined, the attribute is never required.
                    The type may also be an callback function which should return a boolean indicating the required flag. The callback takes arguments `(attrs)`, which is the parent attributes object of the attribute being checked.
                @type: boolean, function
                @def: true
            @attribute:
                @name: allow_empty
                @desc: By default empty strings are not allowed when one of the types is `string`, the allow empty flag can be set to `true` to disable this behaviour.
                @type: boolean
                @def: false
            @attribute:
                @name: min_length
                @desc: The minimum value length of arrays or strings.
                @type: number
                @required: false
            @attribute:
                @name: max_length
                @desc: The maximum value length of arrays or strings.
                @type: number
                @required: false
            @attribute:
                @name: alias
                @desc: When two attributes share the same value scheme you can refer to the value scheme of another attribute by assigning the alias attribute with the according attribute name.
                @type: string
                @required: false
            @attribute:
                @name: verify
                @desc:
                    A callback to check the parameter.
                    The callback takes arguments `(attr, attrs)` with the assigned attribute value and the parent attribute object.
                    However, when the `object` is an array the callback takes arguments `(attr, attrs, index)`.
                    The callback will only be executed when the parameter is defined, so not when it is undefined but set by attribute `def`.
                    An error can be caused by returning a string as an error description. This ensures errors are thrown in the same way.
                @type: function
            @attribute:
                @deprecated: true
                @name: callback
                @desc:
                    A callback to check the parameter.
                    The callback takes arguments `(attr, parent_obj, key)` with the assigned attribute value and the parent attribute object.
                    However, when the `object` is an array the callback takes arguments `(attr, parent_arr, index)`.
                    The callback will only be executed when the parameter is defined, so not when it is undefined but set by attribtue `def`.
                    An error can be caused by returning a string as an error description. This ensures errors are thrown in the same way.
                @type: function
            @attribute:
                @name: postprocess
                @desc:
                    A callback to post process the attribute's value. The returned value of the callback will be assigned to the attribute, unless the callback returns `undefined`.
                    The callback takes arguments `(attr, parent_obj, key)` with the assigned attribute value and the parent attribute object.
                    However, when the `object` is an array the callback takes arguments `(attr, parent_arr, index)`.
                @type: function
            @attribute:
                @name: preprocess
                @desc:
                    A callback to pre process the attribute's value before anyting else. The returned value of the callback will be assigned to the attribute, unless the callback returns `undefined`.
                    The callback takes arguments `(attr, parent_obj, key)` with the assigned attribute value and the parent attribute object.
                    However, when the `object` is an array the callback takes arguments `(attr, parent_arr, index)`.
                @type: function
            @attribute:
                @name: scheme
                @desc: The recursive `scheme` for when the parameter is an object, the `scheme` attribute follows the same rules as the main function's `scheme` parameter. However, when the object is an array, the scheme should be for an array item.
                @type: object
            @attribute:
                @name: value_scheme
                @desc: The universal `scheme` for object values, only used in arrays and raw objects.
                @type: object
            @attribute:
                @name: enum
                @desc: Validate that an object/array value is one of the enumerate items.
                @type: string[]
    @param: 
        @name: check_unknown
        @desc: Throw an error when unknown attributes were passed.
        @type: boolean
    @param: 
        @name: parent
        @desc: The error parent prefix.
        @type: string
    @param: 
        @name: error_prefix
        @desc: The error prefix.
        @type: string
    @param: 
        @name: throw_err
        @desc: Throw an error or return a response object.
        @type: boolean
 */
vlib.scheme.verify = function({
    object = {},
    scheme = {},
    value_scheme = null,
    check_unknown = false,
    parent = "",
    error_prefix = "",
    err_prefix = null,
    throw_err = true,
}) {

    // Set error prefix.
    if (err_prefix !== null) {
        error_prefix = err_prefix;
    }

    // Throw an error and pop the verify_object from the stacktrace.
    const throw_err_h = (e, field) => {
        const invalid_fields = {};
        invalid_fields[field] = e;
        if (throw_err === false) {
            return {error: e, invalid_fields, object: null};
        }
        const error = new Error(e);
        // let stack = error.stack.split("\n");
        // stack = [stack[0], ...stack.slice(3)];
        // error.stack = stack.join("\n");
        error.json = {error: e, invalid_fields, object: null};
        throw error;
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
                        object[obj_key] = vlib.scheme.verify({
                            object: object[obj_key],
                            scheme: scheme_item.scheme,
                            value_scheme: scheme_item.value_scheme,
                            check_unknown,
                            parent: `${parent}${obj_key}.`,
                            error_prefix,
                            throw_err: true,
                        });
                    } catch (e) {
                        if (!throw_err && e.json) { return e.json; }
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
                        object[obj_key] = vlib.scheme.verify({
                            object: object[obj_key],
                            scheme: scheme_item.scheme,
                            value_scheme: scheme_item.value_scheme,
                            check_unknown,
                            parent: `${parent}${obj_key}.`,
                            error_prefix,
                            throw_err: true,
                        });
                    } catch (e) {
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
            if (scheme_item.default === null && object[key] == null) {
            }

            // Multiple types supported.
            else if (Array.isArray(scheme_item.type)) {
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
                    const current_type = vlib.scheme.value_type(object[key]);
                    return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${vlib.scheme.type_error_str(scheme_item, "")}.`, field);
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
                    const current_type = vlib.scheme.value_type(object[key]);
                    return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${vlib.scheme.type_error_str(scheme_item, "")}.`, field);
                }
                else if (res === 1 && is_required && scheme_item.default !== "") {
                    const field = `${parent}${value_scheme_key || key}`;
                    return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`, field);
                }
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
        if (typeof scheme_item.callback === "function") {

            // Show deprecated warning with shortened stack trace.
            let stack = new Error("SPLIT-AFTER").stack.split("SPLIT-AFTER\n")[1].split('\n');
            let last = -1;
            for (let i = 0; i < stack.length; i++) {
                if (stack[i].includes('at vlib.scheme.verify ')) {
                    last = i;
                }
            }
            if (last !== -1) {
                stack = stack.slice(last);
            }
            console.warn(`${vlib.colors.end}[vlib.scheme.verify] ${vlib.colors.yellow}Warning${vlib.colors.end}: Attribute "callback" is deprecated and replaced by attribute "verify" and will be removed in future versions.\n${stack.join('\n')}`);

            // Still proceed as normal.
            const err = scheme_item.callback(object[key], object, key);
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


    // When object is an array.
    if (Array.isArray(object)) {

        // @deprecated: No longer use scheme for arrays since if a param may be both an array and obj, there must be a distinction possible to verify the scheme of the possible object vs the value scheme of a possible array.
        //
        // Always use value scheme.
        scheme = value_scheme;
        if (scheme != null) {

            // Use the scheme as a scheme item for the entire array.
            const scheme_item = vlib.scheme.init_scheme_item(scheme); 

            // Iterate array.
            for (let index = 0; index < object.length; index++) {
                const err = verify_value_scheme(scheme_item, index, object);
                if (err) { return err; }
            }
        }
    }

    // When object is an object.
    else {

        // Verify object's value scheme.
        // So only check the values of the object, not the object itself.
        if (value_scheme != null) {

            // Convert scheme item into object.
            const scheme_item = vlib.scheme.init_scheme_item(value_scheme);

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

            // Iterate all object to check if there are any undefined object passed.
            // This must be done before checking known attributes, otherwise it can lead to weird error messages when attributes are only required if other (wrongly-spelled) attributes are missing.
            if (check_unknown) {
                const object_keys = Object.keys(object);
                for (let x = 0; x < object_keys.length; x++) {
                    if (object_keys[x] in scheme === false) {
                        const field = `${parent}${object_keys[x]}`;
                        return throw_err_h(`${error_prefix}Attribute "${field}" is not a valid attribute name.`, field);
                    }
                }
            }

            // Iterate all scheme object to check if any object are missing.
            const scheme_keys = Object.keys(scheme);
            for (let scheme_index = 0; scheme_index < scheme_keys.length; scheme_index++) {
                const scheme_key = scheme_keys[scheme_index];
                let scheme_item = vlib.scheme.init_scheme_item(scheme[scheme_key], scheme, scheme_key);
                if (typeof scheme_item.alias === "string") {
                    scheme_item = vlib.scheme.init_scheme_item(scheme[scheme_item.alias], scheme, scheme_item.alias);
                }

                // Parameter is not found in passed object.
                if (scheme_key in object === false) {

                    // Not required.

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
                                return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${vlib.scheme.type_error_str(scheme_item)}.`, field);
                            }
                        } else {
                            const field = `${parent}${scheme_key}`;
                            return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${vlib.scheme.type_error_str(scheme_item)}.`, field);
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
        return {error: null, invalid_fields: {}, object};
    }
    return object;
}

// Create a type string from an array.
vlib.scheme._type_string = function(type = [], prefix = "") {
    if (typeof type === "string") {
        return `${prefix}"${type}"`;
    }
    if (Array.isArray(type) && type.length > 0) {
        let str = prefix;
        for (let i = 0; i < type.length; i++) {
            if (typeof type[i] === "function") {
                try {
                    str += `"${type[i].name}"`
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

// Throw an error saying an argument is undefined.
// @note supports keyword (obj) assignment parameters using the same names and a single object argument.
vlib.scheme.throw_undefined = function(name, type, throw_err = true) {
    // Support keyword assignment params.
    if (typeof name === "object" && name != null) {
        ({
            name,
            type = [],
            throw_err = true,
        } = name);
    }
    const err = `Argument "${name}" should be a defined value${vlib.scheme._type_string(type, " of type ")}.`
    if (throw_err) {
        throw new Error(err);
    }
    return err;
}

// Throw an error saying an argument is undefined.
// @note supports keyword (obj) assignment parameters using the same names and a single object argument.
vlib.scheme.throw_invalid_type = function(
    name,
    value,
    type = [],
    throw_err = true, // always keep true by default otherwise it will hugely mess up some things.
) {
    // Support keyword assignment params.
    if (typeof name === "object" && name != null) {
        ({
            name,
            value,
            type = [],
            throw_err = true,
        } = name);
    }
    const err = `Invalid type "${vlib.scheme.value_type(value)}" for argument "${name}"${vlib.scheme._type_string(type, ", the valid type is ")}.`
    if (throw_err) {
        throw new Error(err);
    }
    return err;   
}