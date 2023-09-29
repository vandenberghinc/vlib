/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

 // ---------------------------------------------------------
// Imports.

const {colors} = require("../system/colors.js");

// ---------------------------------------------------------
// Functions.

// Print wrapper that does not insert spaces.
function print(...args) {
	console.log(args.join(""));
}
function printe(...args) {
	console.error(args.join(""));
}

// Print marker.
function print_marker(...args) {
    print(colors.blue, ">>> ", vlib.colors.end, ...args);
}

// Print warning.
function print_warning(...args) {
    print(colors.yellow, ">>> ", vlib.colors.end, ...args);
}

// Print error.
function print_error(...args) {
    printe(colors.red, ">>> ", vlib.colors.end, ...args);
}

// ---------------------------------------------------------
// Exports.

module.exports = {
	print,
	printe,
	print_marker,
	print_warning,
	print_error
}