/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// ---------------------------------------------------------
// Imports.

import CleanCSS from 'clean-css';
import * as vlib from "@vlib";

// ---------------------------------------------------------
/**
 * CSS utils.
 * Mainly because this is might be used in combination with the ts bundler.
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
     */
    export async function bundle({
        data,
        paths = undefined,
        minify = false,
        output = undefined,
        postprocess = undefined,
        log_level = 0,
    }: {
        data: string;
        paths?: string[];
        minify?: boolean;
        output?: string | string[];
        postprocess?: undefined | ((data: string) => string | Promise<string>);
        log_level?: number;
    }): Promise<string> {

        // Load via paths.
        if (paths !== undefined) {
            data = "";
            for (const path of paths) {
                (data as string) += await new vlib.Path(path).load();
            }
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
                vlib.logger.marker(`Bundled ${p.full_name()} (${p.str()}) [${vlib.Utils.format_bytes(p.size)}].`);
            }
        }

        // Return.
        return data as string;
    }
}
export { CSS as css };