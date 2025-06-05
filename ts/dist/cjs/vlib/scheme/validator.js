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
  Validator: () => Validator,
  validate: () => validate
});
module.exports = __toCommonJS(stdin_exports);
var import_throw = require("./throw.js");
var import_entry = require("./entry.js");
var import_scheme = require("./scheme.js");
var import_cast = require("./cast.js");
class Validator {
  /** The scheme to validate. */
  scheme;
  /** The value scheme for object values or array items. */
  value_scheme;
  /** Is an array with tuple mode enabled. */
  is_tuple;
  /**
   * Allow unknown attributes
   * When `false`, errors will be thrown when unknown attributes are found.
   * Defaults to `true`.
   */
  unknown;
  /** The parent prefix. */
  parent;
  /** The error prefix. */
  error_prefix;
  /** Throw occurred errors, defaults to `false` */
  throw;
  /** Constructor. */
  constructor(mode, opts) {
    this.unknown = opts.unknown ?? true;
    this.parent = opts.parent ?? "";
    this.error_prefix = opts.error_prefix ?? opts.err_prefix ?? "";
    if (opts.scheme)
      this.scheme = opts.scheme instanceof import_scheme.Scheme ? opts.scheme : new import_scheme.Scheme(opts.scheme);
    if (opts.value_scheme)
      this.value_scheme = opts.value_scheme instanceof import_entry.Entry ? opts.value_scheme : new import_entry.Entry(opts.value_scheme);
    this.throw = opts.throw ?? false;
    if (typeof this.parent === "string" && this.parent.length > 0 && /[a-zA-Z0-9]+/g.test(this.parent.charAt(this.parent.length - 1))) {
      this.parent += ".";
    }
    this.is_tuple = false;
    if (mode === "array" && Array.isArray(opts.tuple)) {
      this.is_tuple = true;
      const scheme = {};
      for (let i = 0; i < opts.tuple.length; i++) {
        if (typeof opts.tuple[i] === "object") {
          scheme[`tuple_${i}`] = opts.tuple[i];
        } else {
          scheme[`tuple_${i}`] = { type: opts.tuple[i] };
        }
      }
      this.scheme = new import_scheme.Scheme(scheme);
    }
  }
  /** Throw an error or return error object. */
  throw_error(e, field) {
    const invalid_fields = {};
    invalid_fields[field] = e;
    return { error: this.error_prefix + e, invalid_fields };
  }
  /**
   * Check type of the parameter function.
   * Scheme key may also be an index for when object is an array.
   */
  check_type(object, obj_key, entry, type) {
    if (typeof type === "function") {
      return object[obj_key] instanceof type;
    }
    switch (type) {
      // Any so no filter.
      case "any":
        return true;
      // Null types.
      case "null":
        return object[obj_key] === null;
      case "undefined":
        return object[obj_key] === void 0;
      // Array types.
      case "array": {
        if (Array.isArray(object[obj_key]) === false) {
          return false;
        }
        if (entry.scheme || entry.value_scheme) {
          const validator = new Validator("array", {
            // scheme: scheme_item.scheme,
            value_scheme: entry.value_scheme,
            tuple: entry.tuple,
            unknown: this.unknown,
            parent: `${this.parent}${obj_key}.`,
            error_prefix: this.error_prefix,
            throw: false
          });
          const res = validator.validate(object[obj_key]);
          if (res.error) {
            return res;
          }
          object[obj_key] = res.data;
        }
        if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
          const field = `${this.parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`, field);
        }
        if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
          const field = `${this.parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`, field);
        }
        return true;
      }
      // Object types.
      case "object": {
        if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
          return false;
        }
        if (entry.scheme || entry.value_scheme) {
          const validator = new Validator("object", {
            scheme: entry.scheme,
            value_scheme: entry.value_scheme,
            tuple: entry.tuple,
            unknown: this.unknown,
            parent: `${this.parent}${obj_key}.`,
            error_prefix: this.error_prefix,
            throw: false
          });
          const res = validator.validate(object[obj_key]);
          if (res.error) {
            return res;
          }
          object[obj_key] = res.data;
        }
        return true;
      }
      // String types.
      case "string": {
        if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
          return false;
        }
        if (entry.allow_empty !== true && object[obj_key].length === 0) {
          return "empty";
        }
        if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
          const field = `${this.parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`, field);
        }
        if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
          const field = `${this.parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`, field);
        }
        if (type !== typeof object[obj_key]) {
          return false;
        }
        if (entry.allow_empty !== true && object[obj_key].length === 0) {
          return "empty";
        }
        return true;
      }
      // Number type.
      case "number": {
        if (type !== typeof object[obj_key]) {
          return false;
        }
        if (entry.allow_empty !== true && isNaN(object[obj_key])) {
          return "empty";
        }
        if (typeof entry.min === "number" && object[obj_key] < entry.min) {
          const field = `${this.parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an value [${object[obj_key].length}], the minimum is [${entry.min}].`, field);
        }
        if (typeof entry.max === "number" && object[obj_key] > entry.max) {
          const field = `${this.parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`, field);
        }
        return true;
      }
      // Boolean
      case "boolean": {
        if (type !== typeof object[obj_key]) {
          return false;
        }
        return true;
      }
      default:
        throw new Validator.InvalidUsageError(`Unsupported type "${type.toString()}".`);
    }
  }
  /** Validate a value ban entry. */
  validate_entry(entry, key, object, value_scheme_key) {
    if (entry.cast && typeof object[key] === "string") {
      if (entry.cast.type === "boolean") {
        const v = import_cast.Cast.boolean(object[key], entry.cast.opts);
        if (v !== void 0) {
          object[key] = v;
        }
      } else if (entry.cast.type === "number") {
        const v = import_cast.Cast.number(object[key], entry.cast.opts);
        if (v !== void 0) {
          object[key] = v;
        }
      }
    }
    if (typeof entry.preprocess === "function") {
      const res = entry.preprocess(object[key], object, key);
      if (res !== void 0) {
        object[key] = res;
      }
    }
    if (entry.type && entry.type !== "any") {
      const is_required = entry.required ?? true;
      if (!((entry.default == null || !is_required) && object[key] == null)) {
        if (Array.isArray(entry.type)) {
          let correct_type = false;
          let is_empty = false;
          for (let i = 0; i < entry.type.length; i++) {
            const res = this.check_type(object, key, entry, entry.type[i]);
            if (typeof res === "object") {
              return res;
            } else if (res === true) {
              correct_type = true;
              break;
            } else if (res === "empty") {
              correct_type = true;
              is_empty = true;
              break;
            }
          }
          if (correct_type === false) {
            const field = `${this.parent}${value_scheme_key || key}`;
            const current_type = (0, import_throw.value_type)(object[key]);
            return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
          } else if (is_empty && is_required && entry.default !== "") {
            const field = `${this.parent}${value_scheme_key || key}`;
            return this.throw_error(`Attribute "${field}" is an empty string.`, field);
          }
        } else {
          const res = this.check_type(object, key, entry, entry.type);
          if (typeof res === "object") {
            return res;
          } else if (res === false) {
            const field = `${this.parent}${value_scheme_key || key}`;
            const current_type = (0, import_throw.value_type)(object[key]);
            return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
          } else if (res === "empty" && is_required && entry.default !== "") {
            const field = `${this.parent}${value_scheme_key || key}`;
            return this.throw_error(`Attribute "${field}" is an empty string.`, field);
          }
        }
      }
    }
    if (object[key] === void 0 && entry.default !== void 0) {
      if (typeof entry.default === "function") {
        object[key] = entry.default(object);
      } else {
        object[key] = entry.default;
      }
    }
    if (entry.charset && typeof object[key] === "string") {
      if (!entry.charset.test(object[key])) {
        const field = `${this.parent}${value_scheme_key || key}`;
        return this.throw_error(`Attribute "${field}" has an invalid charset, expected: ${entry.charset.toString()}.`, field);
      }
    }
    if (entry.enum) {
      if (!entry.enum.includes(object[key])) {
        const field = `${this.parent}${value_scheme_key || key}`;
        const joined = entry.enum.map((item) => {
          if (item == null) {
            return "null";
          } else if (typeof item !== "string" && !(item instanceof String)) {
            return item.toString();
          }
          return `"${item.toString()}"`;
        }).join(", ");
        return this.throw_error(`Attribute "${field}" must be one of the following enumerated values [${joined}].`, field);
      }
    }
    if (typeof entry.verify === "function") {
      const err = entry.verify(object[key], object, key);
      if (err) {
        return this.throw_error(err, `${this.parent}${value_scheme_key || key}`);
      }
    }
    if (typeof entry.postprocess === "function") {
      const res = entry.postprocess(object[key], object, key);
      if (res !== void 0) {
        object[key] = res;
      }
    }
  }
  /** Perform the validation on the data. */
  validate_data(data) {
    if (!this.is_tuple && Array.isArray(data)) {
      if (this.value_scheme != null) {
        for (let index = 0; index < data.length; index++) {
          const err = this.validate_entry(this.value_scheme, index, data);
          if (err) {
            return err;
          }
        }
      } else {
        throw new Validator.InvalidUsageError(`Invalid scheme for array, expected value_scheme, got: ${JSON.stringify({ scheme: this.scheme, value_scheme: this.value_scheme })}`);
      }
    } else if (data != null && typeof data === "object" && !Array.isArray(data)) {
      if (this.value_scheme != null) {
        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
          const err = this.validate_entry(this.value_scheme, keys[i], data);
          if (err) {
            return err;
          }
        }
      } else if (this.scheme instanceof import_scheme.Scheme) {
        const aliases = this.scheme.aliases;
        if (!this.unknown) {
          const object_keys = Object.keys(data);
          for (let x = 0; x < object_keys.length; x++) {
            if (!this.scheme.has(object_keys[x]) && !aliases.has(object_keys[x])) {
              const field = `${this.parent}${object_keys[x]}`;
              return this.throw_error(`Attribute "${field}" is not a valid attribute name.`, field);
            }
          }
        }
        for (const [entry_key, entry] of this.scheme.entries()) {
          if (entry == null) {
            continue;
          }
          if (Array.isArray(entry.alias)) {
            for (let i = 0; i < entry.alias.length; i++) {
              if (data[entry.alias[i]] !== void 0) {
                data[entry_key] = data[entry.alias[i]];
                delete data[entry.alias[i]];
              }
            }
          } else if (typeof entry.alias === "string") {
            if (data[entry.alias] !== void 0) {
              data[entry_key] = data[entry.alias];
              delete data[entry.alias];
            }
          }
          if (entry_key in data === false) {
            if (entry.default !== void 0) {
              if (typeof entry.default === "function") {
                data[entry_key] = entry.default(data);
              } else {
                data[entry_key] = entry.default;
              }
            } else {
              if (entry.required === false) {
                continue;
              } else if (typeof entry.required === "function") {
                const required = entry.required(data);
                if (required) {
                  const field = `${this.parent}${entry_key}`;
                  return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
                }
              } else {
                const field = `${this.parent}${entry_key}`;
                return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
              }
            }
            continue;
          }
          const err = this.validate_entry(entry, entry_key, data);
          if (err) {
            return err;
          }
        }
      } else {
        throw new Validator.InvalidUsageError(`Invalid scheme for object, expected scheme or value_scheme, got: ${JSON.stringify({ scheme: this.scheme, value_scheme: this.value_scheme })}`);
      }
    }
    return { data };
  }
  /** Run the validator. */
  validate(data) {
    if (this.is_tuple && Array.isArray(data)) {
      const new_data = {};
      for (let i = 0; i < data.length; i++) {
        new_data[`tuple_${i}`] = data[i];
      }
      data = new_data;
    }
    const res = this.validate_data(data);
    if (res.error) {
      if (this.throw) {
        throw new Validator.Error(res);
      }
      return res;
    }
    if (res.data && this.is_tuple && Array.isArray(res.data)) {
      const new_data = [];
      const keys = Object.keys(res.data);
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith("tuple_")) {
          const index = parseInt(keys[i].substring(6), 10);
          new_data[index] = res.data[keys[i]];
        } else {
        }
      }
      res.data = new_data;
    }
    return res;
  }
}
(function(Validator2) {
  class Error2 extends globalThis.Error {
    info;
    constructor(info) {
      super(info.error);
      this.info = info;
      this.name = "ValidatorError";
      this.message = info.error;
    }
  }
  Validator2.Error = Error2;
  class InvalidUsageError extends globalThis.Error {
    constructor(msg) {
      super(msg);
      this.name = "InvalidUsageError";
      this.message = msg;
    }
  }
  Validator2.InvalidUsageError = InvalidUsageError;
})(Validator || (Validator = {}));
function validate(data, opts) {
  return new Validator(Array.isArray(data) ? "array" : "object", opts).validate(data);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Validator,
  validate
});
