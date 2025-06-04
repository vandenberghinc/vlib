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

import { json } from "stream/consumers";
import { ObjectUtils } from "../global/object.js";

// Types for colors.
type BackgroundColors = Record<'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white', string>;

/**
 * The colors class serving as a container to manage ANSI color codes.
 * We use a seperate class for this so we can also expose ansi codes as static properties.
 */
export class Colors {
    // ---------------------------------------------------------
    // Attributes.
    static black = "\u001b[30m";
    static red = "\u001b[31m";
    static red_bold = "\u001b[31m\u001b[1m";
    static green = "\u001b[32m";
    static yellow = "\u001b[33m";
    static blue = "\u001b[34m";
    static magenta = "\u001b[35m";
    static cyan = "\u001b[36m";
    static light_gray = "\u001b[37m";
    static gray = "\u001b[90m";
    static bold = "\u001b[1m";
    static italic = "\u001b[3m";
    static end = "\u001b[0m";
    static purple = "\u001b[94m";
    static orange = "\u001b[38;5;208m"; // "\u001b[38;5;214m"
    static bg: BackgroundColors = {
        black: "\u001b[40m",
        red: "\u001b[41m",
        green: "\u001b[42m",
        yellow: "\u001b[43m",
        blue: "\u001b[44m",
        magenta: "\u001b[45m",
        cyan: "\u001b[46m",
        white: "\u001b[47m",
    }
    static bright_bg: BackgroundColors = {
        black: "\u001b[100m",
        red: "\u001b[101m",
        green: "\u001b[102m",
        yellow: "\u001b[103m",
        blue: "\u001b[104m",
        magenta: "\u001b[105m",
        cyan: "\u001b[106m",
        white: "\u001b[107m",
    }
}

/**
 * The color module.
 */
export namespace Color {

    // ---------------------------------------------------------
    // Color functions, wrapping a data argument in a color.

    export const black = (data: any) => `${Colors.black}${data}${Colors.end}`;
    export const red = (data: any) => `${Colors.red}${data}${Colors.end}`;
    export const red_bold = (data: any) => `${Colors.red_bold}${data}${Colors.end}`;
    export const green = (data: any) => `${Colors.green}${data}${Colors.end}`;
    export const green_bold = (data: any) => `${Colors.bold}${Colors.green}${data}${Colors.end}`;
    export const yellow = (data: any) => `${Colors.yellow}${data}${Colors.end}`;
    export const yellow_bold = (data: any) => `${Colors.bold}${Colors.yellow}${data}${Colors.end}`;
    export const blue = (data: any) => `${Colors.blue}${data}${Colors.end}`;
    export const blue_bold = (data: any) => `${Colors.bold}${Colors.blue}${data}${Colors.end}`;
    export const magenta = (data: any) => `${Colors.magenta}${data}${Colors.end}`;
    export const magenta_bold = (data: any) => `${Colors.bold}${Colors.magenta}${data}${Colors.end}`;
    export const cyan = (data: any) => `${Colors.cyan}${data}${Colors.end}`;
    export const cyan_bold = (data: any) => `${Colors.bold}${Colors.cyan}${data}${Colors.end}`;
    export const light_gray = (data: any) => `${Colors.light_gray}${data}${Colors.end}`;
    export const gray = (data: any) => `${Colors.gray}${data}${Colors.end}`;
    export const bold = (data: any) => `${Colors.bold}${data}${Colors.end}`;
    export const italic = (data: any) => `${Colors.italic}${data}${Colors.end}`;
    export const end = (data: any) => `${Colors.end}${data}${Colors.end}`;
    export const purple = (data: any) => `${Colors.purple}${data}${Colors.end}`;
    export const orange = (data: any) => `${Colors.orange}${data}${Colors.end}`;
    export const bg = {
        black: (data: any) => `${Colors.bg.black}${data}${Colors.end}`,
        red: (data: any) => `${Colors.bg.red}${data}${Colors.end}`,
        green: (data: any) => `${Colors.bg.green}${data}${Colors.end}`,
        yellow: (data: any) => `${Colors.bg.yellow}${data}${Colors.end}`,
        blue: (data: any) => `${Colors.bg.blue}${data}${Colors.end}`,
        magenta: (data: any) => `${Colors.bg.magenta}${data}${Colors.end}`,
        cyan: (data: any) => `${Colors.bg.cyan}${data}${Colors.end}`,
        white: (data: any) => `${Colors.bg.white}${data}${Colors.end}`,
    };
    export const bright_bg = {
        black: (data: any) => `${Colors.bright_bg.black}${data}${Colors.end}`,
        red: (data: any) => `${Colors.bright_bg.red}${data}${Colors.end}`,
        green: (data: any) => `${Colors.bright_bg.green}${data}${Colors.end}`,
        yellow: (data: any) => `${Colors.bright_bg.yellow}${data}${Colors.end}`,
        blue: (data: any) => `${Colors.bright_bg.blue}${data}${Colors.end}`,
        magenta: (data: any) => `${Colors.bright_bg.magenta}${data}${Colors.end}`,
        cyan: (data: any) => `${Colors.bright_bg.cyan}${data}${Colors.end}`,
        white: (data: any) => `${Colors.bright_bg.white}${data}${Colors.end}`,
    };

