/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Color } from "../system/colors.js";
/**
 * Log an error.
 */
export function error(...err) {
    let str = "";
    err.forEach(e => {
        if (e.stack) {
            str += "\n" + e.stack;
        }
        else {
            str += e.toString();
        }
    });
    str = str.trim();
    if (str.startsWith("Error: ") || str.startsWith("error: ")) {
        str = str.substring(7).trim();
    }
    console.error(`${Color.red("Error")}: ${str}`);
}
/**
 * Throw an error and stop with exit code 1.
 */
export function throw_error(...err) {
    error(...err);
    process.exit(1);
}
//# sourceMappingURL=error.js.map