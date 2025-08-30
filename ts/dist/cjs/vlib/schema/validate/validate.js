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
  Schemas: () => Schemas,
  ValidateError: () => ValidateError,
  Validator: () => Validator,
  validate: () => validate,
  validate_object: () => validate_object
});
module.exports = __toCommonJS(stdin_exports);
var import_string = require("../../primitives/string.js");
var import_validator_entries = require("./validator_entries.js");
var import_cast = require("./cast.js");
var import_throw = require("./throw.js");
var import_suggest_attr = require("./suggest_attr.js");
var Schemas;
(function(Schemas2) {
  Schemas2.is_fast = (value) => {
    return typeof value === "object" && value != null && (value.schema != null && typeof value.schema === "object" || value.value_schema != null && typeof value.value_schema === "object" || value.tuple != null && Array.isArray(value.tuple));
  };
})(Schemas || (Schemas = {}));
var State;
(function(State2) {
  function create(opts) {
    return {
      parent: typeof opts?.parent === "string" && opts.parent.length > 0 && /[a-zA-Z0-9]+/g.test(opts.parent.last()) ? opts.parent + "." : opts?.parent ?? "",
      field_type: opts?.field_type ?? "attribute",
      unknown: opts?.unknown ?? true,
      shared: {
        error_prefix: opts?.error_prefix ?? "",
        throw: opts?.throw ?? false
      }
    };
  }
  State2.create = create;
  function with_override(state, override) {
    return {
      parent: typeof override.parent === "string" && override.parent.length > 0 && /[a-zA-Z0-9]+/g.test(override.parent.last()) ? override.parent + "." : override.parent ?? state.parent,
      field_type: override.field_type ?? state.field_type,
      unknown: override.unknown ?? state.unknown,
      shared: {
        error_prefix: override.error_prefix ?? state.shared.error_prefix,
        throw: override.throw ?? state.shared.throw
      }
    };
  }
  State2.with_override = with_override;
})(State || (State = {}));
function create_error(state, field, message) {
  return {
    error: state.shared.error_prefix + message,
    invalid_fields: {
      [field]: state.shared.error_prefix + message
    }
  };
}
function get_field_type(state, entry, capitalize_word = false) {
  return capitalize_word ? import_string.String.capitalize_word(entry?.field_type === import_validator_entries.NoValue ? state.field_type : entry?.field_type || state.field_type) : entry?.field_type === import_validator_entries.NoValue ? state.field_type : entry?.field_type || state.field_type;
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
        const res = validate_object(object[obj_key], entry, {
          parent: `${state.parent}${obj_key}.`,
          field_type: entry.field_type === import_validator_entries.NoValue ? state.field_type : entry.field_type,
          unknown: entry.unknown === import_validator_entries.NoValue ? state.unknown : entry.unknown,
          shared: state.shared
        });
        if (res.error)
          return res;
        object[obj_key] = res.data;
      }
      if (!entry.allow_empty && object[obj_key].length === 0) {
        return "empty";
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
        const res = validate_object(object[obj_key], entry, {
          parent: `${state.parent}${obj_key}.`,
          field_type: entry.field_type === import_validator_entries.NoValue ? state.field_type : entry.field_type,
          unknown: entry.unknown === import_validator_entries.NoValue ? state.unknown : entry.unknown,
          shared: state.shared
        });
        if (res.error)
          return res;
        object[obj_key] = res.data;
      }
      const key_length = Object.keys(object[obj_key]).length;
      if (!entry.allow_empty && key_length === 0) {
        return "empty";
      }
      if (typeof entry.min === "number" && key_length < entry.min) {
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the minimum length is [${entry.min}].`);
      }
      if (typeof entry.max === "number" && key_length > entry.max) {
        const field = `${state.parent}${obj_key}`;
        return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' has an invalid array length [${object[obj_key].length}], the maximum length is [${entry.max}].`);
      }
      return true;
    }
    // String types.
    case "string": {
      if (typeof object[obj_key] !== "string" && !(object[obj_key] instanceof String)) {
        return false;
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
      if (!entry.allow_empty && object[obj_key].length === 0) {
        return "empty";
      }
      return true;
    }
    // Number type.
    case "number": {
      if (type !== typeof object[obj_key]) {
        return false;
      }
      if (!entry.allow_empty && isNaN(object[obj_key])) {
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
    if (entry.is_union_type) {
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
    } else if (entry.is_single_type) {
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
    } else {
      throw new InvalidUsageError(`Invalid type '${entry.type}' for entry '${state.parent}${key}'. Expected a string or function.`);
    }
  }
  if (object[key] === void 0 && entry.default !== import_validator_entries.NoValue) {
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
function validate_object(data, entry, state) {
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
      if (entry.unknown === import_validator_entries.NoValue && !state.unknown || entry.unknown !== import_validator_entries.NoValue && !entry.unknown) {
        const object_keys = Object.keys(data);
        for (let x = 0; x < object_keys.length; x++) {
          if (!entry.schema.has(object_keys[x]) && !aliases.has(object_keys[x])) {
            const field = `${state.parent}${object_keys[x]}`;
            const suggested_key = (0, import_suggest_attr.suggest_attribute)(object_keys[x], Array.from(entry.schema.keys()));
            return create_error(state, field, `${get_field_type(state, entry, true)} '${field}' is not allowed` + (suggested_key ? `, did you mean ${get_field_type(state, entry, false)} '${suggested_key}'?` : "."));
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
          if (schema_entry.default !== import_validator_entries.NoValue) {
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
class Validator {
  /**
   * A minimum entry with the schema info
   * Class `ValidatorEntry` must be castable to this parameter type.
   * Therefore we can use this as the uniform `MinimumEntry` for `validate_object()`.
   */
  entry;
  /** Validation options for the current entry. */
  state;
  /**
   * The type of the validated data.
   * Can be used as `typeof validator.validated`.
   * @warning This is a compile-time only type attribute.
   *          The runtime value is `undefined`.
   */
  validated;
  /**
   * The `Schemas` object from the constructor, used to extract the input schemas.
   * Kept public public so users can do `create_json_schema({..., schema: validator.schemas.schema})` to create a JSON schema.
   */
  schemas;
  /** Constructor. */
  constructor(opts) {
    this.schemas = opts;
    this.state = State.create(opts);
    this.entry = {
      schema: opts.schema ? new import_validator_entries.ValidatorEntries(opts.schema) : void 0,
      // @todo fix `as unknown as` conversion
      value_schema: opts.value_schema ? new import_validator_entries.ValidatorEntry(opts.value_schema) : void 0,
      tuple_schema: opts.tuple ? opts.tuple.map((v) => new import_validator_entries.ValidatorEntry(v)) : void 0,
      field_type: this.state.field_type ?? "attribute",
      unknown: this.state.unknown
    };
  }
  /**
   * Validate the given data against the entry.
   * @param data The data to validate.
   * @param state Optionally provide a state object to override the current state.
   */
  validate(data, state) {
    let res;
    if (state == null) {
      res = validate_object(data, this.entry, this.state);
    } else {
      res = validate_object(data, this.entry, State.with_override(this.state, state));
    }
    if (res.error) {
      if (this.state.shared.throw) {
        throw new ValidateError(res);
      }
      return res;
    }
    if (this.state.shared.throw) {
      return res.data;
    }
    return res;
  }
}
function validate(data, val) {
  let res;
  if (val instanceof Validator) {
    return val.validate(data);
  } else if (val && typeof val === "object") {
    return new Validator(val).validate(data);
  } else
    throw new InvalidUsageError(`Invalid entry type, expected Validator, got: ${val.toString()}`);
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
  Schemas,
  ValidateError,
  Validator,
  validate,
  validate_object
});
