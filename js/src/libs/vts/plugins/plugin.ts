/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import fs from "fs/promises";
import { sync as glob_sync } from "glob";
import path_module from "path";
import * as vlib from "../../../index.js";
import { no_debug_plugin } from "./no_debug.js";
import { header_plugin } from "./header.js";
import { dirname_plugin } from "./dirname.js";
import { fill_templates, fill_version } from "./fill_templates.js";

/**
 * The VTS plugin.
 */
export class Plugin {
    constructor(private config: {
        /**
         * The path to the tsconfig.json file.
         * This is used to determine the source and output files.
         */
        tsconfig: string,
        /**
         * Define the header attribute to enable the header plugin.
         */
        header?: {
            /**
             * Define the author option to automatically insert/update 
             * The author and copyright header of each source file. */
            author?: string,
            /** The copyright start year. */
            start_year?: number,
        },
        /**
         * Enable the `dirname` plugin, ensuring variables such as `__dirname` and additional are accessable in ESM and CJS dist files.
         */
        dirname?: boolean,
        /**
         * Enable the `version` plugin, inserting the __version variable into the dist files.
         */
        version?: {
            /** The path to the package.json path or any another json file that has a `version:string` attributel. */
            package: string
        },
        /**
         * Disable all vlib `^\s*debug(...)` statements.
         */
        no_debug?: boolean,
        /**
         * Fill {{key}} templates in the dist files.
         */
        templates?: {
            [key: string]: string,
        },
    }) { }

    /**
     * Run the plugin.
     */
    async run() {
        // Load and parse tsconfig.json
        const tsconfig_path = new vlib.Path(this.config.tsconfig);
        if (!tsconfig_path.exists()) {
            throw new Error(`Typescript config file "${tsconfig_path}" does not exist.`);
        }
        const tsconfig = tsconfig_path.load_sync({ type: "object" });

        // Extract include/exclude patterns
        const include_patterns = tsconfig.include ?? [];
        const exclude_patterns = tsconfig.exclude ?? [];
        const tsconfig_dir = tsconfig_path.base()?.str() ?? "";

        // List all files matching include, filtering out exclude
        const matched_files = include_patterns.flatMap(pattern =>
            glob_sync(pattern, { cwd: tsconfig_dir, absolute: true, ignore: exclude_patterns })
        );

        // Load package version.
        let pkg_version: string | undefined;
        if (this.config.version?.package) {
            const pkg_path = new vlib.Path(this.config.version?.package);
            if (!pkg_path.exists()) {
                throw new Error(`Package.json "${pkg_path.str()}" does not exist.`);
            }
            const pkg_data = pkg_path.load_sync({ type: "object" });
            if (!pkg_data.version) {
                throw new Error(`Package.json "${pkg_path.str()}" does not contain a version.`);
            }
            pkg_version = pkg_data.version;
        }

        const promises: Promise<void>[] = [];
        for (const file_path of matched_files) {
            // Source file
            const source_path = new vlib.Path(file_path);

            // Determine corresponding dist file if outDir is set
            let dist_path: vlib.Path | null = null;
            if (tsconfig.compilerOptions?.outDir) {
                const relative_path = path_module.relative(tsconfig_dir, file_path);
                const js_relative_path = relative_path.replace(/\.[tj]s$/, ".js");
                const dist_file_path = path_module.join(tsconfig_dir, tsconfig.compilerOptions.outDir, js_relative_path);
                dist_path = new vlib.Path(dist_file_path);
            }

            // If dirname injection is enabled, process dist file
            if (this.config.dirname && dist_path) {
                promises.push(dirname_plugin(
                    source_path, 
                    dist_path,
                    tsconfig_path.str(),
                    tsconfig_dir,
                ));
            }

            // If author sync is enabled, process source file
            if (this.config.header?.author) {
                promises.push(header_plugin(
                    source_path,
                    this.config.header.author,
                    this.config.header.start_year,
                ));
            }

            // If author sync is enabled, process source file
            if (this.config.no_debug && dist_path) {
                promises.push(no_debug_plugin(
                    dist_path,
                ));
            }

            // Version plugin
            if (pkg_version && dist_path) {
                fill_version(
                    dist_path,
                    undefined,
                    false,
                    pkg_version,
                )
            }

            // Fill templates.
            if (this.config.templates && dist_path) {
                fill_templates(dist_path, this.config.templates, false);
            }
        }
        await Promise.all(promises);
    }
}
