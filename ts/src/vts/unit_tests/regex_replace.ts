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
const tests = new Module({ name: "vts/regex-replace" });

// ==================================================================================================

const create_unit_test = (files: string | Record<string, string>, replacements: any[]) => {
    if (typeof files === "string") {
        files = { "unit_test.js": files };
    }
    Object.keys(files).walk(k => { files[k] = files[k].dedent(true); });
    const t: Transformer = new Transformer({
        plugins: [
            new Plugins.RegexReplace({ replacements }),
        ],
        files,
        async: false,
    });
    return async () => {
        const { error } = await t.run();
        if (error) throw new Error(error.message);
        return t.sources.get("unit_test.js")?.data ?? "<no data>";
    }
}

// simple string replacement - expect "const str = \"bar bar\";"
tests.add("replace:1", create_unit_test(
    `
    const str = "foo foo";
    `,
    [
        { pattern: /foo/g, replacement: "bar" },
    ]
));

// multiple replacement rules applied in sequence - expect "const str = \"bar qux bar\";"
tests.add("replace:2", create_unit_test(
    `
    const str = "foo baz foo";
    `,
    [
        { pattern: /foo/g, replacement: "bar" },
        { pattern: /baz/g, replacement: "qux" },
    ]
));

// function-based replacement doubling numeric values - expect "const count = 8;"
tests.add("replace:3", create_unit_test(
    `
    const count = 4;
    `,
    [
        {
            pattern: /(\d+)/g,
            replacement: (match) => (parseInt(match[0], 10) * 2).toString(),
        },
    ]
));
