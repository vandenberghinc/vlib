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
  Object: () => ObjectUtils,
  ObjectUtils: () => ObjectUtils
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
var ObjectUtils;
(function(ObjectUtils2) {
  function expand(x, y) {
    const keys = Object.keys(y);
    for (const key of keys) {
      x[key] = y[key];
    }
    return x;
  }
  ObjectUtils2.expand = expand;
  function eq(x, y) {
    return obj_eq(x, y);
  }
  ObjectUtils2.eq = eq;
  function detect_changes(x, y, include_nested = false) {
    return obj_eq(x, y, true, include_nested);
  }
  ObjectUtils2.detect_changes = detect_changes;
  function rename_keys(obj, rename = [], remove = []) {
    for (const key of remove) {
      delete obj[key];
    }
    for (const [oldKey, newKey] of rename) {
      if (oldKey in obj) {
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
      }
    }
    return obj;
  }
  ObjectUtils2.rename_keys = rename_keys;
  function filter(obj, callback, opts) {
    return typeof callback === "function" ? filter_helper(obj, callback, opts, []) : filter_helper(obj, callback.callback, callback, []);
  }
  ObjectUtils2.filter = filter;
  function filter_helper(obj, callback, opts, _parents) {
    if (obj == null) {
      throw new TypeError("ObjectUtils.filter: The object to filter must not be null or undefined.");
    }
    const added = {};
    const keys = Object.keys(obj);
    for (const key in keys) {
      if (!callback(obj[key], key, _parents)) {
        if (opts?.update) {
          delete obj[key];
        }
        continue;
      }
      let v = obj[key];
      if (Array.isArray(v)) {
        const nested_parents = [..._parents, [key, obj[key]]];
        for (let i = 0; i < v.length; i++) {
          if (typeof v[i] === "object" && v[i] !== null) {
            v[i] = filter_helper(v[i], callback, opts, [...nested_parents, [i.toString(), v[i]]]);
          }
        }
      } else if (opts?.recursive && typeof v === "object" && v !== null) {
        v = filter_helper(v, callback, opts, [..._parents, [key, obj[key]]]);
      }
      if (opts?.update) {
        obj[key] = v;
      } else {
        added[key] = v;
      }
    }
    if (opts?.update) {
      return obj;
    }
    return added;
  }
  function delete_recursively(obj, remove_keys = []) {
    function clean(o) {
      if (Array.isArray(o)) {
        for (const item of o) {
          if (item && typeof item === "object")
            clean(item);
        }
      } else if (o && typeof o === "object") {
        for (const key of Object.keys(o)) {
          if (remove_keys.includes(key)) {
            delete o[key];
          } else if (o[key] && typeof o[key] === "object") {
            clean(o[key]);
          }
        }
      }
    }
    clean(obj);
    return obj;
  }
  ObjectUtils2.delete_recursively = delete_recursively;
  function partial_copy(obj, keys) {
    const out = {};
    for (const key of keys) {
      if (key in obj) {
        out[key] = obj[key];
      }
    }
    return out;
  }
  ObjectUtils2.partial_copy = partial_copy;
  function deep_copy(obj) {
    return deep_copy_internal(obj);
  }
  ObjectUtils2.deep_copy = deep_copy;
  function obj_eq(x, y, detect_keys = false, detect_keys_nested = false) {
    if (typeof x !== typeof y) {
      return false;
    } else if (x instanceof String) {
      return x.toString() === y.toString();
    } else if (Array.isArray(x)) {
      if (!Array.isArray(y) || x.length !== y.length) {
        return false;
      }
      for (let i = 0; i < x.length; i++) {
        if (!obj_eq(x[i], y[i])) {
          return false;
        }
      }
      return true;
    } else if (x && typeof x === "object") {
      const changes = [];
      const x_keys = Object.keys(x);
      const y_keys = Object.keys(y);
      if (x_keys.length !== y_keys.length) {
        return false;
      }
      for (const key of x_keys) {
        const result = obj_eq(x[key], y[key], detect_keys, detect_keys_nested);
        if (detect_keys) {
          if (result === true) {
            changes.push(key);
          } else if (Array.isArray(result) && result.length > 0) {
            changes.push(key);
            if (detect_keys_nested) {
              changes.push(...result);
            }
          }
        } else if (result !== true) {
          return false;
        }
      }
      return detect_keys ? changes.length ? changes : null : true;
    } else {
      return x === y;
    }
  }
  function deep_copy_internal(obj) {
    if (Array.isArray(obj)) {
      const copy = [];
      for (const item of obj) {
        copy.push(deep_copy_internal(item));
      }
      return copy;
    } else if (obj && obj instanceof String) {
      return new String(obj.toString());
    } else if (obj && typeof obj === "object") {
      const copy = {};
      for (const key of Object.keys(obj)) {
        copy[key] = deep_copy_internal(obj[key]);
      }
      return copy;
    } else {
      return obj;
    }
  }
  function _stringify_helper(value, indent_level, nested_depth, opts, circular_cache) {
    let indent = indent_level === false ? "" : opts._indent_str?.repeat(indent_level) ?? "";
    let next_indent = indent_level === false ? "" : opts._indent_str?.repeat(indent_level + 1) ?? "";
    let line_break_or_space = indent_level === false ? " " : "\n";
    if (value === null || opts.json && value === void 0) {
      return opts.colored ? `${import_colors.Colors.gray}null${import_colors.Colors.end}` : "null";
    }
    if (value === void 0) {
      return opts.colored ? `${import_colors.Colors.gray}undefined${import_colors.Colors.end}` : "undefined";
    }
    if (value instanceof Date) {
      return opts.colored ? `${import_colors.Colors.magenta}Date(${value.toLocaleDateString()})${import_colors.Colors.end}` : `Date(${value.toLocaleDateString()})`;
    }
    const is_raw_array = Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype;
    let proto;
    const is_raw_obj = value != null && typeof value === "object" && ((proto = Object.getPrototypeOf(value)) === Object.prototype || proto === null);
    if (is_raw_array && value.length <= 3 || typeof value === "object" && Object.keys(value).length <= 3) {
      const keys = Object.keys(value);
      let len = 0, max_len = 100;
      for (const key of keys) {
        len += key.length + 2;
        if (len > max_len) {
          len = -1;
          break;
        }
        const t = typeof value[key];
        if (t === "string") {
          len += value[key].length;
        } else if (t === "number" || t === "boolean") {
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
    if (is_raw_array) {
      if (value.length === 0) {
        return opts.colored ? import_colors.Colors.light_gray + "[]" + import_colors.Colors.end : "[]";
      } else if (opts.max_depth != null && nested_depth > opts.max_depth) {
        return opts.colored ? `${import_colors.Colors.cyan}[Array]${import_colors.Colors.end}` : `[Array]`;
      } else if (circular_cache.has(value)) {
        return opts.colored ? `${import_colors.Colors.cyan}[Circular Array]${import_colors.Colors.end}` : `[Circular Array]`;
      }
      circular_cache.add(value);
      const items = value.map((v) => `${next_indent}${_stringify_helper(v, indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache)}`).join(opts.colored ? import_colors.Colors.light_gray + "," + import_colors.Colors.end + line_break_or_space : "," + line_break_or_space);
      return [
        opts.colored ? import_colors.Colors.light_gray + "[" + import_colors.Colors.end : "[",
        items,
        opts.colored ? `${indent}${import_colors.Colors.light_gray}]${import_colors.Colors.end}` : `${indent}]`
      ].join(line_break_or_space);
    }
    if (is_raw_obj) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return opts.colored ? `${import_colors.Colors.light_gray}{}${import_colors.Colors.end}` : "{}";
      } else if (opts.max_depth != null && nested_depth > opts.max_depth) {
        return opts.colored ? `${import_colors.Colors.cyan}[Object]${import_colors.Colors.end}` : "[Object]";
      } else if (circular_cache.has(value)) {
        return opts.colored ? `${import_colors.Colors.cyan}[Circular Object]${import_colors.Colors.end}` : "[Circular Object]";
      }
      circular_cache.add(value);
      const items = [];
      let total_len = 0;
      for (const key of keys) {
        const formatted_key = opts.json || !/^[\w]+$/.test(key) ? JSON.stringify(key) : key;
        const colored_key = opts.colored ? `${import_colors.Colors.cyan}${formatted_key}${import_colors.Colors.end}` : `${formatted_key}`;
        const colored_val = _stringify_helper(value[key], indent_level === false ? indent_level : indent_level + 1, nested_depth + 1, opts, circular_cache);
        const item = `${next_indent}${colored_key}${opts.colored ? import_colors.Colors.light_gray : ""}: ${opts.colored ? import_colors.Colors.end : ""}${colored_val}`;
        if (opts.max_length != null && item.length + total_len > opts.max_length) {
          if (total_len < opts.max_length) {
            items.push(`${indent}${item.slice(0, opts.max_length - total_len)}${import_colors.Colors.end} ${opts.colored ? import_colors.Color.red_bold("... [truncated]") : "... [truncated]"}`);
          } else {
            items.push(`${next_indent}${opts.colored ? import_colors.Color.red_bold("... [truncated]") : "... [truncated"}`);
          }
          break;
        }
        items.push(item);
        total_len += item.length;
      }
      const items_str = items.join(opts.colored ? import_colors.Colors.light_gray + "," + import_colors.Colors.end + line_break_or_space : "," + line_break_or_space);
      const header = opts.colored ? `${import_colors.Colors.light_gray}{${import_colors.Colors.end}` : "{";
      return [
        header,
        items_str,
        indent + (opts.colored ? `${import_colors.Colors.light_gray}}${import_colors.Colors.end}` : "}")
      ].join(line_break_or_space);
    }
    switch (typeof value) {
      case "string":
        return opts.colored ? `${import_colors.Colors.green}${JSON.stringify(value)}${import_colors.Colors.end}` : JSON.stringify(value);
      case "number":
        return opts.colored ? `${import_colors.Colors.yellow}${value.toString()}${import_colors.Colors.end}` : value.toString();
      case "boolean":
        return opts.colored ? `${import_colors.Colors.yellow}${value.toString()}${import_colors.Colors.end}` : value.toString();
      case "function":
        return opts.colored ? `${import_colors.Colors.cyan}[Function]${import_colors.Colors.end}` : "[Function]";
      default:
        if (value instanceof String || value instanceof Number || value instanceof Boolean || value instanceof RegExp) {
          value = value.toString();
        }
        if (opts.json) {
          return opts.colored ? `"${import_colors.Colors.magenta}${String(value)}${import_colors.Colors.end}"` : `"${String(value)}"`;
        }
        return opts.colored ? `${import_colors.Colors.magenta}${String(value)}${import_colors.Colors.end}` : String(value);
    }
  }
  function stringify(value, opts) {
    if (opts?.filter && typeof value === "object" && value !== null) {
      value = filter(value, opts.filter);
    }
    const circular_cache = /* @__PURE__ */ new Set();
    opts ??= {};
    opts.indent ??= 4;
    if (typeof opts.indent === "number" && opts.indent < 0) {
      opts.indent = false;
    }
    opts.start_indent ??= 0;
    if (opts.indent !== false) {
      opts._indent_str ??= "    ";
    }
    return _stringify_helper(value, opts.indent === false ? false : opts.start_indent, 0, opts, circular_cache);
  }
  ObjectUtils2.stringify = stringify;
})(ObjectUtils || (ObjectUtils = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Object,
  ObjectUtils
});
