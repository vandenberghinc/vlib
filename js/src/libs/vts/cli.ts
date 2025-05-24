#!/usr/bin/env node

// Imports.
import * as vlib from "../../index.js";
import { cjs } from "./cjs.js";
import { fill_templates, fill_version } from "./plugins/fill_templates.js";
import { Plugin } from "./plugins/plugin.js";

// CLI.
const cli = new vlib.CLI({
    name: "vts", version: "1.0.0", main: {
        description: "Execute the VTS plugin.",
        examples: {
            "Execute the dirname plugin": "vts --project path/to/tsconfig.json --dirname",
        },
        args: [
            { id: ["--tsconfig", "--project", "-p"], type: "string", required: false, description: "The source path to tsconfig or a directory with a tsconfig.json file. By default the current working directory will be used when omitted." },
            { id: ["--header", "-h"], type: "boolean", required: false, description: "Enable the header plugin." },
            { id: ["--author", "-a"], type: "string", required: false, description: "The author name to use in the header plugin." },
            { id: ["--copyright", "-c"], type: "number", required: false, description: "The copyright year to use in the header plugin." },
            { id: ["--dirname", "-d"], type: "boolean", required: false, description: "Enable the dirname plugin." },
            { id: ["--no-debug", "-nd"], type: "boolean", required: false, description: "Disable all vlib debug statements." },
            { id: ["--version", "-v"], type: "string", required: false, description: "Enable the version plugin by providing the path to the 'package.json' file, or any other json file containing attribute 'version: string'." },
            { id: ["--templates", "-t"], type: "string:string", required: false, description: "The templates to fill in the dist files, e.g. 'key1=value1,key2=value2'." },
        ],
        callback: async ({
            tsconfig: t = "./",
            header = false,
            author = undefined,
            copyright = undefined,
            dirname = false,
            version,
            no_debug = false,
            templates,
        }) => {
            let tsconfig = new vlib.Path(t);
            if (!tsconfig.exists()) {
                cli.throw(`Typescript config "${tsconfig.str()}" does not exist.`);
            }
            else if (tsconfig.is_dir()) {
                const og_path = tsconfig;
                tsconfig = tsconfig.join("tsconfig.json");
                if (!tsconfig.exists()) {
                    cli.throw(`Typescript source "${og_path.str()}" does not contain a "tsconfig.json" file.`);
                }
            }
            const plugin = new Plugin({
                tsconfig: tsconfig.str(),
                header: !header ? undefined : {
                    author,
                    start_year: copyright,
                },
                version: !version ? undefined : { package: version },
                templates,
                dirname,
                no_debug,
            });
            await plugin.run();
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
            ],
            callback: async ({
                src,
                templates,
                allow_not_found = false,
            }) => await fill_templates(src, templates, allow_not_found),
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
            ],
            callback: async ({
                src,
                pkg = "./package.json",
                allow_not_found = false,
            }) => await fill_version(src, pkg, allow_not_found),
        },

        // Fill __dirname like attribtues.
        {
            id: "--dirname",
            description: "Fill __dirname __ts_dirname like templates in one or multiple target files or directories.",
            examples: {
                "Fill dirname": "vts --dirname",
            },
            args: [
                { id: ["--src", "--source", "-s"], type: "string[]", description: "The dist directory or target path (in which) to fill the templates." },
                { id: ["--pkg", "--package", "-p"], type: "string", required: false, description: "The path to the package.json file to read the version from." },
                { id: ["--allow-not-found", "-a"], type: "boolean", description: "Allow the source files to not be found." },
            ],
            callback: async ({
                src,
                pkg = "./package.json",
                allow_not_found = false,
            }) => await fill_version(src, pkg, allow_not_found),
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
                { id: ["--quiet", "-q"], type: "boolean", required: false, description: "Suppress output messages." },
            ],
            callback: async ({
                src,
                dest,
                target,
                platform,
                override = false,
                quiet = false,
            }) => await cjs({ src, dest, target, platform, override, quiet }),
        },
    ]
});
cli.start();