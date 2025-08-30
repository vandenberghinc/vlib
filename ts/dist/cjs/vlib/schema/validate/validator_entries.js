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
  NoValue: () => NoValue,
  ValidatorEntries: () => ValidatorEntries,
  ValidatorEntry: () => ValidatorEntry
});
module.exports = __toCommonJS(stdin_exports);
var import_array = require("../../primitives/array.js");
var import_entry = require("../infer/entry.js");
const NoValue = Symbol("vlib.Schema.Entry.NoValue");
class ValidatorEntry {
  // ------------------------------------------------------------------
  // Attributes with the same type as the Entry type.
  required;
  allow_empty;
  // ensure its defined for the type checker.
  min;
  max;
  enum;
  alias;
  verify;
  preprocess;
  postprocess;
  charset;
  // def: Entry<T, V, P>["def"]; // ignore the alias.
  // ------------------------------------------------------------------
  // Attributes with a different type from the Entry type.
  // Ensure these types are also inferred by the `infer.ts` file.
  // Also ensure we dont change the name between Entry, so we keep it universal for `infer.ts`.
  /**
   * The field type, e.g. "attribute", "query", "body", etc.
   * Ensure the chosen word fits in sentences like: `Attribte X is ...`, etc.
   * The word is automatically capitalized where needed.
   * We use `NoValue` so the validation process can robustly detect if the field type was not provided.
   * Also automatically casted to `NoValue` when the provided string is empty.
   */
  field_type;
  /**
   * The default value for the entry.
   * `NoDefault` will be used to indicate that no default value was provided.
   * This way we can also support `undefined` and `null` as a default value.
   */
  default;
  /**
   * A nested schema for when the attribute is an object.
   */
  schema;
  /**
   * A nested schema for the array items for when the attribute is an array.
   * Or a schema for the value's of an object.
   */
  value_schema;
  /**
   * Tuple schema for when the input object is an array.
   * This can be used to verify each item in an array specifically with a predefined length.
   *
   * Each index of the schema option corresponds to the index of the input array.
   *
   * It is inputted as an array of entries,
   * However, its stored as `tuple_1: Entry, tuple_2: Entry, ...` etc.
   * This is how it needs to be validated.
   *
   * @note this attribute is ignored when the input object is not an array.
   */
  tuple_schema;
  /**
   * Cast string to boolean/number.
   * Only allowed when type is exactly `boolean` or `number`.
   */
  cast;
  /**
   * Allow unknown attributes, defaults to `true`.
   * However, internally use `NoDefault` so we can detect changes
   * while traversing down the entries.
   */
  unknown;
  // ------------------------------------------------------------------
  // New attributes.
  /**
   * A boolean flag indicating if the `array` or `object` type requires validation.
   * For instance, nested arrays and objects without any schema do not require validation.
   * Note that this is a readonly attribute, hence it is changed, also not once validated.
   */
  requires_validation;
  /**
   * The inferred value.
   */
  validated;
  /** Check if the `type` attribute is a single type, so not an array indicating a union type. */
  is_union_type;
  /** Check if the `type` attribute is a single type, so not an array indicating a union type. */
  is_single_type;
  /** The type. */
  type;
  // allow any type, not just the `Entry.Type` castable types.
  /** Constructor options. */
  constructor(entry_opts) {
    const opts = import_entry.Entry.Type.Castable.is_fast(entry_opts) ? { type: entry_opts } : entry_opts;
    this.type = opts.type;
    this.default = !opts || typeof opts !== "object" ? NoValue : "default" in opts ? opts.default : "def" in opts ? opts.def : NoValue;
    this.required = opts.required ?? true;
    this.allow_empty = opts.allow_empty ?? true;
    this.min = opts.min;
    this.max = opts.max;
    if (opts.schema)
      this.schema = new ValidatorEntries(opts.schema);
    if (opts.value_schema)
      this.value_schema = new ValidatorEntry(opts.value_schema);
    if (opts.tuple)
      this.tuple_schema = opts.tuple.map((e) => new ValidatorEntry(e));
    this.enum = opts.enum;
    this.alias = opts.alias;
    this.verify = opts.verify;
    this.preprocess = opts.preprocess;
    this.postprocess = opts.postprocess;
    if (opts.cast != null && opts.cast !== false) {
      if (this.type === "boolean" || this.type === "number") {
        const cast = typeof opts.cast === "object" ? { ...opts.cast, preserve: true } : { strict: true, preserve: true };
        this.cast = { type: this.type, opts: cast };
      } else {
        throw new TypeError(`Cannot cast type '${this.type}' with cast options.`);
      }
    } else {
      this.cast = void 0;
    }
    this.unknown = opts.unknown ?? NoValue;
    this.charset = opts.charset;
    this.field_type = opts.field_type || NoValue;
    this.requires_validation = this.schema != null || this.value_schema != null || this.tuple_schema != null;
    this.is_union_type = import_array.ArrayUtils.is_any(this.type);
    this.is_single_type = !this.is_union_type && (this.type != null && typeof this.type !== "object");
  }
  /**
   * Get the type as a string.
   * Useful for generating type errors.
   */
  type_name(prefix = "") {
    let type_error_str = "";
    if (Array.isArray(this.type)) {
      type_error_str = prefix;
      for (let i = 0; i < this.type.length; i++) {
        if (typeof this.type[i] === "function") {
          try {
            type_error_str += `'${this.type[i].name}'`;
          } catch (e) {
            type_error_str += `'${this.type[i]}'`;
          }
        } else {
          type_error_str += `'${this.type[i]}'`;
        }
        if (i === this.type.length - 2) {
          type_error_str += " or ";
        } else if (i < this.type.length - 2) {
          type_error_str += ", ";
        }
      }
    } else {
      type_error_str = `${prefix}'${this.type}'`;
    }
    return type_error_str;
  }
  /** Is required wrapper. */
  is_required(object) {
    return this.required == null ? true : typeof this.required === "function" ? this.required(object) : this.required;
  }
}
class ValidatorEntries extends Map {
  /**
   * A map of all aliases from the direct entries.
   * The alias name is used as key, pointing to the original entry.
   */
  aliases = /* @__PURE__ */ new Map();
  /**
   * An attribute with the inferred type of the entries.
   * Note that this value is undefined at runtime.
   * @example
   * ```
   * const validated_data: typeof val_entries.validated ...
   * ```
   */
  validated;
  /** Initialize a scheme object. */
  constructor(schema) {
    super();
    for (const [key, value] of Object.entries(schema)) {
      if (!value)
        continue;
      const entry = value instanceof ValidatorEntry ? value : new ValidatorEntry(value);
      this.set(key, entry);
      if (entry.alias?.length) {
        for (let i = 0; i < entry.alias.length; i++) {
          this.aliases.set(entry.alias[i], entry);
        }
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NoValue,
  ValidatorEntries,
  ValidatorEntry
});
