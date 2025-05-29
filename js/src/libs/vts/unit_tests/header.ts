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
const tests = new Module({ name: "vts/header" });

// ==================================================================================================

const create_unit_test = (files: string | Record<string, string>) => {
    if (typeof files === "string") {
        files = { "unit_test.ts": files };
    }
    Object.keys(files).walk(k => { files[k] = files[k].dedent(true); });
    const t: Transformer = new Transformer({
        plugins: [
            new Plugins.Header({
                author: "Daan van den Bergh",
                start_year: 2025,
                yes: true,
            }),
        ],
        files,
        async: false,
    });
    return async () => {
        const {error} = await t.run();
        if (error) throw new Error(error.message);
        if (!t.sources.has("unit_test.ts")) {
            throw new Error("No unit_test.js source found, available files: " + Array.from(t.sources.keys()).join(", "));
        }
        return t.sources.get("unit_test.ts")?.data ?? "<no data>";
    }
}

tests.add("insert:1", "success", create_unit_test(`
    console.log(__version);
`));

tests.add("upsert:2", "success", create_unit_test(`
    /**
     * Before 
     * @author DaanX van den Bergh
     * @copyright © 2024 X 2025 Daan van den Bergh. All rights reserved.
     * 
     * Some content here
     */
    console.log(__version);
`));

tests.add("upsert:3", "success", create_unit_test(`
    /**
     * @author DaanX van den Bergh
     * @copyright same line termination */
    console.log(__version);
`));