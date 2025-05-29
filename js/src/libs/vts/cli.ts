#!/usr/bin/env node
/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import * as vlib from "../../index.js";
import { cjs } from "./utils/cjs.js";
import { Transformer } from "./transformer/transformer.js";
import { create_plugins, Plugins } from "./plugins/plugins.js";
import { resolve_pkg_json } from "./utils/pkg_json.js";

// CLI.
const cli = new vlib.CLI({
    name: "vts", version: "1.0.0", main: {
        description: "Execute the VTS plugin.",
        examples: {
            "Execute the dirname plugin": "vts --project path/to/tsconfig.json --dirname",
        },
        args: [
            { id: ["--tsconfig", "--project", "-p"], type: "string", required: false, description: "The source path to tsconfig or a directory with a tsconfig.json file. By default the current working directory will be used when omitted." },
            { id: ["--include", "-i"], type: "string[]", required: false, description: "The source files or directories to include in the transformation. Defaults to all files in the tsconfig directory." },
            { id: ["--exclude", "-e"], type: "string[]", required: false, description: "The source files or directories to exclude from the transformation." },
            { id: new vlib.CLI.Query.And("--header", "--author"), type: "string", required: false, description: "The author name to use in the header plugin." },
            { id: new vlib.CLI.Query.And("--header", "--year"), type: "number", required: false, description: "The copyright year to use in the header plugin." },
            { id: ["--dirname", "-d"], type: "boolean", required: false, description: "Enable the dirname plugin." },
            { id: ["--no-debug", "-nd"], type: "boolean", required: false, description: "Disable all vlib debug statements." },
            { id: ["--version", "-v"], type: "string", required: false, description: "Enable the version plugin by providing the path to the 'package.json' file, or any other json file containing attribute 'version: string'." },
            { id: ["--templates", "-t"], type: "string:string", required: false, description: "The templates e.g. '{{KEY}}' to fill in the dist files." },
            { id: ["--exact-templates", "-t"], type: "string:string", required: false, description: "The exact templates '<key>' to fill in the dist files. Use with caution since all exact occurrences of the keys are replaced with their corresponding values." },
            { id: ["--async"], type: "boolean", def: false, description: "Run the transformer in parallel, defaults to 'false'." },
            { id: ["--debug", "--log-level", "-d"], type: "number", def: 0, description: "Set the active log level." },
            { id: ["--yes", "-y"], type: "boolean", required: false, description: "Automatically answer yes to all prompts." },
        ],
        callback: async ({
            tsconfig = process.cwd(),
            header = {},
            include = [],
            exclude = [],
            dirname = false,
            version,
            no_debug = false,
            templates,
            exact_templates,
            yes = false,
            async: parallel = false,
            debug = 0,
        }) => {
            const { error } = await new Transformer({
                tsconfig,
                insert_tsconfig: true,
                check_include: true,
                include,
                exclude,
                interactive: !yes,
                debug,
                plugins: create_plugins({
                    tsconfig,
                    pkg_json: resolve_pkg_json(tsconfig, { throw: false }),
                    header,
                    dirname,
                    yes,
                    version,
                    no_debug,
                    templates,
                    exact_templates,
                }),
            }).run();
            if (error?.type === "warning") {
                vlib.warn(error.message);
            } else if (error) {
                cli.throw(error.message);
            }
            // Old version where tsconfig was an array.
            // if (tsconfig.length === 0) {
            //     tsconfig = [process.cwd()];
            // }
            // await Transformer.run_multiple(
            //     tsconfig.map(ts => ({
            //         type,
            //         tsconfig: ts,
            //         insert_tsconfig: true,
            //         include,
            //         exclude,
            //         templates,
            //         plugins: create_plugins({
            //             tsconfig: ts,
            //             pkg_json: resolve_pkg_json(ts, { throw: false }),
            //             header,
            //             dirname,
            //             yes,
            //             version,
            //             no_debug,
            //             templates,
            //         }),
            //     })),
            //     parallel,
            // )
        }
    },
    commands: [

        // Fill templates.
        {
            id: "--fill-templates",
            description: "Fill {{key}}} templates in one or multiple target files or directories.",
            examples: {
                "Fill templates": "vts --fill-templates --dist path/to/dir --templates key1=value1,key2=value2",
            },
            args: [
                { id: ["--src", "--source", "-s"], type: "string[]", required: false, description: "The dist directory or target path (in which) to fill the templates." },
                { id: ["--templates", "-t"], type: "object", description: "The templates to fill, e.g. 'x:true,y:false'" },
                { id: ["--allow-not-found", "-a"], type: "boolean", description: "Allow the source files to not be found." },
                { id: ["--debug", "--log-level", "-d"], type: "number", def: 0, description: "Set the active log level." },
                { id: ["--yes", "-y"], type: "boolean", required: false, description: "Automatically answer yes to all prompts." },
            ],
            callback: async ({
                src = [process.cwd()],
                templates,
                allow_not_found = false,
                debug = 0,
                yes = false,
            }) => {
                const { error } = await new Transformer({
                    include: src as string[],
                    plugins: [new Plugins.fill_templates({ templates, prefix: "{{", suffix: "}}" })],
                    check_include: !allow_not_found,
                    interactive: !yes,
                    debug,
                }).run()
                if (error?.type === "warning") {
                    cli.error(error.message);
                } else if (error) {
                    cli.throw(error.message);
                }
            }
        },

        // Fill version.
        {
            id: "--fill-version",
            description: "Fill __version templates in one or multiple target files or directories.",
            examples: {
                "Fill templates": "vts --fill-templates --src path/to/dir --package path/to/package.json",
            },
            args: [
                { id: ["--src", "--source", "-s"], type: "string[]", description: "The dist directory or target path (in which) to fill the templates." },
                { id: ["--pkg", "--package", "-p"], type: "string", required: false, description: "The path to the package.json file to read the version from." },
                { id: ["--allow-not-found", "-a"], type: "boolean", description: "Allow the source files to not be found." },
                { id: ["--debug", "--log-level", "-d"], type: "number", def: 0, description: "Set the active log level." },
                { id: ["--yes", "-y"], type: "boolean", required: false, description: "Automatically answer yes to all prompts." },
            ],
            callback: async ({
                src,
                pkg = "./package.json",
                allow_not_found = false,
                debug = 0,
                yes = false,
            }) => {
                const { error } = await new Transformer({
                    include: src,
                    plugins: [new Plugins.version({ pkg_json: pkg })],
                    check_include: !allow_not_found,
                    yes,
                    debug,
                }).run();
                if (error?.type === "warning") {
                    cli.error(error.message);
                } else if (error) {
                    cli.throw(error.message);
                }
            }
        },

        // Convert ESM to CJS.
        {
            id: "--transform-esm",
            description: "Transform ESM into CJS.",
            examples: {
                "Transform ESM": "vts --transform-esm --src dist/esm --dest dist/cjs",
            },
            args: [
                { id: ["--src", "--source", "-s"], type: "string", required: true, description: "The source directory containing ESM files to convert." },
                { id: ["--dest", "--destination", "-d"], type: "string", required: true, description: "The destination directory where converted CJS files will be written." },
                { id: ["--target", "-t"], type: "string", required: false, description: "The ES target version, e.g. 'es2021'." },
                { id: ["--platform", "-p"], type: "string", required: false, description: "The ES platform, 'browser' or 'node'." },
                { id: ["--override", "-o"], type: "boolean", required: false, description: "Override the destination directory if it already exists." },
                { id: ["--debug", "--log-level", "-d"], type: "number", required: false, description: "The log level [0-1]" },
            ],
            callback: async ({
                src,
                dest,
                target,
                platform,
                override = false,
                debug = 0,
            }) => await cjs({ src, dest, target, platform, override, debug }),
        },
    ]
});
cli.start();