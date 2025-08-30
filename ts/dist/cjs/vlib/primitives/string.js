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
  String: () => StringUtils,
  string: () => StringUtils
});
module.exports = __toCommonJS(stdin_exports);
var StringUtils;
(function(StringUtils2) {
  function dedent(data, allow_empty_first_line = false) {
    if (allow_empty_first_line) {
      const line_break = data.indexOf("\n");
      if (line_break !== -1) {
        data = data.slice(line_break + 1);
      } else {
        data = data.trimStart();
      }
    }
    const lines = data.split("\n");
    const indent = lines.filter((line) => line.trim()).map((line) => line.match(/^[ \t]*/)?.[0].length ?? Infinity).reduce((min, curr) => Math.min(min, curr), Infinity);
    return lines.map((line) => line.slice(indent)).join("\n").trim();
  }
  StringUtils2.dedent = dedent;
  function first(data) {
    return data[0];
  }
  StringUtils2.first = first;
  function last(data) {
    const s = data;
    return s[s.length - 1];
  }
  StringUtils2.last = last;
  function first_non_whitespace(data, line_break = false) {
    const s = data;
    for (let i = 0; i < s.length; i++) {
      const char = s.charAt(i);
      if (char !== " " && char !== "	" && (!line_break || char !== "\n")) {
        return char;
      }
    }
    return null;
  }
  StringUtils2.first_non_whitespace = first_non_whitespace;
  function last_non_whitespace(data, line_break = false) {
    const s = data;
    for (let i = s.length - 1; i >= 0; i--) {
      const char = s.charAt(i);
      if (char !== " " && char !== "	" && (!line_break || char !== "\n")) {
        return char;
      }
    }
    return null;
  }
  StringUtils2.last_non_whitespace = last_non_whitespace;
  function first_not_of(data, exclude = [], start_index = 0) {
    const s = data;
    for (let i = start_index; i < s.length; i++) {
      if (!exclude.includes(s.charAt(i)))
        return s.charAt(i);
    }
    return null;
  }
  StringUtils2.first_not_of = first_not_of;
  function first_index_not_of(data, exclude = [], start_index = 0) {
    const s = data;
    for (let i = start_index; i < s.length; i++) {
      if (!exclude.includes(s.charAt(i)))
        return i;
    }
    return null;
  }
  StringUtils2.first_index_not_of = first_index_not_of;
  function last_not_of(data, exclude = [], start_index = -1) {
    const s = data;
    let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
    for (let i = idx; i >= 0; i--) {
      if (!exclude.includes(s.charAt(i)))
        return s.charAt(i);
    }
    return null;
  }
  StringUtils2.last_not_of = last_not_of;
  function last_index_not_of(data, exclude = [], start_index = -1) {
    const s = data;
    let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
    for (let i = idx; i >= 0; i--) {
      if (!exclude.includes(s.charAt(i)))
        return i;
    }
    return null;
  }
  StringUtils2.last_index_not_of = last_index_not_of;
  function insert(data, index, substr) {
    const s = data;
    return s.slice(0, index) + substr + s.slice(index);
  }
  StringUtils2.insert = insert;
  function remove_indices(data, start, end) {
    const s = data;
    return s.slice(0, start) + s.slice(end);
  }
  StringUtils2.remove_indices = remove_indices;
  function replace_indices(data, substr, start, end) {
    const s = data;
    return s.slice(0, start) + substr + s.slice(end);
  }
  StringUtils2.replace_indices = replace_indices;
  function eq_first(data, substr, start_index = 0) {
    const s = data;
    if (start_index + substr.length > s.length)
      return false;
    return s.substr(start_index, substr.length) === substr;
  }
  StringUtils2.eq_first = eq_first;
  function eq_last(data, substr) {
    const s = data;
    if (substr.length > s.length)
      return false;
    return s.slice(s.length - substr.length) === substr;
  }
  StringUtils2.eq_last = eq_last;
  function ensure_last(data, ensure_last2) {
    const s = data;
    if (!ensure_last2.includes(s.charAt(s.length - 1)))
      return s + ensure_last2.charAt(0);
    return s;
  }
  StringUtils2.ensure_last = ensure_last;
  function is_uppercase(data, allow_digits = false) {
    const set = allow_digits ? is_uppercase_plus_num_set : StringUtils2.charset.uppercase_set;
    for (let i = 0; i < data.length; i++) {
      if (!set.has(data.charAt(i)))
        return false;
    }
    return true;
  }
  StringUtils2.is_uppercase = is_uppercase;
  const is_uppercase_plus_num_set = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""));
  StringUtils2.charset = {
    /** All uppercase alphabetical characters. */
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    uppercase_set: new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")),
    /** All lowercase alphabetical characters. */
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    lowercase_set: new Set("abcdefghijklmnopqrstuvwxyz".split("")),
    /** All digits. */
    digits: "0123456789",
    digits_set: new Set("0123456789".split(""))
  };
  function capitalize_word(data) {
    const s = data;
    if (StringUtils2.charset.lowercase_set.has(s.charAt(0)))
      return s.charAt(0).toUpperCase() + s.slice(1);
    return s;
  }
  StringUtils2.capitalize_word = capitalize_word;
  function capitalize_words(data) {
    return data.split(/(\s+)/).map((part) => /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part).join("");
  }
  StringUtils2.capitalize_words = capitalize_words;
  function drop(data, char) {
    const exclude = Array.isArray(char) ? char : [char];
    return [...data].filter((c) => !exclude.includes(c)).join("");
  }
  StringUtils2.drop = drop;
  function reverse(data) {
    return data.split("").reverse().join("");
  }
  StringUtils2.reverse = reverse;
  function random(length = 32, charset) {
    let result = "";
    if (charset) {
      for (let i = 0; i < length; i++)
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    } else {
      for (let i = 0; i < length; i++)
        result += default_random_charset.charAt(Math.floor(Math.random() * default_random_charset.length));
    }
    return result;
  }
  StringUtils2.random = random;
  const default_random_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  function is_integer_string(data) {
    return /^[0-9]+$/.test(data);
  }
  StringUtils2.is_integer_string = is_integer_string;
  function is_floating_string(data) {
    return /^[0-9]*\.[0-9]+$/.test(data);
  }
  StringUtils2.is_floating_string = is_floating_string;
  function is_numeric_string(data, info = false) {
    const s = data;
    const integer = /^[0-9]+$/.test(s);
    const floating = /^[0-9]*\.[0-9]+$/.test(s);
    return info ? { integer, floating } : integer || floating;
  }
  StringUtils2.is_numeric_string = is_numeric_string;
  function unquote(data) {
    const s = data;
    if (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'"))
      return s.slice(1, -1);
    return s;
  }
  StringUtils2.unquote = unquote;
  function quote(data, def = '""') {
    if (!data) {
      return def instanceof String ? def.valueOf() : def;
    }
    const s = data;
    if (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'"))
      return s;
    return `"${s}"`;
  }
  StringUtils2.quote = quote;
  function truncate(data, max, truncated_suffix) {
    const truncated = data.length > max ? data.slice(0, max) : data instanceof String ? data.valueOf() : data;
    if (truncated_suffix) {
      return `${truncated}${truncated_suffix}`;
    }
    return truncated;
  }
  StringUtils2.truncate = truncate;
})(StringUtils || (StringUtils = {}));
String.prototype.first = function() {
  return this[0];
};
String.prototype.last = function() {
  return this[this.length - 1];
};
String.prototype.dedent = function(allow_empty_first_line = false) {
  return StringUtils.dedent(this, allow_empty_first_line);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  String,
  string
});
