/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Utils.

/*  @docs:
    @title: Utils
    @name: vlib.utils
    @desc: The utilities module.
    @parse: false
*/
vlib.utils = {};

// Edit object keys.
// DEPRECATED BUT STILL USED.
vlib.utils.edit_obj_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
    remove.iterate((key) => {
        delete obj[key];
    })
    rename.iterate((key) => {
        obj[key[1]] = obj[key[0]];
        delete obj[key[0]];
    })
    return obj;
}

// Verify that a variable is an object, if not error will be thrown.
/*
vlib.utils.verify_array = function(name, array) {
    if (Array.isArray(array) === false) {
        throw new Error(`Parameter "${name}" should be a defined value of type "object".`);
    }
}
*/

// Verify that a variable is an object and verify its attrs attributes, if not an error will be thrown.
// Attributes are defined like `{ "myattr": {type: "string", default: null}}`.
/*
vlib.utils.verify_object = function(
    obj,
    name = "obj", 
    attrs = {}
) {
    if (this == null || typeof obj !== "object" || Array.isArray(obj)) {
        throw new Error(`Parameter "${name}" should be a defined value of type "object".`);
    }
    attrs.iterate((item) => {
        const value = obj[item[key]];
        if (value === undefined) {
            if (item.def) {
                obj[item[key]] = item.def;
                return null;
            }
            throw new Error(`Parameter "${name}.${item[key]}" should be a defined value of type "${item.type}".`);
        }
        else if (
            item.type === "array" && Array.isArray(value) === false ||
            item.type !== typeof obj[item[key]] ||
            value == null && item.type === "object"
        ) {
            throw new Error(`Parameter "${name}.${item[key]}" should be a defined value of type "${item.type}".`);
        }
    })
}
*/

