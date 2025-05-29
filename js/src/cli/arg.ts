/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Color, ObjectUtils } from "../index.web.js";
import { Query } from "./query.js";

/** Type alias for And and Or */
type And = Query.And<string | string[] | Query.Or>;
type Or = Query.Or<string>;

/**
 * {Arg}
 * Argument options for {@link CLI.get}.
 * 
 * Serves as a base for the initialized command argument.
 * And as a query object for the CLI.get/info methods.
 * 
 * @template T The type to cast the argument to, defaults to `string`.
 * @template V The argument variant, can be "id", "index" or "main".
 * @template M The argument mode, can be "command", "option" or "query", see {@link CLI.Mode} for more info.
 * 
 * @libris
 */
export class Arg<
    V extends Arg.Variant = Arg.Variant,
    M extends Arg.Mode = Arg.Mode,
    T extends Arg.Castable = Arg.Castable,
> {

    /** The argument variant. */
    variant: V;

    /** The expected type, returned type will be auto casted to the mapped type. @attr */
    type?: T;

    /** The default value to return when not found. @attr */
    def?: Arg.Cast<T>;

    /** The id attribute for the `id` variant. @attr */
    id!: V extends "id"
        ? M extends "command" | "option"
            ? Or | And
            : string | string[] | Or | And
        : never;

    /**
     * The index number for the `index` variant.
     * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
     * @attr
     */
    index!: V extends "index" ? number : never;

    /** When searching for this argument, exclude args found that start with a `-` prefix, so basically to ignore --arg like values. @attr */
    exclude_dash: boolean;

    /**
     * The name used as for the callback argument.
     * 
     * Is automatically derived from the first id of an OR operation, or the entire AND operation so we can construct a nested object tree.
     */
    arg_name!: M extends "query" ? never : string | Query.And
    arg_name_str!: M extends "query" ? never : string;

    /** Whether the argument is required or optional, defaults to `true`. */
    required?: M extends "query" ? never : boolean | (() => boolean);

    /** Is optional, when `required` is false or `def` is defined. */
    optional!: M extends "query" ? never : () => boolean;

    /** Argument description. */
    description?: M extends "query" ? never : string;

    /** Ignore this argument. */
    ignore?: M extends "query" ? never : boolean;

    /** Constructor */
    constructor(
        opts: {
            /** exclude dash-prefixed values */
            exclude_dash?: boolean;
            /** explicit cast type; if omitted we treat it as undefined→string */
            type?: T;
            /** The default value, when the argument is not found. */
            def?: Arg.Cast<T>;
        }
        /** Variant based input. */
        & (V extends "main"
            /** main/root command of the CLI, so no index nor id. */
            ? { id?: never; index?: never; }
            : V extends "id"
                /** identifier or query */
                ? { id: string | string[] | Or | And; index?: never; }
                /** positional index */
                : { id?: never; index: number }
        )
        /** Mode based input. */
        & (M extends "query"
            ? { required?: never; description?: never; ignore?: never; name?: never }
            : {
                /** Whether the argument is required or optional, defaults to `true`. */
                required?: M extends "query" ? never : boolean | (() => boolean);
                /** Argument description. */
                description?: M extends "query" ? never : string;
                /** Ignore this argument. */
                ignore?: M extends "query" ? never : boolean;
                /**
                 * The name used as for the callback argument.
                 * 
                 * Is automatically derived from the first id of an OR operation, or the entire AND operation so we can construct a nested object tree.
                 */
                name?: M extends "query" ? never : string | Query.And
            }
        ),
        variant: V | "auto",
        mode: M,
    ) {

        // Aliases.
        const cmd_opt_this = mode === "option" || mode === "command" ? this as Arg<V, "command" | "option", T> : undefined;

        // default exclude_dash to true:
        this.exclude_dash = opts.exclude_dash ?? true;
        this.type = opts.type;
        this.def = opts.def;

        // Assign mode based attributes.
        if (cmd_opt_this) {
            cmd_opt_this.required = opts.required;
            cmd_opt_this.description = opts.description;
            cmd_opt_this.ignore = opts.ignore;
            cmd_opt_this.optional = () => opts.def !== undefined || (
                typeof opts.required === "function"
                    ? opts.required() === false
                    : opts.required === false// || arg.required === "false" || arg.required === "0" || arg.required === "no"
            );
        }

        // Auto detect variant.
        if (variant === "auto") {
            if (typeof opts.index === "number") {
                variant = "index" as V;
            } else if (opts.id != null) {
                variant = "id" as V;
            } else {
                throw new Error(`Command argument ${Color.object(opts)} is missing both "id" and "index" attributes, cannot determine the variant.`);
            }
        }
        this.variant = variant;
        
        // Only assign `index` if it was in opts:
        if ((opts as any).index !== undefined) {
            (this as Arg<"index", M, T>).index = opts.index!;
        }

        // Process variant.
        switch (this.variant) {
            case "main":
                if (cmd_opt_this) {
                    cmd_opt_this.arg_name = "__main__";
                }
                break;
            case "index":
                if (opts.index == null) throw new Error(`Required argument attribute "index" is not defined for command argument ${Color.object(opts)}.`);
                if (cmd_opt_this && !opts.name) {
                    cmd_opt_this.arg_name = `arg_${opts.index}`;
                }
                break;
            case "id":
                if (!opts.id) throw new Error(`Required argument attribute "id" is not defined for command argument ${Color.object(opts)}.`);
                if (cmd_opt_this && !opts.name) {
                    if (opts.id.length === 0) {
                        throw new Error(`Invalid command argument id "${Query.to_str(opts.id)}", empty AND query.`);
                    }
                    if (opts.id instanceof Query.And) {
                        if (mode === "query") {
                            const last = opts.id[opts.id.length - 1]; // use the last child for `AND` operations.
                            if (Array.isArray(last)) {
                                cmd_opt_this.arg_name = last[0]; // use the first child for `OR` operations.
                            } else {
                                cmd_opt_this.arg_name = last;
                            }
                        } else {
                            const names = opts.id.map(c => Array.isArray(c) ? c[0] : c);
                            cmd_opt_this.arg_name = names.join(" & ");
                        }
                    }
                    else {
                        let child: string | any[] = opts.id
                        while (child && typeof child !== "string") {
                            if (child instanceof Query.And) {
                                child = child[child.length - 1]; // use the last child for `AND` operations.
                            } else if (Array.isArray(child)) {
                                child = child[0]; // use the first child for `OR` operations.
                            }
                        }
                        if (typeof child !== "string") {
                            throw new Error(`Invalid command argument id "${Query.to_str(opts.id)}", could not resolve an identifier.`);
                        }
                        // console.log(`Resolving argument name from id "${Query.to_str(arg.id)}" to "${child}".`);
                        let trim_start = 0, c: string | undefined;
                        while ((c = child.charAt(trim_start)) === "-" || c === " " || c === "\t" || c === "\r" || c === "\n") {
                            ++trim_start;
                        }
                        if (trim_start > 0) {
                            child = child.slice(trim_start);
                        }
                        child = child.replaceAll("-", "_").trimEnd();
                        if (typeof child !== "string" || !child) {
                            throw new Error(`Invalid command argument id "${Query.to_str(opts.id)}", argument ended up empty after trimming.`);
                        }
                        cmd_opt_this.arg_name = child;
                    }
                    if (typeof cmd_opt_this.arg_name !== "string" || !cmd_opt_this.arg_name) {
                        throw new Error(`Failed to resolve the argument name of command argument ${Color.object(opts)}.`);
                    }
                }
                break;
            default:
                // @ts-expect-error
                throw new Error(`Invalid command argument variant "${this.variant.toString()}". Expected "id", "main" or "index".`);
        }

        // Set arg name string.
        if (mode !== "query" && this.arg_name) {
            if (Array.isArray(this.arg_name)) {
                (this as Arg<"id", "command">).arg_name_str = this.arg_name.join(" & ");
            }
            else if (typeof this.arg_name === "string") {
                (this as Arg<"id", "command">).arg_name_str = this.arg_name;
            }
        }
    }

    /** Create a string representation of the argument identifier. */
    toString(arg: Arg): string {
        return `Arg(${Color.object(arg, { filter: v => "length" in v
            ? v.length
            : typeof v === "function"
                ? false
                : Boolean(v)
        })}`;
    }
}

