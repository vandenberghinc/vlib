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
var Scheme = __toESM(require("../scheme/index.m.uni.js"));
var import_colors = require("../system/colors.js");
var import_error = require("./error.js");
var import_query = require("./query.js");
var import_index_m_uni = require("../debugging/index.m.uni.js");
var import_logger = require("../logging/logger.js");
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
  options;
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
    options = [],
    strict,
    _sys = false
  }) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.notes = notes;
    this.strict = strict ?? false;
    this.options = options.map((o) => o instanceof import_command.Command ? o : new import_command.Command(o, this.strict));
    argv = argv.slice(2);
    this.argv = argv;
    this.argv_set = new Set(argv);
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
    this.options.walk(add_command);
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
          this.throw(`Unknown argument "${item}".`);
        } else {
          import_logger.logger.warn(`Unknown argument "${item}".`);
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
  }
  /** Throw a cast single error. */
  _cast_single_error(value, type) {
    return `Unable to cast "${value}" of type "${Scheme.value_type(value)}" to type "${Array.isArray(type) ? type.join(" | ") : type}".`;
  }
  /**
   * Cast a single type with info options.
   */
  _cast_single(query, input, type) {
    let value;
    switch (type) {
      case "string":
        return { status: "success", value: input, query };
      // return i;
      case "number": {
        const value2 = Scheme.cast.number(input, { strict: true, preserve: true });
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
          const res = out.map((item) => this._cast(query, item, value_types));
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
          (0, import_error.throw_error)(`Unable to cast "${Scheme.value_type(input)}" to an "object".`);
        }
        let key;
        let key_start = 0, value_start = 0;
        let mode = "key";
        const parsed = {};
        new import_iterator.Iterator(input, { string: ["'", '"', "`"] }, (state, it) => {
          const c = it.state.peek;
          if (mode === "key" && state.is_code && (c === ":" || c === "=")) {
            key = it.slice(key_start, it.state.offset);
            mode = "value";
            value_start = it.state.offset + 1;
          } else if (mode === "value" && state.is_code && !state.is_excluded && (c === "," || c === ";")) {
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
          const record = key_type === "string" ? {} : void 0;
          const map = record == null ? /* @__PURE__ */ new Map() : void 0;
          Object.keys(parsed).walk((key2) => {
            if (record) {
              record[key2] = value_type.length === 1 && value_type[0] === "string" ? parsed[key2] : this._cast(query, parsed[key2], value_type);
            } else {
              map?.set(key_type === "string" ? key2 : this._cast(query, key2, key_type), value_type.length === 1 && value_type[0] === "string" ? parsed[key2] : this._cast(query, parsed[key2], value_type));
            }
          });
          return { status: "success", value: map ?? record, query };
        }
        return { status: "success", value: parsed, query };
      }
      default:
        (0, import_error.throw_error)(`Unsupported cast type "${type.toString()}".`);
    }
  }
  /** Cast types. */
  _cast(query, value, type) {
    if (type == null) {
      return { status: "success", value: void 0, query };
    } else if (type == "string") {
      return { status: "success", value, query };
    }
    if (Array.isArray(type)) {
      for (const t of type) {
        const res = this._cast_single(query, value, t);
        if (!res.error) {
          return res;
        }
      }
      return { status: "invalid_type", error: this._cast_single_error(value, type), query };
    }
    return this._cast_single(query, value, type);
  }
  /** Wrapper function to add an info object and return the info for one line returns. */
  add_info(info) {
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
        (0, import_error.throw_error)(`Argument "${query.identifier()}" must be one of the following enumerated values [${joined}].`);
      }
    }
    const cache_id = `${query.id ?? query.index ?? ""}-${query.type}`;
    this.argv_info.set(cache_id, info);
    return info;
  }
  // Add an argument to the command arguments object.
  add_to_cmd_args(cmd_args, name, value, parent) {
    if (name instanceof import_query.And) {
      if (parent === cmd_args) {
        let id = name[name.length - 1];
        if (typeof id !== "string")
          id = id[0];
        id = id.replace(/^-+/, "");
        parent[id] = value;
      }
      if (name.length === 0) {
        (0, import_error.throw_error)("Cannot insert an empty name array.");
      } else if (name.length === 1) {
        const id = name[0].replace(/^-+/, "");
        parent[id] = value;
      } else {
        const first = name[0].replace(/^-+/, "");
        parent[first] ??= {};
        this.add_to_cmd_args(cmd_args, name.slice(1), value, parent[first]);
      }
    } else if (Array.isArray(name)) {
      const id = name[0].replace(/^-+/, "");
      parent[id] = value;
    } else {
      parent[name.replace(/^-+/, "")] = value;
    }
  }
  /** Run a command. */
  async run_command(command, args_start_index = 0) {
    const cmd_args = { _command: command };
    if (command.args?.length) {
      for (const arg of command.args) {
        try {
          if (!arg.arg_name) {
            (0, import_error.throw_error)(`Argument is not initialized: ${arg}`);
          }
          if (arg.type === "boolean") {
            if (!arg.id) {
              (0, import_error.throw_error)(`Argument "${arg.arg_name}" is not initialized with an id, this is required for boolean types.`);
            }
            this.add_to_cmd_args(cmd_args, arg.arg_name, this.present(arg.id), cmd_args);
          } else {
            const { status, value } = this.info(arg, args_start_index);
            if (status === "not_found" && arg.required) {
              (0, import_error.throw_error)(`Required argument "${(0, import_query.and_or_str)(arg.arg_name)}" was not found`);
            } else if (status === "success" || status === "default") {
              this.add_to_cmd_args(cmd_args, arg.arg_name, value, cmd_args);
            }
          }
        } catch (err) {
          this.docs(command);
          this.throw(err);
        }
      }
    }
    if (import_index_m_uni.debug.on(2))
      (0, import_index_m_uni.debug)(`Running command: ${"id" in command ? command.id ? (0, import_query.and_or_str)(command.id) : "<unknown>" : "<main>"}`);
    if (import_index_m_uni.debug.on(3))
      (0, import_index_m_uni.debug)("With arguments:", cmd_args);
    try {
      if (command.mode === "main") {
        await Promise.resolve(command.callback(cmd_args));
      } else {
        await Promise.resolve(command.callback(cmd_args));
      }
    } catch (err) {
      this.docs(command);
      this.error(err);
      process.exit(1);
    }
  }
  /**
   * Find an argument's index by its id.
   * @libris
   */
  find_index(id) {
    let index_of = -1;
    if (typeof id === "number") {
      return id < this.argv.length ? id : void 0;
    } else if (id instanceof import_query.And) {
      throw new Error("Cannot find index of an 'and' query, use 'or' or a single id instead.");
    } else if (id instanceof import_query.Or || Array.isArray(id)) {
      for (const item of id) {
        const i = this.argv.indexOf(item);
        if (i !== -1) {
          return i;
        }
      }
      return void 0;
    } else {
      index_of = this.argv.indexOf(id);
    }
    return index_of === -1 ? void 0 : index_of;
  }
  /**
   * Check if an argument is present.
   * @libris
   */
  present(id) {
    if (id instanceof Arg.Base) {
      return this.present(id.variant === "index" ? id.index : id.id);
    } else if (typeof id === "number") {
      return id < this.argv.length;
    } else if (id instanceof import_query.And) {
      return id.every((i) => this.present(i));
    } else if (id instanceof import_query.Or || Array.isArray(id)) {
      return id.some((i) => this.present(i));
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
  info(q, _s_index) {
    const query = typeof q === "string" || Array.isArray(q) || q instanceof import_query.Or || q instanceof import_query.And ? new Arg.Query({ id: q, type: "string" }, this.strict) : q instanceof Arg.Base ? q : new Arg.Query(q, this.strict);
    const { id, index, def, type = "string", exclude_dash = true } = query;
    if (!id && index == null) {
      throw new Error("Invalid argument, either parameter 'id' or 'index' must be defined. Argument: " + import_colors.Color.object(query));
    }
    const cache_id = `${id ?? index ?? ""}-${type}`;
    if (this.argv_info.has(cache_id)) {
      return this.argv_info.get(cache_id);
    }
    if (index != null && id == null) {
      const offset = _s_index == null ? index : _s_index + index;
      if (offset < this.argv.length) {
        return this.add_info({
          status: "not_found",
          error: `Invalid query, the query must contain an id or index`,
          query
        });
      }
      return this.add_info(this._cast(query, this.argv[offset], type));
    }
    let value_index = void 0;
    if (id instanceof import_query.And) {
      let and_i = 0;
      for (let i = 0; i < this.argv.length; i++) {
        if (this.argv[i] === id[and_i]) {
          ++and_i;
          if (and_i === id.length) {
            value_index = i + 1;
            break;
          }
        } else if (and_i > 0) {
          break;
        }
      }
    } else if (id instanceof import_query.Or && id.some((i) => this.argv_set.has(i))) {
      value_index = this.argv.findIndex((arg) => id.includes(arg));
      if (value_index !== -1) {
        value_index += 1;
      }
    } else if (typeof id === "string" && this.argv_set.has(id)) {
      value_index = this.argv.indexOf(id);
      if (value_index !== -1) {
        value_index += 1;
      }
    }
    if (value_index != null && value_index != -1 && value_index < this.argv.length && this.argv[value_index] !== void 0) {
      const value = this.argv[value_index];
      if (value === void 0 || exclude_dash && value.charAt(0) === "-") {
        if (def !== Arg.NoDef) {
          return this.add_info({
            status: "default",
            value: def,
            query
          });
        }
        return this.add_info({
          status: "not_found",
          error: `Not a valid value found for argument "${(0, import_query.and_or_str)(id)}".`,
          query
        });
      }
      return this.add_info(this._cast(query, value, type));
    }
    if (def !== Arg.NoDef) {
      return this.add_info({
        status: "default",
        value: def,
        query
      });
    }
    return this.add_info({
      status: "not_found",
      error: `No value found for argument "${(0, import_query.and_or_str)(id ?? "undefined")}".`,
      query
    });
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
          this.throw(`Required argument "${(0, import_query.and_or_str)(res.query.id ?? res.query.index)}" was not found.`);
        } else {
          return void 0;
        }
      }
      this.throw(res.error);
    }
    return res.value;
  }
  /**
   * Log an error.
   * @libris
   */
  error(...err) {
    (0, import_error.error)(...err);
  }
  /**
   * Throw an error and stop with exit code 1.
   * @libris
   */
  throw(...err) {
    if (err.length === 1 && typeof err[0] === "string") {
      (0, import_error.throw_error)(new Error(err[0]));
    }
    (0, import_error.throw_error)(...err);
  }
  /**
   * Log the docs, optionally of an array of command or a single command.
   *
   * @libris
   */
  docs(command_or_commands) {
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
        list_item[0] = `    ${(0, import_query.and_or_str)(command.id ?? "<main>")}`;
        list_item[1] = (command.description ?? "") + "\n";
        list.push(list_item);
        if (command.args?.length) {
          let arg_index = 0;
          command.args.forEach((arg) => {
            if (arg.ignore === true) {
              return;
            }
            const list_item2 = ["", ""];
            if (arg.id == null) {
              list_item2[0] = `        argument ${arg_index}`;
            } else {
              list_item2[0] = `        ${(0, import_query.and_or_str)(arg.id)}`;
            }
            if (arg.type != null && arg.type !== "boolean") {
              list_item2[0] += ` <${arg.type}>`;
            }
            if (arg.required) {
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
      docs += `Usage: $ ${this.name} ${(0, import_query.and_or_str)(command_or_commands.id ?? `<main>`)} [options]
`;
      if (command_or_commands.description) {
        docs += `
${command_or_commands.description}
`;
      }
      if (command_or_commands?.args?.length) {
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
            list_item[0] = `    ${(0, import_query.and_or_str)(arg.id)}`;
          }
          if (arg.type != null && arg.type !== "boolean") {
            list_item[0] += ` <${arg.type}>`;
          }
          if (arg.required) {
            list_item[0] += " (required)";
          }
          list_item[1] = (arg.description ?? "") + "\n";
          list.push(list_item);
          ++arg_index;
        });
        add_keys_and_values(list);
      }
      if (command_or_commands.examples?.length) {
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
      (0, import_error.throw_error)("Main command already set.");
    }
    this._main = main instanceof import_command.Main ? main : new import_command.Main(main, this.strict);
    if (import_index_m_uni.debug.on(3))
      (0, import_index_m_uni.debug)("Added main command: ", this._main);
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
    if (import_index_m_uni.debug.on(2))
      (0, import_index_m_uni.debug)("Added command: ", c);
    this.commands.push(c);
    return this;
  }
  /**
   * Start the cli.
   *
   * @libris
   */
  async start() {
    const help = this.present(["-h", "--help"]);
    let matched = false;
    if (this.strict) {
      this._check_unknown_args();
    }
    for (const command of this.commands) {
      const found_index = command.id instanceof import_query.And ? 0 : this.find_index(command.id);
      if (found_index != null) {
        if (help) {
          this.docs(command);
          return true;
        }
        await this.run_command(command, found_index);
        matched = true;
        break;
      }
    }
    if (!matched && help) {
      this.docs();
      return true;
    }
    if (!matched && this._main) {
      if (help) {
        this.docs(this._main);
        return true;
      }
      if (this._main.args && !this._main.args.every((x) => !x.required) && !this._main.args.some((x) => x.variant === "id" && x.id && this.present(x.id))) {
        this.docs();
        this.error("Invalid mode, not main.");
        return false;
      }
      await this.run_command(this._main);
      matched = true;
    }
    if (!matched) {
      this.docs();
      this.error("Invalid mode.");
      return false;
    }
    return true;
  }
}
const cli = new CLI({ _sys: true, strict: true });
function get(query) {
  return cli.get(query);
}
function present(id) {
  return cli.present(id);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLI,
  cli,
  get,
  present
});
