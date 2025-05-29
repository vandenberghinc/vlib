/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Iterator } from '../code/iterator.js';
import { Scheme } from '../scheme/scheme.js';
import { Colors } from '../system/colors.js';
import { error, throw_error } from './error.js';
import { Command, Command as _Command } from './command.js';
import { Query, Query as _Query } from './query.js';
import { debug } from '../debugging/index.m.uni.js';
// Increase stack trace limit by default.
Error.stackTraceLimit = 100;
/**
 * Build a cli.
 *
 * @param name {string} The cli's name.
 * @param description {string} The cli's description.
 * @param version {string} The cli's version.
 * @param notes {array[string]} The cli's notes.
 * @param commands {array[object]} Array of command objects.
 * @nav CLI
*/
export class CLI {
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
    argv_info = new Map();
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
    constructor({ name = "CLI", main, commands = [], options = [], description, version = "1.0.0", notes = [], start_index = 2, _sys = false, } = {}) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.commands = commands.map(c => Command.init("id", c));
        this.main = main ? Command.init("main", main) : undefined;
        this.options = options.map(o => Command.init_cmd_arg("index", o));
        this.notes = notes;
        this.start_index = start_index;
        this._init(_sys);
    }
    /**
     * Has command wrapper.
     * Does not check the main command.
     */
    _has_command(id) {
        return this.commands.some(cmd => cmd.id
            ? Query.match(cmd.id, id)
            : false);
    }
    /**
     * Initialize the CLI.
     *
     * 1) Adds a --version, -v command.
     */
    _init(_sys = false) {
        /** Add --version command. */
        if (_sys === false) {
            if (this.version != null && !this._has_command(["--version", "-v"])) {
                this.commands.push(Command.init("id", {
                    id: ["--version", "-v"],
                    description: "Show the CLI version.",
                    callback: () => console.log(`${this.name} v${this.version}`)
                }));
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
    _cast_single(input, type) {
        // Handle string.
        let value;
        switch (type) {
            case "string":
                return { found: true, value: input };
            case "number": {
                const value = Scheme.cast_number(input, { strict: true, preserve: true });
                if (typeof value === "string") {
                    return { error: this._cast_single_error(input, type) };
                }
                return { found: true, value };
            }
            case "boolean":
                value = Scheme.cast_bool(input, { preserve: true });
                if (typeof value === "string") {
                    return { error: this._cast_single_error(input, type) };
                }
                return { found: true, value };
            // Array.
            case "array":
            case "string[]":
            case "boolean[]":
            case "number[]":
                {
                    const out = Array.isArray(input) ? input : input.split(",");
                    const value_type = type === "array"
                        ? "string"
                        : type.slice(0, -2);
                    const value_types = value_type.split("|");
                    if (value_types.length === 1 && value_types[0] === "string") {
                        return { found: true, value: out };
                    }
                    else {
                        const res = out.map(item => this._cast(item, value_types));
                        if (res.some(r => r.error)) {
                            return { error: this._cast_single_error(input, type) };
                        }
                        return { found: true, value: res.map(r => r.value) };
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
            case "number:string":
                {
                    if (typeof input !== "string") {
                        throw_error(`Unable to cast "${Scheme.value_type(input)}" to an "object".`);
                    }
                    let key;
                    let key_start = 0, value_start = 0;
                    let mode = "key";
                    const parsed = {};
                    new Iterator(input, { string: ["'", '"', '`'] }, (state, it) => {
                        const c = it.state.peek;
                        if (mode === "key"
                            && state.is_code
                            && (c === ":" || c === "=")) {
                            key = it.slice(key_start, it.state.offset);
                            mode = "value";
                            value_start = it.state.offset + 1;
                        }
                        else if (mode === "value"
                            && state.is_code
                            && !state.is_excluded
                            && (c === "," || c === ";")) {
                            if (key) {
                                let end = it.state.offset;
                                let first = input.charAt(value_start);
                                if (
                                // strip quotes.
                                (first === "'" || first === '"' || first === "`")
                                    && first === input.charAt(it.state.offset - 1)) {
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
                        const casted = new Map();
                        Object.keys(parsed).walk(key => {
                            casted.set(key_type === "string" ? key : this._cast(key, key_type), value_type.length === 1 && value_type[0] === "string"
                                ? parsed[key]
                                : this._cast(parsed[key], value_type));
                        });
                        return { found: true, value: casted };
                    }
                    return { found: true, value: parsed };
                }
            default:
                // @ts-expect-error
                throw_error(`Unsupported cast type "${type.toString()}".`);
        }
    }
    /** Cast types. */
    _cast(value, type) {
        // Handle undefined.
        if (type == null) {
            return { found: true, value: undefined };
        }
        else if (type == "string") {
            return { found: true, value: value };
        }
        // Handle OR operation.
        if (Array.isArray(type)) {
            for (const t of type) {
                const res = this._cast_single(value, t);
                if (!res.error) {
                    return res;
                }
            }
            return { error: this._cast_single_error(value, type) };
        }
        // Handle single type.
        return this._cast_single(value, type);
    }
    /** Wrapper function to add an info object and return the info for one line returns. */
    add_info(cache_id, info) {
        // Check enum.
        // if (scheme_item.enum) {
        //     if (!scheme_item.enum.includes(object[key])) {
        //         const field = `${parent}${value_scheme_key || key}`;
        //         const joined = scheme_item.enum.map(item => {
        //             if (item == null) {
        //                 return 'null';
        //             } else if (typeof item !== "string" && !(item instanceof String)) {
        //                 return item.toString();
        //             }
        //             return `"${item.toString()}"`;
        //         }).join(", ");
        //         return throw_err_h(`${error_prefix}Attribute "${field}" must be one of the following enumerated values [${joined}].`, field);
        //     }
        // }
        // Add item to the cache.
        this.argv_info.set(cache_id, info);
        // Return info.
        return info;
    }
    /**
     * Check if an argument is present.
     * @libris
     */
    present(id) {
        if (typeof id === "number") {
            return this.start_index + id < process.argv.length;
        }
        else if (id instanceof Query.And) {
            return id.every(i => this.present(i));
        }
        else if (id instanceof Query.Or || Array.isArray(id)) {
            return id.some(i => this.present(i));
        }
        else {
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
        // Check args.
        if (!id && index == null) {
            this.throw("Either parameter 'id' or 'index' must be defined.");
        }
        // Check cache.
        const cache_id = `${arg.id ?? arg.index ?? ""}-${arg.type}`;
        if (this.argv_info.has(cache_id)) {
            return this.argv_info.get(cache_id);
        }
        // console.log(`Searching for id="${id ? Query.to_str(id) : undefined}" index=${index} with type "${type}"...`);
        /**
         * Search by index.
         * @warning This must precede over search by id, since the id is now always required.
         */
        if (index != null && id == null) {
            const value = process.argv[this.start_index + index];
            if (value === undefined) {
                return this.add_info(cache_id, { error: `There is no argument at index "${index}".` });
            }
            return this.add_info(cache_id, this._cast(value, type));
        }
        // Find the value index.
        let value_index = undefined;
        if (id instanceof Query.And) {
            let and_i = 0;
            for (let i = this.start_index; i < process.argv.length; i++) {
                if (process.argv[i] === id[and_i]) {
                    ++and_i;
                    if (and_i === id.length) {
                        value_index = i + 1; // next index is the value.
                        break;
                    }
                }
                else if (and_i > 0 /* && process.argv[i]?.charAt(0) !== "-"*/) {
                    // matches must be consecutive, abort if not.
                    break;
                }
            }
        }
        else if (Array.isArray(id)) {
            const i = id.some(i => this.argv_map.has(i))
                ? process.argv.findIndex(arg => id.includes(arg), this.start_index)
                : -1;
            if (i !== -1) {
                value_index = i + 1;
            }
        }
        else {
            value_index = process.argv.indexOf(id, this.start_index);
        }
        if (value_index != null
            && value_index < process.argv.length
            && process.argv[value_index] !== undefined) {
            const value = process.argv[value_index];
            if (value === undefined || (exclude_dash && value.charAt(0) === "-")) {
                if (opts?.def && arg.def !== undefined) {
                    return this.add_info(cache_id, { found: true, value: arg.def });
                }
                return this.add_info(cache_id, { error: `No value found for argument "${Query.to_str(id)}".` });
            }
            return this.add_info(cache_id, this._cast(value, type));
        }
        if (arg.def !== undefined) {
            return this.add_info(cache_id, { found: true, value: arg.def });
        }
        return this.add_info(cache_id, { error: `No value found for argument "${Query.to_str(id ?? "undefined")}".` });
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
        // Initialize args.
        const opts = typeof arguments[0] === "string" || Array.isArray(arguments[0])
            ? { id: arguments[0], type: "string", def: undefined, exclude_dash: true }
            : arguments[0];
        // Load info.
        return this.info(opts).value;
    }
    /**
     * Log an error.
     * @libris
     */
    error(...err) {
        error(...err);
    }
    /**
     * Throw an error and stop with exit code 1.
     * @libris
     */
    throw(...err) {
        throw_error(...err);
    }
    /**
     * Log the docs, optionally of an array of command or a single command.
     *
     * @libris
     */
    docs(command_or_commands = null) {
        // Assign to commands when undefined
        if (command_or_commands == null) {
            command_or_commands = this.commands;
        }
        // Create docs header.
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
        // Add an array of keys and values to the docs with the correct whitespace indent.
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
        // Show docs from an array of commands.
        if (Array.isArray(command_or_commands)) {
            // Description.
            if (this.description) {
                docs += `\nDescription:\n    ${this.description.split("\n").join("\n    ")}\n`;
            }
            // Usage.
            docs += `Usage: $ ${this.name} [mode] [options]\n`;
            // Commands.
            const list = [];
            command_or_commands.forEach((command) => {
                const list_item = ["", ""];
                // Add command.
                list_item[0] = `    ${Query.to_str(command.id ?? "<main>")}`;
                list_item[1] = (command.description ?? "") + "\n";
                list.push(list_item);
                // Add command args.
                if (command.args?.length) {
                    let arg_index = 0;
                    command.args.forEach((arg) => {
                        if (arg.ignore === true) {
                            return;
                        }
                        const list_item = ["", ""];
                        if (arg.id == null) {
                            list_item[0] = `        argument ${arg_index}`;
                        }
                        else {
                            list_item[0] = `        ${Query.to_str(arg.id)}`;
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
                }
            });
            list.push([
                "    --help, -h",
                "Show the overall documentation or when used in combination with a command, show the documentation for a certain command.\n"
            ]);
            add_keys_and_values(list);
            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.slice(0, -1);
            }
            // Notes.
            if (this.notes && this.notes.length > 0) {
                docs += `\nNotes:\n`;
                this.notes.forEach((note) => {
                    docs += ` * ${note}\n`;
                });
            }
            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.slice(0, -1);
            }
        }
        // Show detailed docs from a specific command.
        else {
            // Description.
            if (this.description) {
                docs += this.description + "\n";
            }
            // Usage.
            docs += `Usage: $ ${this.name} ${Query.to_str(command_or_commands.id ?? `<main>>`)} [options]\n`;
            // Description.
            if (command_or_commands.description) {
                docs += `\n${command_or_commands.description}\n`;
            }
            // Arguments.
            if (command_or_commands?.args?.length) {
                docs += `\nOptions:\n`;
                let arg_index = 0;
                const list = [];
                command_or_commands.args.forEach((arg) => {
                    if (arg.ignore === true) {
                        return;
                    }
                    const list_item = ["", ""];
                    if (arg.id == null) {
                        list_item[0] = `    argument ${arg_index}`;
                    }
                    else {
                        list_item[0] = `    ${Query.to_str(arg.id)}`;
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
            // Examples.
            if (command_or_commands.examples != null) {
                docs += `\nExamples:\n`;
                if (typeof command_or_commands.examples === "string") {
                    docs += `    ${Colors.italic}${command_or_commands.examples.startsWith("$") ? "" : "$ "}${command_or_commands.examples}${Colors.end}\n`;
                }
                else if (Array.isArray(command_or_commands.examples)) {
                    command_or_commands.examples.forEach((item) => {
                        docs += `    ${Colors.italic}${item.startsWith("$") ? "" : "$ "}${item}${Colors.end}\n`;
                    });
                }
                else {
                    const list = [];
                    Object.entries(command_or_commands.examples).forEach(([desc, example]) => {
                        list.push([
                            `    ${desc.trimEnd()}:`,
                            `${Colors.italic}${example.startsWith("$") ? "" : "$ "}${example}${Colors.end}\n`
                        ]);
                    });
                    add_keys_and_values(list);
                }
            }
            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.slice(0, -1);
            }
        }
        // Log docs.
        console.log(docs);
    }
    // Add an argument to the command arguments object.
    add_to_cmd_args(cmd_args, name, value, parent) {
        if (name instanceof Query.And) {
            // Insert root also directly.
            // Use last since an array is always an And operation.
            if (parent === cmd_args) {
                let id = name[name.length - 1];
                if (typeof id !== "string")
                    id = id[0];
                id = id.replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            }
            // Insert as nested object(s).
            if (name.length === 0) {
                throw_error("Cannot insert an empty name array.");
            }
            else if (name.length === 1) {
                const id = typeof name[0] === "string" ? name[0] : name[0][0]
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            }
            else {
                const first = typeof name[0] === "string" ? name[0] : name[0][0]
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[first] ??= {};
                this.add_to_cmd_args(cmd_args, name.slice(1), value, parent[first]);
            }
        }
        else if (name instanceof Query.Or || Array.isArray(name)) {
            const id = name[0]
                .replace(/^-+/, ""); // remove leading dashes.
            parent[id] = value;
        }
        else {
            parent[name.replace(/^-+/, "")] = value;
        }
    }
    /** Run a command. */
    async command(command) {
        // Get arguments.
        const cmd_args = { _command: command };
        // Parse arguments.
        if (command.args?.length) {
            for (const arg of command.args) {
                try {
                    if (!arg.name) {
                        throw_error(`Argument "${arg.id}" is not initialized.`);
                    }
                    // Type bool.
                    if (arg.type === "boolean") {
                        if (!arg.id) {
                            throw_error(`Argument "${arg.name}" is not initialized with an id, this is required for boolean types.`);
                        }
                        this.add_to_cmd_args(cmd_args, arg.name, this.present(arg.id), cmd_args);
                    }
                    // Get and cast.
                    else {
                        // Build get options to satisfy overloads
                        let res;
                        if (typeof arg.index === "number") {
                        }
                        else {
                        }
                        const { found, value } = this.info(arg, { def: false });
                        // const { found, value } = this.info({
                        //     id: arg.id,
                        //     type: arg.type ?? "string",
                        //     index: arg.index,
                        // });
                        // console.log(`Found arg "${Query.to_str(arg.id)}" at index ${arg_index}:`, value);
                        if (found === false && arg.required === true) {
                            throw_error(`Define parameter "${arg.id}".`);
                        }
                        if (found === true && value == null && arg.def !== undefined) {
                            this.add_to_cmd_args(cmd_args, arg.name, arg.def, cmd_args);
                        }
                        else if (value != null) {
                            this.add_to_cmd_args(cmd_args, arg.name, value, cmd_args);
                        }
                    }
                }
                catch (err) {
                    this.docs(command);
                    this.error(err);
                    return true;
                }
            }
        }
        if (debug.on(1))
            debug(`Running command: ${"id" in command ? command.id ? Query.to_str(command.id) : "<unknown>" : "<main>"}`);
        if (debug.on(2))
            debug("With args:", cmd_args);
        // Call the callback.
        try {
            await Promise.resolve(command.callback(cmd_args));
        }
        catch (err) {
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
                // console.log(`Running main command: ${Query.to_str(command.id)}`);
                if (help) {
                    // show command help.
                    this.docs(command);
                    return true;
                }
                await this.command(command);
                matched = true;
                break;
            }
        }
        // Show help.
        if (!matched && help) {
            this.docs();
            return true;
        }
        // Show main command.
        if (!matched && this.main) {
            // console.log(`Running main command: ${this.main.id}`);
            if (help) {
                // show command help.
                this.docs(this.main);
                return true;
            }
            if (this.main.args
                && !this.main.args.every(x => x.optional) // except when all args are optional.
                && !this.main.args.some(x => x.variant === "id" && x.id && this.present(x.id)) // ensure some of the main args are present
            ) {
                // Ensure any of the args are found, if not then its likely not the main command.
                this.docs();
                this.error("Invalid mode, not main.");
                // console.log("Present args:", this.main.args.map(x => x.id).join(", "));
                return false;
            }
            await this.command(this.main);
            matched = true;
        }
        // Show default docs.
        if (!matched) {
            this.docs();
            this.error("Invalid mode.");
            return false;
        }
        return true;
    }
}
export const cli = new CLI({ _sys: true });
/**
 * CLI types.
 * @note We need to build the CLI module here.
 *       Due to conflicting names and re-exports of CLI class + creating a CLI namespace.
 */
(function (CLI) {
    CLI.Command = _Command;
    // export type Query = _Query;
    CLI.Query = _Query;
})(CLI || (CLI = {}));
const nr1 = cli.get({ id: "--nr", type: "number" });
const nr2 = cli.get({ id: "--nr", type: "number", def: 0 });
const arr1 = cli.get({ id: "--nr", type: "number[]", def: [] });
//# sourceMappingURL=cli.js.map