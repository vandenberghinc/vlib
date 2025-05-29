/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Command, Command as _Command } from './command.js';
import { Query, Query as _Query } from './query.js';
import { Arg, Arg as _Arg } from './arg.js';
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
export declare class CLI {
    /** The CLI name. */
    private name;
    /** The CLI description for the usage docs. */
    private description?;
    /** The CLI version. */
    private version;
    /** The main command for when no specific command is detected. */
    private main?;
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
    private start_index;
    /** The argv map. */
    private argv_map;
    /** Argv info map. */
    private argv_info;
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
    constructor({ name, main, commands, options, description, version, notes, start_index, _sys, }?: {
        name?: string;
        main?: Command.MainOpts;
        commands?: Command.IdOpts[];
        options?: Command.Arg<Arg.Variant, boolean>[];
        description?: string;
        version?: string;
        notes?: string[];
        start_index?: number;
        _sys?: boolean;
    });
    /**
     * Has command wrapper.
     * Does not check the main command.
     */
    private _has_command;
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
    /**
     * Check if an argument is present.
     * @libris
     */
    present(id: Query.Query | number): boolean;
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
    info<T extends Arg.Castable = "string", D extends Arg.Cast<T> = never>(arg: Arg<T, D>, opts?: {
        def?: boolean;
    }): CLI.Info<T, D> | CLI.Info.Error;
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
    get<T extends Arg.Castable = "string", D extends Arg.Cast<T> = never>(o: Arg<T, D>): CLI.Get.Res<T, D>;
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
    docs(command_or_commands?: Command | Command[] | null): void;
    private add_to_cmd_args;
    /** Run a command. */
    command(command: Command): Promise<true | undefined>;
    /**
     * Start the cli.
     *
     * @libris
     */
    start(): Promise<boolean>;
}
export declare const cli: CLI;
/**
 * CLI types.
 * @note We need to build the CLI module here.
 *       Due to conflicting names and re-exports of CLI class + creating a CLI namespace.
 */
export declare namespace CLI {
    /** CLI.get types. */
    namespace Get {
        /** Get response. */
        type Res<T extends Arg.Castable = "string", D extends Arg.Cast<T> = never> = [D] extends [never] ? Arg.Cast<T> | undefined : D;
    }
    /**
     * Info response.
     * @note that we use a `found` attribute to ensure robust checking instead of checkng if value is undefined, because that can happen while still returning a found value / default value.
     */
    type Info<T extends Arg.Castable = "string", D extends Arg.Cast<T> = never> = [
        D
    ] extends [never] ? {
        error?: never;
        found?: never;
        value?: never;
    } : Info.Error | {
        error?: never;
        found: false;
        value?: never;
    } | {
        error?: never;
        found: true;
        value: Arg.Cast<T>;
    };
    /** @variant */
    /** Info types. */
    namespace Info {
        /**
         * Error info response.
         * Keep it separate since its used separately in `CLI.x` methods.
         */
        type Error = {
            error: string;
            found?: never;
            value?: never;
        };
        /**
         * Any type of info response.
         */
        type Any<T extends Arg.Castable = Arg.Castable, D extends Arg.Cast<T> = Arg.Cast<T> | never> = Info<T, D>;
    }
    /**
     * Create module.
     */
    type Arg = _Arg;
    type Command = _Command;
    const Command: typeof _Command;
    const Query: typeof _Query;
}
