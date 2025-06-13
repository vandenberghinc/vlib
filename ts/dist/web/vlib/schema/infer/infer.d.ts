/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import type { Entry, Entries, ValueEntries } from "./entry.js";
/** Type alias for a castable readonly entry type.  */
type CastType = Entry.Type.Castable<"readonly">;
/** Process the default value and return its type.
 *  - string‐literal → string
 *  - number‐literal → number
 *  - boolean‐literal → boolean
 *  - readonly [ … ] or Array<…> → (widened) array of the element type
 *  - everything else → itself (e.g. class instances, plain objects, etc.)
 */
type LiteralToType<D> = D extends string ? string : D extends number ? number : D extends boolean ? boolean : D extends readonly (infer U)[] ? U[] : D;
/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends Entry.Opts> = E extends Entry ? E extends {
    default: (obj: any) => infer R;
} ? R : E extends {
    default: infer D;
} ? LiteralToType<D> : E extends {
    def: (obj: any) => infer R;
} ? R : E extends {
    def: infer D;
} ? LiteralToType<D> : E extends {
    enum: infer U extends readonly any[];
} ? U[number] : E extends {
    schema: infer S extends Entries.Opts;
} ? InferEntries<S> : E extends {
    value_schema: infer V extends ValueEntries.Opts;
} ? InferValueEntries<ValueEntriesParentType<E>, V> : E extends {
    tuple: infer Tup extends readonly Entry.Opts[];
} ? InferTupleEntries<Tup> : E["type"] extends CastType ? Entry.Type.Cast<E["type"]> : unknown : E extends CastType ? Entry.Type.Cast<E> : never;
/**
 * Get the parent type for value entries.
 * From the parent entry.
 */
export type ValueEntriesParentType<E extends CastType | Entry, Default extends "array" | "object" = "array"> = E extends CastType ? Entry.Type.Cast<E> extends readonly any[] ? "array" : "object" : E extends Entry ? E extends {
    default: infer D;
} ? LiteralToType<D> extends readonly any[] ? "array" : "object" : E extends {
    def: infer D;
} ? LiteralToType<D> extends readonly any[] ? "array" : "object" : E["type"] extends CastType ? Entry.Type.Cast<E["type"]> extends readonly any[] ? "array" : "object" : Default : Default;
/** Infer a value scheme */
export type InferValueEntries<ParentT extends "array" | "object", V extends ValueEntries.Opts> = V extends Entry ? ParentT extends "array" ? InferEntry<V>[] : Record<string, InferEntry<V>> : V extends CastType ? ParentT extends "array" ? Entry.Type.Cast<V>[] : Record<string, Entry.Type.Cast<V>> : never;
/** Extract the value‐type for a tuple, preserving tuple positions */
export type InferTupleEntries<T extends readonly Entry.Opts[]> = {
    [I in keyof T]: T[I] extends Entry.Opts ? InferEntry<T[I]> : never;
};
/** Is entry optional */
type IsOptional<E extends Entry.Opts> = E extends Entry ? [
    E["required"]
] extends [false] ? true : E["required"] extends Function ? true : false : false;
/** infer the raw value for every key */
type RawEntries<S extends Entries.Opts> = {
    [K in keyof S]: S[K] extends Entry.Opts ? InferEntry<S[K]> : unknown;
};
/** split into an optional‐props & required‐props mapped type */
export type InferEntries<S extends Entries.Opts> = {
    [K in keyof S as IsOptional<S[K]> extends true ? K : never]?: RawEntries<S>[K];
} & {
    [K in keyof S as IsOptional<S[K]> extends true ? never : K]: RawEntries<S>[K];
};
export {};
