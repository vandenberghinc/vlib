/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Iterator } from '../code/iterator.js';
import * as Scheme from '../scheme/index.m.uni.js';
import { Color, Colors } from '../system/colors.js';
import { Path } from '../system/path.js';
import type { Merge, StringLiteral, ArrayLiteral, IsNever } from '../types/index.m.js';
import { error as dump_error, throw_error } from './error.js';
import { And, Or, and_or_str } from './query.js';
import { debug } from '../debugging/index.m.uni.js';
import * as InferArgs from './infer_args.js';
import { logger } from '../logging/logger.js';
import { ObjectUtils } from '../global/object.js';
import { CastFlag, ExtractFlag } from '../types/flags.js';
import type { Cast } from './cast.js';
import * as Arg from './arg.js';
import { Strict } from './arg.js';
import { Command, Main, Base as BaseCommand } from './command.js';

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
export class CLI<
    S extends Strict = Strict,
> {

    /** The CLI name. */
    private name: string;

    /** The CLI description for the usage docs. */
    private description?: string;

    /** The CLI version. */
    private version: string;
    
    /** The main command for when no specific command is detected. */
    private _main?: Main<S>;

    /** The list of commands. */
    private commands: Command<S>[] = [];

    /**
     * The list of global option arguments.
     * @todo not implemented yet.
     */
    private options: Command<S>[];

    /** The notes. */
    private notes: string[];

    /** The argc start index. */
    // private start_index: number;

    /** The argv set & map. */
    private argv: string[]; 
    private argv_set: Set<string>;

    /** Argv info map. */
    private argv_info: Map<string, Info> = new Map();
    
    /** Whether to throw an error when an unknown command is detected, defaults to false. */
    strict: Strict.Cast<S>;

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
    constructor(
        {
            name = "CLI",
            description,
            version = "1.0.0",
            argv = process.argv, // default start index is 2.
            notes = [],
            options = [],
            strict,
            _sys = false,
        }: {
            name?: string;
            description?: string;
            version?: string;
            notes?: string[];
            start_index?: number;
            argv?: string[]; 
            options?: Command.Opts<S>[]; // global options.
            _sys?: boolean; // is internal system cli.
        }
            & Strict.If<
                S,
                "strict",
                // with infer inside so the `S` template is inferred correctly from the constructor.
                { strict: "strict" extends S ? true : false },
                { strict?: "strict" extends S ? true : false }
            >
    ) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.notes = notes;
        this.strict = (strict ?? false) as Strict.Cast<S>;
        this.options = options.map(o => o instanceof Command
            ? o
            : new Command(o, this.strict)
        );
        argv = argv.slice(2);
        this.argv = argv;
        this.argv_set = new Set(argv);       
        this._init(_sys);
    }

    /** Check unknown arguments. */
    private _check_unknown_args(): void {
        
        // Build a list of all known args.
        const known_id_args = new Set<string>();
        const add_arg = (arg: Arg.Command<S>) => {
            if (arg.variant === "id" && arg.id) {
                if (arg.id instanceof Or || arg.id instanceof And) {
                    arg.id.walk(id => known_id_args.add(id));
                } else {
                    known_id_args.add(arg.id);
                }
            }
        }
        const add_command = (cmd: Command<S> | Main<S>) => {
            if (cmd.id instanceof Or || cmd.id instanceof And) {
                cmd.id.walk(id => known_id_args.add(id));
            } else {
                known_id_args.add(cmd.id);
            }
            if (cmd.args?.length) {
                cmd.args.walk(add_arg);
            }
        }
        for (const cmd of this.commands) {
            add_command(cmd);   
        }
        this.commands.walk(add_command);
        this.options.walk(add_command);
        if (this._main) { add_command(this._main); }

        // Iterate over the argv and check for unknown args.
        for (let i = 0; i < this.argv.length; i++) {
            const item = this.argv[i];
            if (
                item.charAt(0) !== "-" // skip non-args.
                || item === "--help" // skip help since that is handled internally and is not added.
                || item === "-h" 
            ) {
                continue; 
            }
            if (!known_id_args.has(item)) {
                if (this.strict) {
                    this.throw(`Unknown argument "${item}".`);
                } else {
                    logger.warn(`Unknown argument "${item}".`);
                }
            }
        }

    }

    /**
     * Check if a command with an id query exists.
     */
    private _has_id_command(id: string | string[] | Command["id"]): boolean {
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
                this.command({
                    id: ["--version", "-v"],
                    description: "Show the CLI version.",
                    callback: (args: any): void => console.log(`${this.name} v${this.version}`),
                })
            }
        }
        
    }

    /** Throw a cast single error. */
    private _cast_single_error(value: any, type: Cast.Castable): string {
        return `Unable to cast "${value}" of type "${Scheme.value_type(value)}" to type "${
            Array.isArray(type) ? type.join(" | ") : type
        }".`;
    }

    /**
     * Cast a single type with info options.
     */
    private _cast_single<A extends Arg.Base = Arg.Base>(
        query: A,
        input: string,
        type: Cast.Type,
    ): Info<"success", A> | Info<"error", A> {

        // Type alias.
        type Casted = InferArgs.ExtractArgValueType<A>;

        // Handle string.
        let value: any;
        switch (type) {
            case "string":
                return { status: "success", value: input as Casted, query };
                // return i;
            case "number": {
                const value = Scheme.cast.number(input, { strict: true, preserve: true });
                if (typeof value === "string") {
                    return { status: "invalid_value", error: this._cast_single_error(input, type), query };
                }
                return { status: "success", value: value as Casted, query };
            }
            case "boolean":
                value = Scheme.cast.boolean(input, { preserve: true });
                if (typeof value === "string") {
                    return { status: "invalid_value", error: this._cast_single_error(input, type), query };
                }

            // Array.
            case "array":
            case "string[]": case "boolean[]": case "number[]":
            // case "(string|boolean)[]"] // could be supported.
            {
                const out = Array.isArray(input) ? input : input.split(",");
                const value_type = type === "array"
                    ? "string"
                    : type.slice(0, -2) as Cast.Type;
                const value_types = value_type.split("|") as Cast.Type[];
                if (value_types.length === 1 && value_types[0] === "string") {
                    return { status: "success", value: out as Casted, query };
                } else {
                    const res = out.map(item => this._cast(query, item, value_types));
                    if (res.some(r => r.error)) {
                        return { status: "invalid_type", error: this._cast_single_error(input, type), query };
                    }
                    return { status: "success", value: res.map(r => r.value) as Casted, query };
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
                        const value_type = type.slice(7 + key_type.length + 2, -1).split("|") as Cast.Type[];
                        const record = key_type === "string" ? {} as Record<string, any> : undefined;
                        const map = record == null ? new Map<any, any>() : undefined;
                        Object.keys(parsed).walk(key => {
                            if (record) {
                                record[key] = 
                                    value_type.length === 1 && value_type[0] === "string"
                                        ? parsed[key]
                                        : this._cast(query, parsed[key], value_type)
                            } else {
                                map?.set(
                                    key_type === "string" ? key : this._cast(query, key, key_type as Cast.Type),
                                    value_type.length === 1 && value_type[0] === "string"
                                        ? parsed[key]
                                        : this._cast(query, parsed[key], value_type)
                                );
                            }
                        });
                        return { status: "success", value: (map ?? record) as Casted, query };
                    }
                    return { status: "success", value: parsed as Casted, query };
                }
            default:
                // @ts-expect-error
                throw_error(`Unsupported cast type "${type.toString()}".`);
        }
    }

    /** Cast types. */
    private _cast<A extends Arg.Base = Arg.Base>(
        query: A,
        value: string,
        type: Cast.Castable,
    ): Info<"success", A> | Info<"error", A> {

        // Type alias.
        type Casted = InferArgs.ExtractArgValueType<A>;
        
        // Handle undefined.
        if (type == null) {
            return { status: "success", value: undefined as Casted, query };
        } else if (type == "string") {
            return { status: "success", value: value as Casted, query };
        }

        // Handle OR operation.
        if (Array.isArray(type)) {
            for (const t of type) {
                const res = this._cast_single(query, value, t);
                if (!res.error) {
                    return res;
                }
            }
            return { status: "invalid_type", error: this._cast_single_error(value, type), query };
        }

        // Handle single type.
        return this._cast_single(query, value, type);
    }

    /** Wrapper function to add an info object and return the info for one line returns. */
    private add_info<I extends Info>(info: I): I {

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
                    } else if (typeof item !== "string" && !(item instanceof String)) {
                        return item.toString();
                    }
                    return `"${item.toString()}"`;
                }).join(", ");
                throw_error(`Argument "${query.identifier()}" must be one of the following enumerated values [${joined}].`);
            }
        }

        // Add item to the cache.
        const cache_id = `${query.id ?? query.index ?? ""}-${query.type}`;
        this.argv_info.set(cache_id, info);

        // Return info.
        return info
    }

    // Add an argument to the command arguments object.
    private add_to_cmd_args(
        cmd_args: Record<string, any>,
        name: string | And | Or,
        value: any,
        parent: Record<string, any>,
    ): void {
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
                if (typeof id !== "string") id = id[0]
                id = id.replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            }

            // Insert as nested object(s).
            if (name.length === 0) { throw_error("Cannot insert an empty name array."); }
            else if (name.length === 1) {
                const id = name[0] // (typeof name[0] === "string" ? name[0] : name[0][0])
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            } else {
                const first = name[0] // (typeof name[0] === "string" ? name[0] : name[0][0])
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[first] ??= {};
                this.add_to_cmd_args(cmd_args, name.slice(1) as And, value, parent[first]);
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
    private async run_command(
        command: Command<S> | Main<S>,
        args_start_index: number = 0,
    ): Promise<void> { 

        // Get arguments.
        const cmd_args: Record<string, any> = { _command: command };

        // Parse arguments.
        if (command.args?.length) {
            for (const arg of command.args) {
                try {
                    if (!arg.arg_name) { throw_error(`Argument is not initialized: ${arg}`); }

                    // Type bool.
                    if (arg.type === "boolean") {
                        if (!arg.id) {
                            throw_error(`Argument "${arg.arg_name}" is not initialized with an id, this is required for boolean types.`);
                        }
                        this.add_to_cmd_args(cmd_args, arg.arg_name, this.has(arg.id), cmd_args);
                    }
                    // Get and cast.
                    else {
                        // Build get options to satisfy overloads
                        const { status, value } = this.info(arg, args_start_index);
                        // console.log(`Arg status "${status}" from ${arg}:`, value);
                        if (status === "not_found" && arg.required) {
                            throw_error(`Required argument "${and_or_str(arg.arg_name)}" was not found`);
                        }
                        else if (status === "success" || status === "default") {
                            this.add_to_cmd_args(cmd_args, arg.arg_name, value, cmd_args);
                        }
                    }
                } catch (err) {
                    this.docs(command);
                    this.throw(err);
                }
            }
        }
        if (debug.on(2)) debug(`Running command: ${"id" in command ? command.id ? and_or_str(command.id) : "<unknown>" : "<main>"}`);
        if (debug.on(3)) debug("With arguments:", cmd_args);

        // Call the callback.
        try {
            // required if statement for ts `this` context complaints.
            if (command.mode === "main") {
                await Promise.resolve(
                    command.callback(cmd_args as any)
                );
            } else {
                await Promise.resolve(
                    command.callback(cmd_args as any)
                );
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
    find_index(id: number | string | string[] | Or | And): number | undefined {
        let index_of: number | -1 = -1;
        if (typeof id === "number") {
            return id < this.argv.length ? id : undefined;
        } else if (id instanceof And) {
            // not supported, no good way to univerally know if to return the start or end index of the found match.
            throw new Error("Cannot find index of an 'and' query, use 'or' or a single id instead.");
        } else if (id instanceof Or || Array.isArray(id)) {
            // return id.some(i => this.present(i));
            for (const item of id) {
                const i = this.argv.indexOf(item);
                if (i !== -1) { return i; }
            }
            return undefined;
        } else {
            index_of = this.argv.indexOf(id as string);
        }
        return index_of === -1 ? undefined : index_of;
    }

    /**
     * Check if the CLI has an argument index or id(s).
     * @libris
     */
    has(id: number | string | string[] | Or | And | Arg.Base): boolean {
        if (id instanceof Arg.Base) {
            return this.has(id.variant === "index" ? id.index : id.id);
        } else if (typeof id === "number") {
            return id < this.argv.length
        } else if (id instanceof And) {
            // should not check sequence, that is only for Arg not for Command.
            return id.every(i => this.has(i));
        } else if (id instanceof Or || Array.isArray(id)) {
            return id.some(i => this.has(i));
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
    info<
        const O extends Arg.Base | Arg.Base.Opts = Arg.Base.Opts<"loose", "query", Arg.Variant, "string">    
    >(
        q: 
            | O
            | And
            | Or | string[]
            | string,
        _s_index?: number, // start index when searching for arguments by index.
    ): Info<"success", Arg.Base.FromOpts<O>> | Info<"error", Arg.Base.FromOpts<O>> {

        // Type alias.
        type Q = Arg.Base.FromOpts<O>;
        type Casted = InferArgs.ExtractArgValueType<Q>;
        type I = Info<"success", Q> | Info<"error", Q>;

        // Initialize args.
        // Ensure query is of type `A` so the return type is correct when using `query` inside the add_info obj param.
        const query: Q = 
            (typeof q === "string" || Array.isArray(q) || q instanceof Or || q instanceof And)
            ? new Arg.Query({ id: q, type: "string" }, this.strict) as any
            : q instanceof Arg.Base
                ? q
                : new Arg.Query(
                    q as any,
                    this.strict
                )

        // Unpack the arg.
        const {
            id, index, def,
            type = "string",
            exclude_dash = true,
        } = query;

        // Check args.
        if (!id && index == null) {
            throw new Error("Invalid argument, either parameter 'id' or 'index' must be defined. Argument: " + Color.object(query));
        }

        // Check cache.
        const cache_id = `${id ?? index ?? ""}-${type}`;
        if (this.argv_info.has(cache_id)) {
            return this.argv_info.get(cache_id) as I;
        }
        // console.log(`Searching for id="${id ? and_or_str(id) : undefined}" index=${index} with type "${type}"...`);

        /**
         * Search by index.
         * @warning This must precede over search by id, since the id is now always required.
         */
        if (index != null && id == null) {
            const offset = _s_index == null ? index : _s_index + index;
            if (offset < this.argv.length) {
                return this.add_info({
                    status: "not_found",
                    error: `Invalid query, the query must contain an id or index`,
                    query,
                });
            }
            return this.add_info(this._cast(query, this.argv[offset], type) as any);
        }

        // Find the value index.
        let value_index: number | undefined = undefined;
        if (id instanceof And) {
            let and_i = 0;
            for (let i = 0; i < this.argv.length; i++) {
                if (this.argv[i] === id[and_i]) {
                    ++and_i;
                    if (and_i === id.length) {
                        value_index = i + 1; // next index is the value.
                        break;
                    }
                } else if (and_i > 0/* && this.argv[i]?.charAt(0) !== "-"*/) {
                    // matches must be consecutive, abort if not.
                    break;
                }
            }
        } else if (
            id instanceof Or// || Array.isArray(id))
            && id.some(i => this.argv_set.has(i)) // fast lookup
        ) {
            value_index = this.argv.findIndex(arg => id.includes(arg))
            if (value_index !== -1) {
                value_index += 1; // next index is the value.
            }
        } else if (
            typeof id === "string"
            && this.argv_set.has(id)
        ) {
            value_index = this.argv.indexOf(id as string);
            if (value_index !== -1) {
                value_index += 1; // next index is the value.
            }
        }
        // console.log("ID:", id )
        // console.log("Args:", this.argv);
        if (
            value_index != null
            && value_index != -1
            && value_index < this.argv.length
            && this.argv[value_index] !== undefined
        ) {
            const value = this.argv[value_index];
            if (value === undefined || (exclude_dash && value.charAt(0) === "-")) {
                if (def !== Arg.NoDef) {
                    return this.add_info({
                        status: "default",
                        value: def as any,
                        query,
                    });
                }
                return this.add_info({
                    status: "not_found",
                    error: `Not a valid value found for argument "${and_or_str(id)}".`,
                    query
                });
            }
            return this.add_info(this._cast(query as any, value, type))
        }
        if (def !== Arg.NoDef) {
            return this.add_info({
                status: "default",
                value: def as any,
                query,
            });
        }
        return this.add_info({
            status: "not_found",
            error: `No value found for argument "${and_or_str(id ?? "undefined")}".`,
            query,
        });
    }

    /**
     * {Get}
     * Get an argument.
     * @param query The argument get options. See {@link Arg.Base} for option information.
     * @libris
     */
    get<
        const Q extends Arg.Base | Arg.Base.Opts = Arg.Base.Opts<"loose", "query", Arg.Variant, "string">,
    >(query:
        | Q
        | And
        | Or | string[]
        | string,
    ): InferArgs.IsOptional<Q> extends true
        ? undefined | InferArgs.ExtractArgValueType<Q, "string">
        : InferArgs.ExtractArgValueType<Q, "string">
    {
        type Res = InferArgs.IsOptional<Q> extends true
            ? undefined | InferArgs.ExtractArgValueType<Q, "string">
            : InferArgs.ExtractArgValueType<Q, "string">
        const res = this.info<Q>(query);
        if (res.error) {
            if (res.status === "not_found") {
                if (res.query.required) {
                    this.throw(`Required argument "${and_or_str(res.query.id ?? res.query.index)}" was not found.`);
                } else {
                    return undefined as Res;
                }
            }
            this.throw(res.error);
        }
        return res.value as Res;
    }

    /**
     * Log an error.
     * @libris
     */
    error(...err: any[]): void {
        dump_error(...err);
    }

    /**
     * Throw an error and stop with exit code 1.
     * @libris
     */
    throw(...err: any[]): never {
        if (err.length === 1 && typeof err[0] === "string") {
            throw_error(new Error(err[0]));
        }
        throw_error(...err);
    }

    /**
     * Log the docs, optionally of an array of command or a single command.
     * 
     * @libris
     */
    docs(command_or_commands?:
        | Main<S>
        | Command<S>
        | Command<S>[]
    ): void {
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
                        const list_item: [string, string] = ["", ""];
                        if (arg.id == null) {
                            list_item[0] = `        argument ${arg_index}`;
                        } else {
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
    main<const A extends Command.Args<S> = Command.Args<S>>(
        main: Main.Opts<S, Main.Variant, A>
    ): this {
        if (this._main) {
            throw_error("Main command already set.");
        }
        this._main = (main instanceof Main ? main : new Main<S, Main.Variant, A>(main, this.strict)) as Main<S>;
        if (debug.on(3)) debug("Added main command: ", this._main);
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
    command<const A extends Command.Args<S> = Command.Args<S>>(
        cmd: Command.Opts<S, Command.Variant, A>
    ): this {
        const c = (cmd instanceof Command ? cmd : new Command<S, Command.Variant, A>(cmd, this.strict)) as Command<S>;
        if (debug.on(2)) debug("Added command: ", c);
        this.commands.push(c);
        return this;
    }

    /**
     * Start the cli.
     * 
     * @libris
     */
    async start(): Promise<boolean> {
        const help = this.has(["-h", "--help"]);
        let matched = false;

        // Check unknown args in strict mode.
        if (debug.on(0)) debug("Starting CLI.");
        if (this.strict) {
            this._check_unknown_args();
        }

        // Run commands.
        if (debug.on(0)) debug("Running commands.");
        for (const command of this.commands) {
            if (debug.on(0)) debug("Running command ", command.id);
            const found_index = command.id instanceof And
                ? 0
                : this.find_index(command.id);
            if (found_index != null) {
                if (help) { this.docs(command); return true; }
                await this.run_command(command, found_index);
                matched = true;
                break;
            }
        }

        // Show help.
        if (debug.on(0)) debug("Matched command: ", matched);
        if (!matched && help) {
            this.docs();
            return true;
        }

        // Show main command.
        if (!matched && this._main) {
            if (debug.on(2)) debug("Checking main command.");
            if (help) { this.docs(this._main); return true; }
            if (
                this._main.args
                && !this._main.args.every(x => !x.required)
                // @todo this should exclude ids that are also present in the main command args.
                && !this._main.args.some(x => x.variant === "id" && x.id && this.has(x.id)) // ensure some of the main args are present
            ) {
                // Ensure any of the args are found, if not then its likely not the main command.
                this.docs();
                this.error("Invalid mode, not main.");
                return false;
            }
            if (debug.on(2)) debug("Executing main command.");
            await this.run_command(this._main);
            matched = true;
        }

        // Show default docs.
        if (!matched) {
            this.docs();
            this.error("Invalid mode.");
            return false;
        }

        if (debug.on(2)) debug("CLI run finished");
        return true;
    }
}

/**
 * Info response.
 * @note that we use a `found` attribute to ensure robust checking instead of checkng if value is undefined, because that can happen while still returning a found value / default value.
 * 
 * @todo apply enum cast in `info()` response
 */
export type Info<
    /** The info mode. */
    M extends Info.Mode = Info.Mode,
    /** The attached search query, used to derive `Info` attributes. */
    A extends Arg.Base | Arg.Base.Opts = Arg.Base,
> =
    /**
     * Error response.
     */
    M extends "error" ? {
        error: string;
        status: "not_found" | "invalid_type" | "invalid_value"
        value?: never;
        query: A,
    } :
    /** Found response. */
    M extends "success" ? {
        /** Error is never defined so can be used as a type guard. */
        error?: never;
        /**
         * The status of the query
         * - `success` means the query was found and the value was casted.
         * - `default` means the query was not found and the default entry value was returned.
         */
        status: "success" | "default";
        /** The casted value type. */
        value: InferArgs.IsOptional<A> extends true
            ? undefined | InferArgs.ExtractArgValueType<A, "string">
            : InferArgs.ExtractArgValueType<A, "string">;
        /** The attached query. */
        query: A,
    } :
    /** Invalid mode. */
    never;
export namespace Info {
    /** The info mode. */
    export type Mode = "error" | "success";
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
export function get<
    const A extends Arg.Base | Arg.Base.Opts = Arg.Base.Opts<"loose", "query", Arg.Variant, "string">,
>(query: A | Or | string[] | string): InferArgs.IsOptional<A> extends true
    ? undefined | InferArgs.ExtractArgValueType<A, "string">
    : InferArgs.ExtractArgValueType<A, "string">
{
    return cli.get(query) as any;
}

/**
 * Check if an argument is present.
 * @libris
 */
export function present(id: number | string | string[] | Or | And | Arg.Base): boolean {
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


