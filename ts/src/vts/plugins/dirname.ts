/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Path } from "@vlib";

// Imports.
import { Plugin } from "./plugin.js";
import { UpsertRuntimeVars } from "./upsert_runtime_vars.js";

/**
 * Inserts the following variables into dist files:
 * - `__filename`: The filename of the current file.
 * - `__dirname`: The directory name of the current file.
 * - `__ts_filename`: The filename of the TypeScript source file.
 * - `__ts_dirname`: The directory name of the TypeScript source file.
 * - `__tsconfig`: The path to the TypeScript configuration file.
 * - `__tsconfig_dirname`: The directory name of the TypeScript configuration file.
 * 
 * @note This plugin should not be executed for CJS
 */
export class Dirname extends Plugin {

    /** Set id. */
    static id = new Plugin.Id("vts-dirname");

    /** Create a new instance of the plugin. */
    constructor({ pkg_json, tsconfig }: {
        tsconfig: Path | string
        pkg_json?: Path | string
    }) {
        super({
            type: "dist",
        });
        const pkg_p = !pkg_json ? undefined : pkg_json instanceof Path ? pkg_json : new Path(pkg_json);
        const tsconfig_p = tsconfig instanceof Path ? tsconfig : new Path(tsconfig);
        const upsert = new UpsertRuntimeVars({
            identifier: Dirname.id,
            vars: [
                ["__filename", "__dirname", "__ts_filename", "__ts_dirname", "__tsconfig", "__tsconfig_dirname", "__package_json"],
                (source) => ({
                    __filename: "__fileURLToPath(import.meta.url);",
                    __dirname: "__path_module.dirname(__filename);",
                    __ts_filename: `"${source.safe_ts_src.path}"`,
                    __ts_dirname: source.safe_ts_src.base()?.quote("undefined") ?? "undefined",
                    __tsconfig: tsconfig_p.quote(),
                    __tsconfig_dirname: tsconfig_p.base()?.quote("undefined") ?? "undefined",
                    __package_json: pkg_p?.quote("undefined") ?? "undefined",
                })
            ],
            code: {
                before:
                    `import {fileURLToPath as __fileURLToPath} from "url";` +
                    `import __path_module from "path";`
            }
        });
        this.callback = (src) => upsert.callback(src);
    }
}