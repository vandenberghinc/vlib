/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { CodeIterator } from '../code/iterator.js';
import { Scheme } from '../scheme/scheme.js';
import { Colors } from '../system/colors.js';
import { Path } from '../system/path.js';
import { Merge, StringLiteral, ArrayLiteral } from '../global/types.js';

/**
 * The base type for a cast res, excluding undefined.
 */
type CastBase = CLI.Arg.Type | CLI.Arg.Type[];

/**
 * Cast a type name or type names union to its corresponding value type.
 * Also supports already casted value types as input.
 */
type CastedValue<T extends undefined | CastBase | CLI.Arg.ValueType> =
    T extends CLI.Arg.Type[]
    ? CLI.Arg.Types[T[number]]
    : T extends CLI.Arg.Type
        ? CLI.Arg.Types[T]
        : T extends undefined | null
            ? string // undefined is treated as string
            // : T extends CLI.Arg.ValueType
            //     ? T
                : never;

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
    private description: string | null;

    /** The CLI version. */
    private version: string | null;
    
    /** The main command for when no specific command is detected. */
    private main?: CLI.Command;

    /** The list of commands. */
    private commands: CLI.Command[];

    /** The notes. */
    private notes: string[] | null;

    /** The argc start index. */
    private start_index: number;

    /** The argv map. */
    private argv_map: Set<string> = new Set(process.argv);

    /** Argv info map. */
    private argv_info: Map<string, Omit<CLI.Get.Res, "def">> = new Map();

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
            description = null,
            version = null,
            notes = null,
            main,
            commands = [],
            start_index = 2,
        }: {
            name?: string;
            description?: string | null;
            version?: string | null;
            notes?: string[] | null;
            commands?: (Omit<CLI.Command, "id"> & { id: CLI.Query })[];
            main?: Omit<CLI.Command, "id">;
            start_index?: number;
        } = {}
    ) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.commands = commands.map(CLI.Command.init);
        this.main = main ? {...main, id: new CLI.Query.Or("__main__") } : undefined;
        this.notes = notes;
        this.start_index = start_index;
        this._init();
    }

    /** 
     * Initialize the CLI.
     * 
     * 1) Adds a --version, -v command.
     */
    private _init() {

        /** Add --version command. */
        const query = new CLI.Query.Or("--version", "-v");
        if (this.version != null && !this.commands.some(cmd => CLI.Query.match(cmd.id, query))) {
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
    private _cast_single_error(value: any, type: CastBase): string {
        return `Unable to cast "${value}" of type "${Scheme.value_type(value)}" to type "${
            Array.isArray(type) ? type.join(" | ") : type
        }".`;
    }

    /**
     * Cast a single type with info options.
     */
    private _cast_single<T extends CLI.Arg.Type>(input: string, type: T): CLI.Get.Res<T> {
        // Handle string.
        let value: any;
        switch (type) {
            case "string":
                return { found: true, value: input } as CLI.Get.Res<T>;
            case "number": {
                const value = Scheme.cast_number(input, { strict: true, preserve: true });
                if (typeof value === "string") {
                    return { found: true, error: this._cast_single_error(input, type) }
                }
                return { found: true, value } as CLI.Get.Res<T>;
            }
            case "boolean":
                value = Scheme.cast_bool(input, { preserve: true });
                if (typeof value === "string") {
                    return { found: true, error: this._cast_single_error(input, type) };
                }
                return { found: true, value } as CLI.Get.Res<T>;

            // Array.
            case "array":
            case "string[]": case "boolean[]": case "number[]":
            {
                const out = Array.isArray(input) ? input : input.split(",");
                const value_type = type === "array"
                    ? "string"
                    : type.slice(0, -2) as CLI.Arg.Type;
                const value_types = value_type.split("|") as CLI.Arg.Type[];
                if (value_types.length === 1 && value_types[0] === "string") {
                    return { found: true, value: out } as CLI.Get.Res<T>;
                } else {
                    const res = out.map(item => this._cast(item, value_types));
                    if (res.some(r => r.error)) {
                        return { found: true, error: this._cast_single_error(input, type) };
                    }
                    return { found: true, value: res.map(r => r.value) } as CLI.Get.Res<T>
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
                        throw Error(`Unable to cast "${Scheme.value_type(input)}" to an "object".`);
                    }
                    let key: string | undefined;
                    let key_start = 0, value_start = 0;
                    let mode: "key" | "value" = "key";
                    const parsed: Record<string, string> = {};
                    new CodeIterator(input, { string: ["'", '"', '`'] }, (state, it) => {
                        const c = it.char();
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
                            && !it.is_excluded()
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
                        const value_type = type.slice(7 + key_type.length + 2, -1).split("|") as CLI.Arg.Type[];
                        const casted = new Map<any, any>();
                        Object.keys(parsed).walk(key => {
                            casted.set(
                                key_type === "string" ? key : this._cast(key, key_type as CLI.Arg.Type),
                                value_type.length === 1 && value_type[0] === "string"
                                    ? parsed[key]
                                    : this._cast(parsed[key], value_type)
                            );
                        });
                        return { found: true, value: casted } as CLI.Get.Res<T>;
                    }
                    return { found: true, value: parsed } as CLI.Get.Res<T>;
                }
            default:
                // @ts-expect-error
                throw Error(`Unsupported cast type "${type.toString()}".`);
        }
    }

    /** Cast types. */
    private _cast<T extends CastBase>(value: string, type: T): CLI.Get.Res<T> {
        
        // Handle undefined.
        if (type == null) {
            return { found: true, value: undefined } as CLI.Get.Res<T>;
        } else if (type == "string") {
            return { found: true, value: value } as CLI.Get.Res<T>;
        }

        // Handle OR operation.
        if (Array.isArray(type)) {
            for (const t of type) {
                const res = this._cast_single(value, t as CLI.Arg.Type) as CLI.Get.Res<T>;
                if (!res.error) { return res; }
            }
            return { found: true, error: this._cast_single_error(value, type) };
        }

        // Handle single type.
        return this._cast_single(value, type) as CLI.Get.Res<T>;
    }
    
    /** Run a command. */
    private async _run_command(command: CLI.Command) {

        // Get arguments.
        const callback_args: Record<string, any> = { _command: command };
        let arg_index = 0;

        for (const arg of command.args) {
            try {
                // Convert arg id name.
                if (arg.id == null) {
                    /** @note legacy was optional, now the name must be defined, index just precedes the name in get(). */
                    throw new Error(`Argument id is not defined for argument ${arg_index}.`);
                }
                let id_name: string;
                let child: string | any[] = arg.id
                while (true) {
                    if (Array.isArray(child)) {
                        child = child[0];
                    } else { break; }
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

                // Type bool.
                if (arg.type === "boolean") {
                    callback_args[id_name] = this.present(arg.id);
                }
                // Get and cast.
                else {
                    // Build get options to satisfy overloads
                    const { found, value } = this.get({
                        id: arg.id,
                        def: undefined,
                        type: arg.type ?? "string",
                        index: arg_index,
                    });
                    if (found === false && arg.required === true) {
                        throw new Error(`Define parameter "${arg.id}".`);
                    }
                    if (found === true && value == null && arg.default !== undefined) {
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

        // Call the callback.
        try {
            await Promise.resolve(command.callback(callback_args));
        } catch (err) {
            this.docs(command);
            this.error(err);
            process.exit(1);
        }
    }

    /**
     * Get an argument.
     * See {@link CLI.Get.Opts} for option information.
     * @libris
     */
    get<T extends CastBase>(opts: Merge<CLI.Get.Opts<T>, { type: T }>): CLI.Get.Res<T>;
    get<T extends undefined>(opts: StringLiteral<string> | ArrayLiteral<string[]> | Merge<CLI.Get.Opts, { type?: T }>): CLI.Get.Res<string>;
    get<T extends undefined | CastBase>(o: StringLiteral<string> | ArrayLiteral<string[]> | CLI.Get.Opts<T>): CLI.Get.Res
    {

        // Initialize args.
        const opts: CLI.Get.Opts<T> = typeof o === "string" || Array.isArray(o)
            ? { id: o, type: "string" as T, def: undefined, exclude_dash: true }
            : o;
        if (opts.type == null) {
            opts.type ??= "string" as T;
        }
        opts.exclude_dash ??= true;
        
        // Check args.
        if (!opts.id && opts.index == null) {
            this.throw("Either parameter 'id' or 'index' must be defined.");
        }

        // Load info.
        const info = this.info(opts as Merge<CLI.Get.Opts<T>, { type: T }>);
        if (!info.found) {
            return { ...info, value: opts.def } as CLI.Get.Res;
        }
        return info;
    }

    /**
     * Get info.
     */
    info<T extends CastBase>(opts: CLI.Get.Opts<T>): CLI.Get.Res<T> {
        const { id, index, type = "string", def, exclude_dash = true } = opts;

        // Check cache.
        const cache_id = `${opts.id ?? opts.index ?? ""}-${opts.type}`;
        if (this.argv_info.has(cache_id)) {
            return this.argv_info.get(cache_id) as CLI.Get.Res<T>;
        }
        const add = (info: CLI.Get.Res<T>): CLI.Get.Res<T> => {
            this.argv_info.set(cache_id, info);
            // console.log("Result:", info)
            return info
        };
        // console.log(`Searching for id="${id ? CLI.Query.to_str(id) : undefined}" index=${index} with type "${type}"...`);

        /**
         * Search by index.
         * @warning This must precede over search by id, since the id is now always required.
         */
        if (index != null && id == null) {
            const value = process.argv[this.start_index + index];
            if (value === undefined) {
                return add({ found: false, error: `There is no argument at index "${index}".` });
            }
            return add(this._cast<T>(value, type as T));
        }

        // Search by id.
        const is_array = Array.isArray(id);
        for (let i = this.start_index; i < process.argv.length; i++) {
            if (
                (is_array && id?.includes(process.argv[i]))
                || (!is_array && process.argv[i] === id)
            ) {
                const value = process.argv[i + 1];
                if (value === undefined || (true && value.charAt(0) === "-")) { // exclude_dash
                    return add({ found: false, error: `No value found for argument "${CLI.Query.to_str(id)}".` });
                }
                return add(this._cast(value, type as T));
            }
        }
        return add({ found: false, error: `No value found for argument "${CLI.Query.to_str(id ?? "undefined")}".` });
    }

    /**
     * Check if an argument is present.
     * @libris
     */
    present(id: CLI.Query): boolean {
        if (id instanceof CLI.Query.And) {
            return id.every(i => this.present(i));
        } else if (id instanceof CLI.Query.Or || Array.isArray(id)) {
            return id.some(i => this.present(i));
        } else {
            return this.argv_map.has(id);
        }
    }

    /**
     * Log an error.
     * @libris
     */
    error(...err: any[]): void {
        let str = "";
        err.forEach(e => {
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
        // str = str.replace(
        //     // make linkgs clickable.
        //     /\((.*):(\d+):(\d+)\)/g, 
        //     (_, file, line, col) => {
        //         const sublPath = `subl://open?url=file://${file}&line=${line}`;
        //         return `(\x1b]8;;${sublPath}\x07${file} - ${new Path(file).name()}:${line}\x1b]8;;\x07)`;
        //     }
        //     // (_, file, line, col) => `(\x1b]8;;${file.replaceAll("file://","")}:${line}\x07${file.replaceAll("file://","")}:${line}\x1b]8;;\x07)`
        //     // (_, file, line, col) => `X`
        // );
        console.error(`${Colors.red}Error${Colors.end}: ${str}`);
    }

    /**
     * Throw an error and stop with exit code 1.
     * @libris
     */
    throw(...err: any[]): never {
        this.error(...err);
        process.exit(1);
    }
    throw_error(...err: any[]): never {
        this.error(...err);
        process.exit(1);
    }
    throw_err(...err: any[]): never {
        this.error(...err);
        process.exit(1);
    }

    /**
     * Log the docs, optionally of an array of command or a single command.
     * @libris
     */
    docs(command_or_commands: CLI.Command | CLI.Command[] | null = null): void {
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
                list_item[0] = `    ${CLI.Query.to_str(command.id)}`;
                list_item[1] = (command.description ?? "") + "\n";
                list.push(list_item);

                // Add command args.
                if (command.args.length > 0) {
                    let arg_index = 0;
                    command.args.forEach((arg) => {
                        if (arg.ignore === true) {
                            return;
                        }
                        const list_item: [string, string] = ["", ""];
                        if (arg.id == null) {
                            list_item[0] = `        argument ${arg_index}`;
                        } else {
                            list_item[0] = `        ${CLI.Query.to_str(arg.id)}`;
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
            docs += `Usage: $ ${this.name} ${CLI.Query.to_str(command_or_commands.id)} [options]\n`;

            // Description.
            if (command_or_commands.description) {
                docs += `\n${command_or_commands.description}\n`;
            }

            // Arguments.
            if (command_or_commands.args.length > 0) {
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

    /**
     * Start the cli.
     * @libris
     */
    async start(): Promise<boolean> {
        const help = this.present(["-h", "--help"]);
        let matched = false;

        for (const command of this.commands) {
            if (
                this.present(command.id)
                // (command.id instanceof CLI.And || command.id instanceof CLI.Or)
                // ? command.id.match(id => this.present(id))
                // : this.present(command.id)
            ) {
                // console.log(`Running main command: ${CLI.Query.to_str(command.id)}`);
                if (help) {
                    // show command help.
                    this.docs(command);
                    return true;
                }
                await this._run_command(command);
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
            if (!this.main.args.some(x => x.id == null || this.present(x.id))) {
                // Ensure any of the args are found, if not then its likely not the main command.
                this.docs();
                this.error("Invalid mode.");
                return false;
            }
            await this._run_command(this.main);
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

    // --------------------------------------------------------------------------------
    // Static methods

    static _cli: CLI | undefined;

    /**
     * Get an argument.
     * See {@link CLI.Get.Opts} for option information.
     * @libris
     */
    static get<T extends CastBase>(opts: Merge<CLI.Get.Opts, { type: T }>): CLI.Get.Res<T>["value"];
    static get<T extends undefined>(opts: StringLiteral<string> | ArrayLiteral<string[]> | Merge<CLI.Get.Opts, { type?: T }>): CLI.Get.Res<string>["value"];
    static get<T extends undefined | CastBase>(opts: StringLiteral<string> | ArrayLiteral<string[]> | CLI.Get.Opts<T>): CLI.Get.Res["value"]
    {
        if (CLI._cli === undefined) { CLI._cli = new CLI(); }
        return CLI._cli.get(opts as any).value;
    }

    /**
     * Check if an argument is present.
     * @libris
     */
    static present(id: Parameters<typeof CLI.prototype.present>[0]): boolean {
        if (CLI._cli === undefined) { CLI._cli = new CLI(); }
        return CLI._cli.present(id);
    }
}
export default CLI;

/**
 * CLI types.
 */
export namespace CLI {

    /** CLI.get types. */
    export namespace Get {
        
        /**
         * Argument options for {@link CLI.get}.
         * 
         * @attr id The identifier query. Note that the first encountered identifier will be used for the callback argument name. Also required for index arguments, then just define a plain string to inidcate the callback argument name.
         * @attr index The index of the argument to get. This option precedes the id option. Also this ignores the `exclude_dash` option, since it is only used for non-index arguments.
         * @attr type The type to cast the argument to, if not defined the argument is returned as is.
         * @attr def The default value to return when the argument is not found.
         * @attr exclude_dash Whether to exclude values that start with a dash (-) when searching for a non index argument, defaults to true.
         * 
         * @libris
         */
        export interface Opts<T extends undefined | CastBase = CastBase> {
            id: string | string[] | CLI.Query.Or<string>;
            index?: number;
            type?: T;
            def?: CastedValue<T>;
            exclude_dash?: boolean;
        }
        export type NoTypeOpts = Merge<Opts, { type?: undefined; }>;
        
        /**
         * Alias for type casts.
         * Also supports already casted value types as input.
         */
        export type Res<T extends CastBase | CLI.Arg.ValueType = CastBase | CLI.Arg.ValueType> =
            | { found: boolean; error: string; value?: undefined; }
            | { found: true; error?: undefined; value: CastedValue<T> };
    }

    // --------------------------------------------------------------------------------
    // Command types.

    /** Command options. */
    export interface Command<
        Args extends readonly Command.ArgDef<string, CLI.Arg.Type | CLI.Arg.Type[]>[] = Command.ArgDef<string, any>[]
    > {
        id: Command.Id;
        description?: string;
        examples?: string | string[] | { [key: string]: string; };
        args: Arg[];
        callback: (args: Command.InferArgs<Args>) => void | Promise<void>;
    }

    /** Command types. */
    export namespace Command {

        /** Identifier type. */
        export type Id = Query.And | Query.Or;

        /** Initialize a query to an id. */
        export const id = (query: Query): Id => query instanceof Query.Or || query instanceof Query.And
            ? query
            : typeof query === "string"
                ? new Query.Or(query)
                : new Query.Or(...query)

        /** Assert an id, updates the object in place. */
        export const init = <T extends { id: Query }>(obj: & T): Omit<T, "id"> & { id: Id } => ({
            ...obj,
            id: id(obj.id),
        });

        // 1) Define a literal-based ArgDef
        export interface ArgDef<Name extends string, T extends CastBase> {
            id: Name;
            type: T;
        }

        /**
         * Turn a tuple of ArgDef<Name, Type> into
         * a mapping from Name to the correctly-casted value.
         */
        export type InferArgs<Arr extends readonly ArgDef<string, CastBase>[]> = {
            [P in Arr[number] as P["id"]]:
                // If P["type"] is an array of types, infer U and ensure it's a valid Arg.Type
                P["type"] extends readonly (infer U)[]
                    ? U extends CLI.Arg.Type
                        ? CastedValue<U>
                        : never
                    // Otherwise, it's a single CLI.Arg.Type
                    : P["type"] extends CLI.Arg.Type
                        ? CastedValue<P["type"]>
                        : never
        };
  
    }

    // --------------------------------------------------------------------------------
    // Argument types.

    /** CLI argument type. */
    export interface Arg<V extends Arg.ValueType = Arg.ValueType> {
        id: Arg.Id;
        type?: Arg.Type | Arg.Type[];
        required?: boolean;
        default?: V;
        description?: string;
        ignore?: boolean;
    }

    /** Argument types. */
    export namespace Arg {
        
        /**
         * Argument identifier.
         */
        export type Id = string | string[] | Query.Or<string>;

        /**
         * All supported argument types.
         */
        export type Types = {
            /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */

            /** Primitive types. */
            string: string;
            number: number;
            boolean: boolean;

            /**
             * Arrays.
             * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
             */
            array: string[];
            "boolean[]": boolean[];
            "number[]": number[];
            "string[]": string[];

            /** Object.s */
            object: Record<string, any>;

            /** Maps. */
            "string:boolean": Map<string, boolean>;
            "string:number": Map<string, number>;
            "string:string": Map<string, string>;

            "string:boolean|number|string": Map<string, boolean | number | string>;
            "string:boolean|number": Map<string, boolean|number>;
            "string:boolean|string": Map<string, boolean|string>;
            "string:number|string": Map<string, number|string>;

            "string:boolean|number|string|array": Map<string, boolean | number | string | string[]>;

            "number:boolean": Map<number, number>;
            "number:number": Map<number, number>;
            "number:string": Map<number, string>;



        };

        /**
         * Argument string types.
         */
        export type Type = keyof Types;

        /**
         * Argument string types.
         */
        export type ValueType = Types[Type];
    }

    // --------------------------------------------------------------------------------
    // Identifier query types.

    /** Identifier query type. */
    export type Query = Query.And | Query.Or | string | string[];

    /** CLI.Query types. */
    export namespace Query {

        /**
         * And operation for argument identifiers.
         */
        export class And<T = string | Or> extends Array<T> {
            constructor(...args: T[]) { super(...args); }
            match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean {
                return this.every(fn);
            }
        }
        export namespace And {
            export const is = (x: any): x is And => x instanceof And;
        }

        /**
         * Or operation for argument identifiers.
         * A nested string[] is considered as another OR operation.
         */
        export class Or<T = string> extends Array<T> {
            constructor(...args: T[]) { super(...args); }
            match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean {
                return this.some(fn);
            }
        }
        export namespace Or {
            export const is = (x: any): x is Or => x instanceof And === false && Array.isArray(x);
        }

        /**
         * Convert a query / identifier to a string.
         */
        export const to_str = (id: Query): string => id instanceof And
            ? id.map(to_str).join(" ")
            : Array.isArray(id)
                ? id.map(to_str).join(", ")
                : id;

        /**
         * Match identifier against a query.
         * @note only Supports Or<string> and And<string | string[]> queries.
         */
        export function match(id: Query, query: Query): boolean {
            if (id instanceof And) {
                return id.every((item, index) => {
                    if (typeof query === "string") { return match_str(item, query) }
                    const q = query[index];
                    return Array.isArray(q)
                        ? q.includes(item)
                        : match_str(item, q)
                });
            } else if (id instanceof Or || Array.isArray(id)) {
                return id.some(item => match_str(query, item));
            } else if (typeof id === "string") {
                return match_str(query, id);
            } else {
                // @ts-expect-error
                throw new Error(`Invalid query type: ${id.toString()}`);
            }
        }
        export function match_str(id: Query, query: string): boolean {
            if (id instanceof And) {
                return id.every(i => i === query);
            } else if (id instanceof Or) {
                return id.includes(query);
            } else if (Array.isArray(id)) {
                return id.includes(query);
            } else if (typeof query === "string") {
                return id === query;
            } else {
                // @ts-expect-error
                throw new Error(`Invalid query type: ${query.toString()}`);
            }
        }
    }
}

// Snake case compatibility.
export { CLI as cli };