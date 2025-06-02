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
  throw_invalid_type: () => throw_invalid_type,
  throw_undefined: () => throw_undefined,
  value_type: () => value_type
});
module.exports = __toCommonJS(stdin_exports);
function value_type(value) {
  if (value == null) {
    return "null";
  } else if (typeof value === "object" && Array.isArray(value)) {
    return "array";
  } else {
    return typeof value;
  }
}
function throw_type_helper(type = [], prefix = "") {
  if (typeof type === "string") {
    return `${prefix}"${type}"`;
  }
  if (Array.isArray(type) && type.length > 0) {
    let str = prefix;
    for (let i = 0; i < type.length; i++) {
      if (typeof type[i] === "function") {
        try {
          str += `"${type[i].name}"`;
        } catch (e) {
          str += `"${type[i]}"`;
        }
      } else {
        str += `"${type[i]}"`;
      }
      if (i === type.length - 2) {
        str += " or ";
      } else if (i < type.length - 2) {
        str += ", ";
      }
    }
    return str;
  }
  return "";
}
function throw_undefined() {
  let opts;
  if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
    opts = arguments[0];
  } else {
    opts = {
      name: arguments[0],
      type: arguments[1],
      throw: arguments[2] !== false
    };
  }
  const err = `Argument "${opts.name}" should be a defined value${throw_type_helper(opts.type, " of type ")}.`;
  if (opts.throw !== false) {
    throw new Error(err);
  }
  return err;
}
function throw_invalid_type() {
  let opts;
  if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
    opts = arguments[0];
  } else {
    opts = {
      name: arguments[0],
      value: arguments[1],
      type: arguments[2],
      throw: arguments[3] !== false
    };
  }
  const err = `Invalid type "${value_type(opts.value)}" for argument "${opts.name}"${throw_type_helper(opts.type, ", the valid type is ")}.`;
  if (opts.throw) {
    throw new Error(err);
  }
  return err;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  throw_invalid_type,
  throw_undefined,
  value_type
});
