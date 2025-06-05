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
import { ObjectUtils } from "../global/object.js";
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
    static bg = {
        black: "\u001b[40m",
        red: "\u001b[41m",
        green: "\u001b[42m",
        yellow: "\u001b[43m",
        blue: "\u001b[44m",
        magenta: "\u001b[45m",
        cyan: "\u001b[46m",
        white: "\u001b[47m",
    };
    static bright_bg = {
        black: "\u001b[100m",
        red: "\u001b[101m",
        green: "\u001b[102m",
        yellow: "\u001b[103m",
        blue: "\u001b[104m",
        magenta: "\u001b[105m",
        cyan: "\u001b[106m",
        white: "\u001b[107m",
    };
}
/**
 * The color module.
 */
export var Color;
(function (Color) {
    // ---------------------------------------------------------
    // Color functions, wrapping a data argument in a color.
    Color.black = (data) => `${Colors.black}${data}${Colors.end}`;
    Color.red = (data) => `${Colors.red}${data}${Colors.end}`;
    Color.red_bold = (data) => `${Colors.red_bold}${data}${Colors.end}`;
    Color.green = (data) => `${Colors.green}${data}${Colors.end}`;
    Color.green_bold = (data) => `${Colors.bold}${Colors.green}${data}${Colors.end}`;
    Color.yellow = (data) => `${Colors.yellow}${data}${Colors.end}`;
    Color.yellow_bold = (data) => `${Colors.bold}${Colors.yellow}${data}${Colors.end}`;
    Color.blue = (data) => `${Colors.blue}${data}${Colors.end}`;
    Color.blue_bold = (data) => `${Colors.bold}${Colors.blue}${data}${Colors.end}`;
    Color.magenta = (data) => `${Colors.magenta}${data}${Colors.end}`;
    Color.magenta_bold = (data) => `${Colors.bold}${Colors.magenta}${data}${Colors.end}`;
    Color.cyan = (data) => `${Colors.cyan}${data}${Colors.end}`;
    Color.cyan_bold = (data) => `${Colors.bold}${Colors.cyan}${data}${Colors.end}`;
    Color.light_gray = (data) => `${Colors.light_gray}${data}${Colors.end}`;
    Color.gray = (data) => `${Colors.gray}${data}${Colors.end}`;
    Color.bold = (data) => `${Colors.bold}${data}${Colors.end}`;
    Color.italic = (data) => `${Colors.italic}${data}${Colors.end}`;
    Color.end = (data) => `${Colors.end}${data}${Colors.end}`;
    Color.purple = (data) => `${Colors.purple}${data}${Colors.end}`;
    Color.orange = (data) => `${Colors.orange}${data}${Colors.end}`;
    Color.bg = {
        black: (data) => `${Colors.bg.black}${data}${Colors.end}`,
        red: (data) => `${Colors.bg.red}${data}${Colors.end}`,
        green: (data) => `${Colors.bg.green}${data}${Colors.end}`,
        yellow: (data) => `${Colors.bg.yellow}${data}${Colors.end}`,
        blue: (data) => `${Colors.bg.blue}${data}${Colors.end}`,
        magenta: (data) => `${Colors.bg.magenta}${data}${Colors.end}`,
        cyan: (data) => `${Colors.bg.cyan}${data}${Colors.end}`,
        white: (data) => `${Colors.bg.white}${data}${Colors.end}`,
    };
    Color.bright_bg = {
        black: (data) => `${Colors.bright_bg.black}${data}${Colors.end}`,
        red: (data) => `${Colors.bright_bg.red}${data}${Colors.end}`,
        green: (data) => `${Colors.bright_bg.green}${data}${Colors.end}`,
        yellow: (data) => `${Colors.bright_bg.yellow}${data}${Colors.end}`,
        blue: (data) => `${Colors.bright_bg.blue}${data}${Colors.end}`,
        magenta: (data) => `${Colors.bright_bg.magenta}${data}${Colors.end}`,
        cyan: (data) => `${Colors.bright_bg.cyan}${data}${Colors.end}`,
        white: (data) => `${Colors.bright_bg.white}${data}${Colors.end}`,
    };
    // ---------------------------------------------------------
    // Functions.
    /**
     * Enable ANSI color codes by resetting all color attributes.
     */
    function enable() {
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
        };
        Colors.bright_bg = {
            black: "\u001b[100m",
            red: "\u001b[101m",
            green: "\u001b[102m",
            yellow: "\u001b[103m",
            blue: "\u001b[104m",
            magenta: "\u001b[105m",
            cyan: "\u001b[106m",
            white: "\u001b[107m",
        };
    }
    Color.enable = enable;
    /**
     * Disable ANSI color codes by clearing all color attributes.
     */
    function disable() {
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
    Color.disable = disable;
    /**
     * Strip all ANSI color codes from a string.
     *
     * @param data - The string containing ANSI codes.
     * @returns The cleaned string without colors.
     */
    function strip(data) {
        return data.replace(/\u001b\[[0-9;]*m/g, '');
    }
    Color.strip = strip;
    /** Colorize a json object. */
    function json(value, opts) {
        return ObjectUtils.stringify(value, { ...(opts ?? {}), colored: true, json: true });
    }
    Color.json = json;
    /** Colorize an object. */
    function object(value, opts) {
        return ObjectUtils.stringify(value, { ...(opts ?? {}), colored: true, json: false });
    }
    Color.object = object;
})(Color || (Color = {}));
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
//# sourceMappingURL=colors.js.map