/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Iterator } from '../code/iterator.js';
import { Scheme } from '../scheme/scheme.js';
import { Colors } from '../system/colors.js';
import { Path } from '../system/path.js';
import type { Merge, StringLiteral, ArrayLiteral, IsNever } from '../types/index.m.js';
import { error, throw_error } from './error.js';
import { Command, Command as _Command } from './command.js';
import { Query, Query as _Query } from './query.js';
import { debug } from '../debugging/index.m.uni.js';
import { Arg, Arg as _Arg } from './arg.js';

// Increase stack trace limit by default.
Error.stackTraceLimit = 100;

/** Type alias for And and Or */
type And = Query.And<string | string[] | Query.Or>;
type Or = Query.Or<string>;

/** Type alias for an info() query. */
export type InfoQuery<T extends Arg.Castable> =
    | Arg<Arg.Variant, Arg.Mode, T>
    | Arg.Opts<Arg.Variant, Arg.Mode, T>
    | And
    | Or | string[]
    | string;

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
    private name: string;

    /** The CLI description for the usage docs. */
    private description?: string;

    /** The CLI version. */
    private version: string;
    
    /** The main command for when no specific command is detected. */
    private main?: Command.Main;

    /** The list of commands. */
    private commands: Command.Id[];

    /**
     * The list of global option arguments.
     * @todo not implemented yet.
     */
    private options: Arg<"id", "option">[];

    /** The notes. */
    private notes: string[];

    /** The argc start index. */
    private start_index: number;

    /** The argv map. */
    private argv_map: Set<string> = new Set(process.argv);

    /** Argv info map. */
    private argv_info: Map<string, CLI.Info> = new Map();

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
    constructor(
        {
            name = "CLI",
            main,
            commands = [],
            options = [],
            description,
            version = "1.0.0",
            notes = [],
            start_index = 2,
            _sys = false,
        }: {
            name?: string;
            main?: Command.MainOpts;
            commands?: Command.IdOpts[]; // commands with id.
            options?: Command.IdOpts[]; // global options.
            description?: string;
            version?: string;
            notes?: string[];
            start_index?: number;
            _sys?: boolean; // is internal system cli.
            // @todo add something like.
            // check_unknown: boolean | { exclude: string[] }
        } = {}
    ) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.commands = commands.map(c => new Command(c, "id"));
        this.main = main ? new Command(main, "main") : undefined;
        this.options = options.map(o => new Arg(o, "id", "option"));
        this.notes = notes;
        this.start_index = start_index;
        this._init(_sys);
    }

    /**
     * Check if a command with an id query exists.
     */
    private _has_id_command(id: string | string[] | Command.Arg["id"]): boolean {
        return this.commands.some(cmd => cmd.variant === "id"
            ? cmd.eq_id(id)
            : false
        );
    }

    /** 
     * Initialize the CLI.
     * 
     * 1) Adds a --version, -v command.
     */
    private _init(_sys: boolean = false): void {

        /** Add --version command. */
        if (_sys === false) {
            if (this.version != null && !this._has_id_command(["--version", "-v"])) {
                this.commands.push(new Command({
                    id: ["--version", "-v"],
                    description: "Show the CLI version.",
                    callback: () => console.log(`${this.name} v${this.version}`)
                }));
            }
        }
        
    }

    /** Throw a cast single error. */
    private _cast_single_error<T extends Arg.Castable>(value: any, type: T | T[]): string {
        return `Unable to cast "${value}" of type "${Scheme.value_type(value)}" to type "${
            Array.isArray(type) ? type.join(" | ") : type
        }".`;
    }

    /**
     * Cast a single type with info options.
     */
    private _cast_single<T extends Arg.Type>(
        query: Arg, // not guaranteed the same type as T.
        input: string,
        type: T,
    ): CLI.Info<CLI.Info.Mode, T> | CLI.Info<"error"> {
        // Handle string.
        let value: any;
        let error: CLI.Info<"error">;
        switch (type) {
            case "string":
                return { found: true, value: input as Arg.Cast<T>, query };
            case "number": {
                const value = Scheme.cast_number(input, { strict: true, preserve: true });
                if (typeof value === "string") {
                    error = { error: this._cast_single_error(input, type), query }; return error;
                }
                return { found: true, value: value as Arg.Cast<T>, query };
            }
            case "boolean":
                value = Scheme.cast_bool(input, { preserve: true });
                if (typeof value === "string") {
                    error = { error: this._cast_single_error(input, type), query }; return error;
                }
                return { found: true, value, query };

            // Array.
            case "array":
            case "string[]": case "boolean[]": case "number[]":
            {
                const out = Array.isArray(input) ? input : input.split(",");
                const value_type = type === "array"
                    ? "string"
                    : type.slice(0, -2) as Arg.Type;
                const value_types = value_type.split("|") as Arg.Castable[];
                if (value_types.length === 1 && value_types[0] === "string") {
                    return { found: true, value: out as Arg.Cast<T>, query };
                } else {
                    const res = out.map(item => this._cast(query, item, value_types));
                    if (res.some(r => r.error)) {
                        error = { error: this._cast_single_error(input, type), query }; return error;
                    }
                    return { found: true, value: res.map(r => r.value) as Arg.Cast<T>, query };
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
                    let key: string | undefined;
                    let key_start = 0, value_start = 0;
                    let mode: "key" | "value" = "key";
                    const parsed: Record<string, string> = {};
                    new Iterator(input, { string: ["'", '"', '`'] }, (state, it) => {
                        const c = it.state.peek;
                        if (
                            mode === "key"
                            && state.is_code
                            && (c === ":" || c === "=")
                        ) {
                            key = it.slice(key_start, it.state.offset);
                            mode = "value";
                            value_start = it.state.offset + 1;
                        } else if (
                            mode === "value"
                            && state.is_code
                            && !state.is_excluded
                            && (c === "," || c === ";")
                        ) {
                            if (key) {
                                let end = it.state.offset;
                                let first = input.charAt(value_start);
                                if (
                                    // strip quotes.
                                    (first === "'" || first === '"' || first === "`")
                                    && first === input.charAt(it.state.offset - 1)
                                ) { ++value_start; --end; }
                                parsed[key] = it.slice(value_start, end);
                            }
                            key_start = it.state.offset + 1;
                            mode = "key";
                        }
                    });
                    if (type !== "object") {
                        let key_type = type.slice(7);
                        key_type = key_type.slice(0, key_type.indexOf(","));
                        const value_type = type.slice(7 + key_type.length + 2, -1).split("|") as Arg.Type[];
                        const casted = new Map<any, any>();
                        Object.keys(parsed).walk(key => {
                            casted.set(
                                key_type === "string" ? key : this._cast(query, key, key_type as Arg.Type),
                                value_type.length === 1 && value_type[0] === "string"
                                    ? parsed[key]
                                    : this._cast(query, parsed[key], value_type)
                            );
                        });
                        return { found: true, value: casted as Arg.Cast<T>, query };
                    }
                    return { found: true, value: parsed as Arg.Cast<T>, query };
                }
            default:
                // @ts-expect-error
                throw_error(`Unsupported cast type "${type.toString()}".`);
        }
    }

    /** Cast types. */
    private _cast<T extends Arg.Castable>(
        query: Arg, // not guaranteed the same type as T.
        value: string,
        type: T | T[],
    ): CLI.Info<CLI.Info.Mode, T> | CLI.Info<"error"> {
        
        // Handle undefined.
        if (type == null) {
            return { found: true, value: undefined as Arg.Cast<T>, query };
        } else if (type == "string") {
            // const f: CLI.Info<"found", T> = 
            return { found: true, value: value as Arg.Cast<T>, query };
        }

        // Handle OR operation.
        if (Array.isArray(type)) {
            for (const t of type) {
                const res = this._cast_single(query, value, t as Arg.Type) as CLI.Info<CLI.Info.Mode, T>;
                if (!res.error) { return res; }
            }
            return { error: this._cast_single_error(value, type), query };
        }

        // Handle single type.
        return this._cast_single(query, value, type) as CLI.Info<CLI.Info.Mode, T>;
    }

    /** Wrapper function to add an info object and return the info for one line returns. */
    private add_info<T extends Arg.Castable>(
        cache_id: string,
        info: CLI.Info<"error"> | CLI.Info<CLI.Info.Mode, T>
    ): CLI.Info<"error"> | CLI.Info<CLI.Info.Mode, T> {

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
        return info
    }

    /**
     * Check if an argument is present.
     * @libris
     */
    present(id: number | string | string[] | Or | And): boolean {
        if (typeof id === "number") {
            return this.start_index + id < process.argv.length
        } else if (id instanceof Query.And) {
            return id.every(i => this.present(i));
        } else if (Array.isArray(id)) {
            return id.some(i => this.present(i));
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
     * 
     * @param arg The argument get options. See {@link Arg} for option information.
     * @param opts The options for the info method.
     * @param opts.def When `true`, the optional default value will be returned as a `found` response. Defaults to `false`.
     * 
     * @libris
     */
    info<T extends Arg.Castable = "string">(
        query: 
            | Arg<Arg.Variant, Arg.Mode, T>
            | Arg.Opts<Arg.Variant, Arg.Mode, T>
            | And
            | Or | string[]
            | string,
        opts?: { def?: boolean }
    ): CLI.Info<CLI.Info.Mode, T> | CLI.Info<"error"> {

        // Initialize args.
        const arg = typeof query === "string" || Array.isArray(query)
            ? new Arg({ id: query, type: "string", }, "id", "query")
            : query instanceof Arg
                ? query
                : new Arg<Arg.Variant, Arg.Mode, T>(query, "auto", "query")
        let err_info: CLI.Info<"error">;

        // Unpack the arg.
        const {
            id, index, def,
            type = "string",
            exclude_dash = true,
        } = arg;

        // Check args.
        if (!id && index == null) {
            this.throw("Either parameter 'id' or 'index' must be defined.");
        }

        // Check cache.
        const cache_id = `${id ?? index ?? ""}-${type}`;
        if (this.argv_info.has(cache_id)) {
            return this.argv_info.get(cache_id) as CLI.Info<CLI.Info.Mode, T>;
        }
        // console.log(`Searching for id="${id ? Query.to_str(id) : undefined}" index=${index} with type "${type}"...`);

        /**
         * Search by index.
         * @warning This must precede over search by id, since the id is now always required.
         */
        if (index != null && id == null) {
            const value = process.argv[this.start_index + index];
            if (value === undefined) {
                err_info = { error: `No value found for argument at index ${index}.`, query: arg as Arg<Arg.Variant, Arg.Mode, T> };
                return this.add_info(cache_id, err_info);
            }
            return this.add_info<T>(cache_id, this._cast<T>(arg, value, type as T));
        }

        // Find the value index.
        let value_index: number | undefined = undefined;
        if (id instanceof Query.And) {
            let and_i = 0;
            for (let i = this.start_index; i < process.argv.length; i++) {
                if (process.argv[i] === id[and_i]) {
                    ++and_i;
                    if (and_i === id.length) {
                        value_index = i + 1; // next index is the value.
                        break;
                    }
                } else if (and_i > 0/* && process.argv[i]?.charAt(0) !== "-"*/) {
                    // matches must be consecutive, abort if not.
                    break;
                }
            }
        } else if (Array.isArray(id)) {
            const i = id.some(i => this.argv_map.has(i))
                ? process.argv.findIndex(arg => id.includes(arg), this.start_index)
                : -1;
            if (i !== -1) {
                value_index = i + 1;
            }
        } else {
            value_index = process.argv.indexOf(id as string, this.start_index);
        }
        if (
            value_index != null
            && value_index < process.argv.length
            && process.argv[value_index] !== undefined
        ) {
            const value = process.argv[value_index];
            if (value === undefined || (exclude_dash && value.charAt(0) === "-")) {
                if (opts?.def && def !== undefined) {
                    return this.add_info<T>(cache_id, { found: false, value: def as Arg.Cast<T>, query: arg });
                }
                err_info = { error: `No value found for argument at index ${index}.`, query: arg as Arg<Arg.Variant, Arg.Mode, T> };
                return this.add_info<T>(cache_id, { error: `No value found for argument "${Query.to_str(id)}".`, query: arg as Arg<Arg.Variant, Arg.Mode, T> });
            }
            return this.add_info<T>(cache_id, this._cast<T>(arg, value, type as T));
        }
        if (opts?.def && def !== undefined) {
            return this.add_info<T>(cache_id, { found: true, value: def as Arg.Cast<T>, query: arg as Arg<Arg.Variant, Arg.Mode, T> });
        }
        return this.add_info<T>(cache_id, { error: `No value found for argument "${Query.to_str(id ?? "undefined")}".`, query: arg as Arg<Arg.Variant, Arg.Mode, T> });
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
     * 
     * @param o The get options. See {@link Arg} for option information.
     * 
     * @libris
     */
    get<T extends Arg.Castable = "string">(query: 
        | Arg<Arg.Variant, Arg.Mode, T>
        | Arg.Opts<Arg.Variant, Arg.Mode, T>
        | And
        | Or | string[]
        | string,
    ): Arg.Cast<T> {
        const res = this.info(query, { def: true });
        if (res.error) {
            this.throw(res.error);
        }
        if (!res.found) {
            this.throw(`Argument "${res.query}" not found.`);
        }
        return res.value!;
    }

    /**
     * Log an error.
     * @libris
     */
    error(...err: any[]): void {
        error(...err);
    }

    /**
     * Throw an error and stop with exit code 1.
     * @libris
     */
    throw(...err: any[]): never {
        throw_error(...err);
    }

    /**
     * Log the docs, optionally of an array of command or a single command.
     * 
     * @libris
     */
    docs(command_or_commands: Command | Command[] | null = null): void {
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
        const add_keys_and_values = (list: [string, string][]) => {
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
        }

        // Show docs from an array of commands.
        if (Array.isArray(command_or_commands)) {
            
            // Description.
            if (this.description) {
                docs += `\nDescription:\n    ${this.description.split("\n").join("\n    ")}\n`;
            }

            // Usage.
            docs += `Usage: $ ${this.name} [mode] [options]\n`;

            // Commands.
            const list: [string, string][] = [];
            command_or_commands.forEach((command) => {
                const list_item: [string, string] = ["", ""];

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
                        const list_item: [string, string] = ["", ""];
                        if (arg.id == null) {
                            list_item[0] = `        argument ${arg_index}`;
                        } else {
                            list_item[0] = `        ${Query.to_str(arg.id)}`;
                        }
                        if (arg.type != null && (arg as Arg).type !== "boolean") {
                            list_item[0] += ` <${arg.type}>`;
                        }
                        if ((typeof arg.required === "function" && arg.required()) || (typeof arg.required === "boolean" && arg.required)) {
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
                const list: [string, string][] = [];
                command_or_commands.args.forEach((arg) => {
                    if (arg.ignore === true) {
                        return;
                    }
                    const list_item: [string, string] = ["", ""];
                    if (arg.id == null) {
                        list_item[0] = `    argument ${arg_index}`;
                    }
                    else {
                        list_item[0] = `    ${Query.to_str(arg.id)}`;
                    }
                    if (arg.type != null && arg.type !== "boolean") {
                        list_item[0] += ` <${arg.type}>`;
                    }
                    if ((typeof arg.required === "function" && arg.required()) || (typeof arg.required === "boolean" && arg.required)) {
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
                    const list: [string, string][] = [];
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
    private add_to_cmd_args(
        cmd_args: Record<string, any>,
        name: string | Query.And | Query.Or,
        value: any,
        parent: Record<string, any>,
    ): void {
        if (name instanceof Query.And) {

            // Insert root also directly.
            // Use last since an array is always an And operation.
            if (parent === cmd_args) {
                let id = name[name.length - 1];
                if (typeof id !== "string") id = id[0]
                id = id.replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            }

            // Insert as nested object(s).
            if (name.length === 0) { throw_error("Cannot insert an empty name array."); }
            else if (name.length === 1) {
                const id = typeof name[0] === "string" ? name[0] : name[0][0]
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            } else {
                const first = typeof name[0] === "string" ? name[0] : name[0][0]
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[first] ??= {};
                this.add_to_cmd_args(cmd_args, name.slice(1) as Query.And, value, parent[first]);
            }
        } else if (Array.isArray(name)) {
            const id = name[0]
                .replace(/^-+/, ""); // remove leading dashes.
            parent[id] = value;
        } else {
            parent[name.replace(/^-+/, "")] = value;
        }
    }

    /** Run a command. */
    async command(command: Command) {

        // Get arguments.
        const cmd_args: Record<string, any> = { _command: command };

        // Parse arguments.
        if (command.args?.length) {
            for (const arg of command.args) {
                try {
                    if (!arg.arg_name) { throw_error(`Argument "${arg.id}" is not initialized.`); }

                    // Type bool.
                    if (arg.type === "boolean") {
                        if (!arg.id) {
                            throw_error(`Argument "${arg.arg_name}" is not initialized with an id, this is required for boolean types.`);
                        }
                        this.add_to_cmd_args(cmd_args, arg.arg_name, this.present(arg.id), cmd_args);
                    }
                    // Get and cast.
                    else {
                        // Build get options to satisfy overloads
                        let res;
                        if (typeof arg.index === "number") {
                        } else {

                        }
                        const { found, value } = this.info(arg, { def: false });
                        // const { found, value } = this.info({
                        //     id: arg.id,
                        //     type: arg.type ?? "string",
                        //     index: arg.index,
                        // });
                        // console.log(`Found arg "${Query.to_str(arg.id)}" at index ${arg_index}:`, value);
                        if (found === false && (
                            (typeof arg.required === "function" && arg.required())
                            || (typeof arg.required === "boolean" && arg.required)
                        )) {
                            throw_error(`Required argument "${Query.to_str(arg.arg_name)}" not found.`);
                        }
                        if (found === true && value == null && arg.def !== undefined) {
                            this.add_to_cmd_args(cmd_args, arg.arg_name, arg.def, cmd_args);
                        } else if (value != null) {
                            this.add_to_cmd_args(cmd_args, arg.arg_name, value, cmd_args);
                        }
                    }
                } catch (err) {
                    this.docs(command);
                    this.error(err);
                    return true;
                }
            }
        }
        if (debug.on(1)) debug(`Running command: ${"id" in command ? command.id ? Query.to_str(command.id) : "<unknown>" : "<main>"}`);
        if (debug.on(2)) debug("With args:", cmd_args);

        // Call the callback.
        try {
            await Promise.resolve(command.callback(cmd_args as any));
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
    async start(): Promise<boolean> {
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
            if (
                this.main.args
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
export namespace CLI {

    /**
     * Info response.
     * @note that we use a `found` attribute to ensure robust checking instead of checkng if value is undefined, because that can happen while still returning a found value / default value.
     */
    export type Info<
        M extends Info.Mode = Info.Mode,
        T extends Arg.Castable = Arg.Castable,
    > =
        // invalid cast from T + `def` combination - the type casted value is not the same as the default value.
        M extends "invalid_cast" ? {
            error?: never;
            found?: boolean;
            value?: never;
            query: _Arg; // not guaranteed T since T can be a child of an array / OR.
        }
        // perform invalid cast check, if so use that mode.
        : [Arg.Cast<T>] extends [never] ? Info<"invalid_cast", T>
        // error response.
        : M extends "error" ? {
            error: string;
            found?: never;
            value?: never;
            query: _Arg, // not guaranteed T since T can be a child of an array / OR.
        }
        // not found response.
        : M extends "not_found" ? {
            error?: never;
            found: false;
            value?: Arg.Cast<T>; // can still be defined with the value of the `Arg.def` attribute.
            query: _Arg; // not guaranteed T since T can be a child of an array / OR.
        }
        // found response.
        : M extends "found" ? {
            error?: never;
            found: true;
            value: Arg.Cast<T>;
            query: _Arg; // not guaranteed T since T can be a child of an array / OR.
        } 
        // invalid mode.
        : never;

    /** Info types. */
    export namespace Info {

        /** Info mode type. */
        export type Mode = "error" | "found" | "not_found" | "invalid_cast";

    }

    /**
     * Create module.
     */
    export type Arg = _Arg;
    export const Arg = _Arg;
    export type Command = _Command;
    export const Command = _Command;
    // export type Query = _Query;
    export const Query = _Query;
}

// const nr1: number = cli.get({ id: "--nr", type: "number" }); 
// const nr2: number = cli.get({ id: "--nr", type: "number", def: 0 });
// const arr1: number[] = cli.get({ id: "--nr", type: "number[]", def: [] as number[] });


