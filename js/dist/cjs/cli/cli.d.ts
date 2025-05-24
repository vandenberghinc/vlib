/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Merge, StringLiteral, ArrayLiteral } from '../global/types.js';
/**
 * The base type for a cast res, excluding undefined.
 */
type CastBase = CLI.Arg.Type | CLI.Arg.Type[];
/**
 * Cast a type name or type names union to its corresponding value type.
 * Also supports already casted value types as input.
 */
type CastedValue<T extends undefined | CastBase | CLI.Arg.ValueType> = T extends CLI.Arg.Type[] ? CLI.Arg.Types[T[number]] : T extends CLI.Arg.Type ? CLI.Arg.Types[T] : T extends undefined | null ? string : never;
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
    private description;
    /** The CLI version. */
    private version;
    /** The main command for when no specific command is detected. */
    private main?;
    /** The list of commands. */
    private commands;
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
    constructor({ name, description, version, notes, main, commands, start_index, }?: {
        name?: string;
        description?: string | null;
        version?: string | null;
        notes?: string[] | null;
        commands?: (Omit<CLI.Command, "id"> & {
            id: CLI.Query;
        })[];
        main?: Omit<CLI.Command, "id">;
        start_index?: number;
    });
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
    /** Run a command. */
    private _run_command;
    /**
     * Get an argument.
     * See {@link CLI.Get.Opts} for option information.
     * @libris
     */
    get<T extends CastBase>(opts: Merge<CLI.Get.Opts<T>, {
        type: T;
    }>): CLI.Get.Res<T>;
    get<T extends undefined>(opts: StringLiteral<string> | ArrayLiteral<string[]> | Merge<CLI.Get.Opts, {
        type?: T;
    }>): CLI.Get.Res<string>;
    /**
     * Get info.
     */
    info<T extends CastBase>(opts: CLI.Get.Opts<T>): CLI.Get.Res<T>;
    /**
     * Check if an argument is present.
     * @libris
     */
    present(id: CLI.Query): boolean;
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
    throw_error(...err: any[]): never;
    throw_err(...err: any[]): never;
    /**
     * Log the docs, optionally of an array of command or a single command.
     * @libris
     */
    docs(command_or_commands?: CLI.Command | CLI.Command[] | null): void;
    /**
     * Start the cli.
     * @libris
     */
    start(): Promise<boolean>;
    static _cli: CLI | undefined;
    /**
     * Get an argument.
     * See {@link CLI.Get.Opts} for option information.
     * @libris
     */
    static get<T extends CastBase>(opts: Merge<CLI.Get.Opts, {
        type: T;
    }>): CLI.Get.Res<T>["value"];
    static get<T extends undefined>(opts: StringLiteral<string> | ArrayLiteral<string[]> | Merge<CLI.Get.Opts, {
        type?: T;
    }>): CLI.Get.Res<string>["value"];
    /**
     * Check if an argument is present.
     * @libris
     */
    static present(id: Parameters<typeof CLI.prototype.present>[0]): boolean;
}
export default CLI;
/**
 * CLI types.
 */
export declare namespace CLI {
    /** CLI.get types. */
    namespace Get {
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
        interface Opts<T extends undefined | CastBase = CastBase> {
            id: string | string[] | CLI.Query.Or<string>;
            index?: number;
            type?: T;
            def?: CastedValue<T>;
            exclude_dash?: boolean;
        }
        type NoTypeOpts = Merge<Opts, {
            type?: undefined;
        }>;
        /**
         * Alias for type casts.
         * Also supports already casted value types as input.
         */
        type Res<T extends CastBase | CLI.Arg.ValueType = CastBase | CLI.Arg.ValueType> = {
            found: boolean;
            error: string;
            value?: undefined;
        } | {
            found: true;
            error?: undefined;
            value: CastedValue<T>;
        };
    }
    /** Command options. */
    interface Command<Args extends readonly Command.ArgDef<string, CLI.Arg.Type | CLI.Arg.Type[]>[] = Command.ArgDef<string, any>[]> {
        id: Command.Id;
        description?: string;
        examples?: string | string[] | {
            [key: string]: string;
        };
        args: Arg[];
        callback: (args: Command.InferArgs<Args>) => void | Promise<void>;
    }
    /** Command types. */
    namespace Command {
        /** Identifier type. */
        type Id = Query.And | Query.Or;
        /** Initialize a query to an id. */
        const id: (query: Query) => Id;
        /** Assert an id, updates the object in place. */
        const init: <T extends {
            id: Query;
        }>(obj: T) => Omit<T, "id"> & {
            id: Id;
        };
        interface ArgDef<Name extends string, T extends CastBase> {
            id: Name;
            type: T;
        }
        /**
         * Turn a tuple of ArgDef<Name, Type> into
         * a mapping from Name to the correctly-casted value.
         */
        type InferArgs<Arr extends readonly ArgDef<string, CastBase>[]> = {
            [P in Arr[number] as P["id"]]: P["type"] extends readonly (infer U)[] ? U extends CLI.Arg.Type ? CastedValue<U> : never : P["type"] extends CLI.Arg.Type ? CastedValue<P["type"]> : never;
        };
    }
    /** CLI argument type. */
    interface Arg<V extends Arg.ValueType = Arg.ValueType> {
        id: Arg.Id;
        type?: Arg.Type | Arg.Type[];
        required?: boolean;
        default?: V;
        description?: string;
        ignore?: boolean;
    }
    /** Argument types. */
    namespace Arg {
        /**
         * Argument identifier.
         */
        type Id = string | string[] | Query.Or<string>;
        /**
         * All supported argument types.
         */
        type Types = {
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
            "string:boolean|number": Map<string, boolean | number>;
            "string:boolean|string": Map<string, boolean | string>;
            "string:number|string": Map<string, number | string>;
            "string:boolean|number|string|array": Map<string, boolean | number | string | string[]>;
            "number:boolean": Map<number, number>;
            "number:number": Map<number, number>;
            "number:string": Map<number, string>;
        };
        /**
         * Argument string types.
         */
        type Type = keyof Types;
        /**
         * Argument string types.
         */
        type ValueType = Types[Type];
    }
    /** Identifier query type. */
    type Query = Query.And | Query.Or | string | string[];
    /** CLI.Query types. */
    namespace Query {
        /**
         * And operation for argument identifiers.
         */
        class And<T = string | Or> extends Array<T> {
            constructor(...args: T[]);
            match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean;
        }
        namespace And {
            const is: (x: any) => x is And;
        }
        /**
         * Or operation for argument identifiers.
         * A nested string[] is considered as another OR operation.
         */
        class Or<T = string> extends Array<T> {
            constructor(...args: T[]);
            match(fn: (value: T, index?: number, arr?: T[]) => boolean): boolean;
        }
        namespace Or {
            const is: (x: any) => x is Or;
        }
        /**
         * Convert a query / identifier to a string.
         */
        const to_str: (id: Query) => string;
        /**
         * Match identifier against a query.
         * @note only Supports Or<string> and And<string | string[]> queries.
         */
        function match(id: Query, query: Query): boolean;
        function match_str(id: Query, query: string): boolean;
    }
}
export { CLI as cli };
