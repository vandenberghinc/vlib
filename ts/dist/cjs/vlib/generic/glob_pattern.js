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
  GlobPattern: () => GlobPattern
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
}
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobPattern
});
