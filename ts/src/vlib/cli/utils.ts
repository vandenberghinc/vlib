/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 * 
 * CLI utilities.
 */

import { Path } from "../generic/path.js";

/**
 * Find the default configuration file for a set of name and working directory or up to `levels_up` directories.
 * Used for the `vtest.json` and `vrepo.json` like files.
 * @param name The name of the configuration file to find, e.g. `vtest` or `vrepo`. Multiple names can be provided as an array.
 * @param cwd The current working directory to start searching from. Defaults to the current process working directory.
 * @param up The number of levels to go up from the current working directory to search for the configuration file. Defaults to 1.
 * @returns The file path that was found, or `undefined` when none of the file path patterns exist.
 */
export function find_config_path({
    name,
    extension = "",
    cwd = process.cwd(),
    up = 1,
}: {
    name: string | string[];
    extension?: string | string[];
    cwd?: string;
    up?: number;
}): Path | undefined {
    const paths: Path[] = [];
    if (typeof name === "string") name = [name];
    if (!extension) extension = [""];
    else if (typeof extension === "string") extension = [extension];
    for (const n of name) {
        for (const e of extension) {
            paths.push(new Path(`${cwd}/${n}${e}`));
        }
    }
    let up_str = "";
    for (let i = 0; i < up; i++) {
        up_str += "../";
        for (const n of name) {
            for (const e of extension) {
                paths.push(new Path(`${cwd}/${up_str}/${n}${e}`));
            }
        }
    };
    return paths.find(p => p.exists() && p.is_file());
}