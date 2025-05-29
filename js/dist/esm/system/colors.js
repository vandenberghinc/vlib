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
    /** Colorize a object. */
    function _colorize_obj(value, indent_level = 0, nested_depth, opts = {}, circular_cache) {
        let indent = indent_level === false ? '' : '    '.repeat(indent_level);
        let next_indent = indent_level === false ? '' : '    '.repeat(indent_level + 1);
        let line_break_or_space = indent_level === false ? ' ' : '\n';
        // null
        if (value === null) {
            return Colors.gray + 'null' + Colors.end;
        }
        // minify array/obj.
        if ((Array.isArray(value) && value.length <= 3) ||
            (typeof value === 'object' && Object.keys(value).length <= 3)) {
            const keys = Object.keys(value);
            let len = 0, max_len = 100;
            for (const key of keys) {
                len += key.length + 2; // +2 for quotes
                if (len > max_len) {
                    len = -1;
                    break;
                }
                const t = typeof value[key];
                if (t === 'string' || t === 'number' || t === 'boolean') {
                    len += value[key].toString().length;
                }
                else {
                    len = -1;
                    break;
                }
            }
            if (len !== -1 && len < max_len) {
                indent_level = false;
                indent = '';
                next_indent = '';
                line_break_or_space = ' ';
            }
        }
        // array
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return Colors.light_gray + '[]' + Colors.end;
            }
            else if (opts.max_depth != null && nested_depth > opts.max_depth) {
                return `${Colors.cyan}[Array]${Colors.end}`;
            }
            else if (circular_cache.has(value)) {
                return Colors.cyan + '[Circular Array]' + Colors.end;
            }
            circular_cache.add(value);
            const items = value
                .map(v => `${next_indent}${_colorize_obj(v, indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache)}`)
                .join(Colors.light_gray + ',' + Colors.end + line_break_or_space);
            return [
                Colors.light_gray + '[' + Colors.end,
                items,
                `${indent}${Colors.light_gray}]${Colors.end}`
            ].join(line_break_or_space);
        }
        // object
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return Colors.light_gray + '{}' + Colors.end;
            }
            else if (opts.max_depth != null && nested_depth > opts.max_depth) {
                return `${Colors.cyan}[Object]${Colors.end}`;
            }
            else if (circular_cache.has(value)) {
                return Colors.cyan + '[Circular Object]' + Colors.end;
            }
            circular_cache.add(value);
            const items = [];
            let total_len = 0;
            for (const key of keys) {
                const colored_key = Colors.cyan + (opts.json ? JSON.stringify(key) : key) + Colors.end;
                const colored_val = _colorize_obj(value[key], indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache);
                const item = `${next_indent}${colored_key}${Colors.light_gray}: ${Colors.end}${colored_val}`;
                if (opts.max_length != null && item.length + total_len > opts.max_length) {
                    if (total_len < opts.max_length) {
                        items.push(`${indent}${item.slice(0, opts.max_length - total_len)}${Colors.end} ${Color.red_bold("... [truncated]")}`);
                    }
                    else {
                        items.push(`${next_indent}${Color.red_bold("... [truncated]")}`);
                    }
                    break;
                }
                items.push(item);
                total_len += item.length;
            }
            const items_str = items.join(Colors.light_gray + ',' + Colors.end + line_break_or_space);
            const header = Colors.light_gray + '{' + Colors.end;
            return [
                header,
                items_str,
                `${indent}${Colors.light_gray}}${Colors.end}`
            ].join(line_break_or_space);
        }
        // primitives
        switch (typeof value) {
            case 'string':
                return Colors.green + JSON.stringify(value) + Colors.end;
            case 'number':
                return Colors.yellow + value.toString() + Colors.end;
            case 'boolean':
                return Colors.yellow + value.toString() + Colors.end;
            case 'undefined':
                return Colors.gray + 'undefined' + Colors.end;
            case 'function':
                return Colors.cyan + "[Function]" + Colors.end;
            default:
                // symbols, bigints, etc.
                return Colors.magenta + String(value) + Colors.end;
        }
    }
    /** Colorize a json object. */
    function json(value, opts) {
        opts ??= {};
        opts.json = true;
        const circular_cache = new Set();
        return _colorize_obj(value, opts?.indent ?? 0, 0, opts, circular_cache);
    }
    Color.json = json;
    /** Colorize an object. */
    function object(value, opts) {
        opts ??= {};
        opts.json = true;
        const circular_cache = new Set();
        return _colorize_obj(value, opts?.indent ?? 0, 0, opts, circular_cache);
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
//# sourceMappingURL=colors.js.map