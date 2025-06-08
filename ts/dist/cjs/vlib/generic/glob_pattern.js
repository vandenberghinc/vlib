var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  GlobPattern: () => GlobPattern,
  GlobPatternList: () => GlobPatternList
});
module.exports = __toCommonJS(stdin_exports);
var import_path = __toESM(require("path"));
class GlobPattern {
  /** The original glob pattern. */
  pattern;
  /** The generated regular expression. */
  regex;
  /**
   * Create a new glob pattern matcher.
   * @param pattern - The glob pattern to compile.
   */
  constructor(pattern) {
    this.pattern = pattern;
    this.regex = GlobPattern.compile(pattern);
  }
  /**
   * Update the pattern on the current instance.
   * @param pattern - The new glob pattern.
   */
  update(pattern) {
    this.pattern = pattern;
    this.regex = GlobPattern.compile(pattern);
  }
  /**
   * Test a value against the glob pattern.
   * @param value - The string to test.
   * @returns True when the value matches the pattern.
   * @funcs 2
   */
  test(value) {
    const normalized = value.replace(/\\/g, "/");
    return this.regex.test(normalized);
  }
  match(value) {
    const normalized = value.replace(/\\/g, "/");
    return this.regex.test(normalized);
  }
  /**
   * Filter an array of values by this pattern.
   * @param values - The values to filter.
   * @returns The matched values.
   */
  filter(values) {
    return values.filter((v) => this.test(v));
  }
  /**
   * Static helper to directly match a value.
   */
  static matches(pattern, value) {
    return new GlobPattern(pattern).test(value);
  }
  /**
   * Checks whether a given string is a glob pattern (contains
   * wildcard characters) or just a regular path.
   * @param str - The string to inspect.
   * @returns True if `str` looks like a glob pattern; false otherwise.
   */
  static is(str) {
    return /[\*\?\[\]\{\}]/.test(str);
  }
  /**
   * Compile a glob pattern to a regular expression.
   * @param pattern - The pattern to compile.
   * @returns The compiled regular expression.
   */
  static compile(pattern) {
    pattern = pattern.replace(/\\/g, "/");
    let regex = "^";
    let i = 0;
    let in_group = false;
    while (i < pattern.length) {
      const char = pattern[i];
      if (char === "\\") {
        regex += "\\" + pattern[i + 1];
        i += 2;
        continue;
      }
      if (char === "?") {
        regex += "[^/]";
        i++;
        continue;
      }
      if (char === "*") {
        if (pattern[i + 1] === "*") {
          if (pattern[i + 2] === "/") {
            regex += "(?:.*/)?";
            i += 3;
            continue;
          }
          regex += ".*";
          i += 2;
          continue;
        }
        regex += "[^/]*";
        i++;
        continue;
      }
      if (char === "[") {
        let j = i + 1;
        let neg = false;
        if (pattern[j] === "!") {
          neg = true;
          j++;
        }
        let set = "";
        for (; j < pattern.length && pattern[j] !== "]"; j++) {
          const ch = pattern[j];
          set += ch;
        }
        if (j === pattern.length) {
          regex += "\\[";
          i++;
          continue;
        }
        const esc_set = set.replace(/\\/g, "\\");
        regex += neg ? `[^${esc_set}]` : `[${esc_set}]`;
        i = j + 1;
        continue;
      }
      if (char === "{") {
        regex += "(?:";
        in_group = true;
        i++;
        continue;
      }
      if (char === "}") {
        regex += ")";
        in_group = false;
        i++;
        continue;
      }
      if (char === "," && in_group) {
        regex += "|";
        i++;
        continue;
      }
      if ("+.^$|()".indexOf(char) !== -1) {
        regex += "\\" + char;
      } else {
        regex += char;
      }
      i++;
    }
    regex += "$";
    return new RegExp(regex);
  }
  /** To string */
  toString() {
    return `GlobPattern("${this.pattern}")`;
  }
}
;
class GlobPatternList {
  items;
  absolute;
  /**
   *
   * @param list A single glob pattern or an array of glob patterns.
   * @param opts Options to configure the list.
   * @param opts.absolute When true, all string patterns are resolved to absolute paths using `path.resolve()`.
   *                      This is useful when you want to ensure all patterns are absolute paths.
   *                      Defaults to false.
   */
  constructor(list, opts) {
    this.absolute = opts?.absolute ?? false;
    const init_item = (item) => {
      if (this.absolute && typeof item === "string") {
        item = import_path.default.resolve(item);
      }
      return item instanceof GlobPattern || !GlobPattern.is(item) ? item : new GlobPattern(item);
    };
    this.items = Array.isArray(list) ? list.map(init_item) : [init_item(list)];
  }
  /**
   * Test if a value matches any of the glob patterns in the list.
   * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
   * @param value - The string to test.
   */
  match(value) {
    return this.items.some((p) => typeof p === "string" ? p === value : p.test(value));
  }
  test(value) {
    return this.match(value);
  }
  some(value) {
    return this.match(value);
  }
  /**
   * Test if a value matches all glob patterns in the list.
   * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
   * @param value - The string to test.
   */
  every(value) {
    return this.items.every((p) => typeof p === "string" ? p === value : p.test(value));
  }
  /** Check if an array contains either a string glob patern or a GlobPattern instance. */
  static is(list) {
    return list.some((item) => item instanceof GlobPattern || GlobPattern.is(item));
  }
  /** To string */
  toString() {
    return `GlobPatternList("${this.items.join(", ")}")`;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobPattern,
  GlobPatternList
});
