/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Get the first and last item.
Array.prototype.first = function() {
    return this[0];
}; // Get the first and last item.
Array.prototype.last = function() {
    return this[this.length - 1];
};

// Iteration function for arrays.
Array.prototype.iterate = function(start, end, handler) {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = start; i < end; i++) {    
        const res = handler(this[i]);
        if (res != null && !(res instanceof Promise)) {
            return res;
        }
    }
    return null;
};
Array.prototype.iterate_async = function(start, end, handler) {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    let promises = [];
    for (let i = start; i < end; i++) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            promises.push(res);
        }
    }
    return promises;
};
Array.prototype.iterate_async_await = async function(start, end, handler) {
    if (typeof start === "function") {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = start; i < end; i++) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            const pres = await res;
            if (pres != null) {
                return pres;
            }
        }
    }
    return null;
};

// Iterate an array reversed.
Array.prototype.iterate_reversed = function(start, end, handler) {
    if (handler == null && start != null) {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = end - 1; i >= start; i--) {    
        const res = handler(this[i]);
        if (res != null && !(res instanceof Promise)) {
            return res;
        }
    }
    return null;
};
Array.prototype.iterate_reversed_async = function(start, end, handler) {
    if (handler == null && start != null) {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    let promises = [];
    for (let i = end - 1; i >= start; i--) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            promises.push(res);
        }
    }
    return promises;
};
Array.prototype.iterate_reversed_async_await = async function(start, end, handler) {
    if (handler == null && start != null) {
        handler = start;
        start = null;
    }
    if (start == null) {
        start = 0;
    }
    if (end == null) {
        end = this.length;
    }
    for (let i = end - 1; i >= start; i--) {    
        const res = handler(this[i]);
        if (res != null && res instanceof Promise) {
            const pres = await res;
            if (pres != null) {
                return pres;
            }
        }
    }
    return null;
};

// Drop an item by the item itself.
Array.prototype.drop = function(item) {
    const dropped = new this.constructor(); // for when a class extends Array.
    for (let i = 0; i < this.length; i++) {    
        if (this[i] != item) {
            dropped.push(this[i])
        }
    }
    return dropped;
};

// Drop an item by index.
Array.prototype.drop_index = function(index) {
    const dropped = new this.constructor(); // for when a class extends Array.
    for (let i = 0; i < this.length; i++) {    
        if (i != index) {
            dropped.push(this[i])
        }
    }
    return dropped;
};

// Drop duplicate items from an array.
Array.prototype.drop_duplicates = function() {
    return this.reduce((accumulator, val) => {
        if (!accumulator.includes(val)) {
            accumulator.push(val);
        }
        return accumulator;
    }, []);
}

// Limit from end, always creates a new array.
Array.prototype.limit_from_end = function(limit) {
    let limited = [];
    if (this.length > limit) {
        for (let i = this.length - limit; i < this.length; i++) {
            limited.push(this[i]);
        }
    } else {
        for (let i = 0; i < this.length; i++) {
            limited.push(this[i]);
        }
    }
    return limited;
}

// Remove all items that equal the item from the array.
Array.prototype.remove = function(item) {
    let removed = [];
    this.iterate((i) => {
        if (i != item) {
            removed.push(i);
        }
    })
    return removed;
};

// Check if an array equals another array.
// When the second parameter is not passed `this` will be used as `x` and `x` will be used as `y`.
Array.prototype.eq = function(x = null, y = null) {
    const eq = (x, y) => {

        // Arrays.
        if (Array.isArray(x)) {
            if (
                Array.isArray(y) === false ||
                x.length !== y.length
            ) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (typeof x[i] === "object" || typeof y[i] === "object") {
                    const result = eq(x[i], y[i]);
                    if (result === false) {
                        return false;
                    }
                } else if (x[i] !== y[i]) {
                    return false;
                }
            }
            return true;
        }

        // Objects.
        else if (typeof x === "object") {
            if (
                typeof y !== "object" ||
                Array.isArray(y)
            ) {
                return false;
            }
            const x_keys = Object.keys(x);
            const y_keys = Object.keys(y);
            if (eq(x_keys, y_keys) === false) {
                return false;
            }
            for (let i = 0; i < x_keys.length; i++) {
                if (typeof x[x_keys[i]] === "object" || typeof y[y_keys[i]] === "object") {
                    const result = eq(x[x_keys[i]], y[y_keys[i]]);
                    if (result === false) {
                        return false;
                    }
                } else if (x[x_keys[i]] !== y[y_keys[i]]) {
                    return false;
                }
            }
            return true;
        }

        // Others.
        else if (typeof x !== typeof y) { return false; }
        return x === y;
    }
    if (y == null) {
        y = x;
        x = this;
    }
    return eq(x, y);
}

