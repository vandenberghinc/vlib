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
  Array: () => ArrayUtils,
  ArrayUtils: () => ArrayUtils,
  array: () => ArrayUtils
});
module.exports = __toCommonJS(stdin_exports);
var ArrayUtils;
(function(ArrayUtils2) {
  function append(arr, ...items) {
    return arr.push(...items);
  }
  ArrayUtils2.append = append;
  function walk(arr, handler) {
    return arr.forEach(handler);
  }
  ArrayUtils2.walk = walk;
  function first(arr) {
    return arr[0];
  }
  ArrayUtils2.first = first;
  function last(arr) {
    return arr[arr.length - 1];
  }
  ArrayUtils2.last = last;
  function iterate(arr, start, end, handler) {
    if (typeof start === "function") {
      handler = start;
      start = null;
    }
    if (start == null)
      start = 0;
    if (end == null)
      end = arr.length;
    for (let i = start; i < end; i++) {
      const res = handler(arr[i]);
      if (res != null && !(res instanceof Promise)) {
        return res;
      }
    }
    return null;
  }
  ArrayUtils2.iterate = iterate;
  function is_any(x) {
    return Array.isArray(x);
  }
  ArrayUtils2.is_any = is_any;
  function iterate_reversed(arr, start, end, handler) {
    if (handler == null && start != null) {
      handler = start;
      start = null;
    }
    if (start == null)
      start = 0;
    if (end == null)
      end = arr.length;
    for (let i = end - 1; i >= start; i--) {
      const res = handler(arr[i]);
      if (res != null && !(res instanceof Promise)) {
        return res;
      }
    }
    return null;
  }
  ArrayUtils2.iterate_reversed = iterate_reversed;
  function drop(arr, item) {
    const dropped = [];
    for (const el of arr) {
      if (el !== item)
        dropped.push(el);
    }
    return dropped;
  }
  ArrayUtils2.drop = drop;
  function drop_index(arr, index) {
    const dropped = [];
    for (let i = 0; i < arr.length; i++) {
      if (i !== index)
        dropped.push(arr[i]);
    }
    return dropped;
  }
  ArrayUtils2.drop_index = drop_index;
  function drop_duplicates(arr) {
    return arr.reduce((acc, val) => {
      if (!acc.includes(val))
        acc.push(val);
      return acc;
    }, []);
  }
  ArrayUtils2.drop_duplicates = drop_duplicates;
  function truncate(arr, max) {
    return arr.length > max ? arr.slice(0, max) : arr;
  }
  ArrayUtils2.truncate = truncate;
  function limit_from_end(arr, limit) {
    const limited = [];
    if (arr.length > limit) {
      for (let i = arr.length - limit; i < arr.length; i++) {
        limited.push(arr[i]);
      }
    } else {
      limited.push(...arr);
    }
    return limited;
  }
  ArrayUtils2.limit_from_end = limit_from_end;
  function remove(arr, item) {
    const removed = [];
    for (const el of arr) {
      if (el !== item)
        removed.push(el);
    }
    return removed;
  }
  ArrayUtils2.remove = remove;
  function eq(haystack, needle, from = 0, to = haystack.length - 1) {
    if (needle.length === 0)
      return true;
    if (needle.length > haystack.length)
      return false;
    const start = Math.max(0, from);
    const lastPossible = Math.min(to, haystack.length - 1) - needle.length + 1;
    for (let i = start; i <= lastPossible; i++) {
      let j = 0;
      for (; j < needle.length && haystack[i + j] === needle[j]; j++) {
      }
      if (j === needle.length)
        return true;
    }
    return false;
  }
  ArrayUtils2.eq = eq;
  function deep_eq(x, y) {
    const compare = (a, b) => {
      if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length)
          return false;
        for (let i = 0; i < a.length; i++) {
          if (typeof a[i] === "object" || typeof b[i] === "object") {
            if (!compare(a[i], b[i]))
              return false;
          } else if (a[i] !== b[i]) {
            return false;
          }
        }
        return true;
      } else if (typeof a === "object") {
        if (typeof b !== "object" || Array.isArray(b))
          return false;
        const a_keys = Object.keys(a);
        const b_keys = Object.keys(b);
        if (!compare(a_keys, b_keys))
          return false;
        for (const key of a_keys) {
          if (typeof a[key] === "object" || typeof b[key] === "object") {
            if (!compare(a[key], b[key]))
              return false;
          } else if (a[key] !== b[key]) {
            return false;
          }
        }
        return true;
      } else {
        return a === b;
      }
    };
    return compare(x, y);
  }
  ArrayUtils2.deep_eq = deep_eq;
  function divide(arr, x) {
    if (typeof x !== "number" || x <= 0) {
      throw new Error("Number of nested arrays must be a positive number");
    }
    const result = [];
    const nested_len = Math.ceil(arr.length / x);
    for (let i = 0; i < arr.length; i += nested_len) {
      result.push(arr.slice(i, i + nested_len));
    }
    return result;
  }
  ArrayUtils2.divide = divide;
})(ArrayUtils || (ArrayUtils = {}));
Object.defineProperty(Array.prototype, "append", {
  value: Array.prototype.push,
  writable: true,
  configurable: true,
  enumerable: false
});
Object.defineProperty(Array.prototype, "walk", {
  value: Array.prototype.forEach,
  writable: true,
  configurable: true,
  enumerable: false
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Array,
  ArrayUtils,
  array
});
