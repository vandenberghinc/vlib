/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import type { ExtractFlag, IfFlag, IfFlags } from "../types/flags.js";
import { Or, And } from "./query.js";
import { Cast } from "./cast.js";
/**
 * A symbol to indicate no default value was used,
 * This way we can distinguish between `undefined` and no default value.
 */
export declare const NoDef: unique symbol;
export type NoDef = typeof NoDef;
/**
 * Strict flag, defaults to `strict`.
 * Should only be defined on the `CLI` instance and passed down from there.
 *
 * @enum {"strict"} Strict mode. When enabled some additional checks are performed. For instance either attribute `required` or `def` must be defined.
 * @enum {"loose"} Loose mode. When passed, strict mode is disabled. This is required for some type aliases.
 */
export type Strict = "strict" | "loose";
/** Strict utilities. */
export declare namespace Strict {
    /** Cast to its `is_strict` boolean type. */
    export type Cast<S extends Strict> = If<S, "strict", true, false>;
    /** Universal flag utilities after `T` is defined. */
    type T = Strict;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
    export {};
}
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
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
    export {};
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
export declare namespace Mode {
    /** Universal flag utilities after `T` is defined. */
    type T = Mode;
    export type Extract<F extends T> = ExtractFlag<F, T, never>;
    /** If condition - @note K may only be a single flag name. */
    export type If<F extends T, K extends T, Then, Else = never> = IfFlag<F, K, Then, Else>;
    export type IfOne<F extends T, K extends T, Then, Else = never> = IfFlags<F, K, Then, Else>;
    export {};
}
/**
 * {Arg}
 * Argument options for {@link CLI.get}.
 *
 * @template F The argument flags.
 * @template T Inferred casted inferred type.
 * @template E Inferred typeof of the `enum` attribute, required for `InferArgs`.
 */
export declare class Base<const S extends Strict = Strict, const M extends Mode = Mode, const V extends Variant = Variant, const T extends Cast.Castable = Cast.Castable, const E extends readonly any[] = readonly any[]> {
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
    enum: undefined | E;
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
    required: Mode.If<M, "command", boolean>;
    /** Constructor */
    constructor(opts: (Base.Opts<S, M, V, T, E>), mode: Mode.Extract<M>, strict: Strict.Cast<S>);
    /** Infer the variant type. */
    static infer_variant(obj: {
        id?: string | string[] | Or | And;
        index?: number;
    }, throw_err: boolean): undefined | Variant;
    /** Get as identifier such as id/name/main based on variant + mode. */
    identifier(): string;
    /** Create a string representation of the argument identifier. */
    toString(): string;
}
export declare namespace Base {
    /** Constructor options alias. */
    type Opts<S extends Strict = Strict, M extends Mode = Mode, V extends Variant = Variant, T extends Cast.Castable = Cast.Castable, E extends readonly any[] = readonly any[]> = {
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
     & Variant.If<V, "index", 
    /** positional index, including optional argument name */
    {
        id?: never;
        index: number;
        name?: string;
    }, 
    /** identifier or query */
    {
        id: string | string[] | Or | And;
        index?: never;
        name?: never;
    }>
    /** Command & option flags. */
     & Mode.If<M, "command", {
        /** Argument description. */
        description?: string;
        /** Ignore this argument. */
        ignore?: boolean;
    }, {
        description?: never;
        ignore?: never;
        name?: never;
    }>
    /** Strict mode, ensure either `required` or `def` is defined. */
     & Mode.If<M, "command", Strict.If<S, "strict", 
    /** Where `required` is non optional. */
    {
        required: boolean | (() => boolean);
        def?: never;
    }
    /** Where `def` is non optional. */
     | {
        required?: never;
        def?: Cast.Cast<T>;
    }, {}>, {}>;
    /** Infer `Base` from `Base.Opts` */
    type FromOpts<O extends Base | Opts> = O extends Base ? O : O extends Opts<infer S extends Strict, infer M extends Mode, infer V extends Variant, infer T extends Cast.Castable, infer E extends readonly any[]> ? Base<S, M, V, T, E> : never;
    /** Infer `Base.Opts` from `Base` */
    type ToOpts<B extends Opts | Base<any, any, any, any, any>> = B extends Opts ? B : B extends Base<infer S extends Strict, infer M extends Mode, infer V extends Variant, infer T extends Cast.Castable, infer E extends readonly any[]> ? Opts<S, M, V, T, E> : never;
}
/**
 * An argument of a command.
 * Used in the array of the `CLI.Command.args` attribute.
 */
export declare class Command<S extends Strict = Strict, V extends Variant = Variant, T extends Cast.Castable = Cast.Castable, E extends readonly any[] = readonly any[]> extends Base<S, "command", V, T, E> {
    constructor(opts: Base.Opts<S, "command", V, T, E>, strict: Strict.Cast<S>);
}
export declare namespace Command {
    type Opts<S extends Strict = Strict, V extends Variant = Variant, T extends Cast.Castable = Cast.Castable, E extends readonly any[] = readonly any[]> = ConstructorParameters<typeof Base<S, "command", V, T, E>>[0];
}
/**
 * The query command.
 * Used as info query for the `CLI.info` and `CLI.get` methods.
 */
export declare class Query<S extends Strict = Strict, V extends Variant = Variant, T extends Cast.Castable = Cast.Castable, E extends readonly any[] = readonly any[]> extends Base<S, "query", V, T, E> {
    constructor(opts: Base.Opts<S, "query", V, T, E>, strict: Strict.Cast<S>);
}
export declare namespace Query {
    type Opts<S extends Strict = Strict, V extends Variant = Variant, T extends Cast.Castable = Cast.Castable, E extends readonly any[] = readonly any[]> = ConstructorParameters<typeof Base<S, "query", V, T, E>>[0];
}
