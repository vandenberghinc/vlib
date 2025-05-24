/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * CSS utils.
 * Mainly because this is might be used in combination with the ts bundler.
 */
export declare namespace CSS {
    /**
     * Minify CSS code.
     */
    function minify(data: string): string;
    /**
     * Bundle CSS code or files.
     */
    function bundle({ data, paths, minify, output, postprocess, log_level, }: {
        data: string;
        paths?: string[];
        minify?: boolean;
        output?: string | string[];
        postprocess?: undefined | ((data: string) => string | Promise<string>);
        log_level?: number;
    }): Promise<string>;
}
export { CSS as css };
