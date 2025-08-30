/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * WARNING:
 *  This script is also embedded into vweb.
 *  Therefore, it must be a standalone script not depending on anything from vlib except for Array.iterate.
 *  And beware that `vlib` will be replaced with `vweb`.
 */
import { ObjectUtils } from "../primitives/object.js";
type BackgroundColors = Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string>;
/**
 * The colors class serving as a container to manage ANSI color codes.
 * We use a seperate class for this so we can also expose ansi codes as static properties.
 */
export declare class Colors {
    static black: string;
    static red: string;
    static red_bold: string;
    static green: string;
    static yellow: string;
    static blue: string;
    static magenta: string;
    static cyan: string;
    static light_gray: string;
    static gray: string;
    static bold: string;
    static italic: string;
    static end: string;
    static purple: string;
    static orange: string;
    static bg: BackgroundColors;
    static bright_bg: BackgroundColors;
}
/**
 * The color module.
 */
export declare namespace Color {
    const black: (data: any) => string;
    const red: (data: any) => string;
    const red_bold: (data: any) => string;
    const green: (data: any) => string;
    const green_bold: (data: any) => string;
    const yellow: (data: any) => string;
    const yellow_bold: (data: any) => string;
    const blue: (data: any) => string;
    const blue_bold: (data: any) => string;
    const magenta: (data: any) => string;
    const magenta_bold: (data: any) => string;
    const cyan: (data: any) => string;
    const cyan_bold: (data: any) => string;
    const light_gray: (data: any) => string;
    const gray: (data: any) => string;
    const bold: (data: any) => string;
    const italic: (data: any) => string;
    const end: (data: any) => string;
    const purple: (data: any) => string;
    const orange: (data: any) => string;
    const bg: {
        black: (data: any) => string;
        red: (data: any) => string;
        green: (data: any) => string;
        yellow: (data: any) => string;
        blue: (data: any) => string;
        magenta: (data: any) => string;
        cyan: (data: any) => string;
        white: (data: any) => string;
    };
    const bright_bg: {
        black: (data: any) => string;
        red: (data: any) => string;
        green: (data: any) => string;
        yellow: (data: any) => string;
        blue: (data: any) => string;
        magenta: (data: any) => string;
        cyan: (data: any) => string;
        white: (data: any) => string;
    };
    /**
     * Enable ANSI color codes by resetting all color attributes.
     */
    function enable(): void;
    /**
     * Disable ANSI color codes by clearing all color attributes.
     */
    function disable(): void;
    /**
     * Strip all ANSI color codes from a string.
     *
     * @param data - The string containing ANSI codes.
     * @returns The cleaned string without colors.
     */
    function strip(data: string): string;
    /** Colorize a json object. */
    function json(value: any, opts?: ObjectUtils.StringifyOpts): string;
    /** Colorize an object. */
    function object(value: object, opts?: ObjectUtils.StringifyOpts): string;
    /**
     * Convert ANSI color codes to HTML spans with Mac OS terminal colors.
     *
     * @param data - The string containing ANSI codes.
     * @returns The HTML string with color spans.
     */
    function to_html(data: string): string;
    /** Update html env for browser environment. */
}
export { Colors as colors };