    // ---------------------------------------------------------
    // Functions.

    /**
     * Enable ANSI color codes by resetting all color attributes.
     */
    export function enable(): void {
        Colors.black = "\u001b[30m";
        Colors.red = "\u001b[31m";
        Colors.red_bold = "\u001b[31m\u001b[1m";
        Colors.green = "\u001b[32m";
        Colors.yellow = "\u001b[33m";
        Colors.blue = "\u001b[34m";
        Colors.magenta = "\u001b[35m";
        Colors.cyan = "\u001b[36m";
        Colors.light_gray = "\u001b[37m";
        Colors.gray = "\u001b[90m";
        Colors.bold = "\u001b[1m";
        Colors.italic = "\u001b[3m";
        Colors.end = "\u001b[0m";
        Colors.purple = "\u001b[94m";
        Colors.orange = "\u001b[38;5;208m";
        Colors.bg = {
            black: "\u001b[40m",
            red: "\u001b[41m",
            green: "\u001b[42m",
            yellow: "\u001b[43m",
            blue: "\u001b[44m",
            magenta: "\u001b[45m",
            cyan: "\u001b[46m",
            white: "\u001b[47m",
        }
        Colors.bright_bg = {
            black: "\u001b[100m",
            red: "\u001b[101m",
            green: "\u001b[102m",
            yellow: "\u001b[103m",
            blue: "\u001b[104m",
            magenta: "\u001b[105m",
            cyan: "\u001b[106m",
            white: "\u001b[107m",
        }
    }

    /**
     * Disable ANSI color codes by clearing all color attributes.
     */
    export function disable(): void {
        Colors.black = "";
        Colors.red = "";
        Colors.red_bold = "";
        Colors.green = "";
        Colors.yellow = "";
        Colors.blue = "";
        Colors.magenta = "";
        Colors.cyan = "";
        Colors.light_gray = "";
        Colors.gray = "";
        Colors.bold = "";
        Colors.italic = "";
        Colors.end = "";
        Colors.purple = "";
        Colors.orange = "";
        Colors.bg = {
            black: "",
            red: "",
            green: "",
            yellow: "",
            blue: "",
            magenta: "",
            cyan: "",
            white: "",
        };
        Colors.bright_bg = {
            black: "",
            red: "",
            green: "",
            yellow: "",
            blue: "",
            magenta: "",
            cyan: "",
            white: "",
        };
    }

    /**
     * Strip all ANSI color codes from a string.
     *
     * @param data - The string containing ANSI codes.
     * @returns The cleaned string without colors.
     */
    export function strip(data: string): string {
        return data.replace(/\u001b\[[0-9;]*m/g, '');
    }

    /** Colorize a json object. */
    export function json(value: any, opts?: ObjectUtils.StringifyOpts): string {
        return ObjectUtils.stringify(value, {...(opts ?? {}), colored: true, json: true});
    }

    /** Colorize an object. */
    export function object(value: object, opts?: ObjectUtils.StringifyOpts): string {
        return ObjectUtils.stringify(value, { ...(opts ?? {}), colored: true, json: false });
    }
}
export { Colors as colors }; // snake_case compatibility

// ---------------------------------------------------------
// Test circular references.
// const x: any = {};
// const y: any = { x };
// x.y = y;
// console.log(Color.object(x, { max_depth: undefined, max_length: undefined }))




// console.log("Object:", Color.json(
//     {
//         null: null,
//         undefined: undefined,
//         bool: true,
//         num: 42,
//         str: "Hello, World!",
//         arr: [1, 2, 3, { nested: "value" }],
//         obj: {
//             key1: "value1",
//             key2: "value2",
//             nested: {
//                 key3: "value3",
//                 key4: [1, 2, 3],
//             },
//         },
//         func: function () { return "I am a function"; },
//         date: new Date(),
//         regex: /abc/i,
//         symbol: Symbol("mySymbol"),
//         bigint: BigInt(12345678901234567890),

//     }
// ));
// process.exit(1);