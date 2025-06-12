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
  Cast: () => Cast,
  cast: () => Cast
});
module.exports = __toCommonJS(stdin_exports);
var Cast;
(function(Cast2) {
  function boolean(str, opts) {
    switch (str) {
      case "true":
      case "True":
      case "TRUE":
      case "1":
        return true;
      case "false":
      case "False":
      case "FALSE":
      case "0":
        return false;
      default:
        if (opts?.preserve) {
          return str;
        }
        if (opts?.strict !== false) {
          return void 0;
        }
        return false;
    }
  }
  Cast2.boolean = boolean;
  function number(str, opts) {
    if (opts?.strict !== false) {
      if (!is_number(str)) {
        if (opts?.preserve) {
          return str;
        }
        return void 0;
      }
    }
    const num = Number(str);
    if (isNaN(num)) {
      if (opts?.preserve) {
        return str;
      }
      return void 0;
    }
    return num;
  }
  Cast2.number = number;
  function is_number(s) {
    const len = s.length;
    if (len === 0)
      return false;
    let i = 0;
    const first = s.charCodeAt(0);
    if (first === 43 || first === 45) {
      if (len === 1)
        return false;
      i++;
    }
    let sawDigits = false;
    while (i < len) {
      const c = s.charCodeAt(i);
      if (c >= 48 && c <= 57) {
        sawDigits = true;
        i++;
      } else {
        break;
      }
    }
    if (i < len && s.charCodeAt(i) === 46) {
      i++;
      let sawFrac = false;
      while (i < len) {
        const c = s.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          sawFrac = true;
          i++;
        } else {
          break;
        }
      }
      if (!sawDigits && !sawFrac)
        return false;
    } else if (!sawDigits) {
      return false;
    }
    return i === len;
  }
  Cast2.is_number = is_number;
})(Cast || (Cast = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Cast,
  cast
});
