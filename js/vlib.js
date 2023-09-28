/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Library.

// Define the lib.
const vlib = {};

// ---------------------------------------------------------
// Files that only edit the default prototypes.

require("global/array.js")
require("global/string.js")

// ---------------------------------------------------------
// Imports.

require("types/path.js")

// ---------------------------------------------------------
// Exports.

module.exports = vlib;