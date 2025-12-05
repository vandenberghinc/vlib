/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Utility types to create a Flags generic type that supports a cpp bitwise style union.
 * 
 * See how {@link CLI.Arg} does it.
 */

/**
 * HasFlag<Flags, K> returns `true` if and only if
 * The union type `Flags` contains at least one of the members in `K`.
 * Otherwise it returns `false`.
 * 
 * @nav Types/Flags
 * @docs
 */
export type HasFlag<
    Flags extends string,
    K extends string
> = [Extract<Flags, K>] extends [never]
    ? false
    : true;

/**
 * CastFlag<Flags, K, Present, Missing> returns `Present` if
 * `HasFlag<Flags, K>` is `true`, otherwise it returns `Missing`.
 * 
 * Can be used to cast a flag to a value type, or return a default value if the flag is not present.
 * 
 * @nav Types/Flags
 * @docs
 */
export type CastFlag<
    Flags extends string,
    K extends string,
    Value extends any,
    Default extends any = never
> = HasFlag<Flags, K> extends true
    ? Value
    : Default;

/**
 * RemoveAndAdd<Flags, Remove, Add>
 *
 * Remove all members of `Remove` from `Flags`, then include any in `Add`.
 *
 * @example
 *   type Flags = "a" | "b" | "c";
 *   type X1 = RemoveFlag<Flags, "b">;          // "a" | "c"
 *   type X2 = RemoveFlag<Flags, "b", "d">;     // "a" | "c" | "d"
 * 
 * @nav Types/Flags
 * @docs
*/
export type RemoveFlag<
    Flags extends string,
    Remove extends string,
    Add extends string = never
> = Exclude<Flags, Remove> | Add;

/**
 * ExtractFlag< Flags, Keys, Default = never >
 *
 *   • If `Extract<Flags, Keys>` is `never`, return `Default`.
 *   • Otherwise return `Extract<Flags, Keys>` (i.e. the union of all matching members).
 *
 * Notes:
 *  - `Keys` here is a union of string‐literals (e.g. `"command"|"option"|"query"`).
 *  - If multiple members of `Keys` appear in `Flags`, you will get back a union of all matches.
 *  - If you want “exactly one must match,” you must ensure your `Flags`→`Keys` intersection can never produce more than one member, or else you’ll wind up with a multi‐member union.
 * 
 * @nav Types/Flags
 * @docs
 */
export type ExtractFlag<
    Flags extends string,
    Keys extends string,
    Default = never
> = [Extract<Flags, Keys>] extends [never]
    ? Default
    : Extract<Flags, Keys>;

   
/**
 * Conditionally selects `Then` or `Else` based on whether the flag set `F`
 * contains key `K`.
 *
 * - `F` is a string union representing a set of flags (e.g. `"a" | "b" | "c"`).
 * - `K` may be a single string literal (e.g. `"a"`).
 *   If `K` appears in `F`, this resolves to `Then`; otherwise it resolves to `Else`.
 *
 * @template F  A union of flag names.
 * @template K  One flag name to test for—any overlap with `F` triggers the `Then` branch.
 * @template Then  The type to return when `F` and `K` overlap.
 * @template Else  The type to return when there is no overlap (defaults to `never`).
 * 
 * @note Use a separate class from `IfFlags` since this is more strict and 100% ts safe.
 * 
 * @nav Types/Flags
 * @docs
 */
export type IfFlag<
    F extends string,
    K extends string,
    Then,
    Else = never
> = F extends K ? Then : Else

/**
 * Conditionally selects `Then` or `Else` based on whether the flag set `K`
 * contains any key `F`.
 * 
 * Note that this is the reversed version of `IfFlag`.
 * This can be used to check if one or more flags are present for a single input flag.
 * This is mainly because using `Extract<...>` in this context causes TypeScript issues.
 *
 * @template F  A single flag name.
 * @template K  Multiple flag names to test for—any overlap with `F` triggers the `Then` branch.
 * @template Then  The type to return when `F` and `K` overlap.
 * @template Else  The type to return when there is no overlap (defaults to `never`).
 * 
 * @nav Types/Flags
 * @docs
 */
export type IfFlags<
    F extends string,
    K extends string,
    Then,
    Else = never
> = K extends F ? Then : Else
    // Using `[Extract]` in this context causes ts issues to infer correct variants.
    // [Extract<F, K>] extends [never] ? Else : Then;
