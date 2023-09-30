/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Functions.

// Print wrapper that does not insert spaces.
vlib.print = function(...args) {
	console.log(args.join(""));
}
vlib.printe = function(...args) {
	console.error(args.join(""));
}

// Print marker.
vlib.print_marker = function(...args) {
    print(vlib.colors.blue, ">>> ", vlib.colors.end, ...args);
}

// Print warning.
vlib.print_warning = function(...args) {
    print(vlib.colors.yellow, ">>> ", vlib.colors.end, ...args);
}

// Print error.
vlib.print_error = function(...args) {
    printe(vlib.colors.red, ">>> ", vlib.colors.end, ...args);
}