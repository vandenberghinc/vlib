/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Infer command args to an object type.
 */

import type { Cast } from "./cast.js";
import type { NoDef } from "./arg.js";
import { And, Or, and } from "./query.js";

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

// ————————————————————————————————————————————————————————
// Key extraction.

/**
 * Recursively join a tuple of `string`s with `_`.
 * Also trim since this is required for the `And` joining for ids.
 */
export type JoinArray<Delimiter extends string, T extends readonly string[]> =
    T extends [] ? "" :
    T extends [infer F extends string] ? Trim<F> :
    T extends [infer F extends string, ...infer R extends readonly string[]]
    ? `${Trim<F>}${Delimiter}${JoinArray<Delimiter, R>}`
    : string;

// strip leading dashes, convert kebab to snake
type Trim<S extends string> =
    S extends `--${infer R}` ? Trim<R> :
    S extends `-${infer R}` ? Trim<R> : S;
type Snake<S extends string> =
    S extends `${infer H}-${infer T}` ? `${H}_${Snake<T>}` : S;

/** Pick the first of an array. */
type PickFirst<T extends readonly any[], Def = never> =
    T extends readonly [infer F] ? F :
    T extends readonly [infer F, ...any] ? F :
    T extends readonly [] ? Def :
    Def;

/** Extract the runtime key of. */
type KeyOf<A extends InferArgsBase> =
    A["name"] extends string ? A["name"] :
    A["name"] extends And ? JoinArray<"/", A["name"]["items"]> :
    A["index"] extends number ? `arg_${A["index"]}` :
    A["id"] extends string ? A["id"] :
    // A extends { id: And } ? "okokok" : //JoinArray<"/", A["id"]["items"]> :
    A["id"] extends And ? JoinArray<"/", A["id"]["items"]> :
    A["id"] extends Or ? PickFirst<A["id"]["items"], "error_or_op_not_a_string_1"> :
    A["id"] extends readonly [infer F extends string, ...string[]] ? F :
    `error_key_not_found`;

// ————————————————————————————————————————————————————————
// Value extraction.

/** Process the default value and return its type.
 *  - string‐literal → string
 *  - number‐literal → number
 *  - boolean‐literal → boolean
 *  - readonly [ … ] or Array<…> → (widened) array of the element type
 *  - everything else → itself (e.g. class instances, plain objects, etc.)
 */
type DefaultValueToType<D> =
    // if D is any kind of string literal, make it `string`
    D extends string ? string :
    // if D is any numeric literal, make it `number`
    D extends number ? number :
    // if D is a boolean literal, make it `boolean`
    D extends boolean ? boolean :
    // if D is a readonly tuple/array, infer U and return a plain U[]
    D extends readonly (infer U)[] ? U[] :
    // otherwise, leave D as‐is (e.g. class instances, POJOs, etc.)
    D;

/** Extract the runtime value type of an argument. */
export type ExtractArgValueType<
    A extends InferArgsBase,
    Default extends Cast.Castable = never // default type
> =
    A extends { def: infer D extends undefined | Cast.Value } ? DefaultValueToType<D> :
    // A extends { def: infer D extends Exclude<any, NoDef> } ? WidenDefault<D> :
    // A extends { def: infer D extends Cast.Cast<
    //     A["type"] extends Cast.Castable ? A["type"] : Default
    // > } ? WidenDefault<D> :
    // A extends { enum: infer E extends any[] } ? E[number] :
    A extends { enum: readonly (infer U)[] } ? U :
    A["type"] extends Cast.Castable
        ? Cast.Cast<A["type"], Default>
        : Default; // revert to default.

/** Is the argument optional? */
export type IsOptional<A extends InferArgsBase> =
    // Booleans are never optional since it is always true/false, verified by test at bottom of the file.
    A["type"] extends "boolean" ? false :
    // Explicit `false` ➜ optional
    [A["required"]] extends [false] ? true :
    // Explicit `true` ➜ not optional
    [A["required"]] extends [true] ? false :
    // Callback ➜ we cannot evaluate ➜ optional
    A["required"] extends (...args: any) => any ? true :
    // Default is `undefined` so always optional.
    // Since the default is `string` otherwise a { id: "x", def: undefined } would result in a string.
    A["def"] extends undefined ? true :
    // Missing / `true` ➜ required
    false;

// ————————————————————————————————————————————————————————
// Separating the `AND` operations from identifiers.
// They were joined with a "/" delimiter, now we need to separate them
// In to individual object properties with (recursively) nested attrs.

// 1) Split a string literal by `/`
type Split<S extends string, Delimiter extends string> =
    S extends `${infer Head}${Delimiter}${infer Tail}`
    ? [Head, ...Split<Tail, Delimiter>]
    : [S];

// 2) Given a path tuple ["a","b","c"] and a value V, build
//    { a: { b: { c: V } } }
type Nest<Path extends readonly string[], V> =
    Path extends [infer K extends string, ...infer Rest extends string[]]
    ? Rest['length'] extends 0
    ? { [P in K]: V }
    : { [P in K]: Nest<Rest, V> }
    : V;

// 3) Turn a union of these one-key nested objects into a single intersection
type UnionToIntersection<U> =
    (U extends any ? (u: U) => void : never) extends
    (i: infer I) => void ? I : never;

