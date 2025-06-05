/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
"use strict";

// Imports.
import { Module } from "@vtest";
import { Transformer } from "../transformer/transformer.js";
import { Plugins } from "../plugins/plugins.js";

// Unit tests module.
const tests = new Module({ name: "vts/no-debug" });

// ==================================================================================================

const create_unit_test = (data: string) => {
    const files = { "unit_test.js": data };
    Object.keys(files).walk(k => { files[k] = files[k].dedent(true); });
    const t = new Transformer({
        plugins: [new Plugins.NoDebug()],
        files,
        async: false,
    });
    return async () => {
        const { error } = await t.run();
        if (error) throw new Error(error.message);
        return t.sources.get("unit_test.js")?.data ?? "<no data>";
    };
};

// no_debug_none:1 — no debug calls: expect identical input/output
tests.add("no_debug_none:1", "success", create_unit_test(`
// no debug calls — expect identical input/output
const a = 1;
function foo() {
    return a;
}
`));

// no_debug_simple:2 — single top‐level debug call: expect the debug line commented out
tests.add("no_debug_simple:2", "success", create_unit_test(`
// single debug — the line "debug('test');" should be "//debug('test');"
debug("test");
const x = 1;
`));

// no_debug_nested:3 — nested parentheses in debug call: expect entire call commented
tests.add("no_debug_nested:3", "success", create_unit_test(`
// nested debug — the whole "debug(foo(bar));" should be commented
debug(foo(bar));
`));

// no_debug_multiline:4 — multi‐line debug call with inner debug: expect all lines commented
tests.add("no_debug_multiline:4", "success", create_unit_test(`
// multiline debug — each line from "debug(" to its closing ")" (plus semicolon) should be "//"-commented
debug(
    foo(
        "a",
        debug("inner"),
        baz
    )
);
const y = 2;
`));

