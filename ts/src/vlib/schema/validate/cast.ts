/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/**
 * Cast types.
 * @nav Schema
 * @docs
 */
export namespace Cast {

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
    export function boolean(str: string, opts: boolean.Opts<"preserve">): boolean | string;
    export function boolean(str: string, opts?: boolean.Opts<"strict">): boolean | undefined;
    export function boolean(str: string, opts?: boolean.Opts): boolean | string | undefined {
        switch (str) {
            case "true":
            case "True":
            case "TRUE":
            case "1":
                return true;
            case "false":
            case "False":
            case "FALSE":
            case "0":
                return false;
            default:
                if (opts?.preserve) {
                    /**
                     * @warning let `preserve` precede `strict`.
                     * The `Entry.cast` attribute expects this as well when it defines both preserve
                     * and strict as `true` when casting a boolean type `Entry.cast` to a univeral options object.
                     */
                    return str;
                }
                if (opts?.strict as boolean !== false) {
                    return undefined;
                }
                return false;
        }
    }
    export namespace boolean {
        export type Opts<M extends "preserve" | "strict" = "preserve" | "strict"> =
            M extends "preserve" ? { preserve: true, strict?: false } :
            M extends "strict" ? { preserve?: false, strict: true } :
            never;
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
    export function number(str: string, opts: number.Opts<"preserve">): string | number;
    export function number(str: string, opts?: number.Opts<"strict">): number | undefined;
    export function number(str: string, opts?: number.Opts): string | number | undefined {
        if (opts?.strict !== false) {
            // const regex = /^[+-]?\d+(\.\d+)?$/;
            // if (!regex.test(str)) {
            if (!is_number(str)) {
                if (opts?.preserve) {
                    return str;
                }
                return undefined;
            }
        }
        const num = Number(str);
        if (isNaN(num)) {
            if (opts?.preserve) {
                return str;
            }
            return undefined;
        }
        return num;
    }
    export namespace number {
        export type Opts<M extends "preserve" | "strict" = "preserve" | "strict"> =
            M extends "preserve" ? { preserve: true, strict?: boolean } :
            M extends "strict" ? { preserve?: boolean, strict: true } :
            never
    }

    /**
     * Returns true if `s` is a valid signed decimal integer or float:
     *   [+|-]?digits[.digits]?
     * No exponents, no hex, no leading/trailing whitespace.
     * @docs
     */
    export function is_number(s: string): boolean {
        const len = s.length;
        if (len === 0) return false;

        let i = 0;
        const first = s.charCodeAt(0);

        // Optional leading + or -
        if (first === 43 /* '+' */ || first === 45 /* '-' */) {
            if (len === 1) return false;  // just "+" or "-" is invalid
            i++;
        }

        let sawDigits = false;
        // Scan integer part
        while (i < len) {
            const c = s.charCodeAt(i);
            if (c >= 48 && c <= 57) { // '0'..'9'
                sawDigits = true;
                i++;
            } else {
                break;
            }
        }

        // Fractional part
        if (i < len && s.charCodeAt(i) === 46 /* '.' */) {
            i++;
            let sawFrac = false;
            while (i < len) {
                const c = s.charCodeAt(i);
                if (c >= 48 && c <= 57) {
                    sawFrac = true;
                    i++;
                } else {
                    break;
                }
            }
            // Must have at least one digit either before or after the dot
            if (!sawDigits && !sawFrac) return false;
        } else if (!sawDigits) {
            // No dot and no integer digits = invalid
            return false;
        }

        // We must have consumed the whole string
        return i === len;
    }

}
export { Cast as cast }; // snake_case compatibility.