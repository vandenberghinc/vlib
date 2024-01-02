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
}