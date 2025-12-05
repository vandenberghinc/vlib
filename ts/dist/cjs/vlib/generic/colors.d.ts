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
 * @docs
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
 * @docs
 */
export declare namespace Color {
    /** Create black colored text. */
    const black: (data: any) => string;
    /** Create red colored text. */
    const red: (data: any) => string;
    /** Create red+bold colored text. */
    const red_bold: (data: any) => string;
    /** Create green colored text. */
    const green: (data: any) => string;
    /** Create green+bold colored text. */
    const green_bold: (data: any) => string;
    /** Create yellow colored text. */
    const yellow: (data: any) => string;
    /** Create yellow+bold colored text. */
    const yellow_bold: (data: any) => string;
    /** Create blue colored text. */
    const blue: (data: any) => string;
    /** Create blue_b+ld colored text. */
    const blue_bold: (data: any) => string;
    /** Create magenta colored text. */
    const magenta: (data: any) => string;
    /** Create magent+_bold colored text. */
    const magenta_bold: (data: any) => string;
    /** Create cyan colored text. */
    const cyan: (data: any) => string;
    /** Create cyan_b+ld colored text. */
    const cyan_bold: (data: any) => string;
    /** Create light_gray colored text. */
    const light_gray: (data: any) => string;
    /** Create gray colored text. */
    const gray: (data: any) => string;
    /** Create bold colored text. */
    const bold: (data: any) => string;
    /** Create italic colored text. */
    const italic: (data: any) => string;
    /** Create end colored text. */
    const end: (data: any) => string;
    /** Create purple colored text. */
    const purple: (data: any) => string;
    /** Create orange colored text. */
    const orange: (data: any) => string;
    /** Create background colored text. */
    const bg: {
        /** Create black background colored text. */
        black: (data: any) => string;
        /** Create red background colored text. */
        red: (data: any) => string;
        /** Create green background colored text. */
        green: (data: any) => string;
        /** Create yellow background colored text. */
        yellow: (data: any) => string;
        /** Create blue background colored text. */
        blue: (data: any) => string;
        /** Create magenta background colored text. */
        magenta: (data: any) => string;
        /** Create cyan background colored text. */
        cyan: (data: any) => string;
        /** Create white background colored text. */
        white: (data: any) => string;
    };
    /** Create bright background colored text. */
    const bright_bg: {
        /** Create black bright background colored text. */
        black: (data: any) => string;
        /** Create red bright background colored text. */
        red: (data: any) => string;
        /** Create green bright background colored text. */
        green: (data: any) => string;
        /** Create yellow bright background colored text. */
        yellow: (data: any) => string;
        /** Create blue bright background colored text. */
        blue: (data: any) => string;
        /** Create magenta bright background colored text. */
        magenta: (data: any) => string;
        /** Create cyan bright background colored text. */
        cyan: (data: any) => string;
        /** Create white bright background colored text. */
        white: (data: any) => string;
    };
    /**
     * Enable ANSI color codes by resetting all color attributes.
     * @docs
     */
    function enable(): void;
    /**
     * Disable ANSI color codes by clearing all color attributes.
     * @docs
     */
    function disable(): void;
    /**
     * Strip all ANSI color codes from a string.
     *
     * @param data - The string containing ANSI codes.
     * @returns The cleaned string without colors.
     *
     * @docs
     */
    function strip(data: string): string;
    /**
     * Colorize a json object.
     *
     * @docs
     */
    function json(value: any, opts?: ObjectUtils.StringifyOpts): string;
    /**
     * Colorize an object.
     *
     * @docs
     */
    function object(value: object, opts?: ObjectUtils.StringifyOpts): string;
    /**
     * Convert ANSI color codes to HTML spans with Mac OS terminal colors.
     *
     * @param data - The string containing ANSI codes.
     * @returns The HTML string with color spans.
     *
     * @docs
     */
    function to_html(data: string): string;
    /** Update html env for browser environment. */
}
export { Colors as colors };
