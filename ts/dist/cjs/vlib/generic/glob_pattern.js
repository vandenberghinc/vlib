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
  GlobPattern: () => GlobPattern,
  GlobPatternList: () => GlobPatternList
});
module.exports = __toCommonJS(stdin_exports);
class GlobPattern {
  /** The original glob pattern. */
  pattern;
  /** The generated regular expression. */
  regex;
  /**
   * Create a new glob pattern matcher.
   * @param pattern - The glob pattern to compile.
   * @docs
   */
  constructor(pattern) {
    this.pattern = pattern;
    this.regex = GlobPattern.compile(pattern);
  }
  /**
   * Get the length.
   * @docs
   */
  get length() {
    return this.pattern.length;
  }
  /**
   * Update the pattern on the current instance.
   * @param pattern - The new glob pattern.
   * @docs
   */
  update(pattern) {
    this.pattern = pattern;
    this.regex = GlobPattern.compile(pattern);
  }
  /**
   * Test a value against the glob pattern.
   * @param value - The string to test.
   * @returns True when the value matches the pattern.
   * @docs
   */
  test(value) {
    const normalized = value.replace(/\\/g, "/");
    return this.regex.test(normalized);
  }
  /**
   * Test a value against the glob pattern.
   * @param value - The string to test.
   * @returns True when the value matches the pattern.
   * @docs
   */
  match(value) {
    const normalized = value.replace(/\\/g, "/");
    return this.regex.test(normalized);
  }
  /**
   * Filter an array of values by this pattern.
   * @param values - The values to filter.
   * @returns The matched values.
   * @docs
   */
  filter(values) {
    return values.filter((v) => this.test(v));
  }
  /**
   * Static helper to directly match a value.
   * @docs
   */
  static matches(pattern, value) {
    return new GlobPattern(pattern).test(value);
  }
  /**
   * Checks whether a given string is a glob pattern (contains
   * wildcard characters) or just a regular path.
   * @param str - The string to inspect.
   * @returns True if `str` looks like a glob pattern; false otherwise.
   * @docs
   */
  static is(str) {
    for (let i = 0, n = str.length; i < n; ++i) {
      switch (str.charCodeAt(i)) {
        case 42:
        // *
        case 63:
        // ?
        case 91:
        // [
        case 93:
        // ]
        case 123:
        // {
        case 125:
          return true;
      }
    }
    return false;
  }
  /**
   * Compile a glob pattern to a regular expression.
   * @param pattern - The pattern to compile.
   * @returns The compiled regular expression.
   * @docs
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
  /** Cast to primitives. */
  /** Cast to primitives. */
  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case "number":
        return this.pattern.length;
      case "string":
        return this.pattern;
      case "default":
      default:
        return this.toString();
    }
  }
}
;
class GlobPatternList {
  items;
  /**
   * Construct a new glob pattern list.
   * @param list A single glob pattern or an array of glob patterns.
   * @docs
   */
  constructor(list) {
    this.items = Array.isArray(list) ? list.map(GlobPatternList.init_list_item) : [GlobPatternList.init_list_item(list)];
  }
  /** Initialize a list item. */
  static init_list_item(item) {
    return item instanceof GlobPattern || !GlobPattern.is(item) ? item : new GlobPattern(item);
  }
  /**
   * Get the length.
   * @docs
   */
  get length() {
    return this.items.length;
  }
  /**
   * Test if a value matches any of the glob patterns in the list.
   * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
   * @param value - The string to test.
   * @docs
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
   * @docs
   */
  every(value) {
    return this.items.every((p) => typeof p === "string" ? p === value : p.test(value));
  }
  /**
   * Check if an array contains either a string glob patern or a GlobPattern instance.
   * @docs
   */
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
