/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Utils.

vlib.utils = {};

// Edit object keys.
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
vlib.utils.verify_array = function(name, array) {
    if (Array.isArray(array) === false) {
        throw new Error(`Parameter "${name}" should be a defined value of type "object".`);
    }
}

// Verify that a variable is an object and verify its attrs attributes, if not an error will be thrown.
// Attributes are defined like `{ "myattr": {type: "string", default: null}}`.
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

// Verify keyword assignment arguments.
// The info may be the following.
// Example info: `{"myarg": {type: "string"}}`.
// Example info with non required arg: `{"myarg": {type: "string", required: false}}`.
// Example info with non required arg and a default value: `{"myarg": {type: "string", default: "Hello World!"}}`.
// Example info with attribute check for arg object: `{"myarg": {type: "string", attribute: {}}}`, the attrs/attributes key is again a nested info object.
vlib.utils.verify_params = function(args = {}, info = {}, check_unknown = false, parent = "") {
    const args_keys = Object.keys(args);
    const info_keys = Object.keys(info);

    // Throw an error and pop the verify_params from the stacktrace.
    const throw_err = (e) => {
        const error = new Error(e);
        let stack = error.stack.split("\n");
        stack = [stack[0], ...stack.slice(3)];
        error.stack = stack.join("\n");
        throw error;
    }

    // Iterate all info args to check if any args are missing.
    for (let x = 0; x < info_keys.length; x++) {
        let info_item;
        if (typeof info[info_keys[x]] === "string") {
            info[info_keys[x]] = {type: info[info_keys[x]]}; // for subsequent requests, useful for vweb restapi callback.
            info_item = info[info_keys[x]];
        } else {
            info_item = info[info_keys[x]];
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
        if (info_keys[x] in args === false) {

            // Set default.
            if (info_item.default !== undefined) {
                args[info_keys[x]] = info_item.default;
            }

            // Required unless specified otherwise.
            else if (info_item.required !== false) {
                throw_err(`Parameter "${parent}${info_keys[x]}" should be a defined value${type_error_str()}.`);
            }
        }

        // Check type.
        else if (info_item.type) {
            const check_type = (type) => {
                switch (type) {
                    case "null":
                        return args[info_keys[x]] == null;
                    case "array":
                        if (Array.isArray(args[info_keys[x]]) === false) {
                            return false;
                        }
                        return true;
                    case "object":
                        if (typeof args[info_keys[x]] !== "object" || args[info_keys[x]] == null) {
                            return false;
                        }
                        if (info_item.attrs !== undefined) {
                            let child_parent = `${parent}${info_keys[x]}.`;
                            vlib.utils.verify_params(args[info_keys[x]], info_item.attrs, check_unknown, child_parent);
                        }
                        if (info_item.attributes !== undefined) {
                            let child_parent = `${parent}${info_keys[x]}.`;
                            vlib.utils.verify_params(args[info_keys[x]], info_item.attributes, check_unknown, child_parent);
                        }
                        return true;
                    default:
                        if (type !== typeof args[info_keys[x]]) {
                            return false;
                        }
                        return true;
                }
            }
            if (Array.isArray(info_item.type)) {
                let correct_type = false;
                for (let i = 0; i < info_item.type.length; i++) {
                    if (check_type(info_item.type[i])) {
                        correct_type = true;
                        break;
                    }
                }
                if (correct_type === false) {
                    throw_err(`Parameter "${parent}${info_keys[x]}" has an invalid type "${typeof args[info_keys[x]]}", the valid type is ${type_error_str("")}.`);
                }
            } else {
                if (check_type(info_item.type) === false) {
                    throw_err(`Parameter "${parent}${info_keys[x]}" has an invalid type "${typeof args[info_keys[x]]}", the valid type is ${type_error_str("")}.`);    
                }
            }
        }
    }

    // Iterate all args to check if there are any undefined args passed.
    if (check_unknown) {
        for (let x = 0; x < args_keys.length; x++) {
            if (args_keys[x] in info === false) {
                throw_err(`Parameter "${parent}${args_keys[x]}" is not a valid parameter.`);
            }
        }
    }
}

































