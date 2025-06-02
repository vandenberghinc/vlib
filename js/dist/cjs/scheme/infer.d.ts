/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Infer a scheme item to a type.
 */
import type { EntryObject } from "./entry.js";
import type { Cast } from "./cast.js";
import type { Scheme } from "./scheme.js";
/** Is scheme item optional */
type IsOptional<E extends Cast.Castable | EntryObject> = E extends EntryObject ? [
    E["required"]
] extends [false] ? true : E["required"] extends Function ? true : false : false;
/** Wrap maybe as optional. */
type MaybeOptional<E extends Cast.Castable | EntryObject, T extends any> = IsOptional<E> extends true ? T | undefined : T;
/** Wrap in an object or record type if based on object/array type. */
type ValueSchemeHelper<E extends EntryObject, V extends Cast.Value> = E["type"] extends "object" ? Record<string, V> : V[];
/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends EntryObject> = E extends {
    default: (obj: any) => infer R;
} ? R : E extends {
    default: infer D;
} ? D : E extends {
    def: (obj: any) => infer R;
} ? R : E extends {
    def: infer D;
} ? D : E extends {
    enum: infer U extends readonly any[];
} ? U[number] : E extends {
    scheme: infer S extends Scheme.Opts;
} ? InferScheme<S> : E extends {
    value_scheme: infer V;
} ? V extends EntryObject ? ValueSchemeHelper<E, InferEntry<V>> : V extends Cast.Castable ? ValueSchemeHelper<E, Cast<V, "string", undefined>> : never : E extends {
    tuple: infer Tup;
} ? Tup extends readonly (EntryObject | Cast.Castable)[] ? InferTupleScheme<Tup> : never : E["type"] extends Cast.Castable ? Cast<E["type"], "string", undefined> : never;
/** Extract the value‐type for a normal (named) Scheme.Opts object */
export type InferScheme<S extends Record<string, EntryObject | Cast.Castable>> = {
    [K in keyof S]: S[K] extends EntryObject ? MaybeOptional<S[K], InferEntry<S[K]>> : MaybeOptional<S[K], Cast<S[K], never, "string">>;
};
/** Extract the value‐type for a tuple, preserving tuple positions */
export type InferTupleScheme<T extends readonly (EntryObject | Cast.Castable)[]> = {
    [I in keyof T]: T[I] extends EntryObject ? MaybeOptional<T[I], InferEntry<T[I]>> : MaybeOptional<T[I], Cast<T[I], never, "string">>;
};
export {};
