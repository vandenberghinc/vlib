/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Bundle library.

const libpath = require("path");
const libfs = require("fs");
let vhighlight;
if (libfs.existsSync("/Volumes/persistance")) {
    vhighlight = require("/Volumes/persistance/private/dev/vinc/vhighlight/vhighlight.js");
} else {
    vhighlight = require("/Users/administrator/persistance/private/dev/vinc/vhighlight/vhighlight.js");
}
const {JSCompiler} = vhighlight;

// Source file.
const source = __dirname;
const export_path = libpath.join(source, "vlib.js");

// Initialize compiler.
const compiler = new JSCompiler();

// Bundle.
compiler.bundle({
    export_path: export_path,
    includes: [
        // libpath.join(source, "../dev/bundle_test.js"),

        // Includes.
        libpath.join(source, "include/includes.js"),

        // Global.
        libpath.join(source, "include/types/global/string.js"),
        libpath.join(source, "include/types/global/array.js"),
        libpath.join(source, "include/types/global/object.js"),
        libpath.join(source, "include/types/global/utils.js"),

        // System.
        libpath.join(source, "include/types/system/date.js"),
        libpath.join(source, "include/types/system/colors.js"),
        libpath.join(source, "include/types/system/print.js"),
        libpath.join(source, "include/types/system/path.js"),
        libpath.join(source, "include/types/system/process.js"),

        // CLI.
        libpath.join(source, "include/cli/progress_loader.js"),
        libpath.join(source, "include/cli/cli.js"),

        // Sockets.
        libpath.join(source, "include/sockets/request.js"),

        // Exports.
        libpath.join(source, "include/exports.js"),
    ],
    excludes: [],
})

// Log.
// console.log(`Bundled into "${export_path}".`);