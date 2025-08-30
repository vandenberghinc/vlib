/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import type { ExtractFlag, IfFlag, IfFlags } from "../types/flags.js";
import { ObjectUtils } from "../primitives/object.js";
import { Color } from "../generic/colors.js";
import { value_type } from "../schema/validate/throw.js";
import { Or, And, and_or_str } from "./query.js";
import { Cast } from "./cast.js";

// ------------------------------------------------------------------
// Symbols

/**
 * A symbol to indicate no default value was used, 
 * This way we can distinguish between `undefined` and no default value.
 */
export const NoDef: unique symbol = Symbol('vlib/cli/NoDef');
export type NoDef = typeof NoDef;

// ------------------------------------------------------------------
// Argument flags.

/**
 * Strict flag, defaults to `strict`.
 * Should only be defined on the `CLI` instance and passed down from there.
 * 
 * @enum {"strict"} Strict mode. When enabled some additional checks are performed. For instance either attribute `required` or `def` must be defined.
 * @enum {"loose"} Loose mode. When passed, strict mode is disabled. This is required for some type aliases.
 */
export type Strict = "strict" | "loose";

/** Strict utilities. */
export namespace Strict {
    /** Cast to its `is_strict` boolean type. */
    export type Cast<S extends Strict> = If<S, "strict", true, false>;
    /** Universal flag utilities after `T` is defined. */
    type T = Strict;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
}

/**
 * All variants, defaults to `id`.
 * @enum {"id"} For `id` based arguments, such as `--arg` or `-a`.
 * @enum {"index"} For positional index arguments, such as `arg_0`, `arg_1`, etc.
 */
export type Variant = "id" | "index";
export namespace Variant {
    /** Universal flag utilities after `T` is defined. */
    type T = Variant;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
} 

/**
 * The argument mode, defaults to `query`.
 * @enum {"query"}
 *      Query is used for search queries for the `CLI.get` method.
 * @enum {"command"}
 *      Command is used for the `CLI.Command.args` arguments.
 *      This is also a query but with additional attributes.
 */
export type Mode = "command" | "query";
export namespace Mode {
    /** Universal flag utilities after `T` is defined. */
    type T = Mode;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    /** If condition - @note K may only be a single flag name. */
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
} 

// ------------------------------------------------------------------
// Base argument class.

/**
 * {Arg}
 * Argument options for {@link CLI.get}.
 * 
 * @template F The argument flags.
 * @template T Inferred casted inferred type.
 * @template E Inferred typeof of the `enum` attribute, required for `InferArgs`.
 */
export class Base<
    const S extends Strict = Strict,
    const M extends Mode = Mode,
    const V extends Variant = Variant,
    const T extends Cast.Castable = Cast.Castable,
    const E extends readonly any[] = readonly any[],
