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
  Scheme: () => Scheme,
  scheme: () => Scheme
});
module.exports = __toCommonJS(stdin_exports);
var Scheme;
(function(Scheme2) {
  class InternalError {
    data;
    constructor(data) {
      this.data = data;
    }
  }
  function init_scheme_item(scheme_item, scheme, scheme_key) {
    if (typeof scheme_item === "string") {
      scheme_item = { type: scheme_item };
      if (scheme !== void 0 && scheme_key !== void 0) {
        scheme[scheme_key] = scheme_item;
      }
    } else {
      if (scheme_item.def !== void 0) {
        scheme_item.default = scheme_item.def;
        delete scheme_item.def;
      }
    }
    return scheme_item;
  }
  function type_error_str(scheme_item, prefix = " of type ") {
    let type_error_str2 = "";
    if (Array.isArray(scheme_item.type)) {
      type_error_str2 = prefix;
      for (let i = 0; i < scheme_item.type.length; i++) {
        if (typeof scheme_item.type[i] === "function") {
          try {
            type_error_str2 += `"${scheme_item.type[i].name}"`;
          } catch (e) {
            type_error_str2 += `"${scheme_item.type[i]}"`;
          }
        } else {
          type_error_str2 += `"${scheme_item.type[i]}"`;
        }
        if (i === scheme_item.type.length - 2) {
          type_error_str2 += " or ";
        } else if (i < scheme_item.type.length - 2) {
          type_error_str2 += ", ";
        }
      }
    } else {
      type_error_str2 = `${prefix}"${scheme_item.type}"`;
    }
    return type_error_str2;
  }
  function type_string(type = [], prefix = "") {
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
  function verify({ object, data, scheme = {}, value_scheme, tuple_scheme, strict = false, parent = "", error_prefix = "", err_prefix, throw: throw_err = true }) {
    if (data != null)
      object = data;
    if (err_prefix != null)
      error_prefix = err_prefix;
    if (typeof parent === "string" && parent.length > 0 && /[a-zA-Z0-9]+/g.test(parent.charAt(parent.length - 1))) {
      parent += ".";
    }
    const throw_err_h = (e, field) => {
      const invalid_fields = {};
      invalid_fields[field] = e;
      if (throw_err === false) {
        return { error: e, invalid_fields, object: void 0 };
      }
      throw new InternalError({ error: e, invalid_fields, object: void 0 });
    };
    const check_type = (object2, obj_key, scheme_item, type) => {
      if (typeof type === "function") {
        return object2[obj_key] instanceof type;
      }
      switch (type) {
        case "null":
          return object2[obj_key] == null;
        case "array": {
          if (Array.isArray(object2[obj_key]) === false) {
            return false;
          }
          if (scheme_item.scheme || scheme_item.value_scheme) {
            try {
              object2[obj_key] = Scheme2.verify({
                object: object2[obj_key],
                scheme: scheme_item.scheme,
                value_scheme: scheme_item.value_scheme,
                strict,
                parent: `${parent}${obj_key}.`,
                error_prefix,
                throw: true
              });
            } catch (e) {
              if (!throw_err && e instanceof InternalError && e.data) {
                return e.data;
              } else {
                throw e;
              }
            }
          }
          if (typeof scheme_item.min_length === "number" && object2[obj_key].length < scheme_item.min_length) {
            const field = `${parent}${obj_key}`;
            return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object2[obj_key].length}], the minimum length is [${scheme_item.min_length}].`, field);
          }
          if (typeof scheme_item.max_length === "number" && object2[obj_key].length > scheme_item.max_length) {
            const field = `${parent}${obj_key}`;
            return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object2[obj_key].length}], the maximum length is [${scheme_item.max_length}].`, field);
          }
          return true;
        }
        case "object": {
          if (typeof object2[obj_key] !== "object" || object2[obj_key] == null) {
            return false;
          }
          if (scheme_item.scheme || scheme_item.value_scheme) {
            try {
              object2[obj_key] = Scheme2.verify({
                object: object2[obj_key],
                scheme: scheme_item.scheme,
                value_scheme: scheme_item.value_scheme,
                strict,
                parent: `${parent}${obj_key}.`,
                error_prefix,
                throw: true
              });
            } catch (e) {
              if (!throw_err && e.json) {
                return e.json;
              } else {
                throw e;
              }
            }
          }
          return true;
        }
        case "string": {
          if (typeof object2[obj_key] !== "string" && !(object2[obj_key] instanceof String)) {
            return false;
          }
          if (scheme_item.allow_empty !== true && object2[obj_key].length === 0) {
            return 1;
          }
          if (typeof scheme_item.min_length === "number" && object2[obj_key].length < scheme_item.min_length) {
            const field = `${parent}${obj_key}`;
            return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object2[obj_key].length}], the minimum length is [${scheme_item.min_length}].`, field);
          }
          if (typeof scheme_item.max_length === "number" && object2[obj_key].length > scheme_item.max_length) {
            const field = `${parent}${obj_key}`;
            return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object2[obj_key].length}], the maximum length is [${scheme_item.max_length}].`, field);
          }
        }
        default:
          if (type !== typeof object2[obj_key]) {
            return false;
          }
          if (type === "string" && scheme_item.allow_empty !== true && object2[obj_key].length === 0) {
            return 1;
          }
          return true;
      }
    };
    const verify_value_scheme = (scheme_item, key, object2, value_scheme_key = void 0) => {
      if (typeof scheme_item.preprocess === "function") {
        const res = scheme_item.preprocess(object2[key], object2, key);
        if (res !== void 0) {
          object2[key] = res;
        }
      }
      if (scheme_item.type && scheme_item.type !== "any") {
        const is_required = scheme_item.required ?? true;
        if (!((scheme_item.default == null || !is_required) && object2[key] == null)) {
          if (Array.isArray(scheme_item.type)) {
            let correct_type = false;
            let is_empty = false;
            for (let i = 0; i < scheme_item.type.length; i++) {
              const res = check_type(object2, key, scheme_item, scheme_item.type[i]);
              if (typeof res === "object") {
                return res;
              } else if (res === true) {
                correct_type = true;
                break;
              } else if (res === 1) {
                correct_type = true;
                is_empty = true;
                break;
              }
            }
            if (correct_type === false) {
              const field = `${parent}${value_scheme_key || key}`;
              const current_type = Scheme2.value_type(object2[key]);
              return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
            } else if (is_empty && is_required && scheme_item.default !== "") {
              const field = `${parent}${value_scheme_key || key}`;
              return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`, field);
            }
          } else {
            const res = check_type(object2, key, scheme_item, scheme_item.type);
            if (typeof res === "object") {
              return res;
            } else if (res === false) {
              const field = `${parent}${value_scheme_key || key}`;
              const current_type = Scheme2.value_type(object2[key]);
              return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
            } else if (res === 1 && is_required && scheme_item.default !== "") {
              const field = `${parent}${value_scheme_key || key}`;
              return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`, field);
            }
          }
        }
      }
      if (object2[key] === void 0 && scheme_item.default !== void 0) {
        if (typeof scheme_item.default === "function") {
          object2[key] = scheme_item.default(object2);
        } else {
          object2[key] = scheme_item.default;
        }
      }
      if (scheme_item.enum) {
        if (!scheme_item.enum.includes(object2[key])) {
          const field = `${parent}${value_scheme_key || key}`;
          const joined = scheme_item.enum.map((item) => {
            if (item == null) {
              return "null";
            } else if (typeof item !== "string" && !(item instanceof String)) {
              return item.toString();
            }
            return `"${item.toString()}"`;
          }).join(", ");
          return throw_err_h(`${error_prefix}Attribute "${field}" must be one of the following enumerated values [${joined}].`, field);
        }
      }
      if (typeof scheme_item.verify === "function") {
        const err = scheme_item.verify(object2[key], object2, key);
        if (err) {
          return throw_err_h(`${error_prefix}${err}`, `${parent}${value_scheme_key || key}`);
        }
      }
      if (typeof scheme_item.postprocess === "function") {
        const res = scheme_item.postprocess(object2[key], object2, key);
        if (res !== void 0) {
          object2[key] = res;
        }
      }
    };
    if (Array.isArray(object) && Array.isArray(tuple_scheme)) {
      scheme = {};
      let out_obj = {};
      for (let i = 0; i < tuple_scheme.length; i++) {
        out_obj[`argument_${i}`] = object[i];
        if (typeof tuple_scheme[i] === "object") {
          scheme[`tuple_${i}`] = tuple_scheme[i];
        } else {
          scheme[`tuple_${i}`] = { type: tuple_scheme[i] };
        }
      }
    }
    if (Array.isArray(object)) {
      if (value_scheme != null) {
        const scheme_item = init_scheme_item(value_scheme);
        for (let index = 0; index < object.length; index++) {
          const err = verify_value_scheme(scheme_item, index, object);
          if (err) {
            return err;
          }
        }
      }
    } else if (typeof object === "object" && object != null) {
      if (value_scheme != null) {
        const scheme_item = init_scheme_item(value_scheme);
        const keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
          const err = verify_value_scheme(scheme_item, keys[i], object);
          if (err) {
            return err;
          }
        }
      } else {
        const aliases = /* @__PURE__ */ new Map();
        Object.values(scheme).walk((s) => {
          if (typeof s === "object" && s.alias?.length) {
            for (let i = 0; i < s.alias.length; i++) {
              aliases.set(s.alias[i], s);
            }
          }
        });
        if (strict) {
          const object_keys = Object.keys(object);
          for (let x = 0; x < object_keys.length; x++) {
            if (object_keys[x] in scheme === false && !aliases.has(object_keys[x])) {
              const field = `${parent}${object_keys[x]}`;
              return throw_err_h(`${error_prefix}Attribute "${field}" is not a valid attribute name.`, field);
            }
          }
        }
        const scheme_keys = Object.keys(scheme);
        for (let scheme_index = 0; scheme_index < scheme_keys.length; scheme_index++) {
          const scheme_key = scheme_keys[scheme_index];
          if (scheme[scheme_key] == null) {
            continue;
          }
          const scheme_item = init_scheme_item(scheme[scheme_key], scheme, scheme_key);
          if (Array.isArray(scheme_item.alias)) {
            for (let i = 0; i < scheme_item.alias.length; i++) {
              if (object[scheme_item.alias[i]] !== void 0) {
                object[scheme_key] = object[scheme_item.alias[i]];
                delete object[scheme_item.alias[i]];
              }
            }
          } else if (typeof scheme_item.alias === "string") {
            if (object[scheme_item.alias] !== void 0) {
              object[scheme_key] = object[scheme_item.alias];
              delete object[scheme_item.alias];
            }
          }
          if (scheme_key in object === false) {
            if (scheme_item.default !== void 0) {
              if (typeof scheme_item.default === "function") {
                object[scheme_key] = scheme_item.default(object);
              } else {
                object[scheme_key] = scheme_item.default;
              }
            } else {
              if (scheme_item.required === false) {
                continue;
              } else if (typeof scheme_item.required === "function") {
                const required = scheme_item.required(object);
                if (required) {
                  const field = `${parent}${scheme_key}`;
                  return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${type_error_str(scheme_item)}.`, field);
                }
              } else {
                const field = `${parent}${scheme_key}`;
                return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${type_error_str(scheme_item)}.`, field);
              }
            }
            continue;
          }
          const err = verify_value_scheme(scheme_item, scheme_key, object);
          if (err) {
            return err;
          }
        }
      }
    }
    if (throw_err === false) {
      return { error: void 0, invalid_fields: {}, object };
    }
    return object;
  }
  Scheme2.verify = verify;
  function value_type(value) {
    if (value == null) {
      return "null";
    } else if (typeof value === "object" && Array.isArray(value)) {
      return "array";
    } else {
      return typeof value;
    }
  }
  Scheme2.value_type = value_type;
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
    const err = `Argument "${opts.name}" should be a defined value${type_string(opts.type, " of type ")}.`;
    if (opts.throw !== false) {
      throw new Error(err);
    }
    return err;
  }
  Scheme2.throw_undefined = throw_undefined;
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
    const err = `Invalid type "${Scheme2.value_type(opts.value)}" for argument "${opts.name}"${type_string(opts.type, ", the valid type is ")}.`;
    if (opts.throw) {
      throw new Error(err);
    }
    return err;
  }
  Scheme2.throw_invalid_type = throw_invalid_type;
  function cast_bool(str, opts) {
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
        if (opts?.strict) {
          return void 0;
        }
        return false;
    }
  }
  Scheme2.cast_bool = cast_bool;
  function cast_number(str, opts) {
    if (opts?.strict) {
      const regex = /^[+-]?\d+(\.\d+)?$/;
      if (!regex.test(str)) {
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
  Scheme2.cast_number = cast_number;
})(Scheme || (Scheme = {}));
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Scheme,
  scheme
});
