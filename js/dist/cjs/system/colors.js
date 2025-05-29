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
  colors: () => Colors
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
}
var Color;
(function(Color2) {
  Color2.black = (data) => `${Colors.black}${data}${Colors.end}`;
  Color2.red = (data) => `${Colors.red}${data}${Colors.end}`;
  Color2.red_bold = (data) => `${Colors.red_bold}${data}${Colors.end}`;
  Color2.green = (data) => `${Colors.green}${data}${Colors.end}`;
  Color2.green_bold = (data) => `${Colors.bold}${Colors.green}${data}${Colors.end}`;
  Color2.yellow = (data) => `${Colors.yellow}${data}${Colors.end}`;
  Color2.yellow_bold = (data) => `${Colors.bold}${Colors.yellow}${data}${Colors.end}`;
  Color2.blue = (data) => `${Colors.blue}${data}${Colors.end}`;
  Color2.blue_bold = (data) => `${Colors.bold}${Colors.blue}${data}${Colors.end}`;
  Color2.magenta = (data) => `${Colors.magenta}${data}${Colors.end}`;
  Color2.magenta_bold = (data) => `${Colors.bold}${Colors.magenta}${data}${Colors.end}`;
  Color2.cyan = (data) => `${Colors.cyan}${data}${Colors.end}`;
  Color2.cyan_bold = (data) => `${Colors.bold}${Colors.cyan}${data}${Colors.end}`;
  Color2.light_gray = (data) => `${Colors.light_gray}${data}${Colors.end}`;
  Color2.gray = (data) => `${Colors.gray}${data}${Colors.end}`;
  Color2.bold = (data) => `${Colors.bold}${data}${Colors.end}`;
  Color2.italic = (data) => `${Colors.italic}${data}${Colors.end}`;
  Color2.end = (data) => `${Colors.end}${data}${Colors.end}`;
  Color2.purple = (data) => `${Colors.purple}${data}${Colors.end}`;
  Color2.orange = (data) => `${Colors.orange}${data}${Colors.end}`;
  Color2.bg = {
    black: (data) => `${Colors.bg.black}${data}${Colors.end}`,
    red: (data) => `${Colors.bg.red}${data}${Colors.end}`,
    green: (data) => `${Colors.bg.green}${data}${Colors.end}`,
    yellow: (data) => `${Colors.bg.yellow}${data}${Colors.end}`,
    blue: (data) => `${Colors.bg.blue}${data}${Colors.end}`,
    magenta: (data) => `${Colors.bg.magenta}${data}${Colors.end}`,
    cyan: (data) => `${Colors.bg.cyan}${data}${Colors.end}`,
    white: (data) => `${Colors.bg.white}${data}${Colors.end}`
  };
  Color2.bright_bg = {
    black: (data) => `${Colors.bright_bg.black}${data}${Colors.end}`,
    red: (data) => `${Colors.bright_bg.red}${data}${Colors.end}`,
    green: (data) => `${Colors.bright_bg.green}${data}${Colors.end}`,
    yellow: (data) => `${Colors.bright_bg.yellow}${data}${Colors.end}`,
    blue: (data) => `${Colors.bright_bg.blue}${data}${Colors.end}`,
    magenta: (data) => `${Colors.bright_bg.magenta}${data}${Colors.end}`,
    cyan: (data) => `${Colors.bright_bg.cyan}${data}${Colors.end}`,
    white: (data) => `${Colors.bright_bg.white}${data}${Colors.end}`
  };
  function enable() {
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
  Color2.enable = enable;
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
  Color2.disable = disable;
  function strip(data) {
    return data.replace(/\u001b\[[0-9;]*m/g, "");
  }
  Color2.strip = strip;
  function _colorize_obj(value, indent_level = 0, nested_depth, opts = {}, circular_cache) {
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
      const items = value.map((v) => `${next_indent}${_colorize_obj(v, indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache)}`).join(Colors.light_gray + "," + Colors.end + line_break_or_space);
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
        const colored_val = _colorize_obj(value[key], indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache);
        const item = `${next_indent}${colored_key}${Colors.light_gray}: ${Colors.end}${colored_val}`;
        if (opts.max_length != null && item.length + total_len > opts.max_length) {
          if (total_len < opts.max_length) {
            items.push(`${indent}${item.slice(0, opts.max_length - total_len)}${Colors.end} ${Color2.red_bold("... [truncated]")}`);
          } else {
            items.push(`${next_indent}${Color2.red_bold("... [truncated]")}`);
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
  function json(value, opts) {
    opts ??= {};
    opts.json = true;
    const circular_cache = /* @__PURE__ */ new Set();
    return _colorize_obj(value, opts?.indent ?? 0, 0, opts, circular_cache);
  }
  Color2.json = json;
  function object(value, opts) {
    opts ??= {};
    opts.json = true;
    const circular_cache = /* @__PURE__ */ new Set();
    return _colorize_obj(value, opts?.indent ?? 0, 0, opts, circular_cache);
  }
  Color2.object = object;
})(Color || (Color = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Color,
  Colors,
  colors
});
