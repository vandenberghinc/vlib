/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note Web - This file should also be accessable from the frontend / in a web environment.
 *
 * @todo create an InferType type utility that infers teh object type for an object scheme, similar to how CLI does it.
 */
// -------------------------------------------------------
// Utility functions.
/**
 * Get a value type for error reporting
 * @libris
 */
export function value_type(value) {
    if (value == null) {
        return "null";
    }
    else if (typeof value === "object" && Array.isArray(value)) {
        return "array";
    }
    else {
        return typeof value;
    }
}
/**
* Create a type string from an array
* Wrapper func for `throw_undefined` and `throw_invalid_type` etc.
*/
function throw_type_helper(type = [], prefix = "") {
    if (typeof type === "string") {
        return `${prefix}"${type}"`;
    }
    if (Array.isArray(type) && type.length > 0) {
        let str = prefix;
        for (let i = 0; i < type.length; i++) {
            if (typeof type[i] === "function") {
                try {
                    str += `"${type[i].name}"`;
                }
                catch (e) {
                    str += `"${type[i]}"`;
                }
            }
            else {
                str += `"${type[i]}"`;
            }
            if (i === type.length - 2) {
                str += " or ";
            }
            else if (i < type.length - 2) {
                str += ", ";
            }
        }
        return str;
    }
    return "";
}
export function throw_undefined() {
    // Support keyword assignment params.
    let opts;
    if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
        opts = arguments[0];
    }
    else {
        // dont check types here since errors here are weird.
        opts = {
            name: arguments[0],
            type: arguments[1],
            throw: arguments[2] !== false,
        };
    }
    const err = `Argument "${opts.name}" should be a defined value${throw_type_helper(opts.type, " of type ")}.`;
    if (opts.throw !== false) {
        throw new Error(err);
    }
    return err;
}
export function throw_invalid_type() {
    let opts;
    if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
        opts = arguments[0];
    }
    else {
        // dont check types here since errors here are weird.
        opts = {
            name: arguments[0],
            value: arguments[1],
            type: arguments[2],
            throw: arguments[3] !== false,
        };
    }
    const err = `Invalid type "${value_type(opts.value)}" for argument "${opts.name}"${throw_type_helper(opts.type, ", the valid type is ")}.`;
    if (opts.throw) {
        throw new Error(err);
    }
    return err;
}
//# sourceMappingURL=throw.js.map