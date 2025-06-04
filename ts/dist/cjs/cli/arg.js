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
  Base: () => Base,
  Command: () => Command,
  NoDef: () => NoDef,
  Query: () => Query
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
var import_query = require("./query.js");
var import_cast = require("./cast.js");
const NoDef = Symbol("vlib/cli/NoDef");
class Base {
  /** The argument mode. */
  mode;
  /** The argument variant. */
  variant;
  /** The strict mode, when `true` some additional checks are performed. */
  strict;
  /** The expected type, returned type will be auto casted to the mapped type. @attr */
  type;
  /** The default value to return when not found. @attr */
  def;
  /** The id attribute for the `id` variant. @attr */
  id;
  /**
   * The index number for the `index` variant.
   * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
   * @attr
   */
  index;
  /** When searching for this argument, exclude args found that start with a `-` prefix, so basically to ignore --arg like values. @attr */
  exclude_dash;
  /** Enumerate. */
  enum;
  /**
   * The name used as for the callback argument. Is auto inferred or optionally passed when flag `index` is present.
   */
  arg_name;
  /** Argument description. */
  description;
  /** Ignore this argument. */
  ignore;
  /**
   * Whether the argument is required or optional, defaults to `true`.
   * This already resolved and has already used `opts.required` and `opts.def` etc to determine the required value.
   */
  required;
  /** Constructor */
  constructor(opts, mode, strict) {
    this.variant = Base.infer_variant(opts, true);
    this.mode = mode;
    this.strict = strict;
    this.exclude_dash = opts.exclude_dash ?? true;
    this.type = opts.type;
    this.def = "def" in opts ? opts.def : NoDef;
    if (this.type == null) {
      if ("def" in opts) {
        const type = import_cast.Cast.Type.parse(this.def, "string");
        if (type == null) {
          throw new Error(`Invalid value type "${type}" of argument attribute "def", expected one of ${Array.from(import_cast.Cast.Type.valid).join(", ")}. Argument: ${import_colors.Color.object(opts)}}.`);
        }
        this.type = type;
      } else {
        this.type = "string";
      }
    }
    if (this.mode === "command") {
      this.description = opts.description;
      this.ignore = opts.ignore ?? false;
      opts.required ??= false;
      this.required = this.def === NoDef && (typeof opts.required === "function" ? opts.required() : opts.required);
    } else {
      this.description = void 0;
      this.ignore = false;
      this.required = void 0;
    }
    switch (this.variant) {
      case "index":
        if (opts.index == null)
          throw new Error(`Required argument attribute "index" is not defined for command argument ${import_colors.Color.object(opts)}.`);
        if (opts.name) {
          this.arg_name = opts.name;
        } else {
          this.arg_name = `arg_${opts.index}`;
        }
        this.index = opts.index;
        this.id = void 0;
        break;
      case "id":
        if (!opts.id)
          throw new Error(`Required argument attribute "id" is not defined for command argument ${import_colors.Color.object(opts)}.`);
        this.index = void 0;
        if (typeof opts.id === "string") {
          this.id = new import_query.Or(opts.id);
        } else if (opts.id instanceof import_query.Or || opts.id instanceof import_query.And) {
          this.id = opts.id;
        } else if (Array.isArray(opts.id)) {
          this.id = new import_query.Or(...opts.id);
        } else {
          opts.id.toString();
          throw new Error(`Invalid command argument id "${(0, import_query.and_or_str)(opts.id)}", expected string, string[] or Or | And.`);
        }
        if (opts.id.length === 0) {
          throw new Error(`Invalid command argument id "${(0, import_query.and_or_str)(opts.id)}", empty AND query.`);
        }
        let arg_name = void 0;
        if (opts.id instanceof import_query.And) {
          if (mode === "query") {
            const last = opts.id[opts.id.length - 1];
            if (Array.isArray(last)) {
              arg_name = last[0];
            } else {
              arg_name = last;
            }
          } else {
            const names = opts.id.map((c) => Array.isArray(c) ? c[0] : c);
            arg_name = names.join(" & ");
          }
        } else {
          let child = opts.id;
          while (child && typeof child !== "string") {
            if (child instanceof import_query.And) {
              child = child[child.length - 1];
            } else if (child instanceof import_query.Or || Array.isArray(child)) {
              child = child[0];
            }
          }
          if (typeof child !== "string") {
            throw new Error(`Invalid command argument id "${(0, import_query.and_or_str)(opts.id)}", could not resolve an identifier.`);
          }
          let trim_start = 0, c;
          while ((c = child.charAt(trim_start)) === "-" || c === " " || c === "	" || c === "\r" || c === "\n") {
            ++trim_start;
          }
          if (trim_start > 0) {
            child = child.slice(trim_start);
          }
          child = child.replaceAll("-", "_").trimEnd();
          if (typeof child !== "string" || !child) {
            throw new Error(`Invalid command argument id "${(0, import_query.and_or_str)(opts.id)}", argument ended up empty after trimming.`);
          }
          arg_name = child;
        }
        if (typeof arg_name !== "string" || !arg_name) {
          throw new Error(`Failed to resolve the argument name of command argument ${import_colors.Color.object(opts)}.`);
        }
        this.arg_name = arg_name;
        break;
      default:
        throw new Error(`Invalid command argument variant "${this.variant.toString()}". Expected "id" or "index".`);
    }
  }
  /** Infer the variant type. */
  static infer_variant(obj, throw_err) {
    if (typeof obj.index === "number") {
      return "index";
    } else if (obj.id != null) {
      return "id";
    } else if (throw_err) {
      throw new Error(`Invalid argument ${obj instanceof Base ? obj : import_colors.Color.object(obj)} is missing both "id" and "index" attributes, cannot determine the variant.`);
    }
  }
  /** Get as identifier such as id/name/main based on variant + mode. */
  identifier() {
    if (this.variant === "index") {
      return `arg_${this.index}`;
    } else if (this.variant === "id") {
      return (0, import_query.and_or_str)(this.id);
    } else {
      throw new Error(`Invalid argument variant "${this.variant.toString()}" for identifier.`);
    }
  }
  /** Create a string representation of the argument identifier. */
  toString() {
    return `Arg(${import_colors.Color.object({
      variant: this.variant,
      mode: this.mode,
      id: (0, import_query.and_or_str)(this.id),
      index: this.index,
      type: this.type,
      def: this.def,
      required: this.required
    })}`;
    return `Arg(${import_colors.Color.object(this, {
      filter: (v) => v && "length" in v ? v.length : typeof v === "function" || typeof v === "boolean" ? false : Boolean(v)
    })}`;
  }
}
const cmd = new Base({ id: "version" }, "command", true);
class Command extends Base {
  constructor(opts, strict) {
    super(opts, "command", strict);
  }
}
class Query extends Base {
  constructor(opts, strict) {
    super(opts, "query", strict);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Base,
  Command,
  NoDef,
  Query
});
