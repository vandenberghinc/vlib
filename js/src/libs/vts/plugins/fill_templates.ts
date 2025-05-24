/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as fs from 'fs';
import * as pathlib from 'path';
import fg from 'fast-glob';
import * as vlib from '../../../index.js';

// Regex to match full placeholders
const placeholder_pattern = /\{\{(\w+)\}\}/g;

/**
 * Recursively fills `{{key}}` placeholders in all `.js`, `.jsx`, `.ts`, and `.tsx` files under the given directory or path.
 *
 * @param dist Root directory or path to process.
 * @param templates Key→value map for replacements.
 */
export async function fill_templates(
    dist: string | vlib.Path | (string | vlib.Path)[],
    templates: Record<string, any>,
    allow_not_found: boolean = false,
): Promise<void> {

    // Process file wrapper.
    const process_file = async (file: string | vlib.Path) => {
        if (file instanceof vlib.Path) {
            file = file.data;
        }
        const raw = await fs.promises.readFile(file, 'utf8');
        if (!raw.includes('{{')) return;
        let changed = false;
        const result = raw.replace(placeholder_pattern, (match, key) => {
            if (Object.prototype.hasOwnProperty.call(templates, key)) {
                changed = true;
                return String(templates[key]);
            }
            return match;
        });
        if (changed) {
            await fs.promises.writeFile(file, result, 'utf8');
        }
    }

    // Array of files.
    if (Array.isArray(dist)) {
        await Promise.all(dist.map(process_file));
        return;
    }
    
    // File is not a directory, process it directly.
    const dist_path = dist instanceof vlib.Path ? dist : new vlib.Path(dist);
    if (!dist_path.exists()) {
        if (allow_not_found) {
            return;
        }
        throw new Error(`Directory "${dist_path.str()}" does not exist.`);
    }
    if (!dist_path.is_dir()) {
        await process_file(dist_path.str());
        return;
    }

    // Find all matching files
    const abs_dir = pathlib.resolve(dist_path.data);
    const files = await fg(`${abs_dir.split(pathlib.sep).join('/')}/**/*.{js,jsx,ts,tsx}`, { dot: true, onlyFiles: true });
    await Promise.all(files.map(process_file));
}

/**
 * Recursively fills exact `key` template matches in all `.js`, `.jsx`, `.ts`, and `.tsx` files under the given directory or path.
 *
 * @param dist Root directory or path to process.
 * @param templates Key→value map for replacements.
 */
export async function fill_exact_templates(
    dist: string | vlib.Path | (string | vlib.Path)[],
    templates: Record<string, any>,
    allow_not_found: boolean = false,
): Promise<void> {

    // Process file wrapper.
    const process_file = async (file: string | vlib.Path) => {
        if (file instanceof vlib.Path) {
            file = file.data;
        }
        const raw = await fs.promises.readFile(file, 'utf8');
        const pattern = new RegExp(`\b$(${Object.keys(templates).join("|")})\b`, "g");
        let changed = false;
        const result = raw.replace(pattern, (match, key) => {
            if (Object.prototype.hasOwnProperty.call(templates, key)) {
                changed = true;
                return String(templates[key]);
            }
            return match;
        });
        if (changed) {
            await fs.promises.writeFile(file, result, 'utf8');
        }
    }

    // Array of files.
    if (Array.isArray(dist)) {
        await Promise.all(dist.map(process_file));
        return;
    }

    // File is not a directory, process it directly.
    const dist_path = dist instanceof vlib.Path ? dist : new vlib.Path(dist);
    if (!dist_path.exists()) {
        if (allow_not_found) {
            return;
        }
        throw new Error(`Directory "${dist_path.str()}" does not exist.`);
    }
    if (!dist_path.is_dir()) {
        await process_file(dist_path.str());
        return;
    }

    // Find all matching files
    const abs_dir = pathlib.resolve(dist_path.data);
    const files = await fg(`${abs_dir.split(pathlib.sep).join('/')}/**/*.{js,jsx,ts,tsx}`, { dot: true, onlyFiles: true });
    await Promise.all(files.map(process_file));
}


/**
 * Fill the __version template in given file(s).
 * @todo actually this is wrong since the user thinks __version is a var while it is a string literal at runtime
 */
export async function fill_version(
    paths: vlib.Path | string | string[],
    package_json_path: undefined | string,
    allow_not_found: boolean,
    version: string
): Promise<void>;
export async function fill_version(
    paths: vlib.Path | string | string[],
    package_json: string,
    allow_not_found: boolean,
    version?: undefined
): Promise<void>;
export async function fill_version(
    paths: vlib.Path | string | string[],
    package_json: undefined | string,
    allow_not_found: boolean = false,
    version?: string
): Promise<void> {
    if (version) {
        return fill_exact_templates(paths, { __version: version });
    }
    if (!package_json) {
        throw new Error(`Package.json path is not set.`);
    }
    const package_json_path = new vlib.Path(package_json);
    if (!package_json_path.exists()) {
        if (allow_not_found) {
            return;
        }
        throw new Error(`Package.json "${package_json_path.str()}" does not exist.`);
    }
    const data = package_json_path.load_sync({ type: "object" });
    if (!data.version) {
        throw new Error(`Package.json "${package_json_path.str()}" does not contain a version.`);
    }
    return fill_exact_templates(paths, { __version: data.version });
}