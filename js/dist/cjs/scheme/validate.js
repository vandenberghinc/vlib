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
  validate: () => validate
});
module.exports = __toCommonJS(stdin_exports);
var import_throw = require("./throw.js");
var import_entry = require("./entry.js");
var import_scheme = require("./scheme.js");
class Validate {
  /** The data object to validate. */
  data;
  /** The scheme to validate. */
  scheme;
  /** The value scheme for object values or array items. */
  value_scheme;
  /** The tuple scheme for when the object is an array. */
  tuple;
  /** Throw an error or return a response with a potential error attr. */
  throw;
  /**
   * Strict mode, enabled the following features.
   * 1) Errors will be thrown for unknown attributes.
   */
  strict;
  /** The parent prefix. */
  parent;
  /** The error prefix. */
  error_prefix;
  /** Constructor. */
  constructor(opts) {
    this.data = opts.data ?? opts.object;
    if (opts.scheme)
      this.scheme = opts.scheme instanceof import_scheme.Scheme ? opts.scheme : new import_scheme.Scheme(opts.scheme);
    if (opts.value_scheme)
      this.value_scheme = new import_entry.Entry(opts.value_scheme);
    if (opts.tuple)
      this.tuple = new import_entry.Entry(opts.tuple);
    this.throw = opts.throw ?? true;
    this.strict = opts.strict ?? false;
    this.parent = opts.parent ?? "";
    this.error_prefix = opts.error_prefix ?? opts.err_prefix ?? "";
    if (typeof this.parent === "string" && this.parent.length > 0 && /[a-zA-Z0-9]+/g.test(this.parent.charAt(this.parent.length - 1))) {
      this.parent += ".";
    }
    if (Array.isArray(this.data) && Array.isArray(this.tuple)) {
      const scheme = {};
      for (let i = 0; i < this.tuple.length; i++) {
        if (typeof this.tuple[i] === "object") {
          scheme[`tuple_${i}`] = this.tuple[i];
        } else {
          scheme[`tuple_${i}`] = { type: this.tuple[i] };
        }
      }
      this.scheme = new import_scheme.Scheme(scheme);
    }
  }
  /** Throw an error or return error object. */
  throw_error(e, field) {
    const invalid_fields = {};
    invalid_fields[field] = e;
    if (this.throw) {
      throw new InternalError({ error: this.error_prefix + e, invalid_fields, object: void 0 });
    }
    return { error: this.error_prefix + e, invalid_fields, object: void 0 };
  }
  /**
   * Check type of the parameter function.
   * Scheme key may also be an index for when object is an array.
   */
  check_type(object, obj_key, scheme_item, type) {
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
        if (scheme_item.scheme || scheme_item.value_scheme) {
          try {
            object[obj_key] = validate({
              object: object[obj_key],
              scheme: scheme_item.scheme,
              value_scheme: scheme_item.value_scheme,
              tuple: scheme_item.tuple,
              strict: this.strict,
              parent: `${parent}${obj_key}.`,
              error_prefix: this.error_prefix,
              throw: true
            });
          } catch (e) {
            if (!this.throw && e instanceof InternalError && e.data) {
              return e.data;
            } else {
              throw e;
            }
          }
        }
        if (typeof scheme_item.min === "number" && object[obj_key].length < scheme_item.min) {
          const field = `${parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${scheme_item.min}].`, field);
        }
        if (typeof scheme_item.max === "number" && object[obj_key].length > scheme_item.max) {
          const field = `${parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${scheme_item.max}].`, field);
        }
        return true;
      }
      // Object types.
      case "object": {
        if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
          return false;
        }
        if (scheme_item.scheme || scheme_item.value_scheme) {
          try {
            object[obj_key] = new Validate({
              object: object[obj_key],
              scheme: scheme_item.scheme,
              value_scheme: scheme_item.value_scheme,
              tuple: scheme_item.tuple,
              strict: this.strict,
              parent: `${parent}${obj_key}.`,
              error_prefix: this.error_prefix,
              throw: true
            }).run();
          } catch (e) {
            if (!this.throw && e.json) {
              return e.json;
            } else {
              throw e;
            }
          }
        }
        return true;
      }
      // String types.
      case "string": {
        if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
          return false;
        }
        if (scheme_item.allow_empty !== true && object[obj_key].length === 0) {
          return "empty";
        }
        if (typeof scheme_item.min === "number" && object[obj_key].length < scheme_item.min) {
          const field = `${parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${scheme_item.min}].`, field);
        }
        if (typeof scheme_item.max === "number" && object[obj_key].length > scheme_item.max) {
          const field = `${parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${scheme_item.max}].`, field);
        }
        if (type !== typeof object[obj_key]) {
          return false;
        }
        if (scheme_item.allow_empty !== true && object[obj_key].length === 0) {
          return "empty";
        }
        return true;
      }
      // Number type.
      case "number": {
        if (type !== typeof object[obj_key]) {
          return false;
        }
        if (scheme_item.allow_empty !== true && isNaN(object[obj_key])) {
          return "empty";
        }
        if (typeof scheme_item.min === "number" && object[obj_key] < scheme_item.min) {
          const field = `${parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an value [${object[obj_key].length}], the minimum is [${scheme_item.min}].`, field);
        }
        if (typeof scheme_item.max === "number" && object[obj_key] > scheme_item.max) {
          const field = `${parent}${obj_key}`;
          return this.throw_error(`Attribute "${field}" has an invalid value [${object[obj_key].length}], the maximum is [${scheme_item.max}].`, field);
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
        throw new Error(`Unsupported type "${type.toString()}".`);
    }
  }
  /** Verify a value ban entry. */
  verify_entry(entry, key, object, value_scheme_key) {
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
            const field = `${parent}${value_scheme_key || key}`;
            const current_type = (0, import_throw.value_type)(object[key]);
            return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
          } else if (is_empty && is_required && entry.default !== "") {
            const field = `${parent}${value_scheme_key || key}`;
            return this.throw_error(`Attribute "${field}" is an empty string.`, field);
          }
        } else {
          const res = this.check_type(object, key, entry, entry.type);
          if (typeof res === "object") {
            return res;
          } else if (res === false) {
            const field = `${parent}${value_scheme_key || key}`;
            const current_type = (0, import_throw.value_type)(object[key]);
            return this.throw_error(`Attribute "${field}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`, field);
          } else if (res === "empty" && is_required && entry.default !== "") {
            const field = `${parent}${value_scheme_key || key}`;
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
    if (entry.enum) {
      if (!entry.enum.includes(object[key])) {
        const field = `${parent}${value_scheme_key || key}`;
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
        return this.throw_error(err, `${parent}${value_scheme_key || key}`);
      }
    }
    if (typeof entry.postprocess === "function") {
      const res = entry.postprocess(object[key], object, key);
      if (res !== void 0) {
        object[key] = res;
      }
    }
  }
  /**
   * Run the validation.
   */
  run() {
    if (Array.isArray(this.data)) {
      if (this.value_scheme != null) {
        for (let index = 0; index < this.data.length; index++) {
          const err = this.verify_entry(this.value_scheme, index, this.data);
          if (err) {
            return err;
          }
        }
      } else {
        throw new Error(`Invalid scheme for array, expected value_scheme or tuple, got: ${JSON.stringify({ scheme: this.scheme, value_scheme: this.value_scheme, tuple: this.tuple })}`);
      }
    } else if (typeof this.data === "object" && this.data != null) {
      if (this.value_scheme != null) {
        const keys = Object.keys(this.data);
        for (let i = 0; i < keys.length; i++) {
          const err = this.verify_entry(this.value_scheme, keys[i], this.data);
          if (err) {
            return err;
          }
        }
      } else if (this.scheme instanceof import_scheme.Scheme) {
        const aliases = this.scheme.aliases;
        if (this.strict) {
          const object_keys = Object.keys(this.data);
          for (let x = 0; x < object_keys.length; x++) {
            if (!this.scheme.has(object_keys[x]) && !aliases.has(object_keys[x])) {
              const field = `${parent}${object_keys[x]}`;
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
              if (this.data[entry.alias[i]] !== void 0) {
                this.data[entry_key] = this.data[entry.alias[i]];
                delete this.data[entry.alias[i]];
              }
            }
          } else if (typeof entry.alias === "string") {
            if (this.data[entry.alias] !== void 0) {
              this.data[entry_key] = this.data[entry.alias];
              delete this.data[entry.alias];
            }
          }
          if (entry_key in this.data === false) {
            if (entry.default !== void 0) {
              if (typeof entry.default === "function") {
                this.data[entry_key] = entry.default(this.data);
              } else {
                this.data[entry_key] = entry.default;
              }
            } else {
              if (entry.required === false) {
                continue;
              } else if (typeof entry.required === "function") {
                const required = entry.required(this.data);
                if (required) {
                  const field = `${parent}${entry_key}`;
                  return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
                }
              } else {
                const field = `${parent}${entry_key}`;
                return this.throw_error(`Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`, field);
              }
            }
            continue;
          }
          const err = this.verify_entry(entry, entry_key, this.data);
          if (err) {
            return err;
          }
        }
      } else {
        throw new Error(`Invalid scheme for object, expected scheme or value_scheme, got: ${JSON.stringify({ scheme: this.scheme, value_scheme: this.value_scheme, tuple: this.tuple })}`);
      }
    }
    if (!this.throw) {
      return { error: void 0, invalid_fields: {}, object: this.data };
    }
    return this.data;
  }
}
function validate(opts) {
  return new Validate(opts).run();
}
class InternalError {
  data;
  constructor(data) {
    this.data = data;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validate
});
