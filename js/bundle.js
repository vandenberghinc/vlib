/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

const includes = [

    // Includes.
    `${__dirname}/include/includes.js`,

    // Global.
    `${__dirname}/include/types/global/string.js`,
    `${__dirname}/include/types/global/array.js`,
    `${__dirname}/include/types/global/object.js`,
    `${__dirname}/include/types/global/utils.js`,
    `${__dirname}/include/types/global/json.js`,
    `${__dirname}/include/types/global/scheme.js`,
    `${__dirname}/include/types/global/date.js`,
    `${__dirname}/include/types/global/path.js`,
    `${__dirname}/include/types/global/cache.js`,

    // System.
    `${__dirname}/include/types/system/colors.js`,
    `${__dirname}/include/types/system/print.js`,
    `${__dirname}/include/types/system/process.js`,
    `${__dirname}/include/types/system/network.js`,
    `${__dirname}/include/types/system/time_limiter.js`,
    `${__dirname}/include/types/system/daemon.js`,
    `${__dirname}/include/types/system/system.js`,
    `${__dirname}/include/types/system/logger.js`,
    `${__dirname}/include/types/system/performance.js`,
    `${__dirname}/include/types/system/unit_tests.js`,

    // CLI.
    `${__dirname}/include/cli/progress_loader.js`,
    `${__dirname}/include/cli/cli.js`,

    // Sockets.
    `${__dirname}/include/sockets/request.js`,
    `${__dirname}/include/sockets/websocket.js`,

    // Exports.
    `${__dirname}/include/exports.js`,
]

// ---------------------------------------------------------
/* Old version.
   Keep this since _compile_library also uses vlib.
   Therefore keep it as backup.
*/
if (process.argv.includes("--basic")) {
    const libpath = require("path");
    const libfs = require("fs");

    // Source file.
    const source = __dirname;
    const export_path = libpath.join(source, "vlib.js");

    // Bundle.
    let data = "";
    const paths = includes;
    paths.forEach(path => {
        data += libfs.readFileSync(path).toString();
    })
    data = data.replaceAll("__VERSION__", "'?'");
    libfs.writeFileSync(export_path, data)
}

// ---------------------------------------------------------
// Bundle library.


const vhighlight = require(`${process.env.PERSISTANCE}/private/dev/vinc/vhighlight/vhighlight.js`);
new vhighlight.JSCompiler({
    line_breaks: true,
    double_line_breaks: false,
    comments: false,
    white_space: false,
})
._bundle_library({
    source: __dirname,
    name: "vlib.js",
    author: "Daan van den Bergh",
    start_year: 2023,
    includes,
})
