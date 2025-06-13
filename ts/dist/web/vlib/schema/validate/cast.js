/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** Cast types. */
export var Cast;
(function (Cast) {
    function boolean(str, opts) {
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
                if (opts?.strict !== false) {
                    return undefined;
                }
                return false;
        }
    }
    Cast.boolean = boolean;
    function number(str, opts) {
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
    Cast.number = number;
    /**
     * Returns true if `s` is a valid signed decimal integer or float:
     *   [+|-]?digits[.digits]?
     * No exponents, no hex, no leading/trailing whitespace.
     */
    function is_number(s) {
        const len = s.length;
        if (len === 0)
            return false;
        let i = 0;
        const first = s.charCodeAt(0);
        // Optional leading + or -
        if (first === 43 /* '+' */ || first === 45 /* '-' */) {
            if (len === 1)
                return false; // just "+" or "-" is invalid
            i++;
        }
        let sawDigits = false;
        // Scan integer part
        while (i < len) {
            const c = s.charCodeAt(i);
            if (c >= 48 && c <= 57) { // '0'..'9'
                sawDigits = true;
                i++;
            }
            else {
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
                }
                else {
                    break;
                }
            }
            // Must have at least one digit either before or after the dot
            if (!sawDigits && !sawFrac)
                return false;
        }
        else if (!sawDigits) {
            // No dot and no integer digits = invalid
            return false;
        }
        // We must have consumed the whole string
        return i === len;
    }
    Cast.is_number = is_number;
})(Cast || (Cast = {}));
export { Cast as cast }; // snake_case compatibility.
//# sourceMappingURL=cast.js.map