// 4) FlattenPaths: for each key in T, build its nested object, then intersect them all
export type FlattenPaths<T extends Record<string, any>> =
    // T
    UnionToIntersection<
        { [K in keyof T]: Nest<Split<K & string, "/">, T[K]> }[keyof T]
    >;

// ————————————————————————————————————————————————————————
// Inferring.

/** Infer the arguments from a list of arguments and turn it into an object type. */
export type InferArgs<
    L extends readonly InferArgsBase[]
> = 
    FlattenPaths<{
        [D in L[number] as Snake<Trim<KeyOf<D>>>]:
            IsOptional<D> extends true
                ? ExtractArgValueType<D, "string"> | undefined
                : ExtractArgValueType<D, "string">;
    }>

// ————————————————————————————————————————————————————————
// INTERNAL TESTS
//
// Primitive cast checks – should compile.
const cast_test_nr: Cast.Cast<"number"> = 42;
const cast_test_str: Cast.Cast<"string"> = "hello";
const cast_test_bool_arr: Cast.Cast<"boolean[]"> = [true];
// @ts-expect-error – undefined is not boolean
const cast_test_bool_arr_err: Cast.Cast<"boolean[]"> = [undefined];

// Ok this works.
function test_infer_args<const A extends readonly InferArgsBase[]>(i: A, callback: (a: InferArgs<A>) => void) {}
test_infer_args(
    [

        // Name based.
        { name: "some_def_str" },
        { name: "some_str", type: "string" },
        { name: "some_nr", type: "number" },
        { name: "some_opt_nr", type: "number", required: false },
        {
            name: "some_opt_nr_2",
            type: "number",
            required: () => {
                return true || false;
            },
        },
        { name: "some_list", type: "string[]" },
        { name: "some_bool_list", type: "boolean[]" },

        // Name based.
        { id: "id_some_def_str" },
        { id: "--id_some_str", type: "string" },
        { id: "--id-some-nr", type: "number" },
        { id: "--id_some_opt_nr", type: "number", required: false },
        {
            name: "id_some_opt_nr_2",
            type: "number",
            required: () => {
                return true || false;
            },
        },
        { id: "id_some_list", type: "string[]" },
        { id: "id_some_bool_list", type: "boolean[]" },

        // Index based.
        { index: 0, type: "number" },

        // OR id.
        { id: ["--id_some_or_nr", "-i"], type: "number" },

        // AND id.
        { id: new And("--id_and_1", "--x"), type: "number" },
        { id: new And("--id_and_1", "--y"), type: "boolean" },
        { id: new And("--id_and_2", "--nested", "--x"), type: "number" },
        { id: new And("--id_and_2", "--nested", "--y"), type: "boolean" },
        { id: new And("--id_and_2", "--nested", "--z"), type: "string" },

        // Enum.
        { id: "--some_enum", enum: ["a", "b", "c"] },

        // Omitted type.
        { name: "omitted_type_1" },

        // Optional.
        { name: "some_optional_1", required: false },
        { name: "some_optional_2", def: "some_val" },
        { name: "some_optional_3", def: undefined },

        // Some type+def number, caused error in the past.
        { id: "some_type_plus_def_nr", def: 0, type: "number" },

    ],
    (args) => {

        // Name based.
        const some_def_str: string = args.some_def_str;
        const some_str: string = args.some_str;
        const some_nr: number = args.some_nr;
        // @ts-expect-error – may be undefined
        const some_opt_nr: number = args.some_opt_nr;
        // @ts-expect-error – may be undefined
        const some_opt_nr_2: number = args.some_opt_nr_2;
        const some_list: string[] = args.some_list;
        const some_bool_list: boolean[] = args.some_bool_list;

        // Id based.
        const id_some_def_str: string = args.id_some_def_str;
        const id_some_str: string = args.id_some_str;
        const id_some_nr: number = args.id_some_nr;
        // @ts-expect-error – may be undefined
        const id_some_opt_nr: number = args.id_some_opt_nr;
        // @ts-expect-error – may be undefined
        const id_some_opt_nr_2: number = args.id_some_opt_nr_2;
        const id_some_list: string[] = args.some_list;
        const id_some_bool_list: boolean[] = args.id_some_bool_list;

        // Index based.
        const _index_some_nr: number = args.arg_0;

        // OR operation.
        const id_some_or_nr: number = args.id_some_or_nr;

        // Unknown.
        // @ts-expect-error
        args.unknown;

        // AND operations.
        const id_and_1: { x: number, y: boolean } = args.id_and_1;
        const id_and_2_nested: { x: number, y: boolean, z: string } = args.id_and_2.nested;
        const id_and_2: { nested: { x: number, y: boolean, z: string } } = args.id_and_2;

        // Enum
        const some_enum: "a" | "b" | "c" = args.some_enum;
        // @ts-expect-error
        const some_enum_unknown: "a" | "b" | "c" = args.some_enum_unknown;

        // Omitted type.
        const omitted_type_1: string = args.omitted_type_1;

        // Optional
        // @ts-expect-error – may be undefined
        const some_optional_1: string = args.some_optional_1;
        const some_optional_2: string = args.some_optional_2;
        // @ts-expect-error – is string | undefined
        const some_optional_3: string = args.some_optional_3;

        // Some type+def number, caused error in the past.
        const some_type_plus_def_nr: number = args.some_type_plus_def_nr;
    }
);
  

