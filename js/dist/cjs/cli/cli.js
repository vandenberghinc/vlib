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
  CLI: () => CLI,
  cli: () => CLI,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_iterator = require("../code/iterator.js");
var import_scheme = require("../scheme/scheme.js");
var import_colors = require("../system/colors.js");
class CLI {
  /** The CLI name. */
  name;
  /** The CLI description for the usage docs. */
  description;
  /** The CLI version. */
  version;
  /** The main command for when no specific command is detected. */
  main;
  /** The list of commands. */
  commands;
  /** The notes. */
  notes;
  /** The argc start index. */
  start_index;
  /** The argv map. */
  argv_map = new Set(process.argv);
  /** Argv info map. */
  argv_info = /* @__PURE__ */ new Map();
  /**
   * The constructor.
   * @param name The CLI name.
   * @param description The CLI description.
   * @param version The CLI version.
   * @param notes The CLI notes.
   * @param main The main command for when no specific command is detected.
   * @param commands The list of commands.
   * @param start_index The argc start index, defaults to 2.
   */
  constructor({ name = "CLI", description = null, version = null, notes = null, main, commands = [], start_index = 2 } = {}) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.commands = commands.map(CLI.Command.init);
    this.main = main ? { ...main, id: new CLI.Query.Or("__main__") } : void 0;
    this.notes = notes;
    this.start_index = start_index;
    this._init();
  }
  /**
   * Initialize the CLI.
   *
   * 1) Adds a --version, -v command.
   */
  _init() {
    const query = new CLI.Query.Or("--version", "-v");
    if (this.version != null && !this.commands.some((cmd) => CLI.Query.match(cmd.id, query))) {
      this.commands.push({
        id: new CLI.Query.Or("--version", "-v"),
        description: "Show the CLI version.",
        args: [],
        callback: () => {
          console.log(`${this.name} v${this.version}`);
        }
      });
    }
  }
  /** Throw a cast single error. */
  _cast_single_error(value, type) {
    return `Unable to cast "${value}" of type "${import_scheme.Scheme.value_type(value)}" to type "${Array.isArray(type) ? type.join(" | ") : type}".`;
  }
  /**
   * Cast a single type with info options.
   */
  _cast_single(input, type) {
    let value;
    switch (type) {
      case "string":
        return { found: true, value: input };
      case "number": {
        const value2 = import_scheme.Scheme.cast_number(input, { strict: true, preserve: true });
        if (typeof value2 === "string") {
          return { found: true, error: this._cast_single_error(input, type) };
        }
        return { found: true, value: value2 };
      }
      case "boolean":
        value = import_scheme.Scheme.cast_bool(input, { preserve: true });
        if (typeof value === "string") {
          return { found: true, error: this._cast_single_error(input, type) };
        }
        return { found: true, value };
      // Array.
      case "array":
      case "string[]":
      case "boolean[]":
      case "number[]": {
        const out = Array.isArray(input) ? input : input.split(",");
        const value_type = type === "array" ? "string" : type.slice(0, -2);
        const value_types = value_type.split("|");
        if (value_types.length === 1 && value_types[0] === "string") {
          return { found: true, value: out };
        } else {
          const res = out.map((item) => this._cast(item, value_types));
          if (res.some((r) => r.error)) {
            return { found: true, error: this._cast_single_error(input, type) };
          }
          return { found: true, value: res.map((r) => r.value) };
        }
      }
      // Object.
      case "object":
      case "string:boolean":
      case "string:number":
      case "string:string":
      case "string:boolean|number|string":
      case "string:boolean|number":
      case "string:boolean|string":
      case "string:number|string":
      case "string:boolean|number|string|array":
      case "number:boolean":
      case "number:number":
      case "number:string": {
        if (typeof input !== "string") {
          throw Error(`Unable to cast "${import_scheme.Scheme.value_type(input)}" to an "object".`);
        }
        let key;
        let key_start = 0, value_start = 0;
        let mode = "key";
        const parsed = {};
        new import_iterator.CodeIterator(input, { string: ["'", '"', "`"] }, (state, it) => {
          const c = it.char();
          if (mode === "key" && state.is_code && (c === ":" || c === "=")) {
            key = it.slice(key_start, it.state.offset);
            mode = "value";
            value_start = it.state.offset + 1;
          } else if (mode === "value" && state.is_code && !it.is_excluded() && (c === "," || c === ";")) {
            if (key) {
              let end = it.state.offset;
              let first = input.charAt(value_start);
              if (
                // strip quotes.
                (first === "'" || first === '"' || first === "`") && first === input.charAt(it.state.offset - 1)
              ) {
                ++value_start;
                --end;
              }
              parsed[key] = it.slice(value_start, end);
            }
            key_start = it.state.offset + 1;
            mode = "key";
          }
        });
        if (type !== "object") {
          let key_type = type.slice(7);
          key_type = key_type.slice(0, key_type.indexOf(","));
          const value_type = type.slice(7 + key_type.length + 2, -1).split("|");
          const casted = /* @__PURE__ */ new Map();
          Object.keys(parsed).walk((key2) => {
            casted.set(key_type === "string" ? key2 : this._cast(key2, key_type), value_type.length === 1 && value_type[0] === "string" ? parsed[key2] : this._cast(parsed[key2], value_type));
          });
          return { found: true, value: casted };
        }
        return { found: true, value: parsed };
      }
      default:
        throw Error(`Unsupported cast type "${type.toString()}".`);
    }
  }
  /** Cast types. */
  _cast(value, type) {
    if (type == null) {
      return { found: true, value: void 0 };
    } else if (type == "string") {
      return { found: true, value };
    }
    if (Array.isArray(type)) {
      for (const t of type) {
        const res = this._cast_single(value, t);
        if (!res.error) {
          return res;
        }
      }
      return { found: true, error: this._cast_single_error(value, type) };
    }
    return this._cast_single(value, type);
  }
  /** Run a command. */
  async _run_command(command) {
    const callback_args = { _command: command };
    let arg_index = 0;
    for (const arg of command.args) {
      try {
        if (arg.id == null) {
          throw new Error(`Argument id is not defined for argument ${arg_index}.`);
        }
        let id_name;
        let child = arg.id;
        while (true) {
          if (Array.isArray(child)) {
            child = child[0];
          } else {
            break;
          }
        }
        id_name = child;
        if (typeof id_name !== "string") {
          this.throw(`Invalid argument id "${CLI.Query.to_str(arg.id)}".`);
        }
        while (id_name.startsWith("-")) {
          id_name = id_name.slice(1);
        }
        id_name = id_name.replace(/-/g, "_");
        if (id_name === "") {
          throw new Error(`Invalid argument id "${arg.id}".`);
        }
        if (arg.type === "boolean") {
          callback_args[id_name] = this.present(arg.id);
        } else {
          const { found, value } = this.get({
            id: arg.id,
            def: void 0,
            type: arg.type ?? "string",
            index: arg_index
          });
          if (found === false && arg.required === true) {
            throw new Error(`Define parameter "${arg.id}".`);
          }
          if (found === true && value == null && arg.default !== void 0) {
            callback_args[id_name] = arg.default;
          } else if (value != null) {
            callback_args[id_name] = value;
          }
        }
      } catch (err) {
        this.docs(command);
        this.error(err);
        return true;
      }
      ++arg_index;
    }
    try {
      await Promise.resolve(command.callback(callback_args));
    } catch (err) {
      this.docs(command);
      this.error(err);
      process.exit(1);
    }
  }
  get(o) {
    const opts = typeof o === "string" || Array.isArray(o) ? { id: o, type: "string", def: void 0, exclude_dash: true } : o;
    if (opts.type == null) {
      opts.type ??= "string";
    }
    opts.exclude_dash ??= true;
    if (!opts.id && opts.index == null) {
      this.throw("Either parameter 'id' or 'index' must be defined.");
    }
    const info = this.info(opts);
    if (!info.found) {
      return { ...info, value: opts.def };
    }
    return info;
  }
  /**
   * Get info.
   */
  info(opts) {
    const { id, index, type = "string", def, exclude_dash = true } = opts;
    const cache_id = `${opts.id ?? opts.index ?? ""}-${opts.type}`;
    if (this.argv_info.has(cache_id)) {
      return this.argv_info.get(cache_id);
    }
    const add = (info) => {
      this.argv_info.set(cache_id, info);
      return info;
    };
    if (index != null && id == null) {
      const value = process.argv[this.start_index + index];
      if (value === void 0) {
        return add({ found: false, error: `There is no argument at index "${index}".` });
      }
      return add(this._cast(value, type));
    }
    const is_array = Array.isArray(id);
    for (let i = this.start_index; i < process.argv.length; i++) {
      if (is_array && id?.includes(process.argv[i]) || !is_array && process.argv[i] === id) {
        const value = process.argv[i + 1];
        if (value === void 0 || value.charAt(0) === "-") {
          return add({ found: false, error: `No value found for argument "${CLI.Query.to_str(id)}".` });
        }
        return add(this._cast(value, type));
      }
    }
    return add({ found: false, error: `No value found for argument "${CLI.Query.to_str(id ?? "undefined")}".` });
  }
  /**
   * Check if an argument is present.
   * @libris
   */
  present(id) {
    if (id instanceof CLI.Query.And) {
      return id.every((i) => this.present(i));
    } else if (id instanceof CLI.Query.Or || Array.isArray(id)) {
      return id.some((i) => this.present(i));
    } else {
      return this.argv_map.has(id);
    }
  }
  /**
   * Log an error.
   * @libris
   */
  error(...err) {
    let str = "";
    err.forEach((e) => {
      if (e.stack) {
        str += "\n" + e.stack;
      } else {
        str += e.toString();
      }
    });
    str = str.trim();
    if (str.startsWith("Error: ") || str.startsWith("error: ")) {
      str = str.substring(7).trim();
    }
    console.error(`${import_colors.Colors.red}Error${import_colors.Colors.end}: ${str}`);
  }
  /**
   * Throw an error and stop with exit code 1.
   * @libris
   */
  throw(...err) {
    this.error(...err);
    process.exit(1);
  }
  throw_error(...err) {
    this.error(...err);
    process.exit(1);
  }
  throw_err(...err) {
    this.error(...err);
    process.exit(1);
  }
  /**
   * Log the docs, optionally of an array of command or a single command.
   * @libris
   */
  docs(command_or_commands = null) {
    if (command_or_commands == null) {
      command_or_commands = this.commands;
    }
    let docs = "";
    if (this.name != null) {
      docs += this.name;
    }
    if (this.version != null) {
      docs += ` v${this.version}`;
    }
    if (docs.length > 0) {
      docs += "\n";
    }
    const add_keys_and_values = (list) => {
      let max_length = 0;
      list.forEach((item) => {
        if (item[0].length > max_length) {
          max_length = item[0].length;
        }
      });
      list.forEach((item) => {
        while (item[0].length < max_length + 4) {
          item[0] += " ";
        }
        docs += item[0] + item[1];
      });
    };
    if (Array.isArray(command_or_commands)) {
      if (this.description) {
        docs += `
Description:
    ${this.description.split("\n").join("\n    ")}
`;
      }
      docs += `Usage: $ ${this.name} [mode] [options]
`;
      const list = [];
      command_or_commands.forEach((command) => {
        const list_item = ["", ""];
        list_item[0] = `    ${CLI.Query.to_str(command.id)}`;
        list_item[1] = (command.description ?? "") + "\n";
        list.push(list_item);
        if (command.args.length > 0) {
          let arg_index = 0;
          command.args.forEach((arg) => {
            if (arg.ignore === true) {
              return;
            }
            const list_item2 = ["", ""];
            if (arg.id == null) {
              list_item2[0] = `        argument ${arg_index}`;
            } else {
              list_item2[0] = `        ${CLI.Query.to_str(arg.id)}`;
            }
            if (arg.type != null && arg.type !== "boolean") {
              list_item2[0] += ` <${arg.type}>`;
            }
            if (arg.required === true) {
              list_item2[0] += " (required)";
            }
            list_item2[1] = (arg.description ?? "") + "\n";
            list.push(list_item2);
            ++arg_index;
          });
        }
      });
      list.push([
        "    --help, -h",
        "Show the overall documentation or when used in combination with a command, show the documentation for a certain command.\n"
      ]);
      add_keys_and_values(list);
      if (docs.charAt(docs.length - 1) === "\n") {
        docs = docs.slice(0, -1);
      }
      if (this.notes && this.notes.length > 0) {
        docs += `
Notes:
`;
        this.notes.forEach((note) => {
          docs += ` * ${note}
`;
        });
      }
      if (docs.charAt(docs.length - 1) === "\n") {
        docs = docs.slice(0, -1);
      }
    } else {
      if (this.description) {
        docs += this.description + "\n";
      }
      docs += `Usage: $ ${this.name} ${CLI.Query.to_str(command_or_commands.id)} [options]
`;
      if (command_or_commands.description) {
        docs += `
${command_or_commands.description}
`;
      }
      if (command_or_commands.args.length > 0) {
        docs += `
Options:
`;
        let arg_index = 0;
        const list = [];
        command_or_commands.args.forEach((arg) => {
          if (arg.ignore === true) {
            return;
          }
          const list_item = ["", ""];
          if (arg.id == null) {
            list_item[0] = `    argument ${arg_index}`;
          } else {
            list_item[0] = `    ${CLI.Query.to_str(arg.id)}`;
          }
          if (arg.type != null && arg.type !== "boolean") {
            list_item[0] += ` <${arg.type}>`;
          }
          if (arg.required === true) {
            list_item[0] += " (required)";
          }
          list_item[1] = (arg.description ?? "") + "\n";
          list.push(list_item);
          ++arg_index;
        });
        add_keys_and_values(list);
      }
      if (command_or_commands.examples != null) {
        docs += `
Examples:
`;
        if (typeof command_or_commands.examples === "string") {
          docs += `    ${import_colors.Colors.italic}${command_or_commands.examples.startsWith("$") ? "" : "$ "}${command_or_commands.examples}${import_colors.Colors.end}
`;
        } else if (Array.isArray(command_or_commands.examples)) {
          command_or_commands.examples.forEach((item) => {
            docs += `    ${import_colors.Colors.italic}${item.startsWith("$") ? "" : "$ "}${item}${import_colors.Colors.end}
`;
          });
        } else {
          const list = [];
          Object.entries(command_or_commands.examples).forEach(([desc, example]) => {
            list.push([
              `    ${desc.trimEnd()}:`,
              `${import_colors.Colors.italic}${example.startsWith("$") ? "" : "$ "}${example}${import_colors.Colors.end}
`
            ]);
          });
          add_keys_and_values(list);
        }
      }
      if (docs.charAt(docs.length - 1) === "\n") {
        docs = docs.slice(0, -1);
      }
    }
    console.log(docs);
  }
  /**
   * Start the cli.
   * @libris
   */
  async start() {
    const help = this.present(["-h", "--help"]);
    let matched = false;
    for (const command of this.commands) {
      if (this.present(command.id)) {
        if (help) {
          this.docs(command);
          return true;
        }
        await this._run_command(command);
        matched = true;
        break;
      }
    }
    if (!matched && help) {
      this.docs();
      return true;
    }
    if (!matched && this.main) {
      if (help) {
        this.docs(this.main);
        return true;
      }
      if (!this.main.args.some((x) => x.id == null || this.present(x.id))) {
        this.docs();
        this.error("Invalid mode.");
        return false;
      }
      await this._run_command(this.main);
      matched = true;
    }
    if (!matched) {
      this.docs();
      this.error("Invalid mode.");
      return false;
    }
    return true;
  }
  // --------------------------------------------------------------------------------
  // Static methods
  static _cli;
  static get(opts) {
    if (CLI._cli === void 0) {
      CLI._cli = new CLI();
    }
    return CLI._cli.get(opts).value;
  }
  /**
   * Check if an argument is present.
   * @libris
   */
  static present(id) {
    if (CLI._cli === void 0) {
      CLI._cli = new CLI();
    }
    return CLI._cli.present(id);
  }
}
var stdin_default = CLI;
(function(CLI2) {
  let Command;
  (function(Command2) {
    Command2.id = (query) => query instanceof Query.Or || query instanceof Query.And ? query : typeof query === "string" ? new Query.Or(query) : new Query.Or(...query);
    Command2.init = (obj) => ({
      ...obj,
      id: Command2.id(obj.id)
    });
  })(Command = CLI2.Command || (CLI2.Command = {}));
  let Query;
  (function(Query2) {
    class And extends Array {
      constructor(...args) {
        super(...args);
      }
      match(fn) {
        return this.every(fn);
      }
    }
    Query2.And = And;
    (function(And2) {
      And2.is = (x) => x instanceof And2;
    })(And = Query2.And || (Query2.And = {}));
    class Or extends Array {
      constructor(...args) {
        super(...args);
      }
      match(fn) {
        return this.some(fn);
      }
    }
    Query2.Or = Or;
    (function(Or2) {
      Or2.is = (x) => x instanceof And === false && Array.isArray(x);
    })(Or = Query2.Or || (Query2.Or = {}));
    Query2.to_str = (id) => id instanceof And ? id.map(Query2.to_str).join(" ") : Array.isArray(id) ? id.map(Query2.to_str).join(", ") : id;
    function match(id, query) {
      if (id instanceof And) {
        return id.every((item, index) => {
          if (typeof query === "string") {
            return match_str(item, query);
          }
          const q = query[index];
          return Array.isArray(q) ? q.includes(item) : match_str(item, q);
        });
      } else if (id instanceof Or || Array.isArray(id)) {
        return id.some((item) => match_str(query, item));
      } else if (typeof id === "string") {
        return match_str(query, id);
      } else {
        throw new Error(`Invalid query type: ${id.toString()}`);
      }
    }
    Query2.match = match;
    function match_str(id, query) {
      if (id instanceof And) {
        return id.every((i) => i === query);
      } else if (id instanceof Or) {
        return id.includes(query);
      } else if (Array.isArray(id)) {
        return id.includes(query);
      } else if (typeof query === "string") {
        return id === query;
      } else {
        throw new Error(`Invalid query type: ${query.toString()}`);
      }
    }
    Query2.match_str = match_str;
  })(Query = CLI2.Query || (CLI2.Query = {}));
})(CLI || (CLI = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLI,
  cli
});
