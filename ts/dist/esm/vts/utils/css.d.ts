/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { AtLeastOneOf } from '../../vlib/types/types.js';
/**
 * The CSS utility namespace to minify and bundle CSS code.
 */
export declare namespace CSS {
    /**
     * Minify CSS code.
     */
    function minify(data: string): string;
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
    function bundle({ data, paths, minify, output, postprocess, log_level, }: AtLeastOneOf<{
        data?: string;
        paths?: string[];
        minify?: boolean;
        output?: string | string[];
        postprocess?: undefined | ((data: string) => string | Promise<string>);
        log_level?: number;
    }, "data" | "paths">): Promise<string>;
}
export { CSS as css };