/** Argument types. */
export namespace Arg {

    /** Constructor options alias. */
    export type Opts<
        V extends Arg.Variant = Arg.Variant,
        M extends Arg.Mode = Arg.Mode,
        T extends Arg.Castable = Arg.Castable,
    > = ConstructorParameters<typeof Arg<V, M, T>>[0];

    /** All variants. */
    export type Variant = "id" | "index" | "main";

    /**
     * The argument mode, can be "command", "option" or "argument".
     * @enum {"command"} command is used for the `CLI.Command.args` arguments.
     * @enum {"option"} option is used for the `CLI.Command.options` arguments.
     * @enum {"query"} query is used as search queries for the `CLI.get` method.
     */
    export type Mode = "command" | "option" | "query";

    /** All supported argument types. */
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
        "string:boolean|number": Map<string, boolean | number>;
        "string:boolean|string": Map<string, boolean | string>;
        "string:number|string": Map<string, number | string>;

        "string:boolean|number|string|array": Map<string, boolean | number | string | string[]>;

        "number:boolean": Map<number, number>;
        "number:number": Map<number, number>;
        "number:string": Map<number, string>;
    };

    /** Argument string types. */
    export type Type = keyof Types;

    /** The value type of */
    export type Value = Types[Type];

    /**
     * The base type of castable type generics.
     * @warning never add `undefined` etc here, do that on specific types only. 
     */
    export type Castable = Type | Type[];

    /**
     * Cast a type name or type names union to its corresponding value type.
     * Also supports already casted value types as input.
     */
    export type Cast<T extends never | undefined | Castable | Value> =
        [T] extends [never]
        ? string // default is string
        : T extends | null | undefined
        ? string
        : T extends Type[]
        ? Types[T[number]]
        : T extends Type
        ? Types[T]
        : never;


    /** Additional initialize options for `Arg.init()`. */
    export type InitOpts<
        V extends Arg.Variant = Arg.Variant,
        M extends Arg.Mode = Arg.Mode,
        T extends Arg.Castable = Arg.Castable,
    > =
        | Arg<V, M, T>
        | Arg.Opts<V, M, T>
        | And
        | Or | string[]
        | string;
}