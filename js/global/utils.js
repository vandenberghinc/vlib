/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Utils.

const utils = {};

// Edit object keys.
utils.edit_obj_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
    remove.iterate((key) => {
        delete obj[key];
    })
    rename.iterate((key) => {
        obj[key[1]] = obj[key[0]];
        delete obj[key[0]];
    })
    return obj;
}

// ---------------------------------------------------------
// Exports.

module.exports = utils;