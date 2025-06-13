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
  InvalidUsageError: () => InvalidUsageError,
  ValidateError: () => ValidateError,
  validate: () => validate
});
module.exports = __toCommonJS(stdin_exports);
var import_throw = require("./throw.js");
var import_validator_entries = require("./validator_entries.js");
var import_cast = require("./cast.js");
var import_string = require("../primitives/string.js");
function create_error(state, field, message) {
  return {
    error: state.shared.error_prefix + message,
    invalid_fields: {
      [field]: state.shared.error_prefix + message
    }
  };
}
function get_field_type(state, entry, capitalize_word = false) {
  return capitalize_word ? import_string.String.capitalize_word(entry?.field_type || state.shared.field_type || "attribute") : entry?.field_type || state.shared.field_type || "attribute";
}
function check_type(state, object, obj_key, entry, type) {
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
      if (entry.requires_validation) {
        const res = validate_internal(object[obj_key], entry, {
          parent: `${state.parent}${obj_key}.`,
          shared: state.shared
        });
        if (res.error)
          return res;
        object[obj_key] = res.data;
      }
      if (typeof entry.min === "number" && object[obj_key].length < entry.min) {
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
      }
      if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
      }
      return true;
    }
    // Object types.
    case "object": {
      if (typeof object[obj_key] !== "object" || object[obj_key] == null) {
        return false;
      }
      if (entry.requires_validation) {
        const res = validate_internal(object[obj_key], entry, {
          parent: `${state.parent}${obj_key}.`,
          shared: state.shared
        });
        if (res.error)
          return res;
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
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid string length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
      }
      if (typeof entry.max === "number" && object[obj_key].length > entry.max) {
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid string length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
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
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an value [${object[obj_key].length}], the minimum is [${entry.min}].`);
      }
      if (typeof entry.max === "number" && object[obj_key] > entry.max) {
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid value [${object[obj_key].length}], the maximum is [${entry.max}].`);
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
      throw new InvalidUsageError(`Unsupported type '${type.toString()}'.`);
  }
}
function validate_entry(state, entry, key, object) {
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
  if (
    // Only when type is defined and not "any".
    entry.type && entry.type !== "any" && !(object[key] === void 0 && !entry.is_required(object))
  ) {
    if (Array.isArray(entry.type)) {
      let correct_type = false;
      let is_empty = false;
      for (let i = 0; i < entry.type.length; i++) {
        const res = check_type(state, object, key, entry, entry.type[i]);
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
        const field = `${state.parent}${key}`;
        const current_type = (0, import_throw.value_type)(object[key]);
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid type '${current_type}', the valid type is ${entry.type_name("")}.`);
      } else if (is_empty && entry.is_required(object) && entry.default !== "") {
        const field = `${state.parent}${key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is an empty string.`);
      }
    } else {
      const res = check_type(state, object, key, entry, entry.type);
      const f = `${state.parent}${key}`;
      if (typeof res === "object") {
        return res;
      } else if (res === false) {
        const field = `${state.parent}${key}`;
        const current_type = (0, import_throw.value_type)(object[key]);
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid type '${current_type}', the valid type is ${entry.type_name("")}.`);
      } else if (res === "empty" && entry.is_required(object) && entry.default !== "") {
        const field = `${state.parent}${key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is an empty string.`);
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
      const field = `${state.parent}${key}`;
      return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid charset, expected: ${entry.charset.toString()}.`);
    }
  }
  if (entry.enum) {
    if (!entry.enum.includes(object[key])) {
      const field = `${state.parent}${key}`;
      const joined = entry.enum.map((item) => {
        if (item == null) {
          return "null";
        } else if (typeof item !== "string" && !(item instanceof String)) {
          return item.toString();
        }
        return `'${item.toString()}'`;
      }).join(", ");
      return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' must be one of the following enumerated values [${joined}].`);
    }
  }
  if (typeof entry.verify === "function") {
    const err = entry.verify(object[key], object, key);
    if (err) {
      return create_error(state, `${state.parent}${key}`, err);
    }
  }
  if (typeof entry.postprocess === "function") {
    const res = entry.postprocess(object[key], object, key);
    if (res !== void 0) {
      object[key] = res;
    }
  }
}
function validate_internal(data, entry, state) {
  if (Array.isArray(data)) {
    if (entry.tuple_schema != null) {
      if (data.length !== entry.tuple_schema.length) {
        const field = `${state.parent || "tuple"}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid tuple length [${data.length}], expected [${entry.tuple_schema.length}].`);
      }
      for (let index = 0; index < data.length; index++) {
        const err = validate_entry(state, entry.tuple_schema[index], index, data);
        if (err) {
          return err;
        }
      }
    } else if (entry.value_schema != null) {
      for (let index = 0; index < data.length; index++) {
        const err = validate_entry(state, entry.value_schema, index, data);
        if (err) {
          return err;
        }
      }
    } else
      throw new InvalidUsageError(`Invalid scheme for array, expected tuple_schema or value_schema, got: ${entry}`);
  } else if (data != null && typeof data === "object" && !Array.isArray(data)) {
    if (entry.value_schema != null) {
      const keys = Object.keys(data);
      for (let i = 0; i < keys.length; i++) {
        const err = validate_entry(state, entry.value_schema, keys[i], data);
        if (err) {
          return err;
        }
      }
    } else if (entry.schema instanceof import_validator_entries.ValidatorEntries) {
      const aliases = entry.schema.aliases;
      if (!state.shared.unknown) {
        const object_keys = Object.keys(data);
        for (let x = 0; x < object_keys.length; x++) {
          if (!entry.schema.has(object_keys[x]) && !aliases.has(object_keys[x])) {
            const field = `${state.parent}${object_keys[x]}`;
            return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is not allowed.`);
          }
        }
      }
      for (const [entry_key, schema_entry] of entry.schema.entries()) {
        if (schema_entry == null)
          continue;
        if (Array.isArray(schema_entry.alias)) {
          for (let i = 0; i < schema_entry.alias.length; i++) {
            if (data[schema_entry.alias[i]] !== void 0) {
              data[entry_key] = data[schema_entry.alias[i]];
              delete data[schema_entry.alias[i]];
            }
          }
        } else if (typeof schema_entry.alias === "string") {
          if (data[schema_entry.alias] !== void 0) {
            data[entry_key] = data[schema_entry.alias];
            delete data[schema_entry.alias];
          }
        }
        if (entry_key in data === false) {
          if (schema_entry.default !== import_validator_entries.NoDefault) {
            if (typeof schema_entry.default === "function") {
              data[entry_key] = schema_entry.default(data);
            } else {
              data[entry_key] = schema_entry.default;
            }
          } else {
            if (schema_entry.required === false) {
              continue;
            } else if (typeof schema_entry.required === "function") {
              const required = schema_entry.required(data);
              if (required) {
                const field = `${state.parent}${entry_key}`;
                return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' should be a defined value${schema_entry.type_name(" of type ")}.`);
              }
            } else {
              const field = `${state.parent}${entry_key}`;
              return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' should be a defined value${schema_entry.type_name(" of type ")}.`);
            }
          }
          continue;
        }
        const err = validate_entry(state, schema_entry, entry_key, data);
        if (err) {
          return err;
        }
      }
    } else
      throw new InvalidUsageError(`Invalid scheme for object, expected scheme or value_scheme, got: ${entry}`);
  }
  return { data };
}
function validate(...args) {
  let data;
  let state;
  let schema;
  if (args.length === 2) {
    data = args[0];
    const arg1 = args[1];
    schema = arg1;
    state = { throw: false };
    if (arg1 instanceof import_validator_entries.ValidatorEntry === false && arg1 instanceof import_validator_entries.ValidatorEntries === false) {
      if (arg1.parent !== void 0)
        state.parent = arg1.parent;
      if (arg1.unknown !== void 0)
        state.unknown = arg1.unknown;
      if (arg1.error_prefix !== void 0)
        state.error_prefix = arg1.error_prefix;
      if (arg1.field_type !== void 0)
        state.field_type = arg1.field_type;
      if (arg1.throw !== void 0)
        state.throw = arg1.throw;
    }
  } else if (args.length === 3) {
    data = args[0];
    state = args[1];
    schema = args[2];
  } else
    throw new InvalidUsageError(`Invalid number of arguments passed to validate(), expected 2 or 3, got ${args.length}.`);
  let entry_opts;
  if (schema instanceof import_validator_entries.ValidatorEntry) {
    entry_opts = schema;
  } else if (schema instanceof import_validator_entries.ValidatorEntries) {
    if (Array.isArray(data)) {
      throw new InvalidUsageError(`Cannot use a ValidatorEntries instance as schema for an array, use a tuple or value_schema instead.`);
    }
    entry_opts = { schema };
  } else if (schema.schema) {
    entry_opts = {
      schema: schema.schema instanceof import_validator_entries.ValidatorEntries ? schema.schema : new import_validator_entries.ValidatorEntries(schema.schema)
    };
  } else if (schema.value_schema) {
    entry_opts = {
      value_schema: schema.value_schema instanceof import_validator_entries.ValidatorEntry ? schema.value_schema : new import_validator_entries.ValidatorEntry(schema.value_schema)
      // cast to mutable.
    };
  } else if (Array.isArray(data) && Array.isArray(schema.tuple)) {
    entry_opts = {
      tuple_schema: schema.tuple.map((v) => new import_validator_entries.ValidatorEntry(v))
      // cast to mutable.
    };
  } else
    throw new InvalidUsageError(`No scheme or value_scheme or tuple provided, at least one of these must be provided.`);
  const res = validate_internal(data, entry_opts, {
    parent: typeof state.parent === "string" && state.parent.length > 0 && /[a-zA-Z0-9]+/g.test(state.parent.last()) ? state.parent + "." : state.parent || "",
    shared: {
      unknown: state.unknown ?? true,
      error_prefix: state.error_prefix ?? "",
      field_type: entry_opts.field_type
    }
  });
  if (res.error) {
    if (state.throw) {
      throw new ValidateError(res);
    }
    return res;
  }
  if (state.throw) {
    return res.data;
  }
  return res;
}
class ValidateError extends globalThis.Error {
  info;
  constructor(info) {
    super(info.error);
    this.info = info;
    this.name = "ValidateError";
    this.message = info.error;
  }
}
class InvalidUsageError extends globalThis.Error {
  constructor(msg) {
    super(msg);
    this.name = "InvalidUsageError";
    this.message = msg;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InvalidUsageError,
  ValidateError,
  validate
});