> {

    /** The argument mode. */
    mode: Mode.Extract<M>;

    /** The argument variant. */
    variant: Variant.Extract<V>;

    /** The strict mode, when `true` some additional checks are performed. */
    strict: Strict.Cast<S>;

    /** The expected type, returned type will be auto casted to the mapped type. @attr */
    type: undefined | T;

    /** The default value to return when not found. @attr */
    def: NoDef | undefined | Cast.Cast<T>;

    /** The id attribute for the `id` variant. @attr */
    id: Variant.If<V, "id", Or | And>;

    /**
     * The index number for the `index` variant.
     * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
     * @attr
     */
    index: Variant.If<V, "index", number, never>;

    /** When searching for this argument, exclude args found that start with a `-` prefix, so basically to ignore --arg like values. @attr */
    exclude_dash: boolean;

    /** Enumerate. */
    enum: undefined | E

    /**
     * The name used as for the callback argument. Is auto inferred or optionally passed when flag `index` is present.
     */
    arg_name: Mode.If<M, "command", string>;

    /** Argument description. */
    description: Mode.If<M, "command", undefined | string>;

    /** Ignore this argument. */
    ignore: Mode.If<M, "command", boolean>;

    /**
     * Whether the argument is required or optional, defaults to `true`.
     * This already resolved and has already used `opts.required` and `opts.def` etc to determine the required value.
     */
    required: Mode.If<M, "command", boolean>;;

    /** Constructor */
    constructor(
        opts: (
            Base.Opts<S, M, V, T, E>
            // {
            //     /** exclude dash-prefixed values */
            //     exclude_dash?: boolean;
            //     /** explicit cast type; if omitted we treat it as undefined→string */
            //     type?: T;
            //     /** The enumerate options. */
            //     enum?: E;
            //     /** The default value, when the argument is not found. */
            //     def?: Cast.Cast<T>;
            //     /** Whether the argument is required or optional, defaults to `true`. */
            //     required?: boolean | (() => boolean);
            // }
            // /** Variant based input. */
            // // & V extends "index" 
            // //     /** positional index, including optional argument name */
            // //     ? { id?: never; index: number; name?: string; }
            // //     /** identifier or query */
            // //     : { id: string | string[] | Or | And; index?: never; name?: never; }
            // // )
            // & Variant.If<V, "index",
            //     /** positional index, including optional argument name */
            //     { id?: never; index: number; name?: string; },
            //     /** identifier or query */
            //     { id: string | string[] | Or | And; index?: never; name?: never; }
            // >
            // /** Command & option flags. */
            // & Mode.If<M, "command", 
            //     {
            //         /** Argument description. */
            //         description?: string;
            //         /** Ignore this argument. */
            //         ignore?: boolean;
            //     },
            //     { description?: never; ignore?: never; name?: never } // also neverify `name` not sure if it works perhaps not.
            // >
            // /** Strict mode, ensure either `required` or `def` is defined. */
            // & Mode.If<M, "command",
            //     Strict.If<S, "strict",
            //         /** Where `required` is non optional. */
            //         | {  required: boolean | (() => boolean); def?: never; }
            //         /** Where `def` is non optional. */
            //         | { required?: never; def?: Cast.Cast<T>; },
            //         {}
            //     >,
            //     {}
            // >
        ),
        // Non inferrable mode since all mode attrs are optional.
        mode: Mode.Extract<M>,
        // Strict mode, so we can auto infer all flags.
        strict: Strict.Cast<S>,
    ) {
        type This = Base<S, M, V, T, E>;

        // Also support direct `Arg` since this simplifies initialization types for `Command` and `CLI`.
        // if (opts instanceof Base) {
        //     this.variant = opts.variant;
        //     this.mode = opts.mode;
        //     this.strict = opts.strict;
        //     this.type = opts.type;
        //     this.def = opts.def;
        //     this.id = opts.id;
        //     this.index = opts.index;
        //     this.exclude_dash = opts.exclude_dash;
        //     this.enum = opts.enum;
        //     this.arg_name = opts.arg_name;
        //     this.description = opts.description;
        //     this.ignore = opts.ignore;
        //     this.required = opts.required;
        //     return ;
        // }

        // Assign variant, mode & strict.
        this.variant = Base.infer_variant(opts as any, true) as Variant.Extract<V>;
        this.mode = mode;
        this.strict = strict;

        // default exclude_dash to true:
        this.exclude_dash = opts.exclude_dash ?? true;
        this.type = opts.type;
        this.def = "def" in opts ? opts.def : NoDef;

        // Auto infer type.
        // Since later the types is sometimes used to check things
        // For instance boolean types are handled differently when parsed by `CLI.run_command`.
        // And when the type is inferred by InferArgs then it should match here.
        // note we cant assign `enum` to `this.type`.
        if (this.type == null) {
            if ("def" in opts) {
                const type = Cast.Type.parse(this.def, "string");
                if (type == null) {
                    throw new Error(`Invalid value type "${type}" of argument attribute "def", expected one of ${Array.from(Cast.Type.valid).join(", ")}. Argument: ${Color.object(opts)}}.`);
                }
                this.type = type as T;
            } else {
                this.type = "string" as T;
            }
        }

        // Assign mode based attributes.
        if (this.mode === "command") {
            this.description = opts.description as This["description"];
            this.ignore = (opts.ignore ?? false) as This["ignore"];
            opts.required ??= false;
            this.required = (this.def === NoDef && (
                typeof opts.required === "function"
                    ? opts.required()
                    : opts.required
            )) as This["required"];
        } else {
            this.description = undefined as never;
            this.ignore = false as never;
            this.required = undefined as never;
        }

        // Process variant.
        switch (this.variant) {
            case "index":
                if (opts.index == null) throw new Error(`Required argument attribute "index" is not defined for command argument ${Color.object(opts)}.`);
                if (opts.name) {
                    this.arg_name = opts.name as This["arg_name"];
                } else {
                    this.arg_name = `arg_${opts.index}` as This["arg_name"];
                }
                this.index = opts.index as This["index"];
                this.id = undefined as never;
                break;
            case "id":
                if (!opts.id) throw new Error(`Required argument attribute "id" is not defined for command argument ${Color.object(opts)}.`);
                this.index = undefined as never;
                // Assign id.
                if (typeof opts.id === "string") {
                    this.id = new Or(opts.id) as any;
                } else if (opts.id instanceof Or || opts.id instanceof And) {
                    // is any Or or And.
                    this.id = opts.id as This["id"];
                } else if (Array.isArray(opts.id)) {
                    this.id = new Or(...opts.id) as any;
                } else {
                    // @ts-expect-error
                    opts.id.toString();
                    throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", expected string, string[] or Or | And.`);
                }

                // Assign name.
                if (opts.id.length === 0) {
                    throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", empty AND query.`);
                }
                let arg_name: string | undefined = undefined;
                if (opts.id instanceof And) {
                    if (mode === "query") {
                        const last = opts.id[opts.id.length - 1]; // use the last child for `AND` operations.
                        if (Array.isArray(last)) {
                            arg_name = last[0]; // use the first child for `OR` operations.
                        } else {
                            arg_name = last;
                        }
                    } else {
                        const names = opts.id.map(c => Array.isArray(c) ? c[0] : c);
                        arg_name = names.join(" & ");
                    }
                }
                else {
                    let child: string | string[] | Or = opts.id
                    
                    while (child && typeof child !== "string") {
                        if (child instanceof And) {
                            child = child[child.length - 1]; // use the last child for `AND` operations.
                        } else if (child instanceof Or || Array.isArray(child)) {
                            child = child[0]; // use the first child for `OR` operations.
                        }
                    }
                    if (typeof child !== "string") {
                        throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", could not resolve an identifier.`);
                    }
                    // console.log(`Resolving argument name from id "${and_or_str(arg.id)}" to "${child}".`);
                    let trim_start = 0, c: string | undefined;
                    while ((c = child.charAt(trim_start)) === "-" || c === " " || c === "\t" || c === "\r" || c === "\n") {
                        ++trim_start;
                    }
                    if (trim_start > 0) {
                        child = child.slice(trim_start);
                    }
                    child = child.replaceAll("-", "_").trimEnd();
                    if (typeof child !== "string" || !child) {
                        throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", argument ended up empty after trimming.`);
                    }
                    arg_name = child;
                }
                if (typeof arg_name !== "string" || !arg_name) {
                    throw new Error(`Failed to resolve the argument name of command argument ${Color.object(opts)}.`);
                }
                this.arg_name = arg_name as This["arg_name"];
                break;
            default:
                // @ts-expect-error
                throw new Error(`Invalid command argument variant "${this.variant.toString()}". Expected "id" or "index".`);
        }
    }

    /** Infer the variant type. */
    static infer_variant(
        obj: { id?: string | string[] | Or | And; index?: number},
        throw_err: boolean,
    ): undefined | Variant {
        if (typeof obj.index === "number") {
            return "index";
        } else if (obj.id != null) {
            return "id";
        } else if (throw_err) {
            throw new Error(`Invalid argument ${obj instanceof Base ? obj : Color.object(obj)} is missing both "id" and "index" attributes, cannot determine the variant.`);
        }
    }

    /** Get as identifier such as id/name/main based on variant + mode. */
    identifier(): string {
        if (this.arg_name) return this.arg_name;
        if (this.variant === "index") {
            return `arg_${this.index}`;
        } else if (this.variant === "id") {
            return and_or_str(this.id);
        } else {
            // @ts-expect-error
            throw new Error(`Invalid argument variant "${this.variant.toString()}" for identifier.`);
        }
    }

    /** Create a string representation of the argument identifier. */
    toString(): string {
        return `Arg(${Color.object({
            variant: this.variant,
            mode: this.mode,
            id: and_or_str(this.id),
            index: this.index,
            type: this.type,
            def: this.def,
            required: this.required,
        })}`;
        return `Arg(${Color.object(this, {
            filter: v => v && "length" in v
            ? v.length
            : typeof v === "function" || typeof v === "boolean"
                ? false
                : Boolean(v)
        })}`;
    }
}
export namespace Base {

