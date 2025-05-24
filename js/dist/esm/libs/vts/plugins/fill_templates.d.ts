/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from '../../../index.js';
/**
 * Recursively fills `{{key}}` placeholders in all `.js`, `.jsx`, `.ts`, and `.tsx` files under the given directory or path.
 *
 * @param dist Root directory or path to process.
 * @param templates Key→value map for replacements.
 */
export declare function fill_templates(dist: string | vlib.Path | (string | vlib.Path)[], templates: Record<string, any>, allow_not_found?: boolean): Promise<void>;
/**
 * Recursively fills exact `key` template matches in all `.js`, `.jsx`, `.ts`, and `.tsx` files under the given directory or path.
 *
 * @param dist Root directory or path to process.
 * @param templates Key→value map for replacements.
 */
export declare function fill_exact_templates(dist: string | vlib.Path | (string | vlib.Path)[], templates: Record<string, any>, allow_not_found?: boolean): Promise<void>;
/**
 * Fill the __version template in given file(s).
 * @todo actually this is wrong since the user thinks __version is a var while it is a string literal at runtime
 */
export declare function fill_version(paths: vlib.Path | string | string[], package_json_path: undefined | string, allow_not_found: boolean, version: string): Promise<void>;
export declare function fill_version(paths: vlib.Path | string | string[], package_json: string, allow_not_found: boolean, version?: undefined): Promise<void>;
