/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Path } from "@vlib";

/**
 * Load a package json file and throw a descriptive error if it does not exist or does not contain a version.
 * @param path - The package.json file path.
 * @param opts - Optional options.
 * @param opts.version - If true, will throw an error if the package.json does not contain a version.
 * @param opts.throw - By default an error will be thrown thrown if the returned type would be undefined. However, if set to false, it will return undefined instead.
 * @returns The package.json data.
 * @throws Will throw an error if the package.json file does not exist or does not contain a version.
 */
export function load_pkg_json(path: string | Path, opts: { version?: boolean, throw: false }): Record<string, any> | undefined;
export function load_pkg_json(path: string | Path, opts?: { version?: boolean, throw?: boolean }): Record<string, any>;
export function load_pkg_json(path: string | Path, opts?: { version?: boolean, throw?: boolean }): Record<string, any> | undefined {
    if (typeof path === "string") {
        path = new Path(path);
    }
    if (!path.exists()) {
        if (opts?.throw === false) {
            return undefined;
        }
        throw new Error(`Package.json "${path.str()}" does not exist.`);
    }
    const pkg_data = path.load_sync({ type: "object" });
    if (opts?.version && !pkg_data.version) {
        if (opts?.throw === false) {
            return undefined;
        }
        throw new Error(`Package.json "${path.str()}" does not contain a version.`);
    }
    return pkg_data;
}

/**
 * Resolve the npm package.json file in the given path and its parent directories.
 * @param path - The path to start searching from.
 * @param opts - Optional options.
 * @param opts.throw - By default an error will be thrown thrown if the returned type would be undefined. However, if set to false, it will return undefined instead.
 * @returns The path to the package.json file.
 * @throws Will throw an error if no package.json file is found.
 */
export function resolve_pkg_json(path: string | Path, opts: { throw: false }): Path | undefined;
export function resolve_pkg_json(path: string | Path, opts?: { throw?: boolean }): Path;
export function resolve_pkg_json(path: string | Path, opts?: { throw?: boolean }): Path | undefined {
    if (typeof path === "string") {
        path = new Path(path);
    }
    if (path.full_name() === "package.json") {
        return path;
    }
    let base: Path | undefined = path;
    while (
        (base = base?.base())
        && !base.join("package.json").exists()
    ) {}
    const pkg_json = base?.join("package.json");
    if (!pkg_json || !pkg_json.exists()) {
        if (opts?.throw === false) {
            return undefined;
        }
        throw new Error(`No package.json file found in path "${path.str()}".`);
    }
    return pkg_json;
}