    /** Constructor options alias. */
    export type Opts<
        S extends Strict = Strict,
        M extends Mode = Mode,
        V extends Variant = Variant,
        T extends Cast.Castable = Cast.Castable,
        E extends readonly any[] = readonly any[],
    > =
        // ConstructorParameters<typeof Base<S, M, V, T, E>>[0];
        {
            /** exclude dash-prefixed values */
            exclude_dash?: boolean;
            /** explicit cast type; if omitted we treat it as undefined→string */
            type?: T;
            /** The enumerate options. */
            enum?: E;
            /** The default value, when the argument is not found. */
            def?: Cast.Cast<T>;
            /** Whether the argument is required or optional, defaults to `true`. */
            required?: boolean | (() => boolean);
        }
        /** Variant based input. */
        // & V extends "index" 
        //     /** positional index, including optional argument name */
        //     ? { id?: never; index: number; name?: string; }
        //     /** identifier or query */
        //     : { id: string | string[] | Or | And; index?: never; name?: never; }
        // )
        & Variant.If<V, "index",
            /** positional index, including optional argument name */
            { id?: never; index: number; name?: string; },
            /** identifier or query */
            { id: string | string[] | Or | And; index?: never; name?: never; }
        >
        /** Command & option flags. */
        & Mode.If<M, "command",
            {
                /** Argument description. */
                description?: string;
                /** Ignore this argument. */
                ignore?: boolean;
            },
            { description?: never; ignore?: never; name?: never } // also neverify `name` not sure if it works perhaps not.
        >
        /** Strict mode, ensure either `required` or `def` is defined. */
        & Mode.If<M, "command",
            Strict.If<S, "strict",
                /** Where `required` is non optional. */
                | { required: boolean | (() => boolean); def?: never; }
                /** Where `def` is non optional. */
                | { required?: never; def?: Cast.Cast<T>; },
                {}
            >,
            {}
        >

