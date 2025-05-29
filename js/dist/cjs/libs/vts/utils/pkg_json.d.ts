/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../../index.js";
/**
 * Load a package json file and throw a descriptive error if it does not exist or does not contain a version.
 * @param path - The package.json file path.
 * @param opts - Optional options.
 * @param opts.version - If true, will throw an error if the package.json does not contain a version.
 * @param opts.throw - By default an error will be thrown thrown if the returned type would be undefined. However, if set to false, it will return undefined instead.
 * @returns The package.json data.
 * @throws Will throw an error if the package.json file does not exist or does not contain a version.
 */
export declare function load_pkg_json(path: string | Path, opts: {
    version?: boolean;
    throw: false;
}): Record<string, any> | undefined;
export declare function load_pkg_json(path: string | Path, opts?: {
    version?: boolean;
    throw?: boolean;
}): Record<string, any>;
/**
 * Resolve the npm package.json file in the given path and its parent directories.
 * @param path - The path to start searching from.
 * @param opts - Optional options.
 * @param opts.throw - By default an error will be thrown thrown if the returned type would be undefined. However, if set to false, it will return undefined instead.
 * @returns The path to the package.json file.
 * @throws Will throw an error if no package.json file is found.
 */
export declare function resolve_pkg_json(path: string | Path, opts: {
    throw: false;
}): Path | undefined;
export declare function resolve_pkg_json(path: string | Path, opts?: {
    throw?: boolean;
}): Path;
