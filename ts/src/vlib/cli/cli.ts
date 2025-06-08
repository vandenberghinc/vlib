/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Iterator } from '../code/iterator.js';
import * as Scheme from '../scheme/index.m.uni.js';
import { Color, Colors } from '../generic/colors.js';
import { Path } from '../generic/path.js';
import type { Merge, StringLiteral, ArrayLiteral, IsNever } from '../types/index.m.js';
import { CLIError } from './error.js';
import { And, Or, and_or_str } from './query.js';
import * as InferArgs from './infer_args.js';
import { log } from '../logging/index.m.node.js';
import { ObjectUtils } from '../primitives/object.js';
import type { CastFlag, ExtractFlag } from '../types/flags.js';
import type { Cast } from './cast.js';
import * as Arg from './arg.js';
import { Strict } from './arg.js';
import { Command, Main, Base as BaseCommand } from './command.js';
import { Utils } from '../generic/utils.js';

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
    const Options extends readonly Arg.Command.Opts<S, "id">[] = readonly Arg.Command.Opts<S, "id">[],
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
    private option_args: Arg.Command<S, "id">[] = [];

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

    /** The parsed & inferred options. */
    options: InferArgs.InferArgs<Options>;

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
            options,
            strict,
            _sys = false,
        }: {
            name?: string;
            description?: string;
            version?: string;
            notes?: string[];
            start_index?: number;
            argv?: string[]; 
            options?: Options; // global options.
            _sys?: boolean; // is internal system cli.
        }
        & Strict.If<S, "strict",
            // with infer inside so the `S` template is inferred correctly from the constructor.
            { strict: S extends "strict" ? true : false },
            { strict?: S extends "strict" ? true : false }
        >
    ) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.notes = notes;
        this.strict = (strict ?? false) as Strict.Cast<S>;
        this.option_args = !options ? [] : options.map(o => o instanceof Arg.Command
            ? o
            : new Arg.Command(o, this.strict)
        );
        argv = argv.slice(2);
        this.argv = argv;
        this.argv_set = new Set(argv);       
        this.options = {} as InferArgs.InferArgs<Options>; // ensure its set in the constructor, later updated in `_init()`.
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
        const add_command = (cmd: BaseCommand<S>) => {
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
        this.option_args.walk(add_arg);
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
                    throw this.error(`Unknown argument "${item}".`, { docs: true });
                }
                // else { logger.warn(`Unknown argument "${item}".`); }
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

        // Parse options.
        if (this.option_args.length) {
            this.options = this.parse_args(this.option_args, 0, undefined) as InferArgs.InferArgs<Options>;
        } else {
            this.options = {} as InferArgs.InferArgs<Options>;
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
        // optionally, when casting for args from a command, pass the command for more detailed error messages.
        command: undefined | BaseCommand<S>,
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
                return { status: "success", value: value as Casted, query };

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
                    const res = out.map(item => this._cast(query, item, value_types, command));
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
                        throw this.error(`Unable to cast "${Scheme.value_type(input)}" to an "object".`, { command });
                    }
                    let key: string | undefined;
                    let key_start = 0, value_start = 0;
                    let mode: "key" | "value" = "key";
                    const parsed: Record<string, string> = {};
                    new Iterator(
                        { data: input },
                        { language: { string: ["'", '"', '`'] } },
                    ).walk(it => {
                        const c = it.char;
                        if (
                            mode === "key"
                            && it.is_code
                            && (c === ":" || c === "=")
                        ) {
                            key = it.slice(key_start, it.pos);
                            mode = "value";
                            value_start = it.pos + 1;
                        } else if (
                            mode === "value"
                            && it.is_code
                            && !it.is_escaped
                            && (c === "," || c === ";")
                        ) {
                            if (key) {
                                let end = it.pos;
                                let first = input.charAt(value_start);
                                if (
                                    // strip quotes.
                                    (first === "'" || first === '"' || first === "`")
                                    && first === input.charAt(it.pos - 1)
                                ) { ++value_start; --end; }
                                parsed[key] = it.slice(value_start, end);
                            }
                            key_start = it.pos + 1;
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
                                        : this._cast(query, parsed[key], value_type, command)
                            } else {
                                map?.set(
                                    key_type === "string" ? key : this._cast(query, key, key_type as Cast.Type, command),
                                    value_type.length === 1 && value_type[0] === "string"
                                        ? parsed[key]
                                        : this._cast(query, parsed[key], value_type, command)
                                );
                            }
                        });
                        return { status: "success", value: (map ?? record) as Casted, query };
                    }
                    return { status: "success", value: parsed as Casted, query };
                }
            default:
                // @ts-expect-error
                throw this.error(`Unsupported cast type "${type.toString()}".`, command);
        }
    }

    /** Cast types. */
    private _cast<A extends Arg.Base = Arg.Base>(
        query: A,
        value: string,
        type: Cast.Castable,
        // optionally, when casting for args from a command, pass the command for more detailed error messages.
        command: undefined | BaseCommand<S>,
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
    private add_info<I extends Info>(
        info: I,
        // optionally, when casting for args from a command, pass the command for more detailed error messages.
        command: undefined | BaseCommand<S>,
    ): I {

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
                throw this.error(`Argument "${query.identifier()}" must be one of the following enumerated values [${joined}].`, { command });
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
        // optionally, when casting for args from a command, pass the command for more detailed error messages.
        command: undefined | BaseCommand<S>,
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
            if (name.length === 0) { throw this.error("Cannot insert an empty name array.", { command }); }
            else if (name.length === 1) {
                const id = name[0] // (typeof name[0] === "string" ? name[0] : name[0][0])
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[id] = value;
            } else {
                const first = name[0] // (typeof name[0] === "string" ? name[0] : name[0][0])
                    .replace(/^-+/, ""); // remove leading dashes.
                parent[first] ??= {};
                this.add_to_cmd_args(cmd_args, name.slice(1) as And, value, parent[first], command);
            }
        } else if (Array.isArray(name)) {
            const id = name[0]
                .replace(/^-+/, ""); // remove leading dashes.
            parent[id] = value;
        } else {
            parent[name.replace(/^-+/, "")] = value;
        }
    }

    /** Parse an `args` object from a list of `Arg.Command` instances. */
    private async parse_args(
        cmd_args: Arg.Command<S>[],
        args_start_index: number,
        command: undefined | BaseCommand<S>,
    ): Promise<Record<string, any>> {
        const args: Record<string, any> = {};
        if (cmd_args.length) {
            for (const arg of cmd_args) {
                try {
                    if (!arg.arg_name) { throw this.error(`Argument is not initialized: ${arg}`, { command }); }
                    if (log.on(2)) log("Parsing argument ", and_or_str(arg.id));

                    // Type bool.
                    if (arg.type === "boolean") {
                        if (!arg.id) {
                            throw this.error(`Argument "${arg.arg_name}" is not initialized with an id, this is required for boolean types.`, { command });
                        }
                        this.add_to_cmd_args(args, arg.arg_name, this.has(arg.id), args, command);
                    }
                    // Get and cast.
                    else {
                        const { status, value } = this.info(arg, args_start_index, command);
                        if (log.on(2)) log("Argument info ", and_or_str(arg.id), ": ", { status, value });

                        if (status === "not_found" && arg.required) {
                            throw this.error(`Required argument "${and_or_str(arg.arg_name)}" was not found`, { command });
                        }
                        else if (status === "success" || status === "default") {
                            this.add_to_cmd_args(args, arg.arg_name, value, args, command);
                        }
                    }
                } catch (error: any) {
                    if (error instanceof CLIError) { throw error; }
                    throw this.error(
                        `Encountered an error while parsing argument "${arg.identifier()}" from command "${command?.identifier()}".`,
                        { error, command },
                    );
                }
            }
        }
        return args;
    }

    /** Run a command. */
    private async run_command(
        command: BaseCommand<S>,
        args_start_index: number = 0,
    ): Promise<void> { 

        // Get arguments.
        const cmd_args: Record<string, any> = await this.parse_args(
            command.args ?? [],
            args_start_index,
            command
        );

        // Call the callback.
        try {
            await Promise.resolve(command.callback(cmd_args, this));
        } catch (error: any) {
            if (error instanceof CLIError) { throw error; }
            if (log.on(1)) {
                throw this.error(
                    `Encountered an error while executing cli command "${command.identifier()}".`,
                    { error, command },
                );
            }
            Error.stackTraceLimit = 25;
            throw error;
        }
    }

    /** Find the index of an argument / command. */
    private find_arg(
        arg: Arg.Base | Command,
        /** The start index to search from. */
        start_index: number = 0,
    ): {
        /** Indicator if the item was found. */ 
        found: boolean,
        /** Indicator if the input arg was a boolean type, so it doesnt have a value, instead use `found` as its value. */
        is_boolean: boolean,
        /**
         * The index in argv of the matched arg identifier / index etc.
         * This attribute is defined when a match was found.
         */
        index?: number,
        /** The index of the found value, not always present. */
        value_index?: number;
    } & (
        | { found: true, index: number }
        | { found: false, index?: never }
    ) {
        if (log.on(3)) log("Finding argument ", arg);

        // The output indexes.
        let index: number | undefined = undefined;
        let value_index: number | undefined = undefined;

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
        else if (
            arg.id instanceof Or
            && arg.id.some(i => this.argv_set.has(i)) // fast lookup
        ) {
            if ((index = arg.id.match(this.argv, start_index)) != null) {
                index = index;
                value_index = index + 1; // next index is the value.
            }
        }
        
        // Single string id.
        else if (
            typeof arg.id === "string"
            && this.argv_set.has(arg.id)
        ) {
            index = this.argv.indexOf(arg.id as string, 10);
            if (index !== -1) {
                value_index = index  + 1; // next index is the value.
            }
        }

        if (log.on(3)) log("Initially found indexes ", {index, value_index});

        // Reset index.
        if (index === -1) { index = undefined; }

        // Is boolean.
        if (is_boolean) {
            if (index == null) { return { found: false, index, is_boolean }; }
            return { found: true, index, is_boolean };
        }

        // Check value.
        let value: string | undefined;
        if (
            index == null 
            || value_index == null
            || value_index === -1
            || value_index >= this.argv.length
            || (value = this.argv[value_index]) === undefined
            || (exclude_dash && value.charAt(0) === "-")
        ) {
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
        if (index == null) { return { found: false, index, is_boolean, value_index }; }
        return { found: true, index, is_boolean, value_index };
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
        // optionally, when casting for args from a command, pass the command for more detailed error messages.
        _command?: BaseCommand<S>,
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
                    value: def as any,
                    query
                }, _command)
            }
            return this.add_info({
                status: "success",
                value: found as any,
                query
            }, _command)
        }
        if (value_index != null && this.argv[value_index] !== undefined) {
            const value = this.argv[value_index];
            if (value === undefined) {
                if (def !== Arg.NoDef) {
                    return this.add_info({
                        status: "default",
                        value: def as any,
                        query,
                    }, _command);
                }
                return this.add_info({
                    status: "not_found",
                    error: `Not a valid value found for argument "${and_or_str(id)}".`,
                    query
                }, _command);
            }
            return this.add_info(this._cast(query as any, value, type, _command), _command)
        }
        if (def !== Arg.NoDef) {
            return this.add_info({
                status: "default",
                value: def as any,
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
                    throw this.error(
                        `Required argument "${and_or_str(res.query.id ?? res.query.index)}" was not found.`,
                        { docs: true }
                    );
                } else {
                    return undefined as Res;
                }
            }
            throw this.error(res.error);
        }
        return res.value as Res;
    }

    /**
     * Create a CLI error.
     * This error is specially handled by the CLI when executing a command.
     * Therefore it will be dumped pretty when thrown inside a command.
     */
    error(err: string | CLIError, opts?: {
        docs?: true | string, // show docs (boolean) or raw docs input (string), defaults to `false`.
        id?: string, // an optional identifier for the error, only used when the error is logged to the console.
        error?: Error // an optionally nested error rethrown as a CLI error
        command?: BaseCommand<S>, // the command that caused the error, used for more detailed error messages.
    }): CLIError {

        // Already an CLI error.
        if (err instanceof CLIError) { return err; }

        // Set opts.
        if (opts) {
            opts.id ??= opts.command ? `${this.name}:${opts.command.identifier()}` : this.name
            if (opts.docs === true) {
                opts.docs = opts.command ? this.docs(opts.command, false) : this.docs(undefined, false)
            }
        }

        // Create error.
        return new CLIError(err, opts as ConstructorParameters<typeof CLIError>[1]);
    }


    /**
     * Log the docs, optionally of an array of command or a single command.
     * Internally the indent size is set to argument `--docs-indent-size` which defaults to 2.
     * So this is available through the `$ mycli --help --docs-indent-size 4` help command.
     * 
     * @docs
     */
    docs(command?: BaseCommand<S>, dump: boolean = true): string {
        
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
        const indent_size = this.get({ id: "--docs-indent-size", def: 2 });
        const indent = " ".repeat(indent_size);

        /** Add an array of keys and values to the docs with the correct whitespace indent. */
        const add_align_entries = (list: [string, string][]) => {
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
        }

        /** Wrapper func to add command arguments to a list. */
        const add_cmd_args = (
            list: [string, string][],
            indent = "    ",
            args: BaseCommand<S>['args'],
        ) => {
            let real_index = 0;
            args.forEach((arg) => {
                if (arg.ignore === true) {
                    return;
                }
                const list_item: [string, string] = ["", ""];
                if (arg.id == null) {
                    list_item[0] = `${indent}argument ${real_index}`;
                } else {
                    list_item[0] = `${indent}${and_or_str(arg.id)}`;
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
        }

        // Show the entire docs.
        if (command == null) {

            // Description.
            if (this.description) {
                docs += `\nDescription:\n    ${this.description.split("\n").join("\n    ")}\n`;
            }

            // Usage.
            docs += `Usage: $ ${this.name} [mode] [options]\n`;

            // List for main+commands+options
            const list: [string, string][] = [];

            // Main.
            if (this._main) {
                list.push([`\nMain command:`, "\n"]);
                add_cmd_args(list, indent, this._main.args);
                list.push(["\nCommands:", "\n"]);
            }

            // Commands.
            this.commands.walk((command) => {
                list.push([
                    `${indent}${and_or_str(command.id ?? "<main>")}`,
                    (command.description ?? "") + "\n"
                ]);
                if (command.args?.length) {
                    add_cmd_args(list, " ".repeat(indent_size * 2), command.args);
                }
            });
            list.push([
                `${indent}--help, -h`,
                "Show the overall documentation or when used in combination with a command, show the documentation for a certain command.\n"
            ]);

            // Options.
            if (this.option_args?.length) {
                list.push([`\nOptions:`, "\n"]);
                add_cmd_args(list, indent, this.option_args);
            }
            
            // Add list.
            add_align_entries(list);
            list.length = 0;

            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.slice(0, -1);
            }

            // Notes.
            if (this.notes && this.notes.length > 0) {
                docs += `\n\nNotes:\n`;
                this.notes.forEach((note) => {
                    docs += `${indent}- ${note}\n`;
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
            docs += `Usage: $ ${this.name} ${and_or_str(command.id ?? `<main>`)} [options]\n`;

            // Description.
            if (command.description) {
                docs += `\n${command.description}\n`;
            }

            // Arguments.
            if (command?.args?.length) {
                docs += `\nOptions:\n`;
                const list: [string, string][] = [];
                add_cmd_args(list, indent, command.args);
                add_align_entries(list);
            }

            // Examples.
            if (command.examples?.length) {
                docs += `\nExamples:\n`;
                if (typeof command.examples === "string") {
                    docs += `${indent}${Colors.italic}${command.examples.startsWith("$") ? "" : "$ "}${command.examples}${Colors.end}\n`;
                }
                else if (Array.isArray(command.examples)) {
                    command.examples.forEach((item) => {
                        docs += `${indent}${Colors.italic}${item.startsWith("$") ? "" : "$ "}${item}${Colors.end}\n`;
                    });
                }
                else {
                    const list: [string, string][] = [];
                    Object.entries(command.examples).forEach(([desc, example]) => {
                        list.push([
                            `${indent}${desc.trimEnd()}:`,
                            `${Colors.italic}${example.startsWith("$") ? "" : "$ "}${example}${Colors.end}\n`
                        ]);
                    });
                    add_align_entries(list);
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
    main<const A extends Command.Args<S> = Command.Args<S>>(
        main: Main.Opts<S, Main.Variant, A>
    ): this {
        if (this._main) {
            throw this.error("Main command already set.");
        }
        this._main = (main instanceof Main ? main : new Main<S, Main.Variant, A>(main, this.strict)) as Main<S>;
        this._main.init(this);
        if (log.on(3)) log("Added main command: ", this._main);
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
        c.init(this);
        this.commands.push(c);
        if (log.on(2)) log("Added command: ", c);
        return this;
    }

    /**
     * Start the cli.
     * 
     * @libris
     */
    async start(): Promise<void> {
        try {

            // Vars.
            const help = this.has(["-h", "--help"]);
            let matched = false;

            // Check unknown args in strict mode.
            if (log.on(2)) log("Starting CLI.");
            if (this.strict) {
                this._check_unknown_args();
            }

            // Run commands in separate visits.
            const max_visit = 1; // including the max, so `<=`.
            const run_commands = (
                visit: number = 0,
            ): Promise<void> | true | undefined => {
                for (const command of this.commands) {

                    // Only process `AND` identifiers in the first visit.
                    // These precedence over `OR` or single identifiers.
                    // This is the most logical behaviour since the user expects a uniue pattern match.
                    // @warning never change this behaviour.
                    if (visit === 0 && command.id instanceof And === false) {
                        continue;
                    }

                    // Check if the arg is present.
                    if (log.on(2)) log("Checking command ", and_or_str(command.id));
                    const found_index = this.find_arg(command).index;
                    if (found_index != null) {
                        if (log.on(2)) log("Executing command ", and_or_str(command.id));
                        if (help) { this.docs(command); return true; }
                        return this.run_command(command, found_index);
                    }
                }
            }
            for (let visit = 0; visit <= max_visit; ++visit) {
                const promise = run_commands(visit);
                if (promise === true) {
                    matched = true;
                    break;
                }
                else if (promise) {
                    await promise;
                    matched = true;
                    break;
                }
            }

            // Run commands.
            if (log.on(2)) log("Running commands.");

            // Show help.
            if (log.on(2)) log("Matched command: ", matched);
            if (!matched && help) {
                this.docs();
                return;
            }

            // Show main command.
            if (!matched && this._main) {
                if (log.on(2)) log("Checking main command.");
                if (help) { this.docs(this._main); return; }
                if (
                    this._main.args
                    && !this._main.args.every(x => !x.required)
                    // @todo this should exclude ids that are also present in the main command args.
                    && !this._main.args.some(x => x.variant === "id" && x.id && this.has(x.id)) // ensure some of the main args are present
                ) {
                    // Ensure any of the args are found, if not then its likely not the main command.
                    throw this.error("Invalid mode, not main.", { docs: true });
                }
                if (log.on(2)) log("Executing main command.");
                await this.run_command(this._main);
                matched = true;
            }

            // Show default docs.
            if (!matched) {
                throw this.error("Invalid mode.", { docs: true });
            }

            if (log.on(2)) log("CLI run finished");
        } catch (e: any) {
            if (e instanceof CLIError) {
                e.dump();
                process.exit(1);
            }
            if (e instanceof Error) {
                console.error(e.stack?.replace(": ", Colors.end + ": ") ?? e);
                for (const key of Object.keys(e)) {
                    if (key === "stack" || key === "name" || key === "message") continue; // skip stack.
                    console.error(
                        `    ${Colors.cyan}${key}${Colors.end}: ` +
                        ObjectUtils.stringify(e[key], {
                            colored: true,
                            max_depth: 3,
                            start_indent: typeof e[key] === "object" && e[key]
                                ? 1
                                : 0
                        })
                    );
                }
            } else {
                console.error(e);
            }
            process.exit(1);
        }
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


