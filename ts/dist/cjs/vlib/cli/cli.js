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
  CLI: () => CLI,
  cli: () => cli,
  get: () => get,
  present: () => present
});
module.exports = __toCommonJS(stdin_exports);
var import_iterator = require("../code/iterator.js");
var Scheme = __toESM(require("../schema/index.m.uni.js"));
var import_colors = require("../generic/colors.js");
var import_error = require("./error.js");
var import_query = require("./query.js");
var import_index_m_node = require("../logging/index.m.node.js");
var import_object = require("../primitives/object.js");
var Arg = __toESM(require("./arg.js"));
var import_command = require("./command.js");
Error.stackTraceLimit = 100;
class CLI {
  /** The CLI name. */
  name;
  /** The CLI description for the usage docs. */
  description;
  /** The CLI version. */
  version;
  /** The main command for when no specific command is detected. */
  _main;
  /** The list of commands. */
  commands = [];
  /**
   * The list of global option arguments.
   * @todo not implemented yet.
   */
  option_args = [];
  /** The notes. */
  notes;
  /** The argc start index. */
  // private start_index: number;
  /** The argv set & map. */
  argv;
  argv_set;
  /** Argv info map. */
  argv_info = /* @__PURE__ */ new Map();
  /** Whether to throw an error when an unknown command is detected, defaults to false. */
  strict;
  /** The parsed & inferred options. */
  options;
  /**
   * The constructor.
   * @param name The CLI name.
   * @param description The CLI description.
   * @param version The CLI version.
   * @param notes The CLI notes.
   * @param main The main command for when no specific command is detected.
   * @param commands The list of commands.
   * @param strict Whether to throw an error when an unknown command is detected, defaults to false.
   */
  constructor({
    name = "CLI",
    description,
    version = "1.0.0",
    argv = process.argv,
    // default start index is 2.
    notes = [],
    options,
    strict,
    _sys = false
  }) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.notes = notes;
    this.strict = strict ?? false;
    this.option_args = !options ? [] : options.map((o) => o instanceof Arg.Command ? o : new Arg.Command(o, this.strict));
    argv = argv.slice(2);
    this.argv = argv;
    this.argv_set = new Set(argv);
    this.options = {};
    this._init(_sys);
  }
  /** Check unknown arguments. */
  _check_unknown_args() {
    const known_id_args = /* @__PURE__ */ new Set();
    const add_arg = (arg) => {
      if (arg.variant === "id" && arg.id) {
        if (arg.id instanceof import_query.Or || arg.id instanceof import_query.And) {
          arg.id.walk((id) => known_id_args.add(id));
        } else {
          known_id_args.add(arg.id);
        }
      }
    };
    const add_command = (cmd) => {
      if (cmd.id instanceof import_query.Or || cmd.id instanceof import_query.And) {
        cmd.id.walk((id) => known_id_args.add(id));
      } else {
        known_id_args.add(cmd.id);
      }
      if (cmd.args?.length) {
        cmd.args.walk(add_arg);
      }
    };
    for (const cmd of this.commands) {
      add_command(cmd);
    }
    this.commands.walk(add_command);
    this.option_args.walk(add_arg);
    if (this._main) {
      add_command(this._main);
    }
    for (let i = 0; i < this.argv.length; i++) {
      const item = this.argv[i];
      if (item.charAt(0) !== "-" || item === "--help" || item === "-h") {
        continue;
      }
      if (!known_id_args.has(item)) {
        if (this.strict) {
          throw this.error(`Unknown argument "${item}".`, { docs: true });
        }
      }
    }
  }
  /**
   * Check if a command with an id query exists.
   */
  _has_id_command(id) {
    return this.commands.some((cmd) => cmd.variant === "id" ? cmd.eq_id(id) : false);
  }
  /**
   * Initialize the CLI.
   *
   * 1) Adds a --version, -v command.
   */
  _init(_sys = false) {
    if (_sys === false) {
      if (this.version != null && !this._has_id_command(["--version", "-v"])) {
        this.command({
          id: ["--version", "-v"],
          description: "Show the CLI version.",
          callback: (args) => console.log(`${this.name} v${this.version}`)
        });
      }
    }
    if (this.option_args.length) {
      this.options = this.parse_args(this.option_args, 0, void 0);
    } else {
      this.options = {};
    }
  }
  /** Throw a cast single error. */
  _cast_single_error(value, type) {
    return `Unable to cast "${value}" of type "${Scheme.value_type(value)}" to type "${Array.isArray(type) ? type.join(" | ") : type}".`;
  }
  /**
   * Cast a single type with info options.
   */
  _cast_single(query, input, type, command) {
    let value;
    switch (type) {
      case "string":
        return { status: "success", value: input, query };
      // return i;
      case "number": {
        const value2 = Scheme.cast.number(input, { preserve: true });
        if (typeof value2 === "string") {
          return { status: "invalid_value", error: this._cast_single_error(input, type), query };
        }
        return { status: "success", value: value2, query };
      }
      case "boolean":
        value = Scheme.cast.boolean(input, { preserve: true });
        if (typeof value === "string") {
          return { status: "invalid_value", error: this._cast_single_error(input, type), query };
        }
        return { status: "success", value, query };
      // Array.
      case "array":
      case "string[]":
      case "boolean[]":
      case "number[]": {
        const out = Array.isArray(input) ? input : input.split(",");
        const value_type = type === "array" ? "string" : type.slice(0, -2);
        const value_types = value_type.split("|");
        if (value_types.length === 1 && value_types[0] === "string") {
          return { status: "success", value: out, query };
        } else {
          const res = out.map((item) => this._cast(query, item, value_types, command));
          if (res.some((r) => r.error)) {
            return { status: "invalid_type", error: this._cast_single_error(input, type), query };
          }
          return { status: "success", value: res.map((r) => r.value), query };
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
          throw this.error(`Unable to cast "${Scheme.value_type(input)}" to an "object".`, { command });
        }
        let key;
        let key_start = 0, value_start = 0;
        let mode = "key";
        const parsed = {};
        new import_iterator.Iterator({ data: input }, { language: { string: ["'", '"', "`"] } }).walk((it) => {
          const c = it.char;
          if (mode === "key" && it.is_code && (c === ":" || c === "=")) {
            key = it.slice(key_start, it.pos);
            mode = "value";
            value_start = it.pos + 1;
          } else if (mode === "value" && it.is_code && !it.is_escaped && (c === "," || c === ";")) {
            if (key) {
              let end = it.pos;
              let first = input.charAt(value_start);
              if (
                // strip quotes.
                (first === "'" || first === '"' || first === "`") && first === input.charAt(it.pos - 1)
              ) {
                ++value_start;
                --end;
              }
              parsed[key] = it.slice(value_start, end);
            }
            key_start = it.pos + 1;
            mode = "key";
          }
        });
        if (type !== "object") {
          let key_type = type.slice(7);
          key_type = key_type.slice(0, key_type.indexOf(","));
          const value_type = type.slice(7 + key_type.length + 2, -1).split("|");
          const record = key_type === "string" ? {} : void 0;
          const map = record == null ? /* @__PURE__ */ new Map() : void 0;
          Object.keys(parsed).walk((key2) => {
            if (record) {
              record[key2] = value_type.length === 1 && value_type[0] === "string" ? parsed[key2] : this._cast(query, parsed[key2], value_type, command);
            } else {
              map?.set(key_type === "string" ? key2 : this._cast(query, key2, key_type, command), value_type.length === 1 && value_type[0] === "string" ? parsed[key2] : this._cast(query, parsed[key2], value_type, command));
            }
          });
          return { status: "success", value: map ?? record, query };
        }
        return { status: "success", value: parsed, query };
      }
      default:
        throw this.error(`Unsupported cast type "${type.toString()}".`, command);
    }
  }
  /** Cast types. */
  _cast(query, value, type, command) {
    if (type == null) {
      return { status: "success", value: void 0, query };
    } else if (type == "string") {
      return { status: "success", value, query };
    }
    if (Array.isArray(type)) {
      for (const t of type) {
        const res = this._cast_single(query, value, t, command);
        if (!res.error) {
          return res;
        }
      }
      return { status: "invalid_type", error: this._cast_single_error(value, type), query };
    }
    return this._cast_single(query, value, type, command);
  }
  /** Wrapper function to add an info object and return the info for one line returns. */
  add_info(info, command) {
    if (!info.query) {
      throw new Error("Query is not defined in info object.");
    }
    const query = info.query;
    if (info.status === "success" && query.enum) {
      if (!query.enum.includes(info.value)) {
        const joined = query.enum.map((item) => {
          if (item == null) {
            return "null";
          } else if (typeof item !== "string" && !(item instanceof String)) {
            return item.toString();
          }
          return `"${item.toString()}"`;
        }).join(", ");
        throw this.error(`Argument "${query.identifier()}" must be one of the following enumerated values [${joined}].`, { command });
      }
    }
    const cache_id = `${query.id ?? query.index ?? ""}-${query.type}`;
    this.argv_info.set(cache_id, info);
    return info;
  }
  // Add an argument to the command arguments object.
  add_to_cmd_args(cmd_args, name, value, parent, command) {
    if (name instanceof import_query.And) {
      if (parent === cmd_args) {
        let id = name[name.length - 1];
        if (typeof id !== "string")
          id = id[0];
        id = id.replace(/^-+/, "");
        parent[id] = value;
      }
      if (name.length === 0) {
        throw this.error("Cannot insert an empty name array.", { command });
      } else if (name.length === 1) {
        const id = name[0].replace(/^-+/, "");
        parent[id] = value;
      } else {
        const first = name[0].replace(/^-+/, "");
        parent[first] ??= {};
        this.add_to_cmd_args(cmd_args, name.slice(1), value, parent[first], command);
      }
    } else if (Array.isArray(name)) {
      const id = name[0].replace(/^-+/, "");
      parent[id] = value;
    } else {
      parent[name.replace(/^-+/, "")] = value;
    }
  }
  /** Parse an `args` object from a list of `Arg.Command` instances. */
  async parse_args(cmd_args, args_start_index, command) {
    const args = {};
    if (cmd_args.length) {
      for (const arg of cmd_args) {
        try {
          if (!arg.arg_name) {
            throw this.error(`Argument is not initialized: ${arg}`, { command });
          }
          if (import_index_m_node.log.on(2))
            (0, import_index_m_node.log)("Parsing argument ", (0, import_query.and_or_str)(arg.id));
          if (arg.type === "boolean") {
            if (!arg.id) {
              throw this.error(`Argument "${arg.arg_name}" is not initialized with an id, this is required for boolean types.`, { command });
            }
            this.add_to_cmd_args(args, arg.arg_name, this.has(arg.id), args, command);
          } else {
            const { status, value } = this.info(arg, args_start_index, command);
            if (import_index_m_node.log.on(2))
              (0, import_index_m_node.log)("Argument info ", (0, import_query.and_or_str)(arg.id), ": ", { status, value });
            if (status === "not_found" && arg.required) {
              throw this.error(`Required argument "${(0, import_query.and_or_str)(arg.arg_name)}" was not found`, { command });
            } else if (status === "success" || status === "default") {
              this.add_to_cmd_args(args, arg.arg_name, value, args, command);
            }
          }
        } catch (error) {
          if (error instanceof import_error.CLIError) {
            throw error;
          }
          throw this.error(`Encountered an error while parsing argument "${arg.identifier()}" from command "${command?.identifier()}".`, { error, command });
        }
      }
    }
    return args;
  }
  /** Run a command. */
  async run_command(command, args_start_index = 0) {
    const cmd_args = await this.parse_args(command.args ?? [], args_start_index, command);
    try {
      await Promise.resolve(command.callback(cmd_args, this));
    } catch (error) {
      if (error instanceof import_error.CLIError) {
        throw error;
      }
      if (import_index_m_node.log.on(1)) {
        throw this.error(`Encountered an error while executing cli command "${command.identifier()}".`, { error, command });
      }
      Error.stackTraceLimit = 25;
      throw error;
    }
  }
  /** Find the index of an argument / command. */
  find_arg(arg, start_index = 0) {
    if (import_index_m_node.log.on(3))
      (0, import_index_m_node.log)("Finding argument ", arg);
    let index = void 0;
    let value_index = void 0;
    const is_boolean = arg instanceof Arg.Base ? arg.type === "boolean" : false;
    const exclude_dash = arg instanceof Arg.Base ? arg.exclude_dash : true;
    if (typeof arg.index === "number") {
      if (arg.index + start_index < this.argv.length) {
        index = arg.index + start_index;
        value_index = arg.index + start_index;
      }
    } else if (arg.id instanceof import_query.And) {
      if ((index = arg.id.match(this.argv, start_index)) != null) {
        index = index;
        value_index = index + arg.id.length;
      }
    } else if (arg.id instanceof import_query.Or && arg.id.some((i) => this.argv_set.has(i))) {
      if ((index = arg.id.match(this.argv, start_index)) != null) {
        index = index;
        value_index = index + 1;
      }
    } else if (typeof arg.id === "string" && this.argv_set.has(arg.id)) {
      index = this.argv.indexOf(arg.id, 10);
      if (index !== -1) {
        value_index = index + 1;
      }
    }
    if (import_index_m_node.log.on(3))
      (0, import_index_m_node.log)("Initially found indexes ", { index, value_index });
    if (index === -1) {
      index = void 0;
    }
    if (is_boolean) {
      if (index == null) {
        return { found: false, index, is_boolean };
      }
      return { found: true, index, is_boolean };
    }
    let value;
    if (index == null || value_index == null || value_index === -1 || value_index >= this.argv.length || (value = this.argv[value_index]) === void 0 || exclude_dash && value.charAt(0) === "-") {
      value_index = void 0;
    }
    if (index == null) {
      return { found: false, index, is_boolean, value_index };
    }
    return { found: true, index, is_boolean, value_index };
  }
  /**
   * Check if the CLI has an argument index or id(s).
   * @libris
   */
  has(id) {
    if (id instanceof Arg.Base) {
      return this.has(id.variant === "index" ? id.index : id.id);
    } else if (typeof id === "number") {
      return id < this.argv.length;
    } else if (id instanceof import_query.And) {
      return id.every((i) => this.has(i));
    } else if (id instanceof import_query.Or || Array.isArray(id)) {
      return id.some((i) => this.has(i));
    } else {
      return this.argv_set.has(id);
    }
  }
  /**
   * {Info}
   *
   * Get info about an argument.
   *
   * @param q The argument query. See {@link Arg.Query} for information.
   *
   * @libris
   */
  info(q, _s_index, _command) {
    const query = typeof q === "string" || Array.isArray(q) || q instanceof import_query.Or || q instanceof import_query.And ? new Arg.Query({ id: q, type: "string" }, this.strict) : q instanceof Arg.Base ? q : new Arg.Query(q, this.strict);
    const { id, index, def, type = "string" } = query;
    if (!id && index == null) {
      throw new Error("Invalid argument, either parameter 'id' or 'index' must be defined. Argument: " + import_colors.Color.object(query));
    }
    const cache_id = `${id ?? index ?? ""}-${type}`;
    if (this.argv_info.has(cache_id)) {
      return this.argv_info.get(cache_id);
    }
    const { found, is_boolean, value_index } = this.find_arg(query);
    if (is_boolean) {
      if (found === false && typeof def === "boolean") {
        return this.add_info({
          status: "default",
          value: def,
          query
        }, _command);
      }
      return this.add_info({
        status: "success",
        value: found,
        query
      }, _command);
    }
    if (value_index != null && this.argv[value_index] !== void 0) {
      const value = this.argv[value_index];
      if (value === void 0) {
        if (def !== Arg.NoDef) {
          return this.add_info({
            status: "default",
            value: def,
            query
          }, _command);
        }
        return this.add_info({
          status: "not_found",
          error: `Not a valid value found for argument "${(0, import_query.and_or_str)(id)}".`,
          query
        }, _command);
      }
      return this.add_info(this._cast(query, value, type, _command), _command);
    }
    if (def !== Arg.NoDef) {
      return this.add_info({
        status: "default",
        value: def,
        query
      }, _command);
    }
    return this.add_info({
      status: "not_found",
      error: `No value found for argument "${(0, import_query.and_or_str)(id ?? "undefined")}".`,
      query
    }, _command);
  }
  /**
   * {Get}
   * Get an argument.
   * @param query The argument get options. See {@link Arg.Base} for option information.
   * @libris
   */
  get(query) {
    const res = this.info(query);
    if (res.error) {
      if (res.status === "not_found") {
        if (res.query.required) {
          throw this.error(`Required argument "${(0, import_query.and_or_str)(res.query.id ?? res.query.index)}" was not found.`, { docs: true });
        } else {
          return void 0;
        }
      }
      throw this.error(res.error);
    }
    return res.value;
  }
  /**
   * Create a CLI error.
   * This error is specially handled by the CLI when executing a command.
   * Therefore it will be dumped pretty when thrown inside a command.
   */
  error(err, opts) {
    if (err instanceof import_error.CLIError) {
      return err;
    }
    if (opts) {
      opts.id ??= opts.command ? `${this.name}:${opts.command.identifier()}` : this.name;
      if (opts.docs === true) {
        opts.docs = opts.command ? this.docs(opts.command, false) : this.docs(void 0, false);
      }
    }
    return new import_error.CLIError(err, opts);
  }
  /**
   * Log the docs, optionally of an array of command or a single command.
   * Internally the indent size is set to argument `--docs-indent-size` which defaults to 2.
   * So this is available through the `$ mycli --help --docs-indent-size 4` help command.
   *
   * @docs
   */
  docs(command, dump = true) {
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
    const indent_size = this.get({ id: "--docs-indent-size", def: 2 });
    const indent = " ".repeat(indent_size);
    const add_align_entries = (list) => {
      let max_length = 0;
      list.forEach((item) => {
        if (item[0].length > max_length) {
          max_length = item[0].length;
        }
      });
      list.forEach((item) => {
        while (item[0].length < max_length + indent_size) {
          item[0] += " ";
        }
        docs += item[0] + item[1];
      });
    };
    const add_cmd_args = (list, indent2 = "    ", args) => {
      let real_index = 0;
      args.forEach((arg) => {
        if (arg.ignore === true) {
          return;
        }
        const list_item = ["", ""];
        if (arg.id == null) {
          list_item[0] = `${indent2}argument ${real_index}`;
        } else {
          list_item[0] = `${indent2}${(0, import_query.and_or_str)(arg.id)}`;
        }
        if (arg.type != null && arg.type !== "boolean") {
          list_item[0] += ` <${arg.type}>`;
        }
        if (arg.required) {
          list_item[0] += " (required)";
        }
        list_item[1] = (arg.description ?? "") + "\n";
        list.push(list_item);
        ++real_index;
      });
    };
    if (command == null) {
      if (this.description) {
        docs += `
Description:
    ${this.description.split("\n").join("\n    ")}
`;
      }
      docs += `Usage: $ ${this.name} [mode] [options]
`;
      const list = [];
      if (this._main) {
        list.push([`
Main command:`, "\n"]);
        add_cmd_args(list, indent, this._main.args);
        list.push(["\nCommands:", "\n"]);
      }
      this.commands.walk((command2) => {
        list.push([
          `${indent}${(0, import_query.and_or_str)(command2.id ?? "<main>")}`,
          (command2.description ?? "") + "\n"
        ]);
        if (command2.args?.length) {
          add_cmd_args(list, " ".repeat(indent_size * 2), command2.args);
        }
      });
      list.push([
        `${indent}--help, -h`,
        "Show the overall documentation or when used in combination with a command, show the documentation for a certain command.\n"
      ]);
      if (this.option_args?.length) {
        list.push([`
Options:`, "\n"]);
        add_cmd_args(list, indent, this.option_args);
      }
      add_align_entries(list);
      list.length = 0;
      if (docs.charAt(docs.length - 1) === "\n") {
        docs = docs.slice(0, -1);
      }
      if (this.notes && this.notes.length > 0) {
        docs += `

Notes:
`;
        this.notes.forEach((note) => {
          docs += `${indent}- ${note}
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
      docs += `Usage: $ ${this.name} ${(0, import_query.and_or_str)(command.id ?? `<main>`)} [options]
`;
      if (command.description) {
        docs += `
${command.description}
`;
      }
      if (command?.args?.length) {
        docs += `
Options:
`;
        const list = [];
        add_cmd_args(list, indent, command.args);
        add_align_entries(list);
      }
      if (command.examples?.length) {
        docs += `
Examples:
`;
        if (typeof command.examples === "string") {
          docs += `${indent}${import_colors.Colors.italic}${command.examples.startsWith("$") ? "" : "$ "}${command.examples}${import_colors.Colors.end}
`;
        } else if (Array.isArray(command.examples)) {
          command.examples.forEach((item) => {
            docs += `${indent}${import_colors.Colors.italic}${item.startsWith("$") ? "" : "$ "}${item}${import_colors.Colors.end}
`;
          });
        } else {
          const list = [];
          Object.entries(command.examples).forEach(([desc, example]) => {
            list.push([
              `${indent}${desc.trimEnd()}:`,
              `${import_colors.Colors.italic}${example.startsWith("$") ? "" : "$ "}${example}${import_colors.Colors.end}
`
            ]);
          });
          add_align_entries(list);
        }
      }
      if (docs.charAt(docs.length - 1) === "\n") {
        docs = docs.slice(0, -1);
      }
    }
    if (dump) {
      console.log(docs);
    }
    return docs;
  }
  /**
   * Add the main command.
   *
   * @param main The main command to set.
   *
   * @returns The current CLI instance for chaining.
   *
   * @dev_note We require a special function for this
   *           Dont allow passing this in constructor opts.
   *           This is so we can infer the args using InferArgs.
   *           That doesnt work when passing a commands array to the constructor.
   */
  main(main) {
    if (this._main) {
      throw this.error("Main command already set.");
    }
    this._main = main instanceof import_command.Main ? main : new import_command.Main(main, this.strict);
    this._main.init(this);
    if (import_index_m_node.log.on(3))
      (0, import_index_m_node.log)("Added main command: ", this._main);
    return this;
  }
  /**
   * Add an identifier based command mode to the CLI.
   *
   * @param cmd The command to add.
   *
   * @returns The current CLI instance for chaining.
   *
   * @dev_note We require a special function for this
   *           Dont allow passing this in constructor opts.
   *           This is so we can infer the args using InferArgs.
   *           That doesnt work when passing a commands array to the constructor.
   */
  command(cmd) {
    const c = cmd instanceof import_command.Command ? cmd : new import_command.Command(cmd, this.strict);
    c.init(this);
    this.commands.push(c);
    if (import_index_m_node.log.on(2))
      (0, import_index_m_node.log)("Added command: ", c);
    return this;
  }
  /**
   * Start the cli.
   *
   * @libris
   */
  async start() {
    try {
      const help = this.has(["-h", "--help"]);
      let matched = false;
      if (import_index_m_node.log.on(2))
        (0, import_index_m_node.log)("Starting CLI.");
      if (this.strict) {
        this._check_unknown_args();
      }
      const max_visit = 1;
      const run_commands = (visit = 0) => {
        for (const command of this.commands) {
          if (visit === 0 && command.id instanceof import_query.And === false) {
            continue;
          }
          if (import_index_m_node.log.on(2))
            (0, import_index_m_node.log)("Checking command ", (0, import_query.and_or_str)(command.id));
          const found_index = this.find_arg(command).index;
          if (found_index != null) {
            if (import_index_m_node.log.on(2))
              (0, import_index_m_node.log)("Executing command ", (0, import_query.and_or_str)(command.id));
            if (help) {
              this.docs(command);
              return true;
            }
            return this.run_command(command, found_index);
          }
        }
      };
      for (let visit = 0; visit <= max_visit; ++visit) {
        const promise = run_commands(visit);
        if (promise === true) {
          matched = true;
          break;
        } else if (promise) {
          await promise;
          matched = true;
          break;
        }
      }
      if (import_index_m_node.log.on(2))
        (0, import_index_m_node.log)("Running commands.");
      if (import_index_m_node.log.on(2))
        (0, import_index_m_node.log)("Matched command: ", matched);
      if (!matched && help) {
        this.docs();
        return;
      }
      if (!matched && this._main) {
        if (import_index_m_node.log.on(2))
          (0, import_index_m_node.log)("Checking main command.");
        if (help) {
          this.docs(this._main);
          return;
        }
        if (this._main.args && !this._main.args.every((x) => !x.required) && !this._main.args.some((x) => x.variant === "id" && x.id && this.has(x.id))) {
          throw this.error("Invalid mode, not main.", { docs: true });
        }
        if (import_index_m_node.log.on(2))
          (0, import_index_m_node.log)("Executing main command.");
        await this.run_command(this._main);
        matched = true;
      }
      if (!matched) {
        throw this.error("Invalid mode.", { docs: true });
      }
      if (import_index_m_node.log.on(2))
        (0, import_index_m_node.log)("CLI run finished");
    } catch (e) {
      if (e instanceof import_error.CLIError) {
        e.dump();
        process.exit(1);
      }
      if (e instanceof Error) {
        console.error(e.stack?.replace(": ", import_colors.Colors.end + ": ") ?? e);
        for (const key of Object.keys(e)) {
          if (key === "stack" || key === "name" || key === "message")
            continue;
          console.error(`    ${import_colors.Colors.cyan}${key}${import_colors.Colors.end}: ` + import_object.ObjectUtils.stringify(e[key], {
            colored: true,
            max_depth: 3,
            start_indent: typeof e[key] === "object" && e[key] ? 1 : 0
          }));
        }
      } else {
        console.error(e);
      }
      process.exit(1);
    }
  }
}
const cli = new CLI({ _sys: true, strict: true });
function get(query) {
  return cli.get(query);
}
function present(id) {
  return cli.has(id);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLI,
  cli,
  get,
  present
});
