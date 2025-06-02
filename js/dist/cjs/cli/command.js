var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Base: () => Base,
  Command: () => Command,
  Main: () => Main
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
var import_query = require("./query.js");
var Scheme = __toESM(require("../scheme/index.m.uni.js"));
var Arg = __toESM(require("./arg.js"));
class Base {
  /** The command mode. */
  mode;
  /** The command variant. */
  variant;
  /** The strict mode, when `true` some additional checks are performed. */
  strict;
  /** The id attribute for the `id` variant. @attr */
  id;
  /**
   * The index number for the `index` variant.
   * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
   * @attr
   */
  index;
  /**
   * Description of the command for the CLI help.
   */
  description;
  /**
   * Command examples for the CLI help.
   */
  examples;
  /**
   * Callback function to execute when the command is invoked.
   * The argument types should automatically be inferred from the `args` definitions.
   * The command is bound to the Base instance, so `this` is the command instance.
   * @note That we dont infer the actual args here, this causes issues with converting matching Base types.
   *       Only infer on the user input callback so the user has the correct types.
   */
  callback;
  /**
   * Command arguments.
   * This list of argument is also used to infer the callback argument types.
   */
  args;
  /**
   * Initialize a command object.
   * @param variant - The command variant, this can be auto detected or an expected variant type.
   * @param opts - The command options to initialize.
   * @throws An error when the the command input is invalid.
   */
  constructor(opts, mode, strict) {
    if (opts instanceof Base) {
      this.variant = opts.variant;
      this.mode = opts.mode;
      this.strict = opts.strict;
      this.id = opts.id;
      this.index = opts.index;
      this.description = opts.description;
      this.examples = opts.examples;
      this.callback = opts.callback;
      this.args = opts.args;
      return;
    }
    this.description = opts.description;
    this.examples = opts.examples ?? [];
    this.callback = opts.callback.bind(this);
    this.mode = mode;
    this.strict = strict;
    this.variant = Arg.Base.infer_variant(opts, this.mode !== "main");
    if (this.mode === "main") {
      this.index = void 0;
      this.id = void 0;
    } else {
      switch (this.variant) {
        case "index":
          if (typeof opts.index !== "number") {
            throw new Error(`Command variant "id" requires an "index" attribute to be defined, but got ${import_colors.Color.object(opts)}.`);
          }
          this.index = opts.index;
          this.id = void 0;
          break;
        case "id":
          if (opts.id == null) {
            throw new Error(`Command variant "id" requires an "index" attribute to be defined, but got ${import_colors.Color.object(opts)}.`);
          }
          this.index = void 0;
          this.id = opts.id instanceof import_query.And || opts.id instanceof import_query.Or ? opts.id : typeof opts.id === "string" ? new import_query.Or(opts.id) : new import_query.Or(...opts.id);
          break;
        default:
          throw new Error(`Invalid command variant "${variant.toString()}". Expected "id", "index".`);
      }
    }
    if (opts.args) {
      this.args = opts.args.map((a) => a instanceof Arg.Command ? a : new Arg.Command(a, this.strict)) ?? [];
    } else {
      this.args = [];
    }
  }
  /**
   * Find a command by a query.
   */
  find(commands, query) {
    if (typeof query === "number") {
      if (query < 0 || query >= commands.length) {
        throw new Error(`Command index ${query} is out of bounds, expected 0-${commands.length - 1}.`);
      }
      return commands[query];
    } else if (typeof query === "string") {
      const cmd = commands.find((c) => c.id === query || c.description === query);
      if (!cmd) {
        throw new Error(`Command with name "${query}" not found.`);
      }
      return cmd;
    } else if (query && typeof query === "object" && "id" in query) {
    } else {
      throw new Error(`Invalid query type: ${typeof query}. Expected a number, string or an object with an id property, not "${query.toString()}".`);
    }
  }
  /** Utility to check againt index. */
  eq_index(query) {
    if (this.variant !== "id") {
      throw new Error("Cannot use 'eq_index' on a command with id variant, use 'eq_id' instead.");
    }
    return this.index === query;
  }
  /** Check if the id attribute matches a certain query. */
  eq_id(query) {
    if (this.variant !== "id") {
      throw new Error("Cannot use `eq_id` on a command with index variant, use `eq_index` instead.");
    }
    return Base.eq_id(this.id, query);
  }
  /** Static helper method to check if the id attribute matches a certain query. */
  static eq_id(id, query) {
    if (id instanceof import_query.And) {
      if (query instanceof import_query.And) {
        if (id.length !== query.length) {
          return false;
        }
        return id.every((x, i) => {
          const y = query[i];
          if (x instanceof import_query.And) {
            return this.eq_id(x, y);
          } else if (y instanceof import_query.Or || Array.isArray(y)) {
            return this.eq_id(y, x);
          } else {
            return x === y;
          }
        });
      }
      return id.every((x) => {
        if (query instanceof import_query.Or || Array.isArray(query)) {
          return this.eq_id(query, x);
        } else {
          return x === query;
        }
      });
    } else if (id instanceof import_query.Or || Array.isArray(id)) {
      if (query instanceof import_query.And) {
        return id.some((x) => this.eq_id(query, x));
      }
      if (query instanceof import_query.Or || Array.isArray(query)) {
        return id.some((x) => this.eq_id(query, x));
      }
      return id.includes(query);
    } else {
      Scheme.throw_invalid_type({
        name: "Command.eq_id.id",
        type: ["And", "Or"],
        throw: true,
        /** @ts-expect-error */
        value: id.toString()
      });
    }
  }
}
class Main extends Base {
  constructor(opts, strict) {
    super(opts, "main", strict);
  }
}
class Command extends Base {
  constructor(opts, strict) {
    super(opts, "command", strict);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Base,
  Command,
  Main
});
