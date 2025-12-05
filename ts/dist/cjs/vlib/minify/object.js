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
  Object: () => MinifyObject,
  object: () => MinifyObject
});
module.exports = __toCommonJS(stdin_exports);
var import_object = require("../primitives/object.js");
var MinifyObject;
(function(MinifyObject2) {
  function flatten_scheme(scheme, prefix = "", result = {}) {
    for (const key in scheme) {
      if (!Object.prototype.hasOwnProperty.call(scheme, key))
        continue;
      const node = scheme[key];
      const full_path = prefix ? `${prefix}.${key}` : key;
      if (node.key) {
        result[full_path] = node.key;
      }
      if (node.scheme) {
        flatten_scheme(node.scheme, full_path, result);
      }
    }
    return result;
  }
  MinifyObject2.flatten_scheme = flatten_scheme;
  function minify({ object, scheme, flat_scheme }) {
    if (scheme) {
      flat_scheme = flatten_scheme(scheme);
    }
    if (flat_scheme == null) {
      throw new Error("Either scheme or flat_scheme must be provided");
    }
    function _minify(obj, prefix = "") {
      if (Array.isArray(obj)) {
        return obj.map((item) => typeof item === "object" && item !== null ? _minify(item, prefix) : item);
      } else if (obj !== null && typeof obj === "object") {
        const result = {};
        for (const prop in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, prop))
            continue;
          const full_path = prefix ? `${prefix}.${prop}` : prop;
          const mapped_key = flat_scheme[full_path] || prop;
          result[mapped_key] = _minify(obj[prop], full_path);
        }
        return result;
      }
      return obj;
    }
    return _minify(object);
  }
  MinifyObject2.minify = minify;
  function expand({ object, scheme, flat_scheme, copy = true }) {
    if (scheme) {
      flat_scheme = flatten_scheme(scheme);
    } else if (flat_scheme) {
      flat_scheme = { ...flat_scheme };
    } else {
      throw new Error("Either scheme or flat_scheme must be provided");
    }
    const minified_obj = copy ? import_object.ObjectUtils.shallow_copy(object) : object;
    const flat_entries = Object.entries(flat_scheme).map((e) => [e[0].split("."), e[0], e[1].split("."), e[1]]);
    flat_entries.sort((a, b) => a[0].length - b[0].length);
    for (const entry of flat_entries) {
      const [og_path] = entry;
      if (og_path.length === 1)
        continue;
      const parent_path = og_path.slice(0, -1).join(".");
      const og_parent = flat_entries.find((x) => x[1] === parent_path);
      if (og_parent) {
        entry[2] = [...og_parent[2], ...entry[2]];
        entry[3] = entry[2].join(".");
      }
    }
    const alias_to_original = {};
    for (const [og_path_arr, , alias_arr, alias_str] of flat_entries) {
      alias_to_original[alias_str] = og_path_arr;
    }
    function rec_expand(node, base_alias_path) {
      if (Array.isArray(node)) {
        return node.map((item) => typeof item === "object" && item !== null ? rec_expand(item, base_alias_path) : item);
      } else if (node !== null && typeof node === "object") {
        const result = {};
        for (const key in node) {
          if (!Object.prototype.hasOwnProperty.call(node, key))
            continue;
          const new_alias_path = [...base_alias_path, key];
          const alias_path_str = new_alias_path.join(".");
          let original_key;
          if (alias_path_str in alias_to_original) {
            const original_full_path = alias_to_original[alias_path_str];
            original_key = original_full_path[original_full_path.length - 1];
          } else {
            original_key = key;
          }
          result[original_key] = rec_expand(node[key], new_alias_path);
        }
        return result;
      }
      return node;
    }
    const expanded_obj = rec_expand(minified_obj, []);
    return expanded_obj;
  }
  MinifyObject2.expand = expand;
})(MinifyObject || (MinifyObject = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Object,
  object
});
