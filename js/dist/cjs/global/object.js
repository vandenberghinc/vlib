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
  Object: () => ObjectUtils
});
module.exports = __toCommonJS(stdin_exports);
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
  function deep_copy(obj) {
    return deep_copy_internal(obj);
  }
  ObjectUtils2.deep_copy = deep_copy;
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
})(ObjectUtils || (ObjectUtils = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Object
});
