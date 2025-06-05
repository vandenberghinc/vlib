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
const tests = new Module({ name: "vts/dirname" });

// ==================================================================================================

const create_unit_test = (files: string | Record<string, string>) => {
    if (typeof files === "string") {
        files = { "unit_test.ts": files, "unit_test.js": files };
    }
    Object.keys(files).walk(k => { files[k] = files[k].dedent(true); });
    const t: Transformer = new Transformer({
        plugins: [
            new Plugins.Dirname({
                tsconfig: "tsconfig.json",
                pkg_json: "package.json",
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
    console.log(__filename);
    console.log(__dirname);    
    console.log(__ts_filename);
    console.log(__ts_dirname);
    console.log(__tsconfig);
    console.log(__tsconfig_dirname);
    console.log(__package_json);
`));

tests.add("upsert:2", "success", create_unit_test(`
    /** vts-dirname */ import {fileURLToPath as __fileURLToPath} from "url";import __path_module from "path";;const __filename="__fileURLToPath(import.meta.url);";const __dirname="__path_module.dirname(__filename);";const __ts_filename="\"dirname.ts\"";const __ts_dirname="undefined";const __tsconfig="tsconfig.json";const __tsconfig_dirname="undefined";const __package_json="package.json"; /** vts-dirname END */
    console.log(__filename);
    console.log(__dirname);    
    console.log(__ts_filename);
    console.log(__ts_dirname);
    console.log(__tsconfig);
    console.log(__tsconfig_dirname);
    console.log(__package_json);
`));

tests.add("ignore:1", "success", create_unit_test(`
    console.log("Hi!");
`));