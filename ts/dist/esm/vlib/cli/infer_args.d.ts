/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Infer command args to an object type.
 */
import type { Cast } from "./cast.js";
import type { NoDef } from "./arg.js";
import { And, Or } from "./query.js";
/**
 * The shape of a single descriptor in the argument list.
 * This should be base of `Arg` and not `Arg` itself.
 * Since we want to keep it separate in order to make this file easier.
 *
 * @warning This must match with both `Arg.Base` and `Arg.Base.Opts`
 *          Otherwise the resolving of types from `CLI.get` no longer works as it should.
 */
export type InferArgsBase = {
    /** id variant 1 - Name based. */
    name?: string | And;
    /** id variant 2 - Name that will become the property key on the final `args` object. */
    id?: string | string[] | Or | And;
    /** id variant 3 - Index based */
    index?: number;
    /** Optional token that can be cast by {@link Cast.Cast}. */
    type?: Cast.Castable;
    /** Default value – when present its *type* supersedes {@link type}. */
    def?: unknown | NoDef;
    /**
     * When `false` the arg is optional.
     * When it is a callback we *also* treat the arg as optional because the
     * callback result is unknowable at design time.
     * Defaults to `true`.
     */
    required?: boolean | Function;
};
/**
 * Recursively join a tuple of `string`s with `_`.
 * Also trim since this is required for the `And` joining for ids.
 */
export type JoinArray<Delimiter extends string, T extends readonly string[]> = T extends [] ? "" : T extends [infer F extends string] ? Trim<F> : T extends [infer F extends string, ...infer R extends readonly string[]] ? `${Trim<F>}${Delimiter}${JoinArray<Delimiter, R>}` : string;
type Trim<S extends string> = S extends `--${infer R}` ? Trim<R> : S extends `-${infer R}` ? Trim<R> : S;
type Snake<S extends string> = S extends `${infer H}-${infer T}` ? `${H}_${Snake<T>}` : S;
/** Pick the first of an array. */
type PickFirst<T extends readonly any[], Def = never> = T extends readonly [infer F] ? F : T extends readonly [infer F, ...any] ? F : T extends readonly [] ? Def : Def;
/** Extract the runtime key of. */
type KeyOf<A extends InferArgsBase> = A["name"] extends string ? A["name"] : A["name"] extends And ? JoinArray<"/", A["name"]["items"]> : A["index"] extends number ? `arg_${A["index"]}` : A["id"] extends string ? A["id"] : A["id"] extends And ? JoinArray<"/", A["id"]["items"]> : A["id"] extends Or ? PickFirst<A["id"]["items"], "error_or_op_not_a_string_1"> : A["id"] extends readonly [infer F extends string, ...string[]] ? F : `error_key_not_found`;
/** Process the default value and return its type.
 *  - string‐literal → string
 *  - number‐literal → number
 *  - boolean‐literal → boolean
 *  - readonly [ … ] or Array<…> → (widened) array of the element type
 *  - everything else → itself (e.g. class instances, plain objects, etc.)
 */
type DefaultValueToType<D> = D extends string ? string : D extends number ? number : D extends boolean ? boolean : D extends readonly (infer U)[] ? U[] : D;
/** Extract the runtime value type of an argument. */
export type ExtractArgValueType<A extends InferArgsBase, Default extends Cast.Castable = never> = A extends {
    def: infer D extends undefined | Cast.Value;
} ? DefaultValueToType<D> : A extends {
    enum: readonly (infer U)[];
} ? U : A["type"] extends Cast.Castable ? Cast.Cast<A["type"], Default> : Default;
/** Is the argument optional? */
export type IsOptional<A extends InferArgsBase> = A["type"] extends "boolean" ? false : [
    A["required"]
] extends [false] ? true : [
    A["required"]
] extends [true] ? false : A["required"] extends (...args: any) => any ? true : A["def"] extends undefined ? true : false;
type Split<S extends string, Delimiter extends string> = S extends `${infer Head}${Delimiter}${infer Tail}` ? [Head, ...Split<Tail, Delimiter>] : [S];
type Nest<Path extends readonly string[], V> = Path extends [infer K extends string, ...infer Rest extends string[]] ? Rest['length'] extends 0 ? {
    [P in K]: V;
} : {
    [P in K]: Nest<Rest, V>;
} : V;
type UnionToIntersection<U> = (U extends any ? (u: U) => void : never) extends (i: infer I) => void ? I : never;
export type FlattenPaths<T extends Record<string, any>> = UnionToIntersection<{
    [K in keyof T]: Nest<Split<K & string, "/">, T[K]>;
}[keyof T]>;
/** Infer the arguments from a list of arguments and turn it into an object type. */
export type InferArgs<L extends readonly InferArgsBase[]> = FlattenPaths<{
    [D in L[number] as Snake<Trim<KeyOf<D>>>]: IsOptional<D> extends true ? ExtractArgValueType<D, "string"> | undefined : ExtractArgValueType<D, "string">;
}>;
export {};
