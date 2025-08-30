/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// ---------------------------------------------------------
// Imports.

import CleanCSS from 'clean-css';
import * as vlib from "@vlib";
import { AtLeastOneOf } from '@vlib/types/types.js';

// ---------------------------------------------------------
/**
 * The CSS utility namespace to minify and bundle CSS code.
 */
export namespace CSS {

    /**
     * Minify CSS code.
     */
    export function minify(data: string): string {
        return new CleanCSS().minify(data).styles;
    }

    /**
     * Bundle CSS code or files.
     * @param data The CSS code as a string or the path to a file containing CSS code.
     * @param paths Optional paths to load additional CSS files from, when provided, the `data` parameter is ignored.
     * @param minify Whether to minify the CSS code, defaults to `false`.
     * @param output Optional output path or paths to save the bundled CSS code.
     * @param postprocess Optional function to postprocess the CSS code after bundling and minification.
     * @param log_level The log level, defaults to `0` (no logs).
     * @returns The bundled CSS code as a string.
     */
    export async function bundle({
        data,
        paths,
        minify = false,
        output = undefined,
        postprocess = undefined,
        log_level = 0,
    }: AtLeastOneOf<{
        data?: string;
        paths?: string[];
        minify?: boolean;
        output?: string | string[];
        postprocess?: undefined | ((data: string) => string | Promise<string>);
        log_level?: number;
    }, "data" | "paths">): Promise<string> {

        // Load via paths.
        if (paths != null) {
            data = "";
            for (const path of paths) {
                (data as string) += await new vlib.Path(path).load();
            }
        }
        if (!data) {
            throw new Error("No CSS data provided or loaded from paths.");
        }

        // Minify.
        if (minify) {
            data = CSS.minify(data!);
        }

        // Postprocess.
        if (typeof postprocess === "function") {
            const res = postprocess(data);
            if (res instanceof Promise) {
                data = await res;
            } else {
                data = res;
            }
        }

        // Save.
        if (typeof output === "string") {
            await new vlib.Path(output).save(data);
        } else if (Array.isArray(output)) {
            for (let i = 0; i < output.length; i++) {
                await new vlib.Path(output[i]).save(data);
            }
        }

        // Logs.
        if (log_level >= 1) {
            const first_path = typeof output === "string" ? output : (Array.isArray(output) ? output[0] : undefined);
            if (first_path != null) {
                const p = new vlib.Path(first_path);
                vlib.log.marker(`Bundled ${p.full_name()} (${p.str()}) [${vlib.Utils.format_bytes(p.size)}].`);
            }
        }

        // Return.
        return data as string;
    }
}
export { CSS as css };