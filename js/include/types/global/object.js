/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Expand object x with object y, does not create a copy and returns nothing.
Object.expand = function(x, y) {
    const keys = Object.keys(y);
    for (let i = 0; i < keys.length; i++) {
        x[keys[i]] = y[keys[i]];
    }
    return x;
}

// Check if an object equals another object.
// Causes UB wit actual classes.
Object.eq = function(x, y) {
    const eq = (x, y) => {
        if (typeof x !== typeof y) { return false; }
        else if (x instanceof String) {
            return x.toString() === y.toString();
        }
        else if (Array.isArray(x)) {
            if (!Array.isArray(y) || x.length !== y.length) { return false; }
            for (let i = 0; i < x.length; i++) {
                if (!eq(x[i], y[i])) {
                    return false;
                }
            }
            return true;
        }
        else if (x != null && typeof x === "object") {
            const x_keys = Object.keys(x);
            const y_keys = Object.keys(y);
            if (x_keys.length !== y_keys.length) {
                return false;
            }
            for (const key of x_keys) {
                if (!y.hasOwnProperty(key) || !eq(x[key], y[key])) {
                    return false;
                }
            }
            return true;
        }
        else {
            return x === y;
        }
    }
    return eq(x, y);
}

// Rename object keys.
Object.rename_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
    remove.iterate((key) => {
        delete obj[key];
    })
    rename.iterate((key) => {
        obj[key[1]] = obj[key[0]];
        delete obj[key[0]];
    })
    return obj;
}

// Perform a deep copy.
Object.deep_copy = (obj) => {
    return vlib.utils.deep_copy(obj);
}

// Delete keys from an object recursively, so also from the nested objects and from the nested objects nested within nested arrays.
Object.delete_recursively = (obj, remove_keys = []) => {
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

