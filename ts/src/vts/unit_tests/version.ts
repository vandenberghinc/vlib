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
const tests = new Module({ name: "vts/version" });

// ==================================================================================================

const create_unit_test = (files: string | Record<string, string>) => {
    if (typeof files === "string") {
        files = { "unit_test.ts": files, "unit_test.js": files };
    }
    Object.keys(files).walk(k => { files[k] = files[k].dedent(true); });
    const t: Transformer = new Transformer({
        plugins: [
            new Plugins.Version({
                version: "1.2.3",
            }),
        ],
        files,
        async: false,
    });
    return async () => {
        const {error} = await t.run();
        if (error) throw new Error(error.message);
        return t.sources.get("unit_test.js")?.data ?? "<no data>";
    }
}

tests.add("insert:1", "success", create_unit_test(`
    console.log(__version);
`));

tests.add("upsert:2", "success", create_unit_test(`
    /** vts-version */ const __version="1.2.3"; /** vts-version END */
    console.log(__version);
`));

tests.add("ignore:1", "success", create_unit_test(`
    console.log("Hi!");
`));


tests.add("past_issue:1", "success", create_unit_test(`
/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Set stacktrace limit.
Error.stackTraceLimit = 25;
/** global/ */
export * from "./primitives/index.uni.js";
/** scheme/ */
export * as Scheme from "./scheme/index.m.uni.js";
export * as scheme from "./scheme/index.m.uni.js";
/** generic/ */
export * from "./generic/index.web.js";
/** debugging/ */
export * as Debugging from "./debugging/index.m.uni.js";
export * as debugging from "./debugging/index.m.uni.js";
export { debug, Debug } from "./debugging/index.m.uni.js";
import { debug } from "./debugging/index.m.uni.js";
export const print = (...args) => debug(0, ...args);
/** search/ */
export * from "./search/index.uni.js";
/** code/ */
export * as Code from "./code/index.m.uni.js";
export * as code from "./code/index.m.uni.js";
/** clipboard/ */
export * from "./clipboard/index.web.js";
/**
 * Version number
 * Inserted by vts after compilation
 * @ts-expect-error */
export const version = __version;
//# sourceMappingURL=index.web.js.map
`));