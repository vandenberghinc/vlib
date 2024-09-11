/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// The object module.
vlib.object = {};

// Expand object x with object y, does not create a copy and returns nothing.
vlib.object.expand = function(x, y) {
    const keys = Object.keys(y);
    for (let i = 0; i < keys.length; i++) {
        x[keys[i]] = y[keys[i]];
    }
    return x;
}
Object.expand = vlib.object.expand;

// Internal function to check equals.
vlib.internal.obj_eq = function(x, y, detect_keys = false, detect_keys_nested = false) {
    if (typeof x !== typeof y) { return false; }
    else if (x instanceof String) {
        return x.toString() === y.toString();
    }
    else if (Array.isArray(x)) {
        if (!Array.isArray(y) || x.length !== y.length) { return false; }
        for (let i = 0; i < x.length; i++) {
            if (!vlib.internal.obj_eq(x[i], y[i])) {
                return false;
            }
        }
        return true;
    }
    else if (x != null && typeof x === "object") {
        const changes = [];
        const x_keys = Object.keys(x);
        const y_keys = Object.keys(y);
        if (x_keys.length !== y_keys.length) {
            return false;
        }
        for (const key of x_keys) {
            if (!y.hasOwnProperty(key)) {
                const result = vlib.internal.obj_eq(x[key], y[key], detect_keys, detect_keys_nested)
                if (detect_keys) {
                    if (result === true) {
                        changes.append(key)
                    }
                    else if (result !== false && result.length > 0) {
                        changes.append(key)
                        if (detect_keys_nested) {
                            changes.append(...result)
                        }   
                    }
                } else if (!result) {
                    return false
                }
            }
        }
        if (detect_keys) {
            return changes.length === 0 ? null : changes;
        }
        return true;
    }
    else {
        return x === y;
    }
}
Object.obj_eq = vlib.internal.obj_eq;

// Check if an object equals another object.
// Causes UB wit actual classes.
vlib.object.eq = function(x, y) {
    return vlib.internal.obj_eq(x, y);
}
Object.eq = vlib.object.eq;

// Detect changed keys between two objects, optionally include the changed nested object keys.
// Returns `null` when no keys have changed.
// Causes undefined behaviour when one of the x, y parameters is not an object.
vlib.object.detect_changes = function(x, y, include_nested = false) {
    return vlib.internal.obj_eq(x, y, true, include_nested);
}
Object.detect_changes = vlib.object.detect_changes;

// Rename object keys.
vlib.object.rename_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
    remove.iterate((key) => {
        delete obj[key];
    })
    rename.iterate((key) => {
        obj[key[1]] = obj[key[0]];
        delete obj[key[0]];
    })
    return obj;
}
Object.rename_keys = vlib.object.rename_keys;

// Perform a deep copy.
vlib.object.deep_copy = (obj) => {
    return vlib.utils.deep_copy(obj);
}
Object.deep_copy = vlib.object.deep_copy;

// Delete keys from an object recursively, so also from the nested objects and from the nested objects nested within nested arrays.
vlib.object.delete_recursively = (obj, remove_keys = []) => {
    const clean = (obj) => {
        if (Array.isArray(obj)) {
            obj.iterate((item) => {
                if (Array.isArray(item) || (typeof item === "object" && item != null)) {
                    clean(item);
                }
            })
        } else {
            Object.keys(obj).iterate((key) => {
                if (remove_keys.includes(key)) {
                    delete obj[key];
                }
                else if (Array.isArray(obj[key]) || (typeof obj[key] === "object" && obj[key] != null)) {
                    clean(obj[key]);
                }
            })
        }
    }
    clean(obj);
    return obj;
}
Object.delete_recursively = vlib.object.delete_recursively;

// Detect circular.
vlib.object.detect_circular = (obj, attr = '', seen = new Map()) => {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const new_attr = attr ? `${attr}.${key}` : key;
            const value = obj[key];

            // Check if the current value is an object
            if (typeof value === 'object' && value !== null) {
                // Check if the value has been seen before
                if (seen.has(value)) {
                    let preview_value = "";
                    // try {
                    //     preview_value = ": " + JSON.stringify(value, null, 4) + ".";
                    // } catch (e) {}
                    console.log(`Circular reference detected at "${new_attr}", previously detected at "${seen.get(value)}"${preview_value}.`);
                    continue; // Skip further processing to avoid infinite recursion
                }

                // Add the value to the set of seen objects
                seen.set(value, new_attr);

                // Recursively detect circular references in the value
                Object.detect_circular(value, new_attr, seen);
            }
        }
    }
}
Object.detect_circular = vlib.object.detect_circular;

// Pop a key and return the new object.
vlib.object.remove = (obj, key_or_keys = '', copy = false) => {
    if (copy) {
        obj = {...obj};
    }
    if (Array.isArray(key_or_keys)) {
        for (const key of key_or_keys) {
            delete obj[key];    
        }
    } else {
        delete obj[key_or_keys];
    }
    return obj;
}
Object.remove = vlib.object.remove;

// Stringify with support for circular objects.
// Object.stringify = (obj, indent = null, include_circular = true) => {
//     const seen = new WeakMap();
//     function replacer(key, value) {
//         if (typeof value === 'object' && value !== null) {
//             if (seen.has(value)) {
//                 if (include_circular) {
//                     return seen.get(value);
//                 } else {
//                     return "[Circular]";
//                 }
//             }
//             seen.set(value, key);
//         }
//         return value;
//     }
//     return JSON.stringify(obj, replacer, indent);
// }

// The vlib dict class.
/*
vlib.Dict = class Dict {
    constructor(data = {}) {
        this.data = data;

        // Use proxy to support get and set.
        return new Proxy(this, {
            get(target, prop) {
                if (prop in target.data) {
                    return target.data[prop];
                } else if (typeof target[prop] === 'function') {
                    return target[prop].bind(target);
                } else {
                    return undefined;
                }
            },
            set(target, prop, value) {
                target.data[prop] = value;
                return true;
            }
        });
    }

}
*/