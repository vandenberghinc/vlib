/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { CLIError } from "./error.js";
import { And, Or } from "./query.js";
import { CLI } from "./cli.js";
import type { InferArgs } from "./infer_args.js";
import type { ExtractFlag, IfFlag } from "../types/flags.js";
import * as Arg from "./arg.js";
import { Strict } from "./arg.js";
/**
 * All variants, defaults to `id`.
 * @enum {"id"} For `id` based arguments, such as `--arg` or `-a`.
 * @enum {"index"} For positional index arguments, such as `arg_0`, `arg_1`, etc.
 */
export type Variant = "id" | "index";
export declare namespace Variant {
    /** Universal flag utilities after `T` is defined. */
    type T = Variant;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export {};
}
/**
 * The argument mode, defaults to `command`.
 * @enum {"command"}
 *      For CLI optional command such as `--help`, `--version`, etc.
 *      And also for global options of the CLI such as `--verbose`, `--debug`, etc.
 * @enum {"main"} For the main command, which is the root command of the CLI.
 */
export type Mode = "command" | "main";
export declare namespace Mode {
    /** Universal flag utilities after `T` is defined. */
    type T = Mode;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export {};
}
/**
 * Utility type for generic `A` command arguments.
 */
export type Args<S extends Strict> = readonly Arg.Command.Opts<S>[];
export declare namespace Base {
    /** Command constructor options. */
    type Opts<S extends Strict = Strict, M extends Mode = Mode, V extends Variant = Variant, A extends Args<S> = Args<S>> = ConstructorParameters<typeof Base<S, M, V, A>>[0];
}
/**
 * The base command class of derived command classes.
 * @note For instance when no Variant flag is set then never is used as id etc.
 *       This is fine because we let the derived classes handle the default variant and fixed mode.
 */
export declare abstract class Base<const S extends Strict = Strict, const M extends Mode = Mode, const V extends Variant = Variant, const A extends Args<S> = Args<S>> {
    /** The command mode. */
    mode: Mode.Extract<M>;
    /** The command variant. */
    variant: Variant.Extract<V>;
    /** The strict mode, when `true` some additional checks are performed. */
    strict: Strict.Cast<S>;
    /** The id attribute for the `id` variant. */
    id: Mode.If<M, "main", never, Variant.If<V, "id", Or | And>>;
    /**
     * The index number for the `index` variant.
     * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
     */
    index: Mode.If<M, "main", never, Variant.If<V, "index", number, never>>;
    /**
     * Description of the command for the CLI help.
     */
    description: string;
    /**
     * Command examples for the CLI help.
     */
    examples: string | string[] | {
        [key: string]: string;
    };
    /**
     * Callback function to execute when the command is invoked.
     * The argument types should automatically be inferred from the `args` definitions.
     * The command is bound to the Base instance, so `this` is the command instance.
     * @note That we dont infer the actual args here, this causes issues with converting matching Base types.
     *       Only infer on the user input callback so the user has the correct types.
     */
    callback: (args: Record<string, any>, cli: CLI<S>) => any | Promise<any>;
    /**
     * Command arguments.
     * This list of argument is also used to infer the callback argument types.
     */
    args: Arg.Command<S>[];
    /** The attached CLI. */
    private cli?;
    /**
     * Initialize a command object.
     * @param variant - The command variant, this can be auto detected or an expected variant type.
     * @param opts - The command options to initialize.
     * @throws An error when the the command input is invalid.
     */
    constructor(opts: Base<S, M, V, A> | ({
        description: Base["description"];
        examples?: Base["examples"];
        callback: (this: Base<S, M, V, A>, args: InferArgs<A>) => any | Promise<any>;
        args?: A;
    } & Mode.If<M, "main", 
    /** main/root command of the CLI, so no index nor id. */
    {
        id?: never;
        index?: never;
    }, Variant.If<V, "id", 
    /** identifier or query */
    {
        id: string | string[] | Or;
        index?: never;
    }, 
    /** positional index */
    {
        id?: never;
        index: number;
    }>>), mode: Mode.Extract<M>, strict: Strict.Cast<S>);
    /** Initialize the command and assign the `cli` attribute. */
    init(cli: CLI<S>): void;
    /**
     * Find a command by a query.
     */
    find(commands: readonly Arg.Command[], query: {
        id: string | string[] | And | Or;
    }): Arg.Command<Arg.Strict, Arg.Variant, import("./cast.js").Cast.Castable, readonly any[]> | undefined;
    /** Utility to check againt index. */
    eq_index(query: this["index"]): boolean;
    /** Check if the id attribute matches a certain query. */
    eq_id(query: any): any;
    /** Static helper method to check if the id attribute matches a certain query. */
    private static eq_id;
    /** Convert to a string identifier. */
    identifier(): string;
    /**
     * Throw an error for this command.
     * Wrapper function for `CLI.error`.
     */
    error(err: string | CLIError, opts?: Parameters<typeof CLI.prototype.error>[1]): CLIError;
}
type _Variant = Variant;
/**
 * Main command argument, used for the main CLI command.
 * Also ensure a default variant is set.
 */
export declare class Main<const S extends Strict = Strict, const V extends Variant = Variant, const A extends Args<S> = Args<S>> extends Base<S, "main", V, A> {
    constructor(opts: Base.Opts<S, "main", V, A>, strict: Strict.Cast<S>);
}
export declare namespace Main {
    type Variant = _Variant;
    type Opts<S extends Strict = Strict, V extends Variant = Variant, A extends Args<S> = Args<S>> = ConstructorParameters<typeof Main<S, V, A>>[0];
}
/**
 * A non main command.
 * Used as CLI commands.
 * Also ensure a default variant is set.
 */
export declare class Command<const S extends Strict = Strict, const V extends Variant = Variant, const A extends Args<S> = Args<S>> extends Base<S, "command", V, A> {
    constructor(opts: Base.Opts<S, "command", V, A>, strict: Strict.Cast<S>);
}
export declare namespace Command {
    type Variant = _Variant;
    type Opts<S extends Strict = Strict, V extends Variant = Variant, A extends Args<S> = Args<S>> = ConstructorParameters<typeof Command<S, V, A>>[0];
    /** Alias for use outside of this file. */
    type Args<S extends Strict> = readonly Arg.Command.Opts<S>[];
}
export {};
