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
type ColorObject = Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string>;
/**
 * The argument options for the _colorize_obj function.
 */
interface ColorizeObjOptions {
    max_depth?: number;
    indent?: number;
    max_length?: number;
    json?: boolean;
}
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
    static bg: ColorObject;
    static bright_bg: ColorObject;
    /**
     * Enable ANSI color codes by resetting all color attributes.
     */
    static enable(): void;
    /**
     * Disable ANSI color codes by clearing all color attributes.
     */
    static disable(): void;
    /**
     * Strip all ANSI color codes from a string.
     *
     * @param data - The string containing ANSI codes.
     * @returns The cleaned string without colors.
     */
    static strip(data: string): string;
    /** Colorize a json object. */
    static json(value: any, opts?: ColorizeObjOptions): string;
    /** Colorize an object. */
    static object(value: any, opts?: ColorizeObjOptions): string;
    /** Colorize a object. */
    private static _colorize_obj;
}
export { Colors as colors };
export declare const Color: {
    readonly black: (data: any) => string;
    readonly red: (data: any) => string;
    readonly red_bold: (data: any) => string;
    readonly green: (data: any) => string;
    readonly green_bold: (data: any) => string;
    readonly yellow: (data: any) => string;
    readonly yellow_bold: (data: any) => string;
    readonly blue: (data: any) => string;
    readonly blue_bold: (data: any) => string;
    readonly magenta: (data: any) => string;
    readonly magenta_bold: (data: any) => string;
    readonly cyan: (data: any) => string;
    readonly light_gray: (data: any) => string;
    readonly gray: (data: any) => string;
    readonly bold: (data: any) => string;
    readonly italic: (data: any) => string;
    readonly end: (data: any) => string;
    readonly purple: (data: any) => string;
    readonly orange: (data: any) => string;
    readonly strip: (data: any) => string;
    readonly bg: {
        readonly black: (data: any) => string;
        readonly red: (data: any) => string;
        readonly green: (data: any) => string;
        readonly yellow: (data: any) => string;
        readonly blue: (data: any) => string;
        readonly magenta: (data: any) => string;
        readonly cyan: (data: any) => string;
        readonly white: (data: any) => string;
    };
    readonly bright_bg: {
        readonly black: (data: any) => string;
        readonly red: (data: any) => string;
        readonly green: (data: any) => string;
        readonly yellow: (data: any) => string;
        readonly blue: (data: any) => string;
        readonly magenta: (data: any) => string;
        readonly cyan: (data: any) => string;
        readonly white: (data: any) => string;
    };
    readonly json: (value: any, opts?: ColorizeObjOptions) => string;
    readonly object: (value: any, opts?: ColorizeObjOptions) => string;
};
export { Color as color };
export default Colors;