    /** Infer `Base` from `Base.Opts` */
    export type FromOpts<O extends Base | Opts> =
        O extends Base ? O :
        O extends Opts<
            infer S extends Strict,
            infer M extends Mode,
            infer V extends Variant,
            infer T extends Cast.Castable,
            infer E extends readonly any[]
        >
        ? Base<S, M, V, T, E>  // note: make sure your Base’s type‐parameters line up here
        : never;

    /** Infer `Base.Opts` from `Base` */
    export type ToOpts<
        B extends Opts | Base<any, any, any, any, any>
    > =
        B extends Opts ? B :
        B extends Base<
            infer S extends Strict,
            infer M extends Mode,
            infer V extends Variant,
            infer T extends Cast.Castable,
            infer E extends readonly any[]
        >
        ? Opts<S, M, V, T, E>
        : never;

    
}

const cmd = new Base({ id: "version" }, "command", true);

// ------------------------------------------------------------------
// Create specific argument classes.
// This is so we dont have to define the flags every time we want to construct an argument.

/**
 * An argument of a command.
 * Used in the array of the `CLI.Command.args` attribute.
 */
export class Command<
    S extends Strict = Strict,
    V extends Variant = Variant,
    T extends Cast.Castable = Cast.Castable,
    E extends readonly any[] = readonly any[],
> extends Base<S, "command", V, T, E> {
    constructor(
        opts: Base.Opts<S, "command", V, T, E>,
        strict: Strict.Cast<S>,
    ) {
        super(opts, "command", strict);
    }
}
export namespace Command {
    export type Opts<
        S extends Strict = Strict,
        V extends Variant = Variant,
        T extends Cast.Castable = Cast.Castable,
        E extends readonly any[] = readonly any[],
    > = ConstructorParameters<typeof Base<S, "command", V, T, E>>[0];
}

/**
 * The query command.
 * Used as info query for the `CLI.info` and `CLI.get` methods.
 */
export class Query<
    S extends Strict = Strict,
    V extends Variant = Variant,
    T extends Cast.Castable = Cast.Castable,
    E extends readonly any[] = readonly any[],
> extends Base<S, "query", V, T, E> {
    constructor(
        opts: Base.Opts<S, "query", V, T, E>,
        strict: Strict.Cast<S>,
    ) {
        super(opts, "query", strict);
    }
}
export namespace Query {
    export type Opts<
        S extends Strict = Strict,
        V extends Variant = Variant,
        T extends Cast.Castable = Cast.Castable,
        E extends readonly any[] = readonly any[],
    > = ConstructorParameters<typeof Base<S, "query", V, T, E>>[0];
}
