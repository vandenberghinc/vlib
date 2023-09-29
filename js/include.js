/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Exports.

/*
module.exports = function(id = null) {

    // ---------------------------------------------------------
    // Files that only edit the default prototypes.

    require("./global/array.js")
    require("./global/string.js")

    // ---------------------------------------------------------
    // Imports.

    // Include wrapper.
    const include = (include_id) => {
        if (id == include_id) { return true; }
        require(`.${include_id}`)
        return false;
    }

    // Includes in chronological order.
    if (include("types/path.js")) { return null; }

}
*/