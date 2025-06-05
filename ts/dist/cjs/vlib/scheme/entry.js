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
  Entry: () => Entry
});
module.exports = __toCommonJS(stdin_exports);
var import_scheme = require("./scheme.js");
class Entry {
  /**
   * The value type.
   * @note When the type is `any`, then all filters such as `allow_empty`, `max` etc are disabled.
   */
  type;
  /**
   * The default value or callback to create default value
   * When defined this attribute will be considered as optional.
   */
  default;
  /**
   * Is required, when `true` the attribute must be or an error will be thrown.
   */
  required;
  /**
   * Allow empty strings, arrays or objects.
   * By default `true`.
   */
  allow_empty;
  /**
   * Set a minimum length for strings or arrays, and min `x >= min` value of number.
   */
  min;
  /**
   * Set a maximum length for strings or arrays, and max `x <= max` value of number.
   */
  max;
  /**
   * A nested scheme for when the attribute is an object.
   */
  scheme;
  /**
   * A nested scheme for the array items for when the attribute is an array.
   * Or a scheme for the value's of an object.
   */
  value_scheme;
  /**
   * Tuple scheme for when the input object is an array.
   * This can be used to verify each item in an array specifically with a predefined length.
   *
   * Each index of the scheme option corresponds to the index of the input array.
   *
   * @note this attribute is ignored when the input object is not an array.
   */
  tuple;
  /**
   * A list of valid values for the attribute.
   */
  enum;
  /**
   * Aliases for this atttribute.
   * When any of these alias attributes is encountered the attribute will be renamed to the current attribute name.
   * Therefore this will edit the input object.
   */
  alias;
  /**
   * Verify the attribute, optionally return an error string.
   */
  verify;
  /**
   * Pre process the attribute.
   * The callback should return the updated value.
   */
  preprocess;
  /**
   * Post process the attribute.
   * The callback should return the updated value.
   */
  postprocess;
  /** Alias for `default`. */
  def;
  /** Cast string to boolean/number. */
  cast;
  /**
   * The allowed charset for string typed entries.
   * This should be some `^...$` formatted regex.
   * For instance `^[\w+]+$` will only allow alphanumeric and _ characters.
   */
  charset;
  /** Constructor options. */
  constructor(opts) {
    if (typeof opts === "string" || typeof opts === "function" || Array.isArray(opts)) {
      opts = { type: opts };
    }
    this.type = opts.type;
    this.default = opts.default ?? opts.def;
    this.required = opts.required;
    this.allow_empty = opts.allow_empty ?? true;
    this.min = opts.min;
    this.max = opts.max;
    if (opts.scheme)
      this.scheme = new import_scheme.Scheme(opts.scheme);
    if (opts.value_scheme)
      this.value_scheme = new Entry(opts.value_scheme);
    if (opts.tuple)
      this.tuple = opts.tuple.map((e) => new Entry(e));
    this.enum = opts.enum;
    this.alias = opts.alias;
    this.verify = opts.verify;
    this.preprocess = opts.preprocess;
    this.postprocess = opts.postprocess;
    if (opts.cast != null && opts.cast !== false) {
      if (this.type === "boolean") {
        this.cast = {
          type: "boolean",
          opts: typeof opts.cast === "object" ? { ...opts.cast, preserve: true } : { preserve: true }
        };
      } else if (this.type === "number") {
        this.cast = {
          type: "number",
          opts: typeof opts.cast === "object" ? { ...opts.cast, preserve: true } : { preserve: true, strict: true }
        };
      } else {
        throw new TypeError(`Cannot cast type "${this.type}" with cast options.`);
      }
    } else {
      this.cast = void 0;
    }
    this.charset = opts.charset;
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
            type_error_str += `"${this.type[i].name}"`;
          } catch (e) {
            type_error_str += `"${this.type[i]}"`;
          }
        } else {
          type_error_str += `"${this.type[i]}"`;
        }
        if (i === this.type.length - 2) {
          type_error_str += " or ";
        } else if (i < this.type.length - 2) {
          type_error_str += ", ";
        }
      }
    } else {
      type_error_str = `${prefix}"${this.type}"`;
    }
    return type_error_str;
  }
}
const _cast_test_boolean = {
  type: "boolean",
  required: false,
  cast: true
  // preprocess: v => vlib.scheme.cast.boolean(v, { preserve: true }),
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Entry
});
