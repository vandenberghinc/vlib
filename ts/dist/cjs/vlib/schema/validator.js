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
var import_validator_entries = require("./validator_entries.js");
var import_cast = require("./cast.js");
class Validator {
  /** The schema to validate. */
  schema;
  /** The value schema for object values or array items. */
  value_schema;
  /** Is an array with tuple mode enabled. */
  is_tuple = false;
  /** Throw occurred errors, defaults to `false` */
  throw;
  /**
   * Allow unknown attributes.
   * When `false`, errors will be thrown when unknown attributes are found.
   * Defaults to `true`.
   */
  unknown;
  /** The parent prefix. */
  parent;
  /** The error prefix. */
  error_prefix;
  /** Constructor. */
  constructor(opts) {
    this.unknown = opts.unknown ?? true;
    this.parent = opts.parent ?? "";
    this.error_prefix = opts.error_prefix ?? "";
    this.throw = opts.throw ?? false;
    if (typeof this.parent === "string" && this.parent.length > 0 && /[a-zA-Z0-9]+/g.test(this.parent.charAt(this.parent.length - 1))) {
      this.parent += ".";
    }
    if (opts.schema) {
      this.schema = opts.schema instanceof import_validator_entries.ValidatorEntries ? opts.schema : new import_validator_entries.ValidatorEntries(opts.schema);
    } else if (opts.value_schema) {
      this.value_schema = opts.value_schema instanceof import_validator_entries.ValidatorEntry ? opts.value_schema : new import_validator_entries.ValidatorEntry(opts.value_schema);
    } else if (Array.isArray(opts.tuple)) {
      this.is_tuple = true;
      const scheme = {};
      for (let i = 0; i < opts.tuple.length; i++) {
        if (typeof opts.tuple[i] === "object") {
          scheme[`tuple_${i}`] = opts.tuple[i];
        } else {
          scheme[`tuple_${i}`] = { type: opts.tuple[i] };
        }
      }
      this.schema = new import_validator_entries.ValidatorEntries(scheme);
    } else
      throw new Validator.InvalidUsageError(`No scheme or value_scheme or tuple provided, at least one of these must be provided.`);
  }
  /** Create an error object. */
  create_error(field, message) {
    return {
      error: this.error_prefix + message,
      invalid_fields: {
        [field]: this.error_prefix + message
      }
    };
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
        if (entry.schema || entry.value_schema) {
          const validator = new Validator({
            // scheme: scheme_item.scheme,
            value_schema: entry.value_schema,
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
          return this.create_error(field, `Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
        }
        if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
          const field = `${this.parent}${obj_key}`;
          return this.create_error(field, `Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
        }
        return true;
      }
      // Object types.
      case "object": {
        if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
          return false;
        }
        if (entry.schema || entry.value_schema) {
          const validator = new Validator({
            schema: entry.schema,
            value_schema: entry.value_schema,
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
          return this.create_error(field, `Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
        }
        if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
          const field = `${this.parent}${obj_key}`;
          return this.create_error(field, `Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
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
          return this.create_error(field, `Attribute "${field}" has an value [${object[obj_key].length}], the minimum is [${entry.min}].`);
        }
        if (typeof entry.max === "number" && object[obj_key] > entry.max) {
          const field = `${this.parent}${obj_key}`;
          return this.create_error(field, `Attribute "${field}" has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`);
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
    if (entry.cast != null && typeof object[key] === "string") {
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
    const field = `${this.parent}${value_scheme_key || key}`;
    if (
      // Only when type is defined and not "any".
      entry.type && entry.type !== "any" && !(object[key] === void 0 && !entry.is_required(object))
    ) {
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
          const field2 = `${this.parent}${value_scheme_key || key}`;
          const current_type = (0, import_throw.value_type)(object[key]);
          return this.create_error(field2, `Attribute "${field2}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`);
        } else if (is_empty && entry.is_required(object) && entry.default !== "") {
          const field2 = `${this.parent}${value_scheme_key || key}`;
          return this.create_error(field2, `Attribute "${field2}" is an empty string.`);
        }
      } else {
        const res = this.check_type(object, key, entry, entry.type);
        const f = `${this.parent}${value_scheme_key || key}`;
        if (typeof res === "object") {
          return res;
        } else if (res === false) {
          const field2 = `${this.parent}${value_scheme_key || key}`;
          const current_type = (0, import_throw.value_type)(object[key]);
          return this.create_error(field2, `Attribute "${field2}" has an invalid type "${current_type}", the valid type is ${entry.type_name("")}.`);
        } else if (res === "empty" && entry.is_required(object) && entry.default !== "") {
          const field2 = `${this.parent}${value_scheme_key || key}`;
          return this.create_error(field2, `Attribute "${field2}" is an empty string.`);
        }
      }
    }
    if (object[key] === void 0 && entry.default !== import_validator_entries.NoDefault) {
      if (typeof entry.default === "function") {
        object[key] = entry.default(object);
      } else {
        object[key] = entry.default;
      }
    }
    if (entry.charset && typeof object[key] === "string") {
      if (!entry.charset.test(object[key])) {
        const field2 = `${this.parent}${value_scheme_key || key}`;
        return this.create_error(field2, `Attribute "${field2}" has an invalid charset, expected: ${entry.charset.toString()}.`);
      }
    }
    if (entry.enum) {
      if (!entry.enum.includes(object[key])) {
        const field2 = `${this.parent}${value_scheme_key || key}`;
        const joined = entry.enum.map((item) => {
          if (item == null) {
            return "null";
          } else if (typeof item !== "string" && !(item instanceof String)) {
            return item.toString();
          }
          return `"${item.toString()}"`;
        }).join(", ");
        return this.create_error(field2, `Attribute "${field2}" must be one of the following enumerated values [${joined}].`);
      }
    }
    if (typeof entry.verify === "function") {
      const err = entry.verify(object[key], object, key);
      if (err) {
        return this.create_error(`${this.parent}${value_scheme_key || key}`, err);
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
      if (this.value_schema != null) {
        for (let index = 0; index < data.length; index++) {
          const err = this.validate_entry(this.value_schema, index, data);
          if (err) {
            return err;
          }
        }
      } else {
        throw new Validator.InvalidUsageError(`Invalid scheme for array, expected value_scheme, got: ${JSON.stringify({ scheme: this.schema, value_scheme: this.value_schema })}`);
      }
    } else if (data != null && typeof data === "object" && !Array.isArray(data)) {
      if (this.value_schema != null) {
        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
          const err = this.validate_entry(this.value_schema, keys[i], data);
          if (err) {
            return err;
          }
        }
      } else if (this.schema instanceof import_validator_entries.ValidatorEntries) {
        const aliases = this.schema.aliases;
        if (!this.unknown) {
          const object_keys = Object.keys(data);
          for (let x = 0; x < object_keys.length; x++) {
            if (!this.schema.has(object_keys[x]) && !aliases.has(object_keys[x])) {
              const field = `${this.parent}${object_keys[x]}`;
              return this.create_error(field, `Attribute "${field}" is not a valid attribute name.`);
            }
          }
        }
        for (const [entry_key, entry] of this.schema.entries()) {
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
            if (entry.default !== import_validator_entries.NoDefault) {
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
                  return this.create_error(field, `Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`);
                }
              } else {
                const field = `${this.parent}${entry_key}`;
                return this.create_error(field, `Attribute "${field}" should be a defined value${entry.type_name(" of type ")}.`);
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
        throw new Validator.InvalidUsageError(`Invalid scheme for object, expected scheme or value_scheme, got: ${JSON.stringify({ scheme: this.schema, value_scheme: this.value_schema })}`);
      }
    }
    return { data };
  }
  /**
   * Run the validator.
   * @returns The verified object or array, while throwing errors upon verification failure. Or a response object when `throw` is `false`.
   */
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
    if (this.throw) {
      return res.data;
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
  return new Validator(opts).validate(data);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Validator,
  validate
});
