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
  cli: () => cli
});
module.exports = __toCommonJS(stdin_exports);
var import_iterator = require("../code/iterator.js");
var import_scheme = require("../scheme/scheme.js");
var import_colors = require("../system/colors.js");
var import_error = require("./error.js");
var import_command = require("./command.js");
var import_query = require("./query.js");
var import_index_m_uni = require("../debugging/index.m.uni.js");
Error.stackTraceLimit = 100;
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
  /**
   * The list of global option arguments.
   * @todo not implemented yet.
   */
  options;
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
  constructor({ name = "CLI", main, commands = [], options = [], description, version = "1.0.0", notes = [], start_index = 2, _sys = false } = {}) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.commands = commands.map((c) => import_command.Command.init("id", c));
    this.main = main ? import_command.Command.init("main", main) : void 0;
    this.options = options.map((o) => import_command.Command.init_cmd_arg("index", o));
    this.notes = notes;
    this.start_index = start_index;
    this._init(_sys);
  }
  /**
   * Has command wrapper.
   * Does not check the main command.
   */
  _has_command(id) {
    return this.commands.some((cmd) => cmd.id ? import_query.Query.match(cmd.id, id) : false);
  }
  /**
   * Initialize the CLI.
   *
   * 1) Adds a --version, -v command.
   */
  _init(_sys = false) {
    if (_sys === false) {
      if (this.version != null && !this._has_command(["--version", "-v"])) {
        this.commands.push(import_command.Command.init("id", {
          id: ["--version", "-v"],
          description: "Show the CLI version.",
          callback: () => console.log(`${this.name} v${this.version}`)
        }));
      }
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
          return { error: this._cast_single_error(input, type) };
        }
        return { found: true, value: value2 };
      }
      case "boolean":
        value = import_scheme.Scheme.cast_bool(input, { preserve: true });
        if (typeof value === "string") {
          return { error: this._cast_single_error(input, type) };
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
            return { error: this._cast_single_error(input, type) };
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
          (0, import_error.throw_error)(`Unable to cast "${import_scheme.Scheme.value_type(input)}" to an "object".`);
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
          const casted = /* @__PURE__ */ new Map();
          Object.keys(parsed).walk((key2) => {
            casted.set(key_type === "string" ? key2 : this._cast(key2, key_type), value_type.length === 1 && value_type[0] === "string" ? parsed[key2] : this._cast(parsed[key2], value_type));
          });
          return { found: true, value: casted };
        }
        return { found: true, value: parsed };
      }
      default:
        (0, import_error.throw_error)(`Unsupported cast type "${type.toString()}".`);
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
      return { error: this._cast_single_error(value, type) };
    }
    return this._cast_single(value, type);
  }
  /** Wrapper function to add an info object and return the info for one line returns. */
  add_info(cache_id, info) {
    this.argv_info.set(cache_id, info);
    return info;
  }
  /**
   * Check if an argument is present.
   * @libris
   */
  present(id) {
    if (typeof id === "number") {
      return this.start_index + id < process.argv.length;
    } else if (id instanceof import_query.Query.And) {
      return id.every((i) => this.present(i));
    } else if (id instanceof import_query.Query.Or || Array.isArray(id)) {
      return id.some((i) => this.present(i));
    } else {
      return this.argv_map.has(id);
    }
  }
  /**
   * {Info}
   *
   * Get info about an argument.
   *
   * @template T
   *      The type of the argument to get, defaults to "string".
   *      Automatically inferred from the `type` option.
   *      The returned `info.value` will be casted to this type.
   * @template D  System template to check if the provided `def` attribute is of the same type as the resulted return type.
   *
   * @param arg The argument get options. See {@link Arg} for option information.
   * @param opts The options for the info method.
   * @param opts.def When `true`, the optional default value will be returned as a `found` response. Defaults to `false`.
   *
   * @libris
   */
  info(arg, opts) {
    const { id, index, type = "string", exclude_dash = true } = arg;
    if (!id && index == null) {
      this.throw("Either parameter 'id' or 'index' must be defined.");
    }
    const cache_id = `${arg.id ?? arg.index ?? ""}-${arg.type}`;
    if (this.argv_info.has(cache_id)) {
      return this.argv_info.get(cache_id);
    }
    if (index != null && id == null) {
      const value = process.argv[this.start_index + index];
      if (value === void 0) {
        return this.add_info(cache_id, { error: `There is no argument at index "${index}".` });
      }
      return this.add_info(cache_id, this._cast(value, type));
    }
    let value_index = void 0;
    if (id instanceof import_query.Query.And) {
      let and_i = 0;
      for (let i = this.start_index; i < process.argv.length; i++) {
        if (process.argv[i] === id[and_i]) {
          ++and_i;
          if (and_i === id.length) {
            value_index = i + 1;
            break;
          }
        } else if (and_i > 0) {
          break;
        }
      }
    } else if (Array.isArray(id)) {
      const i = id.some((i2) => this.argv_map.has(i2)) ? process.argv.findIndex((arg2) => id.includes(arg2), this.start_index) : -1;
      if (i !== -1) {
        value_index = i + 1;
      }
    } else {
      value_index = process.argv.indexOf(id, this.start_index);
    }
    if (value_index != null && value_index < process.argv.length && process.argv[value_index] !== void 0) {
      const value = process.argv[value_index];
      if (value === void 0 || exclude_dash && value.charAt(0) === "-") {
        if (opts?.def && arg.def !== void 0) {
          return this.add_info(cache_id, { found: true, value: arg.def });
        }
        return this.add_info(cache_id, { error: `No value found for argument "${import_query.Query.to_str(id)}".` });
      }
      return this.add_info(cache_id, this._cast(value, type));
    }
    if (arg.def !== void 0) {
      return this.add_info(cache_id, { found: true, value: arg.def });
    }
    return this.add_info(cache_id, { error: `No value found for argument "${import_query.Query.to_str(id ?? "undefined")}".` });
  }
  /**
   * {Get}
   *
   * Get an argument.
   *
   * @template T
   *      The type of the argument to get, defaults to "string".
   *      Automatically inferred from the `type` option.
   *      The returned value will be casted to this type.
   * @template D  System template to check if the provided `def` attribute is of the same type as the resulted return type.
   *
   * @param o The get options. See {@link Arg} for option information.
   *
   * @libris
   */
  get(o) {
    const opts = typeof arguments[0] === "string" || Array.isArray(arguments[0]) ? { id: arguments[0], type: "string", def: void 0, exclude_dash: true } : arguments[0];
    return this.info(opts).value;
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
    (0, import_error.throw_error)(...err);
  }
  /**
   * Log the docs, optionally of an array of command or a single command.
   *
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
        list_item[0] = `    ${import_query.Query.to_str(command.id ?? "<main>")}`;
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
              list_item2[0] = `        ${import_query.Query.to_str(arg.id)}`;
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
      docs += `Usage: $ ${this.name} ${import_query.Query.to_str(command_or_commands.id ?? `<main>>`)} [options]
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
            list_item[0] = `    ${import_query.Query.to_str(arg.id)}`;
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
  // Add an argument to the command arguments object.
  add_to_cmd_args(cmd_args, name, value, parent) {
    if (name instanceof import_query.Query.And) {
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
        const id = typeof name[0] === "string" ? name[0] : name[0][0].replace(/^-+/, "");
        parent[id] = value;
      } else {
        const first = typeof name[0] === "string" ? name[0] : name[0][0].replace(/^-+/, "");
        parent[first] ??= {};
        this.add_to_cmd_args(cmd_args, name.slice(1), value, parent[first]);
      }
    } else if (name instanceof import_query.Query.Or || Array.isArray(name)) {
      const id = name[0].replace(/^-+/, "");
      parent[id] = value;
    } else {
      parent[name.replace(/^-+/, "")] = value;
    }
  }
  /** Run a command. */
  async command(command) {
    const cmd_args = { _command: command };
    if (command.args?.length) {
      for (const arg of command.args) {
        try {
          if (!arg.name) {
            (0, import_error.throw_error)(`Argument "${arg.id}" is not initialized.`);
          }
          if (arg.type === "boolean") {
            if (!arg.id) {
              (0, import_error.throw_error)(`Argument "${arg.name}" is not initialized with an id, this is required for boolean types.`);
            }
            this.add_to_cmd_args(cmd_args, arg.name, this.present(arg.id), cmd_args);
          } else {
            let res;
            if (typeof arg.index === "number") {
            } else {
            }
            const { found, value } = this.info(arg, { def: false });
            if (found === false && arg.required === true) {
              (0, import_error.throw_error)(`Define parameter "${arg.id}".`);
            }
            if (found === true && value == null && arg.def !== void 0) {
              this.add_to_cmd_args(cmd_args, arg.name, arg.def, cmd_args);
            } else if (value != null) {
              this.add_to_cmd_args(cmd_args, arg.name, value, cmd_args);
            }
          }
        } catch (err) {
          this.docs(command);
          this.error(err);
          return true;
        }
      }
    }
    if (import_index_m_uni.debug.on(1))
      (0, import_index_m_uni.debug)(`Running command: ${"id" in command ? command.id ? import_query.Query.to_str(command.id) : "<unknown>" : "<main>"}`);
    if (import_index_m_uni.debug.on(2))
      (0, import_index_m_uni.debug)("With args:", cmd_args);
    try {
      await Promise.resolve(command.callback(cmd_args));
    } catch (err) {
      this.docs(command);
      this.error(err);
      process.exit(1);
    }
  }
  /**
   * Start the cli.
   *
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
        await this.command(command);
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
      if (this.main.args && !this.main.args.every((x) => x.optional) && !this.main.args.some((x) => x.variant === "id" && x.id && this.present(x.id))) {
        this.docs();
        this.error("Invalid mode, not main.");
        return false;
      }
      await this.command(this.main);
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
const cli = new CLI({ _sys: true });
(function(CLI2) {
  CLI2.Command = import_command.Command;
  CLI2.Query = import_query.Query;
})(CLI || (CLI = {}));
const nr1 = cli.get({ id: "--nr", type: "number" });
const nr2 = cli.get({ id: "--nr", type: "number", def: 0 });
const arr1 = cli.get({ id: "--nr", type: "number[]", def: [] });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLI,
  cli
});
