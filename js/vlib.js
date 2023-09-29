/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Files that only edit the default prototypes.

require("./global/array.js")
require("./global/string.js")

// ---------------------------------------------------------
// Exports.

module.exports = {
    // Types.
    ...require("./types/path.js"),

    // System.
    ...require("./system/colors.js"),
    ...require("./system/print.js"),
    ...require("./system/process.js"),

    // CLI.
    ...require("./cli/cli.js"),
};