/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// --------------------------------------------------------------------------------------

// // ✅ Okay:
// const ok: Foo = {
//     path: "/tmp",
//     foo: 42,
// };
// // ❌ Error: `extra` is not in `{ path; foo }`
// const bad: Foo = {
//     path: "/tmp",
//     extra: "oops",
// };
// // ❌ Error: should not be castable
// const castable: { path: string, data: string } = { path: "/tmp", data: "" };
// const bad_2: Foo = castable;





// /**
//  * Neverify keys K (set to never) in each object type in T.
//  */
// export type NeverifyFor<
//     T extends object,
//     K extends PropertyKey
// > = TransformFor<
//     T,
//     never,
//     never,
//     K,
//     {},
//     never
// >;

// /**
//  * Make keys K optional in each object type in T.

//  @todo GENERATE BETTER DOCS HERE 
//  */
// export type OptionalFor<
//     T extends object,
//     K extends PropertyKey
// > = TransformFor<
//     T,
//     never,
//     K,
//     never,
//     {},
//     never
// >;

// /**
// * Apply `AtLeastOne` to each member of a union type T.
// * Distributes over unions of T automatically.
// *
// * @template T - The union of object types to enforce.
// * @template K - Subset of keys in T that at least one must be present.
// */
// export type EnforceOneFor<
//     T,
//     K extends PropertyKey
// > = [Extract<K, keyof T>] extends [never]
//     ? T
//     : EnforceOne<T, Extract<K, keyof T>>;

// /**
//  * Type transformer utility type to transform an object type and enforce that at least one key is present.
//  * @template T - The source object type (or union of object types).
//  * @template Req - Keys of `T` to make required. Defaults to never.
//  * @template Opt - Keys of `T` to make optional. Defaults to never.
//  * @template Nev - Keys of `T` to nullify (optional never). Defaults to never.
//  * @template Override - Additional overrides or new properties to merge in. Defaults to {}.
//  * @template EnfrcOne - Keys of `T` among which at least one must be present. Defaults to never.
//  *
//  * Distributes over unions in `T`.
//  *
//  * @example
//  * ```ts
//  * interface Foo {
//  *   a?: string;
//  *   b: number;
//  *   c: boolean;
//  *   d: number;
//  *   e: Date;
//  *   f: string;
//  * }
//  * type E = Transform<
//  *   Foo,           // input type
//  *   'a',           // make required
//  *   'b',           // make optional
//  *   'c' | 'd',     // make null
//  *   { f: number }, // override attributes
//  *   'a' | 'b'      // enforce at least one of these keys present
//  * >;
//  * ```
//  */
// export type Transform<
//     T,
//     Req extends keyof T,
//     Opt extends keyof T,
//     Nev extends keyof T,
//     Override extends object,
//     EnfrcOne extends keyof T = never
// > = T extends any
//     ? [EnfrcOne] extends [never]
//     // no enforcement keys: just do the merge
//     ? Merge<
//         Omit<T, Req | Opt | Nev>
//         & Required<Pick<T, Req>>
//         & Partial<Pick<T, Opt>>
//         & { [K in Nev]?: never },
//         Override
//     >
//     // enforcement keys present: apply EnforceOneFor
//     : EnforceOneFor<
//         Merge<
//             Omit<T, Req | Opt | Nev>
//             & Required<Pick<T, Req>>
//             & Partial<Pick<T, Opt>>
//             & { [K in Nev]?: never },
//             Override
//         >,
//         EnfrcOne
//     >
//     : never;

// /**
//  * Apply `Transform` to each member of a union type T when T is an object.
//  * Non-object variants (e.g., undefined) are passed through unchanged.
//  * Distributes over unions of T automatically.
//  *
//  * @template T - The union of types to transform; object variants are transformed.
//  * @template Req - Keys to make required.
//  * @template Opt - Keys to make optional.
//  * @template Nev - Keys to nullify.
//  * @template Override - Overrides or additional properties.
//  * @template EnfrcOne - Creates additional type variants where at least one of these keys is present.
//  */
// export type TransformFor<
//     T extends object | never,
//     Req extends PropertyKey,
//     Opt extends PropertyKey,
//     Nev extends PropertyKey,
//     Override extends object,
//     EnfrcOne extends PropertyKey = never
// > = NonNullable<Transform<
//     T,
//     Extract<Req, keyof T>,
//     Extract<Opt, keyof T>,
//     Extract<Nev, keyof T>,
//     Override,
//     Extract<EnfrcOne, keyof T>
// >>;

