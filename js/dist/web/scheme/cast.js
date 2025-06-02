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
                    return str;
                }
                if (opts?.strict) {
                    return undefined;
                }
                return false;
        }
    }
    Cast.boolean = boolean;
    function number(str, opts) {
        if (opts?.strict) {
            const regex = /^[+-]?\d+(\.\d+)?$/;
            if (!regex.test(str)) {
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
})(Cast || (Cast = {}));
export { Cast as cast }; // snake_case compatibility.
//# sourceMappingURL=cast.js.map