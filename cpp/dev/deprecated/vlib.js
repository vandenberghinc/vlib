/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Files that only edit the default prototypes.

require("./types/global/array.js")
require("./types/global/string.js")

// ---------------------------------------------------------
// Exports.

module.exports = {
    // Types.

    // System.
    ...require("./types/system/path.js"),
    ...require("./types/system/colors.js"),
    ...require("./types/system/print.js"),
    ...require("./types/system/process.js"),

    // CLI.
    ...require("./cli/cli.js"),
};