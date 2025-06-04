/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
"use strict";
// Imports.
import { Module } from "../../vtest/index.js";
import { Transformer } from "../transformer/transformer.js";
import { Plugins } from "../plugins/plugins.js";
// Unit tests module.
const tests = new Module({ name: "vts/fill-templates" });
// ==================================================================================================
const create_unit_test = (files) => {
    if (typeof files === "string") {
        files = { "unit_test.js": files };
    }
    Object.keys(files).walk(k => { files[k] = files[k].dedent(true); });
    const t = new Transformer({
        plugins: [
            new Plugins.FillTemplates({
                templates: {
                    "MyTemplate": "'Hello World from MyTemplate!'",
                },
                prefix: "{{",
                suffix: "}}",
                quote: false,
            }),
        ],
        files,
        async: false,
    });
    return async () => {
        const { error } = await t.run();
        if (error)
            throw new Error(error.message);
        return t.sources.get("unit_test.js")?.data ?? "<no data>";
    };
};
tests.add("insert:1", "success", create_unit_test(`
    console.log({{MyTemplate}});
`));
//# sourceMappingURL=fill_templates.js.map