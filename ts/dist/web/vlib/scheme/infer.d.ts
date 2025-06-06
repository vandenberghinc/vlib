/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Infer a scheme item to a type.
 */
import type { EntryObject } from "./entry.js";
import type { Cast } from "./cast.js";
/** Process the default value and return its type.
 *  - string‐literal → string
 *  - number‐literal → number
 *  - boolean‐literal → boolean
 *  - readonly [ … ] or Array<…> → (widened) array of the element type
 *  - everything else → itself (e.g. class instances, plain objects, etc.)
 */
type LiteralToType<D> = D extends string ? string : D extends number ? number : D extends boolean ? boolean : D extends readonly (infer U)[] ? U[] : D;
/** Is scheme item optional */
type IsOptional<E extends Cast.Castable | EntryObject> = E extends EntryObject ? [
    E["required"]
] extends [false] ? true : E["required"] extends Function ? true : false : false;
/** Wrap maybe as optional. */
type MaybeOptional<E extends Cast.Castable | EntryObject, T extends any> = IsOptional<E> extends true ? T | undefined : T;
/** Extract the created value type of an entry, recursing into nested schemes & tuples */
export type InferEntry<E extends EntryObject> = E extends {
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
    scheme: infer S extends Record<string, EntryObject | Cast.Castable>;
} ? InferScheme<S> : E extends {
    value_scheme: infer V;
} ? V extends EntryObject | Cast.Castable ? InferValueScheme<V> : never : E extends {
    tuple: infer Tup;
} ? Tup extends readonly (EntryObject | Cast.Castable)[] ? InferTupleScheme<Tup> : never : E["type"] extends Cast.Castable ? Cast<E["type"], "string", undefined> : never;
/** Infer a value scheme */
type InferValueScheme<V extends Infer.ValueScheme.T> = V extends EntryObject ? InferEntry<V>[] : V extends Cast.Castable ? Cast<V, "string", never>[] : never;
/** Extract the value‐type for a normal (named) Scheme.Opts object */
type InferScheme<S extends Infer.Scheme.T> = {
    [K in keyof S]: S[K] extends EntryObject ? MaybeOptional<S[K], InferEntry<S[K]>> : MaybeOptional<S[K], Cast<S[K], never, "string">>;
};
/** Extract the value‐type for a tuple, preserving tuple positions */
type InferTupleScheme<T extends Infer.Tuple.T> = {
    [I in keyof T]: T[I] extends EntryObject ? MaybeOptional<T[I], InferEntry<T[I]>> : MaybeOptional<T[I], Cast<T[I], never, "string">>;
};
/** Public infer module. */
export declare namespace Infer {
    /** Extract the created value type of an entry, recursing into nested schemes & tuples */
    type Entry<T extends Entry.T> = T extends Cast.Castable ? Cast<T, "string", never> : InferEntry<T>;
    namespace Entry {
        /** Base for generic, could be useful for user. */
        type T = EntryObject | Cast.Castable;
    }
    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    type Scheme<T extends Scheme.T> = InferScheme<T>;
    namespace Scheme {
        /** Base for generic, could be useful for user. */
        type T = Record<string, Cast.Castable | EntryObject>;
    }
    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    type ValueScheme<T extends ValueScheme.T> = InferValueScheme<T>;
    namespace ValueScheme {
        /** Base for generic, could be useful for user. */
        type T = Cast.Castable | EntryObject;
    }
    /** Extract the value‐type for a tuple, preserving tuple positions */
    type Tuple<T extends Tuple.T> = InferTupleScheme<T>;
    namespace Tuple {
        /** Base for generic, could be useful for user. */
        type T = readonly (Cast.Castable | EntryObject)[];
    }
}
export { Infer as infer };
