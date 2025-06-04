/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../../index.js";
import { Plugin } from "./plugin.js";
/**
 * Version plugin, insert __version into dist files.
 */
export declare class Version extends Plugin {
    /** Set id. @todo testing no id runtime error */
    static id: Plugin.Id;
    /** Create a new instance of the plugin. */
    constructor({ pkg_json, version }: {
        version: string;
        pkg_json?: never;
    } | {
        version?: never;
        pkg_json: Path | string;
    });
}
