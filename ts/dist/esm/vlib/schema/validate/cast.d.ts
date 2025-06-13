/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** Cast types. */
export declare namespace Cast {
    /**
     * Cast a boolean string to a boolean value.
     * So all `true True TRUE 1` strings will be cast to true and likewise for false.
     *
     * @param str - The string to parse.
     * @param opts.preserve
     *      When true a failed parse will return the original string.
     *      When `preserve` always precedes option `opts.strict`.
     * @param opts.strict
     *      When true, undefined will be returned when the string is not a valid boolean. Defaults to `true`.
     * @note That `opts.preserve` and `opts.strict` can not be combined, in this case `opts.preverve` precedes `opts.strict`.
     * @returns the parsed boolean or undefined when the string is not a valid boolean.
     *
     * @docs
     */
    function boolean(str: string, opts: boolean.Opts<"preserve">): boolean | string;
    function boolean(str: string, opts?: boolean.Opts<"strict">): boolean | undefined;
    namespace boolean {
        type Opts<M extends "preserve" | "strict" = "preserve" | "strict"> = M extends "preserve" ? {
            preserve: true;
            strict?: false;
        } : M extends "strict" ? {
            preserve?: false;
            strict: true;
        } : never;
    }
    /**
     * Try to parse a number from a string, optionally strict with a lookup check.
     * @param str The string to parse.
     * @param opts.strict
     *      When true a check will be performed to determine if the string is a valid number. Defaults to `true`.
     * @param opts.preserve
     *      When true a failed parse will return the original string.
     * @docs
     */
    function number(str: string, opts: number.Opts<"preserve">): string | number;
    function number(str: string, opts?: number.Opts<"strict">): number | undefined;
    namespace number {
        type Opts<M extends "preserve" | "strict" = "preserve" | "strict"> = M extends "preserve" ? {
            preserve: true;
            strict?: boolean;
        } : M extends "strict" ? {
            preserve?: boolean;
            strict: true;
        } : never;
    }
    /**
     * Returns true if `s` is a valid signed decimal integer or float:
     *   [+|-]?digits[.digits]?
     * No exponents, no hex, no leading/trailing whitespace.
     */
    function is_number(s: string): boolean;
}
export { Cast as cast };
