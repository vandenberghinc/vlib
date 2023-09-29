/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

// Define the lib.
const vlib = require("./vlib.js");

// ---------------------------------------------------------
// Test func.

const test = (label, should_be, result) => {
    if (should_be === null) {
        should_be = "null";
    } else if (should_be === undefined) {
        should_be = "undefined";
    }
    if (result === null) {
        result = "null";
    } else if (result === undefined) {
        result = "undefined";
    }
    if (should_be.toString() != result.toString()) {
        console.log(`${label}: \x1b[31m✖\x1b[0m (${should_be} vs ${result}).`)
        process.exit(1);
    } else {
        console.log(`${label}: \x1b[32m✔\x1b[0m.`)
    }
}

(async () => {

    
    // ---------------------------------------------------------
    // Path.

    let path = new vlib.Path("/tmp/");
    test("Path.exists", true, path.exists());
    test("Path.is_dir", true, path.is_dir());
    path = new vlib.Path("/tmp/dir/myfile.txt");
    test("Path.name", "myfile.txt", path.name());
    test("Path.extension", ".txt", path.extension());
    test("Path.base(1)", "/tmp/dir", path.base(1));
    test("Path.base(2)", "/tmp", path.base(2));
    test("Path.base(3)", null, path.base(3));
    test("Path.abs", "/tmp", new vlib.Path("/tmp/../tmp/").abs());
    test("Path.join", "/tmp/me", new vlib.Path("/tmp/").join("//me/"));
    const base = path.base();
    await base.mkdir();
    test("Path.mkdir", true, base.exists() && base.is_dir());
    await base.trash();
    test("Path.trash", false, base.exists());
    path = new vlib.Path("/tmp/file.txt")
    path.save("Hello World!");
    test("Path.save & Path.load", "Hello World!", await path.load());

})()