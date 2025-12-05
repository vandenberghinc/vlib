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
var import_object = require("../primitives/object.js");
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
  const env = typeof window !== "undefined" && typeof window.document !== "undefined" ? "html" : "ansi";
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
    /** Create black background colored text. */
    black: (data) => `${Colors.bg.black}${data}${Colors.end}`,
    /** Create red background colored text. */
    red: (data) => `${Colors.bg.red}${data}${Colors.end}`,
    /** Create green background colored text. */
    green: (data) => `${Colors.bg.green}${data}${Colors.end}`,
    /** Create yellow background colored text. */
    yellow: (data) => `${Colors.bg.yellow}${data}${Colors.end}`,
    /** Create blue background colored text. */
    blue: (data) => `${Colors.bg.blue}${data}${Colors.end}`,
    /** Create magenta background colored text. */
    magenta: (data) => `${Colors.bg.magenta}${data}${Colors.end}`,
    /** Create cyan background colored text. */
    cyan: (data) => `${Colors.bg.cyan}${data}${Colors.end}`,
    /** Create white background colored text. */
    white: (data) => `${Colors.bg.white}${data}${Colors.end}`
  };
  Color2.bright_bg = {
    /** Create black bright background colored text. */
    black: (data) => `${Colors.bright_bg.black}${data}${Colors.end}`,
    /** Create red bright background colored text. */
    red: (data) => `${Colors.bright_bg.red}${data}${Colors.end}`,
    /** Create green bright background colored text. */
    green: (data) => `${Colors.bright_bg.green}${data}${Colors.end}`,
    /** Create yellow bright background colored text. */
    yellow: (data) => `${Colors.bright_bg.yellow}${data}${Colors.end}`,
    /** Create blue bright background colored text. */
    blue: (data) => `${Colors.bright_bg.blue}${data}${Colors.end}`,
    /** Create magenta bright background colored text. */
    magenta: (data) => `${Colors.bright_bg.magenta}${data}${Colors.end}`,
    /** Create cyan bright background colored text. */
    cyan: (data) => `${Colors.bright_bg.cyan}${data}${Colors.end}`,
    /** Create white bright background colored text. */
    white: (data) => `${Colors.bright_bg.white}${data}${Colors.end}`
  };
  function enable() {
    if (env === "ansi") {
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
    } else if (env === "html") {
      Colors.black = `<span style='color:${ansi_to_hex["30"]}'>`;
      Colors.red = `<span style='color:${ansi_to_hex["31"]}'>`;
      Colors.red_bold = `<span style='color:${ansi_to_hex["31"]};font-weight:bold'>`;
      Colors.green = `<span style='color:${ansi_to_hex["32"]}'>`;
      Colors.yellow = `<span style='color:${ansi_to_hex["33"]}'>`;
      Colors.blue = `<span style='color:${ansi_to_hex["34"]}'>`;
      Colors.magenta = `<span style='color:${ansi_to_hex["35"]}'>`;
      Colors.cyan = `<span style='color:${ansi_to_hex["36"]}'>`;
      Colors.light_gray = `<span style='color:${ansi_to_hex["37"]}'>`;
      Colors.gray = `<span style='color:${ansi_to_hex["90"]}'>`;
      Colors.bold = `<span style='font-weight:bold'>`;
      Colors.italic = `<span style='font-style:italic'>`;
      Colors.end = "</span>";
      Colors.purple = `<span style='color:${ansi_to_hex["94"]}'>`;
      Colors.orange = `<span style='color:${color_256_palette[208]}'>`;
      Colors.bg = {
        black: `<span style='background-color:${ansi_to_hex["40"]}'>`,
        red: `<span style='background-color:${ansi_to_hex["41"]}'>`,
        green: `<span style='background-color:${ansi_to_hex["42"]}'>`,
        yellow: `<span style='background-color:${ansi_to_hex["43"]}'>`,
        blue: `<span style='background-color:${ansi_to_hex["44"]}'>`,
        magenta: `<span style='background-color:${ansi_to_hex["45"]}'>`,
        cyan: `<span style='background-color:${ansi_to_hex["46"]}'>`,
        white: `<span style='background-color:${ansi_to_hex["47"]}'>`
      };
      Colors.bright_bg = {
        black: `<span style='background-color:${ansi_to_hex["100"]}'>`,
        red: `<span style='background-color:${ansi_to_hex["101"]}'>`,
        green: `<span style='background-color:${ansi_to_hex["102"]}'>`,
        yellow: `<span style='background-color:${ansi_to_hex["103"]}'>`,
        blue: `<span style='background-color:${ansi_to_hex["104"]}'>`,
        magenta: `<span style='background-color:${ansi_to_hex["105"]}'>`,
        cyan: `<span style='background-color:${ansi_to_hex["106"]}'>`,
        white: `<span style='background-color:${ansi_to_hex["107"]}'>`
      };
    }
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
    if (env === "ansi") {
      return data.indexOf("\x1B") === -1 ? data : data.replace(ansi_sgr_regex, "");
    } else if (env === "html") {
      return data.replace(/<span style='color:([^;]+);?'>/g, "").replace(/<\/span>/g, "");
    }
    throw new Error(`Unsupported environment "${env.toString()}" for color stripping.`);
  }
  Color2.strip = strip;
  const ansi_sgr_regex = /\x1B\[[0-9;]*m/g;
  function json(value, opts) {
    return import_object.ObjectUtils.stringify(value, { ...opts ?? {}, colored: true, json: true });
  }
  Color2.json = json;
  function object(value, opts) {
    return import_object.ObjectUtils.stringify(value, { ...opts ?? {}, colored: true, json: false });
  }
  Color2.object = object;
  const ansi_to_hex = {
    "30": "#000000",
    // black
    "31": "#C23621",
    // red
    "32": "#25BC24",
    // green
    "33": "#ADAD27",
    // yellow
    "34": "#0D68A8",
    // blue
    "35": "#A626A4",
    // magenta
    "36": "#0E97A6",
    // cyan
    "37": "#A5A5A6",
    // white/light gray
    "90": "#817F7F",
    // bright black (gray)
    "91": "#E14D42",
    // bright red
    "92": "#1DC121",
    // bright green
    "93": "#F3F167",
    // bright yellow
    "94": "#4B9BFF",
    // bright blue
    "95": "#E741E7",
    // bright magenta
    "96": "#16C8C8",
    // bright cyan
    "97": "#FFFFFF",
    // bright white
    // Background colors
    "40": "#000000",
    // bg black
    "41": "#C23621",
    // bg red
    "42": "#25BC24",
    // bg green
    "43": "#ADAD27",
    // bg yellow
    "44": "#0D68A8",
    // bg blue
    "45": "#A626A4",
    // bg magenta
    "46": "#0E97A6",
    // bg cyan
    "47": "#A5A5A6",
    // bg white
    "100": "#817F7F",
    // bg bright black
    "101": "#E14D42",
    // bg bright red
    "102": "#1DC121",
    // bg bright green
    "103": "#F3F167",
    // bg bright yellow
    "104": "#4B9BFF",
    // bg bright blue
    "105": "#E741E7",
    // bg bright magenta
    "106": "#16C8C8",
    // bg bright cyan
    "107": "#FFFFFF"
    // bg bright white
  };
  const color_256_palette = [
    "#000000",
    "#800000",
    "#008000",
    "#808000",
    "#000080",
    "#800080",
    "#008080",
    "#c0c0c0",
    "#808080",
    "#ff0000",
    "#00ff00",
    "#ffff00",
    "#0000ff",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
    "#000000",
    "#00005f",
    "#000087",
    "#0000af",
    "#0000d7",
    "#0000ff",
    "#005f00",
    "#005f5f",
    "#005f87",
    "#005faf",
    "#005fd7",
    "#005fff",
    "#008700",
    "#00875f",
    "#008787",
    "#0087af",
    "#0087d7",
    "#0087ff",
    "#00af00",
    "#00af5f",
    "#00af87",
    "#00afaf",
    "#00afd7",
    "#00afff",
    "#00d700",
    "#00d75f",
    "#00d787",
    "#00d7af",
    "#00d7d7",
    "#00d7ff",
    "#00ff00",
    "#00ff5f",
    "#00ff87",
    "#00ffaf",
    "#00ffd7",
    "#00ffff",
    "#5f0000",
    "#5f005f",
    "#5f0087",
    "#5f00af",
    "#5f00d7",
    "#5f00ff",
    "#5f5f00",
    "#5f5f5f",
    "#5f5f87",
    "#5f5faf",
    "#5f5fd7",
    "#5f5fff",
    "#5f8700",
    "#5f875f",
    "#5f8787",
    "#5f87af",
    "#5f87d7",
    "#5f87ff",
    "#5faf00",
    "#5faf5f",
    "#5faf87",
    "#5fafaf",
    "#5fafd7",
    "#5fafff",
    "#5fd700",
    "#5fd75f",
    "#5fd787",
    "#5fd7af",
    "#5fd7d7",
    "#5fd7ff",
    "#5fff00",
    "#5fff5f",
    "#5fff87",
    "#5fffaf",
    "#5fffd7",
    "#5fffff",
    "#870000",
    "#87005f",
    "#870087",
    "#8700af",
    "#8700d7",
    "#8700ff",
    "#875f00",
    "#875f5f",
    "#875f87",
    "#875faf",
    "#875fd7",
    "#875fff",
    "#878700",
    "#87875f",
    "#878787",
    "#8787af",
    "#8787d7",
    "#8787ff",
    "#87af00",
    "#87af5f",
    "#87af87",
    "#87afaf",
    "#87afd7",
    "#87afff",
    "#87d700",
    "#87d75f",
    "#87d787",
    "#87d7af",
    "#87d7d7",
    "#87d7ff",
    "#87ff00",
    "#87ff5f",
    "#87ff87",
    "#87ffaf",
    "#87ffd7",
    "#87ffff",
    "#af0000",
    "#af005f",
    "#af0087",
    "#af00af",
    "#af00d7",
    "#af00ff",
    "#af5f00",
    "#af5f5f",
    "#af5f87",
    "#af5faf",
    "#af5fd7",
    "#af5fff",
    "#af8700",
    "#af875f",
    "#af8787",
    "#af87af",
    "#af87d7",
    "#af87ff",
    "#afaf00",
    "#afaf5f",
    "#afaf87",
    "#afafaf",
    "#afafd7",
    "#afafff",
    "#afd700",
    "#afd75f",
    "#afd787",
    "#afd7af",
    "#afd7d7",
    "#afd7ff",
    "#afff00",
    "#afff5f",
    "#afff87",
    "#afffaf",
    "#afffd7",
    "#afffff",
    "#d70000",
    "#d7005f",
    "#d70087",
    "#d700af",
    "#d700d7",
    "#d700ff",
    "#d75f00",
    "#d75f5f",
    "#d75f87",
    "#d75faf",
    "#d75fd7",
    "#d75fff",
    "#d78700",
    "#d7875f",
    "#d78787",
    "#d787af",
    "#d787d7",
    "#d787ff",
    "#d7af00",
    "#d7af5f",
    "#d7af87",
    "#d7afaf",
    "#d7afd7",
    "#d7afff",
    "#d7d700",
    "#d7d75f",
    "#d7d787",
    "#d7d7af",
    "#d7d7d7",
    "#d7d7ff",
    "#d7ff00",
    "#d7ff5f",
    "#d7ff87",
    "#d7ffaf",
    "#d7ffd7",
    "#d7ffff",
    "#ff0000",
    "#ff005f",
    "#ff0087",
    "#ff00af",
    "#ff00d7",
    "#ff00ff",
    "#ff5f00",
    "#ff5f5f",
    "#ff5f87",
    "#ff5faf",
    "#ff5fd7",
    "#ff5fff",
    "#ff8700",
    "#ff875f",
    "#ff8787",
    "#ff87af",
    "#ff87d7",
    "#ff87ff",
    "#ffaf00",
    "#ffaf5f",
    "#ffaf87",
    "#ffafaf",
    "#ffafd7",
    "#ffafff",
    "#ffd700",
    "#ffd75f",
    "#ffd787",
    "#ffd7af",
    "#ffd7d7",
    "#ffd7ff",
    "#ffff00",
    "#ffff5f",
    "#ffff87",
    "#ffffaf",
    "#ffffd7",
    "#ffffff",
    "#080808",
    "#121212",
    "#1c1c1c",
    "#262626",
    "#303030",
    "#3a3a3a",
    "#444444",
    "#4e4e4e",
    "#585858",
    "#626262",
    "#6c6c6c",
    "#767676",
    "#808080",
    "#8a8a8a",
    "#949494",
    "#9e9e9e",
    "#a8a8a8",
    "#b2b2b2",
    "#bcbcbc",
    "#c6c6c6",
    "#d0d0d0",
    "#dadada",
    "#e4e4e4",
    "#eeeeee"
  ];
  function to_html(data) {
    if (data.indexOf("\x1B") === -1)
      return data;
    let result = "";
    let open_spans = 0;
    let i = 0;
    while (i < data.length) {
      if (data[i] === "\x1B" && data[i + 1] === "[") {
        const match = data.slice(i).match(/^\x1B\[([0-9;]+)m/);
        if (match) {
          const codes = match[1].split(";");
          for (const code of codes) {
            if (code === "0") {
              while (open_spans > 0) {
                result += "</span>";
                open_spans--;
              }
            } else {
              let style = "";
              if (ansi_to_hex[code]) {
                const n = parseInt(code, 10);
                if (n >= 40 && n <= 47 || // normal backgrounds
                n >= 100 && n <= 107) {
                  style = `background-color:${ansi_to_hex[code]}`;
                } else {
                  style = `color:${ansi_to_hex[code]}`;
                }
              } else if (codes.length >= 3 && (codes[0] === "38" || codes[0] === "48") && codes[1] === "5") {
                const color_index = parseInt(codes[2]);
                if (color_index >= 0 && color_index < 256) {
                  style = codes[0] === "38" ? `color:${color_256_palette[color_index]}` : `background-color:${color_256_palette[color_index]}`;
                }
              } else if (code === "1") {
                style = "font-weight:bold";
              } else if (code === "3") {
                style = "font-style:italic";
              }
              if (style) {
                result += `<span style="${style}">`;
                open_spans++;
              }
            }
          }
          i += match[0].length;
          continue;
        }
      }
      result += data[i];
      i++;
    }
    while (open_spans > 0) {
      result += "</span>";
      open_spans--;
    }
    return result;
  }
  Color2.to_html = to_html;
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    disable();
  }
})(Color || (Color = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Color,
  Colors,
  colors
});
