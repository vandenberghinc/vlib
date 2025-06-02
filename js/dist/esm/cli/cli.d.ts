/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { And, Or } from './query.js';
import * as InferArgs from './infer_args.js';
import * as Arg from './arg.js';
import { Strict } from './arg.js';
import { Command, Main } from './command.js';
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
export declare class CLI<S extends Strict = Strict> {
    /** The CLI name. */
    private name;
    /** The CLI description for the usage docs. */
    private description?;
    /** The CLI version. */
    private version;
    /** The main command for when no specific command is detected. */
    private _main?;
    /** The list of commands. */
    private commands;
    /**
     * The list of global option arguments.
     * @todo not implemented yet.
     */
    private options;
    /** The notes. */
    private notes;
    /** The argc start index. */
    /** The argv set & map. */
    private argv;
    private argv_set;
    /** Argv info map. */
    private argv_info;
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
    constructor({ name, description, version, argv, // default start index is 2.
    notes, options, strict, _sys, }: {
        name?: string;
        description?: string;
        version?: string;
        notes?: string[];
        start_index?: number;
        argv?: string[];
        options?: Command.Opts<S>[];
        _sys?: boolean;
    } & Strict.If<S, "strict", {
        strict: "strict" extends S ? true : false;
    }, {
        strict?: "strict" extends S ? true : false;
    }>);
    /** Check unknown arguments. */
    private _check_unknown_args;
    /**
     * Check if a command with an id query exists.
     */
    private _has_id_command;
    /**
     * Initialize the CLI.
     *
     * 1) Adds a --version, -v command.
     */
    private _init;
    /** Throw a cast single error. */
    private _cast_single_error;
    /**
     * Cast a single type with info options.
     */
    private _cast_single;
    /** Cast types. */
    private _cast;
    /** Wrapper function to add an info object and return the info for one line returns. */
    private add_info;
    private add_to_cmd_args;
    /** Run a command. */
    private run_command;
    /**
     * Find an argument's index by its id.
     * @libris
     */
    find_index(id: number | string | string[] | Or | And): number | undefined;
    /**
     * Check if an argument is present.
     * @libris
     */
    present(id: number | string | string[] | Or | And | Arg.Base): boolean;
    /**
     * {Info}
     *
     * Get info about an argument.
     *
     * @param q The argument query. See {@link Arg.Query} for information.
     *
     * @libris
     */
    info<const O extends Arg.Base | Arg.Base.Opts = Arg.Base.Opts<"loose", "query", Arg.Variant, "string">>(q: O | And | Or | string[] | string, _s_index?: number): Info<"success", Arg.Base.FromOpts<O>> | Info<"error", Arg.Base.FromOpts<O>>;
    /**
     * {Get}
     * Get an argument.
     * @param query The argument get options. See {@link Arg.Base} for option information.
     * @libris
     */
    get<const Q extends Arg.Base | Arg.Base.Opts = Arg.Base.Opts<"loose", "query", Arg.Variant, "string">>(query: Q | And | Or | string[] | string): InferArgs.IsOptional<Q> extends true ? undefined | InferArgs.ExtractArgValueType<Q, "string"> : InferArgs.ExtractArgValueType<Q, "string">;
    /**
     * Log an error.
     * @libris
     */
    error(...err: any[]): void;
    /**
     * Throw an error and stop with exit code 1.
     * @libris
     */
    throw(...err: any[]): never;
    /**
     * Log the docs, optionally of an array of command or a single command.
     *
     * @libris
     */
    docs(command_or_commands?: Main<S> | Command<S> | Command<S>[]): void;
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
    main<const A extends Command.Args<S> = Command.Args<S>>(main: Main.Opts<S, Main.Variant, A>): this;
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
    command<const A extends Command.Args<S> = Command.Args<S>>(cmd: Command.Opts<S, Command.Variant, A>): this;
    /**
     * Start the cli.
     *
     * @libris
     */
    start(): Promise<boolean>;
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
A extends Arg.Base | Arg.Base.Opts = Arg.Base> = 
/**
 * Error response.
 */
M extends "error" ? {
    error: string;
    status: "not_found" | "invalid_type" | "invalid_value";
    value?: never;
    query: A;
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
    value: InferArgs.IsOptional<A> extends true ? undefined | InferArgs.ExtractArgValueType<A, "string"> : InferArgs.ExtractArgValueType<A, "string">;
    /** The attached query. */
    query: A;
} : 
/** Invalid mode. */
never;
export declare namespace Info {
    /** The info mode. */
    type Mode = "error" | "success";
}
export declare const cli: CLI<Arg.Strict>;
/**
 * Get an argument.
 * @param query The argument get options. See {@link Arg.Base} for option information.
 * @libris
 */
export declare function get<const A extends Arg.Base | Arg.Base.Opts = Arg.Base.Opts<"loose", "query", Arg.Variant, "string">>(query: A | Or | string[] | string): InferArgs.IsOptional<A> extends true ? undefined | InferArgs.ExtractArgValueType<A, "string"> : InferArgs.ExtractArgValueType<A, "string">;
/**
 * Check if an argument is present.
 * @libris
 */
export declare function present(id: number | string | string[] | Or | And | Arg.Base): boolean;
