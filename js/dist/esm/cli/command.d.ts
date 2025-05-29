/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Arg as BaseArg } from "./arg.js";
import { Query } from "./query.js";
export interface ArgDef<T extends BaseArg.Castable = BaseArg.Type | BaseArg.Type[]> {
    id: string;
    type: T;
}
type InferArgs<Arr extends readonly ArgDef<BaseArg.Castable>[]> = any;
/** Command base options. */
export type Command<V extends BaseArg.Variant = BaseArg.Variant, Args extends ArgDef[] = ArgDef[], Initialized extends boolean = boolean> = {
    /**
     * Description of the command for the CLI help.
     */
    description: string;
    /**
     * Command examples for the CLI help.
     */
    examples?: string | string[] | {
        [key: string]: string;
    };
    /**
     * Callback function to execute when the command is invoked.
     */
    callback: (args: InferArgs<Args>) => void | Promise<void>;
} & (V extends "main" ? {
    id?: never;
} : Initialized extends true ? {
    id: Query.And | Query.Or;
} : {
    id: string | string[] | Query.Or<string> | Query.And<string | Query.Or<string>>;
}) & (Initialized extends true ? {
    args: Command.Arg<BaseArg.Variant, Initialized>[];
} : {
    args?: Command.Arg<BaseArg.Variant, Initialized>[];
});
/** Command types. */
export declare namespace Command {
    /**
     * Command types.
     * Opts suffix are user input options, without is the initialized type.
     */
    type Main<Args extends ArgDef[] = ArgDef[]> = Command<"main", Args, true>;
    type MainOpts<Args extends ArgDef[] = ArgDef[]> = Command<"main", Args, false>;
    type Id<Args extends ArgDef[] = ArgDef[]> = Command<"id", Args, true>;
    type IdOpts<Args extends ArgDef[] = ArgDef[]> = Command<"id", Args, false>;
    /**
     * The command argument options.
     */
    type Arg<V extends BaseArg.Variant = BaseArg.Variant, Initialized extends boolean = boolean, T extends BaseArg.Castable = BaseArg.Castable, D extends BaseArg.Cast<T> = never> = BaseArg<T, D, V> & {
        /**
         * Whether the argument is required or optional, defaults to `true`.
         */
        required?: boolean;
        /**
         * Argument description.
         */
        description?: string;
        /**
         * Ignore this argument.
         */
        ignore?: boolean;
    } & (Initialized extends true ? {
        /** The argument variant. */
        variant: V;
        /**
         * The name used as for the callback argument.
         *
         * Is automatically derived from the first id of an OR operation, or the entire AND operation so we can construct a nested object tree.
         */
        name: string | Query.And;
        /**
         * Is optional, when `required` is false or `def` is defined.
         */
        optional: boolean;
    } : {
        variant?: never;
        name?: string | Query.And;
        optional?: never;
    });
    /**
     * Initialize a command object.
     * @param variant - The command variant, this can be auto detected or an expected variant type.
     * @param cmd - The command to initialize.
     * @throws An error when the the command input is invalid.
     * @returns The initialized command.
     */
    function init<V extends BaseArg.Variant = BaseArg.Variant, Args extends ArgDef[] = ArgDef[]>(variant: V, cmd: Command<V, Args, boolean>): Command<V, Args, true>;
    /**
     * Initialize a command argument.
     * @param variant - The command argument variant, this can be auto detected or an expected variant type.
     * @param arg - The command argument to initialize.
     * @throws An error when the the command argument input is invalid.
     * @returns The initialized command argument.
     */
    function init_cmd_arg<V extends BaseArg.Variant = BaseArg.Variant, T extends BaseArg.Castable = BaseArg.Castable, D extends BaseArg.Cast<T> = never>(variant: V | "auto", arg: Arg<V, boolean, T, D>): Arg<V, true, T, D>;
}
export {};