// Verify keyword assignment arguments.
// The info may be the following.
// Example info: `{"myarg": {type: "string"}}`.
// Example info with non required arg: `{"myarg": {type: "string", required: false}}`.
// Example info with non required arg and a default value: `{"myarg": {type: "string", default: "Hello World!"}}`.
// Example info with attribute check for arg object: `{"myarg": {type: "string", attribute: {}}}`, the attrs/attributes key is again a nested info object.
/*  @docs:
    @title: Verify params
    @desc: Verify object parameters.
    @param: 
        @name: params
        @desc: The object parameters.
        @type: object
    @param: 
        @name: info
        @desc: 
            The parameters info.
        @type: object
        @attribute:
            @name: [key]
            @desc: The matching parameter key from parameter `params`.
        @attribute:
            @name: property
            @desc: 
                The parameter information. It can either be a string or an object.

                When the property is a string, then it will be assigned as to the parameter's type value.
            @type: string, object
            @attribute:
                @name: type
                @desc: The type(s) of the parameter.
                @type: string, array[string]
            @attribute:
                @name: def
                @desc: The default value of the parameter.
            @attribute:
                @name: attributes
                @desc: The recursive `info` for when the parameter is an object, the `attributes` attribute follows the same rules as the `info` parameter.
                @type: object
    @param: 
        @name: check_unknown
        @desc: Throw an error when unknown params were passed.
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
vlib.utils.verify_params = function({params = {}, info = {}, check_unknown = false, parent = "", error_prefix = "", throw_err = true}) {
    const params_keys = Object.keys(params);
    const info_keys = Object.keys(info);

    // Throw an error and pop the verify_params from the stacktrace.
    const throw_err_h = (e, field) => {
        const invalid_fields = {};
        invalid_fields[field] = e;
        if (throw_err === false) {
            return {error: e, invalid_fields};
        }
        const error = new Error(e);
        let stack = error.stack.split("\n");
        stack = [stack[0], ...stack.slice(3)];
        error.stack = stack.join("\n");
        error.json = {error: e, invalid_fields};
        throw error;
    }

    // Iterate all info params to check if any params are missing.
    for (let x = 0; x < info_keys.length; x++) {
        let info_item;

        // Convert info item into object.
        if (typeof info[info_keys[x]] === "string") {
            info[info_keys[x]] = {type: info[info_keys[x]]}; // for subsequent requests, useful for vweb restapi callback.
            info_item = info[info_keys[x]];
        } else {
            info_item = info[info_keys[x]];
        }

        // Rename "def" to "default".
        if (info_item.def) {
            info_item.default = info_item.def;
            delete info_item.def;
        }

        // Get type error string.
        const type_error_str = (prefix = " of type ") => {
            let type_error_str = "";
            if (Array.isArray(info_item.type)) {
                type_error_str = prefix;
                for (let i = 0; i < info_item.type.length; i++) {
                    type_error_str += `"${info_item.type[i]}"`
                    if (i === info_item.type.length - 2) {
                        type_error_str += " or "
                    } else if (i < info_item.type.length - 2) {
                        type_error_str += ", "
                    }
                }
                type_error_str;
            } else {
                type_error_str = `${prefix}"${info_item.type}"`
            }
            return type_error_str;
        }

        // Not found.
        if (info_keys[x] in params === false) {

            // Set default.
            if (info_item.default !== undefined) {
                params[info_keys[x]] = info_item.default;
            }

            // Required unless specified otherwise.
            else if (info_item.required !== false) {
                return throw_err_h(`${error_prefix}Parameter "${parent}${info_keys[x]}" should be a defined value${type_error_str()}.`, info_keys[x]);
            }
        }

        // Check type.
        else if (info_item.type) {
            const check_type = (type) => {
                switch (type) {
                    case "null":
                        return params[info_keys[x]] == null;
                    case "array":
                        if (Array.isArray(params[info_keys[x]]) === false) {
                            return false;
                        }
                        return true;
                    case "object":
                        if (typeof params[info_keys[x]] !== "object" || params[info_keys[x]] == null) {
                            return false;
                        }
                        if (info_item.attrs !== undefined) {
                            let child_parent = `${parent}${info_keys[x]}.`;
                            try {
                                params[info_keys[x]] = vlib.utils.verify_params({params:params[info_keys[x]], info:info_item.attrs, check_unknown, parent: child_parent, error_prefix, throw_err: true});
                            } catch (e) {
                                if (!throw_err && e.json) {
                                    return e.json;
                                } else {
                                    throw e;
                                }
                            }
                        }
                        if (info_item.attributes !== undefined) {
                            let child_parent = `${parent}${info_keys[x]}.`;
                            try {
                                params[info_keys[x]] = vlib.utils.verify_params({params:params[info_keys[x]], info:info_item.attributes, check_unknown, parent: child_parent, error_prefix, throw_err: true});
                            } catch (e) {
                                if (!throw_err && e.json) {
                                    return e.json;
                                } else {
                                    throw e;
                                }
                            }
                        }
                        return true;
                    default:
                        if (type !== typeof params[info_keys[x]]) {
                            return false;
                        }
                        return true;
                }
            }

            // Skip when value is `null` and default is `null`.
            if (!(info_item.default == null && params[info_keys[x]] == null)) {

                // Multiple types supported.
                if (Array.isArray(info_item.type)) {
                    let correct_type = false;
                    for (let i = 0; i < info_item.type.length; i++) {
                        const res = check_type(info_item.type[i]);
                        if (typeof res === "object") { // json error.
                            return res;
                        }
                        else if (res === true) {
                            correct_type = true;
                            break;
                        }
                    }
                    if (correct_type === false) {
                        const current_type = params[info_keys[x]] == null ? "null" : typeof params[info_keys[x]];
                        return throw_err_h(`${error_prefix}Parameter "${parent}${info_keys[x]}" has an invalid type "${current_type}", the valid type is ${type_error_str("")}.`, info_keys[x]);
                    }
                }

                // Single type supported.
                else {
                    const res = check_type(info_item.type);
                    if (typeof res === "object") { // json error.
                        return res;
                    }
                    else if (res === false) {
                        const current_type = params[info_keys[x]] == null ? "null" : typeof params[info_keys[x]];
                        return throw_err_h(`${error_prefix}Parameter "${parent}${info_keys[x]}" has an invalid type "${current_type}", the valid type is ${type_error_str("")}.`, info_keys[x]);
                    }
                }
            }
        }
    }

    // Iterate all params to check if there are any undefined params passed.
    if (check_unknown) {
        for (let x = 0; x < params_keys.length; x++) {
            if (params_keys[x] in info === false) {
                return throw_err_h(`${error_prefix}Parameter "${parent}${params_keys[x]}" is not a valid parameter.`, info_keys[x]);
            }
        }
    }

    // Return when no throw err.
    if (throw_err === false) {
        return {error: null, invalid_fields: {}, params};
    }
    return params;
}

// Perform a deep copy on any type, except it does not support classes, only primitive objects.
/*  @docs:
    @title: Deep copy
    @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
 */
vlib.utils.deep_copy = (obj) => {
    if (Array.isArray(obj)) {
        const copy = [];
        obj.iterate((item) => {
            copy.append(vlib.utils.deep_copy(item));
        })
        return copy;
    }
    else if (obj !== null && obj instanceof String) {
        return new String(obj.toString());
    }
    else if (obj !== null && typeof obj === "object") {
        const copy = {};
        const keys = Object.keys(obj);
        const values = Object.values(obj);
        for (let i = 0; i < keys.length; i++) {
            copy[keys[i]] = vlib.utils.deep_copy(values[i]);
        }
        return copy;
    }
    else {
        return obj;
    }
}
































