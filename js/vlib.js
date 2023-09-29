/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Files that only edit the default prototypes.

require("./global/array.js")
require("./global/string.js")

// ---------------------------------------------------------
// Build library.

const vlib = {};

// Types.
vlib.Path = require("./types/path.js");

// System.
vlib.Proc = require("./system/process.js");

// CLI.
vlib.CLI = require("./cli/cli.js");

// ---------------------------------------------------------
// Exports.

module.exports = vlib;