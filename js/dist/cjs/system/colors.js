var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Color: () => Color,
  Colors: () => Colors,
  color: () => Color,
  colors: () => Colors,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
class Colors {
  // ---------------------------------------------------------
  // Attributes.
  static black = "\x1B[30m";
  static red = "\x1B[31m";
  static red_bold = "\x1B[31m\x1B[1m";
  static green = "\x1B[32m";
  static yellow = "\x1B[33m";
  static blue = "\x1B[34m";
  static magenta = "\x1B[35m";
  static cyan = "\x1B[36m";
  static light_gray = "\x1B[37m";
  static gray = "\x1B[90m";
  static bold = "\x1B[1m";
  static italic = "\x1B[3m";
  static end = "\x1B[0m";
  static purple = "\x1B[94m";
  static orange = "\x1B[38;5;208m";
  // "\u001b[38;5;214m"
  static bg = {
    black: "\x1B[40m",
    red: "\x1B[41m",
    green: "\x1B[42m",
    yellow: "\x1B[43m",
    blue: "\x1B[44m",
    magenta: "\x1B[45m",
    cyan: "\x1B[46m",
    white: "\x1B[47m"
  };
  static bright_bg = {
    black: "\x1B[100m",
    red: "\x1B[101m",
    green: "\x1B[102m",
    yellow: "\x1B[103m",
    blue: "\x1B[104m",
    magenta: "\x1B[105m",
    cyan: "\x1B[106m",
    white: "\x1B[107m"
  };
  // ---------------------------------------------------------
  // Functions.
  /**
   * Enable ANSI color codes by resetting all color attributes.
   */
  static enable() {
    Colors.black = "\x1B[30m";
    Colors.red = "\x1B[31m";
    Colors.red_bold = "\x1B[31m\x1B[1m";
    Colors.green = "\x1B[32m";
    Colors.yellow = "\x1B[33m";
    Colors.blue = "\x1B[34m";
    Colors.magenta = "\x1B[35m";
    Colors.cyan = "\x1B[36m";
    Colors.light_gray = "\x1B[37m";
    Colors.gray = "\x1B[90m";
    Colors.bold = "\x1B[1m";
    Colors.italic = "\x1B[3m";
    Colors.end = "\x1B[0m";
    Colors.purple = "\x1B[94m";
    Colors.orange = "\x1B[38;5;208m";
    Colors.bg = {
      black: "\x1B[40m",
      red: "\x1B[41m",
      green: "\x1B[42m",
      yellow: "\x1B[43m",
      blue: "\x1B[44m",
      magenta: "\x1B[45m",
      cyan: "\x1B[46m",
      white: "\x1B[47m"
    };
    Colors.bright_bg = {
      black: "\x1B[100m",
      red: "\x1B[101m",
      green: "\x1B[102m",
      yellow: "\x1B[103m",
      blue: "\x1B[104m",
      magenta: "\x1B[105m",
      cyan: "\x1B[106m",
      white: "\x1B[107m"
    };
  }
  /**
   * Disable ANSI color codes by clearing all color attributes.
   */
  static disable() {
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
      white: ""
    };
    Colors.bright_bg = {
      black: "",
      red: "",
      green: "",
      yellow: "",
      blue: "",
      magenta: "",
      cyan: "",
      white: ""
    };
  }
  /**
   * Strip all ANSI color codes from a string.
   *
   * @param data - The string containing ANSI codes.
   * @returns The cleaned string without colors.
   */
  static strip(data) {
    return data.replace(/\u001b\[[0-9;]*m/g, "");
  }
  /** Colorize a json object. */
  static json(value, opts) {
    opts ??= {};
    opts.json = true;
    const circular_cache = /* @__PURE__ */ new Set();
    return Colors._colorize_obj(value, opts?.indent ?? 0, 0, opts, circular_cache);
  }
  /** Colorize an object. */
  static object(value, opts) {
    opts ??= {};
    opts.json = true;
    const circular_cache = /* @__PURE__ */ new Set();
    return Colors._colorize_obj(value, opts?.indent ?? 0, 0, opts, circular_cache);
  }
  /** Colorize a object. */
  static _colorize_obj(value, indent_level = 0, nested_depth, opts = {}, circular_cache) {
    let indent = indent_level === false ? "" : "    ".repeat(indent_level);
    let next_indent = indent_level === false ? "" : "    ".repeat(indent_level + 1);
    let line_break_or_space = indent_level === false ? " " : "\n";
    if (value === null) {
      return Colors.gray + "null" + Colors.end;
    }
    if (Array.isArray(value) && value.length <= 3 || typeof value === "object" && Object.keys(value).length <= 3) {
      const keys = Object.keys(value);
      let len = 0, max_len = 100;
      for (const key of keys) {
        len += key.length + 2;
        if (len > max_len) {
          len = -1;
          break;
        }
        const t = typeof value[key];
        if (t === "string" || t === "number" || t === "boolean") {
          len += value[key].toString().length;
        } else {
          len = -1;
          break;
        }
      }
      if (len !== -1 && len < max_len) {
        indent_level = false;
        indent = "";
        next_indent = "";
        line_break_or_space = " ";
      }
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return Colors.light_gray + "[]" + Colors.end;
      } else if (opts.max_depth != null && nested_depth > opts.max_depth) {
        return `${Colors.cyan}[Array]${Colors.end}`;
      } else if (circular_cache.has(value)) {
        return Colors.cyan + "[Circular Array]" + Colors.end;
      }
      circular_cache.add(value);
      const items = value.map((v) => `${next_indent}${Colors._colorize_obj(v, indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache)}`).join(Colors.light_gray + "," + Colors.end + line_break_or_space);
      return [
        Colors.light_gray + "[" + Colors.end,
        items,
        `${indent}${Colors.light_gray}]${Colors.end}`
      ].join(line_break_or_space);
    }
    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return Colors.light_gray + "{}" + Colors.end;
      } else if (opts.max_depth != null && nested_depth > opts.max_depth) {
        return `${Colors.cyan}[Object]${Colors.end}`;
      } else if (circular_cache.has(value)) {
        return Colors.cyan + "[Circular Object]" + Colors.end;
      }
      circular_cache.add(value);
      const items = [];
      let total_len = 0;
      for (const key of keys) {
        const colored_key = Colors.cyan + (opts.json ? JSON.stringify(key) : key) + Colors.end;
        const colored_val = Colors._colorize_obj(value[key], indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache);
        const item = `${next_indent}${colored_key}${Colors.light_gray}: ${Colors.end}${colored_val}`;
        if (opts.max_length != null && item.length + total_len > opts.max_length) {
          if (total_len < opts.max_length) {
            items.push(`${indent}${item.slice(0, opts.max_length - total_len)}${Colors.end} ${Color.red_bold("... [truncated]")}`);
          } else {
            items.push(`${next_indent}${Color.red_bold("... [truncated]")}`);
          }
          break;
        }
        items.push(item);
        total_len += item.length;
      }
      const items_str = items.join(Colors.light_gray + "," + Colors.end + line_break_or_space);
      const header = Colors.light_gray + "{" + Colors.end;
      return [
        header,
        items_str,
        `${indent}${Colors.light_gray}}${Colors.end}`
      ].join(line_break_or_space);
    }
    switch (typeof value) {
      case "string":
        return Colors.green + JSON.stringify(value) + Colors.end;
      case "number":
        return Colors.yellow + value.toString() + Colors.end;
      case "boolean":
        return Colors.yellow + value.toString() + Colors.end;
      case "undefined":
        return Colors.gray + "undefined" + Colors.end;
      case "function":
        return Colors.cyan + "[Function]" + Colors.end;
      default:
        return Colors.magenta + String(value) + Colors.end;
    }
  }
}
const Color = {
  black: (data) => `${Colors.black}${data}${Colors.end}`,
  red: (data) => `${Colors.red}${data}${Colors.end}`,
  red_bold: (data) => `${Colors.red_bold}${data}${Colors.end}`,
  green: (data) => `${Colors.green}${data}${Colors.end}`,
  green_bold: (data) => `${Colors.bold}${Colors.green}${data}${Colors.end}`,
  yellow: (data) => `${Colors.yellow}${data}${Colors.end}`,
  yellow_bold: (data) => `${Colors.bold}${Colors.yellow}${data}${Colors.end}`,
  blue: (data) => `${Colors.blue}${data}${Colors.end}`,
  blue_bold: (data) => `${Colors.bold}${Colors.blue}${data}${Colors.end}`,
  magenta: (data) => `${Colors.magenta}${data}${Colors.end}`,
  magenta_bold: (data) => `${Colors.bold}${Colors.magenta}${data}${Colors.end}`,
  cyan: (data) => `${Colors.cyan}${data}${Colors.end}`,
  light_gray: (data) => `${Colors.light_gray}${data}${Colors.end}`,
  gray: (data) => `${Colors.gray}${data}${Colors.end}`,
  bold: (data) => `${Colors.bold}${data}${Colors.end}`,
  italic: (data) => `${Colors.italic}${data}${Colors.end}`,
  end: (data) => `${Colors.end}${data}${Colors.end}`,
  purple: (data) => `${Colors.purple}${data}${Colors.end}`,
  orange: (data) => `${Colors.orange}${data}${Colors.end}`,
  strip: (data) => Colors.strip(data),
  bg: {
    black: (data) => `${Colors.bg.black}${data}${Colors.end}`,
    red: (data) => `${Colors.bg.red}${data}${Colors.end}`,
    green: (data) => `${Colors.bg.green}${data}${Colors.end}`,
    yellow: (data) => `${Colors.bg.yellow}${data}${Colors.end}`,
    blue: (data) => `${Colors.bg.blue}${data}${Colors.end}`,
    magenta: (data) => `${Colors.bg.magenta}${data}${Colors.end}`,
    cyan: (data) => `${Colors.bg.cyan}${data}${Colors.end}`,
    white: (data) => `${Colors.bg.white}${data}${Colors.end}`
  },
  bright_bg: {
    black: (data) => `${Colors.bright_bg.black}${data}${Colors.end}`,
    red: (data) => `${Colors.bright_bg.red}${data}${Colors.end}`,
    green: (data) => `${Colors.bright_bg.green}${data}${Colors.end}`,
    yellow: (data) => `${Colors.bright_bg.yellow}${data}${Colors.end}`,
    blue: (data) => `${Colors.bright_bg.blue}${data}${Colors.end}`,
    magenta: (data) => `${Colors.bright_bg.magenta}${data}${Colors.end}`,
    cyan: (data) => `${Colors.bright_bg.cyan}${data}${Colors.end}`,
    white: (data) => `${Colors.bright_bg.white}${data}${Colors.end}`
  },
  json: (value, opts) => Colors.json(value, opts),
  object: (value, opts) => Colors.object(value, opts)
};
var stdin_default = Colors;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Color,
  Colors,
  color,
  colors
});
