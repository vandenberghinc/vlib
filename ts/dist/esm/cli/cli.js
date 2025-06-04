/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Iterator } from '../code/iterator.js';
import * as Scheme from '../scheme/index.m.uni.js';
import { Color, Colors } from '../system/colors.js';
import { CLIError } from './error.js';
import { And, Or, and_or_str } from './query.js';
import { debug } from '../debugging/index.m.uni.js';
import * as Arg from './arg.js';
import { Command, Main } from './command.js';
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
    argv_info = new Map();
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
    constructor({ name = "CLI", description, version = "1.0.0", argv = process.argv, // default start index is 2.
    notes = [], options = [], strict, _sys = false, }) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.notes = notes;
        this.strict = (strict ?? false);
        this.options = options.map(o => o instanceof Command
            ? o
            : new Command(o, this.strict));
        argv = argv.slice(2);
        this.argv = argv;
        this.argv_set = new Set(argv);
        this._init(_sys);
    }
    /** Check unknown arguments. */
    _check_unknown_args() {
        // Build a list of all known args.
        const known_id_args = new Set();
        const add_arg = (arg) => {
            if (arg.variant === "id" && arg.id) {
                if (arg.id instanceof Or || arg.id instanceof And) {
                    arg.id.walk(id => known_id_args.add(id));
                }
                else {
                    known_id_args.add(arg.id);
                }
            }
        };
        const add_command = (cmd) => {
            if (cmd.id instanceof Or || cmd.id instanceof And) {
                cmd.id.walk(id => known_id_args.add(id));
            }
            else {
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
        // Iterate over the argv and check for unknown args.
        for (let i = 0; i < this.argv.length; i++) {
            const item = this.argv[i];
            if (item.charAt(0) !== "-" // skip non-args.
                || item === "--help" // skip help since that is handled internally and is not added.
                || item === "-h") {
                continue;
            }
            if (!known_id_args.has(item)) {
                if (this.strict) {
                    throw this.error(`Unknown argument "${item}".`, { docs: true });
                }
                // else { logger.warn(`Unknown argument "${item}".`); }
            }
        }
    }
    /**
     * Check if a command with an id query exists.
     */
    _has_id_command(id) {
        return this.commands.some(cmd => cmd.variant === "id"
            ? cmd.eq_id(id)
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
            if (this.version != null && !this._has_id_command(["--version", "-v"])) {
                this.command({
                    id: ["--version", "-v"],
                    description: "Show the CLI version.",
                    callback: (args) => console.log(`${this.name} v${this.version}`),
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
    _cast_single(query, input, type, 
    // optionally, when casting for args from a command, pass the command for more detailed error messages.
    command) {
        // Handle string.
        let value;
        switch (type) {
            case "string":
                return { status: "success", value: input, query };
            // return i;
            case "number": {
                const value = Scheme.cast.number(input, { strict: true, preserve: true });
                if (typeof value === "string") {
                    return { status: "invalid_value", error: this._cast_single_error(input, type), query };
                }
                return { status: "success", value: value, query };
            }
            case "boolean":
                value = Scheme.cast.boolean(input, { preserve: true });
                if (typeof value === "string") {
                    return { status: "invalid_value", error: this._cast_single_error(input, type), query };
                }
                return { status: "success", value: value, query };
            // Array.
            case "array":
            case "string[]":
            case "boolean[]":
            case "number[]":
                // case "(string|boolean)[]"] // could be supported.
                {
                    const out = Array.isArray(input) ? input : input.split(",");
                    const value_type = type === "array"
                        ? "string"
                        : type.slice(0, -2);
                    const value_types = value_type.split("|");
                    if (value_types.length === 1 && value_types[0] === "string") {
                        return { status: "success", value: out, query };
                    }
                    else {
                        const res = out.map(item => this._cast(query, item, value_types, command));
                        if (res.some(r => r.error)) {
                            return { status: "invalid_type", error: this._cast_single_error(input, type), query };
                        }
                        return { status: "success", value: res.map(r => r.value), query };
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
                        throw this.error(`Unable to cast "${Scheme.value_type(input)}" to an "object".`, { command });
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
                        const record = key_type === "string" ? {} : undefined;
                        const map = record == null ? new Map() : undefined;
                        Object.keys(parsed).walk(key => {
                            if (record) {
                                record[key] =
                                    value_type.length === 1 && value_type[0] === "string"
                                        ? parsed[key]
                                        : this._cast(query, parsed[key], value_type, command);
                            }
                            else {
                                map?.set(key_type === "string" ? key : this._cast(query, key, key_type, command), value_type.length === 1 && value_type[0] === "string"
                                    ? parsed[key]
                                    : this._cast(query, parsed[key], value_type, command));
                            }
                        });
                        return { status: "success", value: (map ?? record), query };
                    }
                    return { status: "success", value: parsed, query };
                }
            default:
                // @ts-expect-error
                throw this.error(`Unsupported cast type "${type.toString()}".`, command);
        }
    }
    /** Cast types. */
    _cast(query, value, type, 
    // optionally, when casting for args from a command, pass the command for more detailed error messages.
    command) {
        // Handle undefined.
        if (type == null) {
            return { status: "success", value: undefined, query };
        }
        else if (type == "string") {
            return { status: "success", value: value, query };
        }
        // Handle OR operation.
        if (Array.isArray(type)) {
            for (const t of type) {
                const res = this._cast_single(query, value, t, command);
                if (!res.error) {
                    return res;
                }
            }
            return { status: "invalid_type", error: this._cast_single_error(value, type), query };
        }
        // Handle single type.
        return this._cast_single(query, value, type, command);
    }
    /** Wrapper function to add an info object and return the info for one line returns. */
    add_info(info, 
    // optionally, when casting for args from a command, pass the command for more detailed error messages.
    command) {
        // Check query.
        if (!info.query) {
            throw new Error("Query is not defined in info object.");
        }
        // Check enum.
        // Dont perform enum check when default value is returned.
        const query = info.query;
        if (info.status === "success" && query.enum) {
            if (!query.enum.includes(info.value)) {
                const joined = query.enum.map(item => {
                    if (item == null) {
                        return 'null';
                    }
                    else if (typeof item !== "string" && !(item instanceof String)) {
                        return item.toString();
                    }
                    return `"${item.toString()}"`;
                }).join(", ");
                throw this.error(`Argument "${query.identifier()}" must be one of the following enumerated values [${joined}].`, { command });
            }
        }
        // Add item to the cache.
        const cache_id = `${query.id ?? query.index ?? ""}-${query.type}`;
        this.argv_info.set(cache_id, info);
        // Return info.
        return info;
    }
    // Add an argument to the command arguments object.
    add_to_cmd_args(cmd_args, name, value, parent, 
    // optionally, when casting for args from a command, pass the command for more detailed error messages.
    command) {
        /**
         * @todo the old version inserted it as nested objects
         *       however this is not compatible with InferArgs
         *       so we need to insert it as flat keys joined by a `_` separator according to InferArgs.
         * @priority
         */
        if (name instanceof And) {
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
                throw this.error("Cannot insert an empty name array.", { command });
            }
            else if (name.length === 1) {
                const id = name[0] // (typeof name[0] === "string" ? name[0] : name[0][0])
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            }
            else {
                const first = name[0] // (typeof name[0] === "string" ? name[0] : name[0][0])
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[first] ??= {};
                this.add_to_cmd_args(cmd_args, name.slice(1), value, parent[first], command);
            }
        }
        else if (Array.isArray(name)) {
            const id = name[0]
                .replace(/^-+/, ""); // remove leading dashes.
            parent[id] = value;
        }
        else {
            parent[name.replace(/^-+/, "")] = value;
        }
    }
    /** Run a command. */
    async run_command(command, args_start_index = 0) {
        // Get arguments.
        const cmd_args = {};
        // Parse arguments.
        if (command.args?.length) {
            for (const arg of command.args) {
                try {
                    if (!arg.arg_name) {
                        throw this.error(`Argument is not initialized: ${arg}`, { command });
                    }
                    if (debug.on(2))
                        debug("Parsing argument ", and_or_str(arg.id));
                    // Type bool.
                    if (arg.type === "boolean") {
                        if (!arg.id) {
                            throw this.error(`Argument "${arg.arg_name}" is not initialized with an id, this is required for boolean types.`, { command });
                        }
                        this.add_to_cmd_args(cmd_args, arg.arg_name, this.has(arg.id), cmd_args, command);
                    }
                    // Get and cast.
                    else {
                        const { status, value } = this.info(arg, args_start_index, command);
                        if (debug.on(2))
                            debug("Argument info ", and_or_str(arg.id), ": ", { status, value });
                        if (status === "not_found" && arg.required) {
                            throw this.error(`Required argument "${and_or_str(arg.arg_name)}" was not found`, { command });
                        }
                        else if (status === "success" || status === "default") {
                            this.add_to_cmd_args(cmd_args, arg.arg_name, value, cmd_args, command);
                        }
                    }
                }
                catch (error) {
                    if (error instanceof CLIError) {
                        throw error;
                    }
                    throw this.error(`Encountered an error while parsing argument "${arg.identifier()}" from command "${command.identifier()}".`, { error, command });
                }
            }
        }
        if (debug.on(2))
            debug(`Running command: ${"id" in command ? command.id ? and_or_str(command.id) : "<unknown>" : "<main>"}`);
        if (debug.on(3))
            debug("With arguments:", cmd_args);
        // Call the callback.
        try {
            // required if statement for ts `this` context complaints.
            if (command.mode === "main") {
                await Promise.resolve(command.callback(cmd_args, this));
            }
            else {
                await Promise.resolve(command.callback(cmd_args, this));
            }
        }
        catch (error) {
            if (error instanceof CLIError) {
                throw error;
            }
            throw this.error(`Encountered an error while executing cli command "${command.identifier()}".`, { error, command });
        }
    }
    /** Find the index of an argument / command. */
    find_arg(arg, 
    /** The start index to search from. */
    start_index = 0) {
        if (debug.on(3))
            debug("Finding argument ", arg);
        // The output indexes.
        let index = undefined;
        let value_index = undefined;
        // Is boolean, so has no value.
        const is_boolean = arg instanceof Arg.Base ? arg.type === "boolean" : false;
        // Exclude dash values.
        const exclude_dash = arg instanceof Arg.Base ? arg.exclude_dash : true;
        // Find by index variant.
        if (typeof arg.index === "number") {
            if (arg.index + start_index < this.argv.length) {
                index = arg.index + start_index;
                value_index = arg.index + start_index; // same index for value.
            }
        }
        // And id.
        else if (arg.id instanceof And) {
            if ((index = arg.id.match(this.argv, start_index)) != null) {
                index = index;
                value_index = index + arg.id.length; // next index is the value.
            }
        }
        // Or id.
        else if (arg.id instanceof Or
            && arg.id.some(i => this.argv_set.has(i)) // fast lookup
        ) {
            if ((index = arg.id.match(this.argv, start_index)) != null) {
                index = index;
                value_index = index + 1; // next index is the value.
            }
        }
        // Single string id.
        else if (typeof arg.id === "string"
            && this.argv_set.has(arg.id)) {
            index = this.argv.indexOf(arg.id, 10);
            if (index !== -1) {
                value_index = index + 1; // next index is the value.
            }
        }
        if (debug.on(3))
            debug("Initially found indexes ", { index, value_index });
        // Reset index.
        if (index === -1) {
            index = undefined;
        }
        // Is boolean.
        if (is_boolean) {
            if (index == null) {
                return { found: false, index, is_boolean };
            }
            return { found: true, index, is_boolean };
        }
        // Check value.
        let value;
        if (index == null
            || value_index == null
            || value_index === -1
            || value_index >= this.argv.length
            || (value = this.argv[value_index]) === undefined
            || (exclude_dash && value.charAt(0) === "-")) {
            // if (debug.on(3)) debug("Resetting value index ", {
            //     value_index,
            //     argv_length: this.argv.length,
            //     value,
            //     value_X: this.argv[value_index ?? -1],
            //     exclude_dash,
            //     first: value?.charAt(0),
            //     argv: this.argv,
            // });
            value_index = undefined;
        }
        // Response.
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
        }
        else if (typeof id === "number") {
            return id < this.argv.length;
        }
        else if (id instanceof And) {
            // should not check sequence, that is only for Arg not for Command.
            return id.every(i => this.has(i));
        }
        else if (id instanceof Or || Array.isArray(id)) {
            return id.some(i => this.has(i));
        }
        else {
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
    info(q, _s_index, // start index when searching for arguments by index.
    // optionally, when casting for args from a command, pass the command for more detailed error messages.
    _command) {
        // Initialize args.
        // Ensure query is of type `A` so the return type is correct when using `query` inside the add_info obj param.
        const query = (typeof q === "string" || Array.isArray(q) || q instanceof Or || q instanceof And)
            ? new Arg.Query({ id: q, type: "string" }, this.strict)
            : q instanceof Arg.Base
                ? q
                : new Arg.Query(q, this.strict);
        // Unpack the arg.
        const { id, index, def, type = "string", } = query;
        // Check args.
        if (!id && index == null) {
            throw new Error("Invalid argument, either parameter 'id' or 'index' must be defined. Argument: " + Color.object(query));
        }
        // Check cache.
        const cache_id = `${id ?? index ?? ""}-${type}`;
        if (this.argv_info.has(cache_id)) {
            return this.argv_info.get(cache_id);
        }
        // console.log(`Searching for id="${id ? and_or_str(id) : undefined}" index=${index} with type "${type}"...`);
        // /**
        //  * Search by index.
        //  * @warning This must precede over search by id, since the id is now always required.
        //  */
        // if (index != null && id == null) {
        //     const offset = _s_index == null ? index : _s_index + index;
        //     if (offset < this.argv.length) {
        //         return this.add_info({
        //             status: "not_found",
        //             error: `Invalid query, the query must contain an id or index`,
        //             query,
        //         }, _command);
        //     }
        //     return this.add_info(this._cast(query, this.argv[offset], type, _command) as any, _command);
        // }
        // Find the value index.
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
        if (value_index != null && this.argv[value_index] !== undefined) {
            const value = this.argv[value_index];
            if (value === undefined) {
                if (def !== Arg.NoDef) {
                    return this.add_info({
                        status: "default",
                        value: def,
                        query,
                    }, _command);
                }
                return this.add_info({
                    status: "not_found",
                    error: `Not a valid value found for argument "${and_or_str(id)}".`,
                    query
                }, _command);
            }
            return this.add_info(this._cast(query, value, type, _command), _command);
        }
        if (def !== Arg.NoDef) {
            return this.add_info({
                status: "default",
                value: def,
                query,
            }, _command);
        }
        return this.add_info({
            status: "not_found",
            error: `No value found for argument "${and_or_str(id ?? "undefined")}".`,
            query,
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
                    throw this.error(`Required argument "${and_or_str(res.query.id ?? res.query.index)}" was not found.`, { docs: true });
                }
                else {
                    return undefined;
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
        // Already an CLI error.
        if (err instanceof CLIError) {
            return err;
        }
        // Set opts.
        if (opts) {
            opts.id ??= opts.command ? `${this.name}:${opts.command.identifier()}` : this.name;
            if (opts.docs === true) {
                opts.docs = opts.command ? this.docs(opts.command, false) : this.docs(undefined, false);
            }
        }
        // Create error.
        return new CLIError(err, opts);
    }
    /**
     * Log the docs, optionally of an array of command or a single command.
     *
     * @libris
     */
    docs(command_or_commands, dump = true) {
        // Assign to commands when undefined
        if (command_or_commands == null) {
            command_or_commands = [];
            if (this._main) {
                command_or_commands.push(this._main);
            }
            command_or_commands.push(...this.commands);
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
                list_item[0] = `    ${and_or_str(command.id ?? "<main>")}`;
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
                            list_item[0] = `        ${and_or_str(arg.id)}`;
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
            docs += `Usage: $ ${this.name} ${and_or_str(command_or_commands.id ?? `<main>`)} [options]\n`;
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
                        list_item[0] = `    ${and_or_str(arg.id)}`;
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
            // Examples.
            if (command_or_commands.examples?.length) {
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
        this._main = (main instanceof Main ? main : new Main(main, this.strict));
        this._main.init(this);
        if (debug.on(3))
            debug("Added main command: ", this._main);
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
        const c = (cmd instanceof Command ? cmd : new Command(cmd, this.strict));
        c.init(this);
        this.commands.push(c);
        if (debug.on(2))
            debug("Added command: ", c);
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
            // Check unknown args in strict mode.
            if (debug.on(2))
                debug("Starting CLI.");
            if (this.strict) {
                this._check_unknown_args();
            }
            // Run commands.
            if (debug.on(2))
                debug("Running commands.");
            for (const command of this.commands) {
                if (debug.on(2))
                    debug("Checking command ", and_or_str(command.id));
                const found_index = this.find_arg(command).index;
                if (found_index != null) {
                    if (debug.on(2))
                        debug("Executing command ", and_or_str(command.id));
                    if (help) {
                        this.docs(command);
                        return;
                    }
                    await this.run_command(command, found_index);
                    matched = true;
                    break;
                }
            }
            // Show help.
            if (debug.on(2))
                debug("Matched command: ", matched);
            if (!matched && help) {
                this.docs();
                return;
            }
            // Show main command.
            if (!matched && this._main) {
                if (debug.on(2))
                    debug("Checking main command.");
                if (help) {
                    this.docs(this._main);
                    return;
                }
                if (this._main.args
                    && !this._main.args.every(x => !x.required)
                    // @todo this should exclude ids that are also present in the main command args.
                    && !this._main.args.some(x => x.variant === "id" && x.id && this.has(x.id)) // ensure some of the main args are present
                ) {
                    // Ensure any of the args are found, if not then its likely not the main command.
                    throw this.error("Invalid mode, not main.", { docs: true });
                }
                if (debug.on(2))
                    debug("Executing main command.");
                await this.run_command(this._main);
                matched = true;
            }
            // Show default docs.
            if (!matched) {
                throw this.error("Invalid mode.", { docs: true });
            }
            if (debug.on(2))
                debug("CLI run finished");
        }
        catch (e) {
            if (e instanceof CLIError) {
                e.dump();
                process.exit(1);
            }
            console.error("stack" in e ? e.stack : e);
            process.exit(1);
        }
    }
}
// ------------------------------------------------------------------
// Public functions.
// Public CLI instance.
export const cli = new CLI({ _sys: true, strict: true });
/**
 * Get an argument.
 * @param query The argument get options. See {@link Arg.Base} for option information.
 * @libris
 */
export function get(query) {
    return cli.get(query);
}
/**
 * Check if an argument is present.
 * @libris
 */
export function present(id) {
    return cli.has(id);
}
// // ————————————————————————————————————————————————————————
// // INTERNAL TESTS
// const opt1x = cli.get(new Arg.Base({ id: "--str", type: "string", required: false }, "query", false));
// const opt1y = cli.get({ id: "--str", type: "string", required: false });
// // @ts-expect-error
// const opt1: string = cli.get({ id: "--str", type: "string", required: false }); //
// const opt2: string = cli.get({ id: "--str", type: "string", required: true }); //
// const str1: string = cli.get({ id: "--str", type: "string" }); //
// const nr1: number = cli.get({ id: "--nr", type: "number" }); 
// const nr2: number = cli.get({ id: "--nr", type: "number", def: 0 });
// const arr1: number[] = cli.get({ id: "--nr", type: "number[]", def: [] as number[] });
// new CLI()
// .command({
//     id: "test",
//     description: "test",
//     args: [
//         { name: "source", type: "string" },
//         // { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
//         // { id: "--git", type: "string[]", description: "Push to all git or a list of specific git remotes.", def: [] },
//         // { id: "--ssh", type: "string[]", description: "Push to all ssh or a list of specific ssh remotes.", def: [] },
//         // { id: ["--forced", "-f"], type: "boolean", description: "Push with git in forced mode." },
//         // { id: ["--del", "-d"], type: "boolean", description: "Push with ssh in delete mode." },
//         // { id: ["--ensure-push", "-e"], type: "boolean", description: "Ensure a git push by editing the gitignore safely." },
//         // { id: ["--log-level", "-l"], type: "number", description: "The log level." },
//     ] as const,
//     callback: ({
//         source,
//         // sources = null,
//         // git = null,
//         // ssh = null,
//         // forced = false,
//         // del = false,
//         // ensure_push = false,
//         // log_level = 0,
//     }) => {}
// });
//# sourceMappingURL=cli.js.map