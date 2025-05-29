/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2022 - 2024 Daan van den Bergh.
 *
 * WARNING:
 *  This script is also embedded into vweb.
 *  Therefore, it must be a standalone script not depending on anything from vlib except for Array.iterate.
 *  And beware that `vlib` will be replaced with `vweb`.
 */
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
    export const black: (data: any) => string;
    export const red: (data: any) => string;
    export const red_bold: (data: any) => string;
    export const green: (data: any) => string;
    export const green_bold: (data: any) => string;
    export const yellow: (data: any) => string;
    export const yellow_bold: (data: any) => string;
    export const blue: (data: any) => string;
    export const blue_bold: (data: any) => string;
    export const magenta: (data: any) => string;
    export const magenta_bold: (data: any) => string;
    export const cyan: (data: any) => string;
    export const cyan_bold: (data: any) => string;
    export const light_gray: (data: any) => string;
    export const gray: (data: any) => string;
    export const bold: (data: any) => string;
    export const italic: (data: any) => string;
    export const end: (data: any) => string;
    export const purple: (data: any) => string;
    export const orange: (data: any) => string;
    export const bg: {
        black: (data: any) => string;
        red: (data: any) => string;
        green: (data: any) => string;
        yellow: (data: any) => string;
        blue: (data: any) => string;
        magenta: (data: any) => string;
        cyan: (data: any) => string;
        white: (data: any) => string;
    };
    export const bright_bg: {
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
    export function enable(): void;
    /**
     * Disable ANSI color codes by clearing all color attributes.
     */
    export function disable(): void;
    /**
     * Strip all ANSI color codes from a string.
     *
     * @param data - The string containing ANSI codes.
     * @returns The cleaned string without colors.
     */
    export function strip(data: string): string;
    /** Colorize options for `json()` or `object()`. */
    interface ColorizeObjOptions {
        max_depth?: number;
        indent?: number;
        max_length?: number;
        json?: boolean;
    }
    /** Colorize a json object. */
    export function json(value: any, opts?: ColorizeObjOptions): string;
    /** Colorize an object. */
    export function object(value: any, opts?: ColorizeObjOptions): string;
    export {};
}
export { Colors as colors };
