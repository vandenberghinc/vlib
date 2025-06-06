/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../vlib/index.js";
import { Plugin } from "./plugin.js";
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
export declare class Dirname extends Plugin {
    /** Set id. */
    static id: Plugin.Id;
    /** Create a new instance of the plugin. */
    constructor({ pkg_json, tsconfig }: {
        tsconfig: Path | string;
        pkg_json?: Path | string;
    });
}
