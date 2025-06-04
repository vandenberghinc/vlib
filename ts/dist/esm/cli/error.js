/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Spinners } from "../debugging/spinners.js";
import { Color, Colors } from "../system/colors.js";
/**
 * An CLI error.
 */
export class CLIError extends globalThis.Error {
    /** The error name. */
    name = "CLIError";
    /** The message string. */
    message;
    /** The attached docs from `CLI.docs()`. */
    docs;
    /** The cli identifier where this error is attached to. */
    id;
    /** An optionally nested error rethrown as a CLI error. */
    error;
    /** Constructor. */
    constructor(message, opts) {
        super(message);
        this.message = message;
        if (opts) {
            this.docs = opts.docs;
            this.id = opts.id;
            this.error = opts.error;
        }
    }
    /** Dump an `Error` stack */
    add_error_stack(lines, // the lines to dump the error stack to
    error, // the error to dump
    nested_depth = 0, // the current nested depth, for instance when dumping `this.error` then nested depth is 1.
    id // the command that caused the error, if any
    ) {
        const indent = nested_depth === 0 ? "" : " ".repeat(nested_depth * 4);
        lines.push(indent
            + Color.red(typeof error.name === "string" ? error.name : "Error")
            + (id ? " " + Color.gray(`[${id}]`) : "")
            + `: ${error.message ?? error}`);
        if (error.stack) {
            // const lines = Code.Iterator.slice_lines(error.stack);
            const split = error.stack.split("\n");
            if (split.length > 1) {
                for (let i = 1; i < split.length; i++) {
                    lines.push(indent + split[i]);
                }
            }
            else {
                lines.push(...split.map(l => indent + l));
            }
        }
    }
    /** Dump to console. */
    dump() {
        const lines = [];
        if (this.docs) {
            lines.push(this.docs + "\n");
        }
        this.add_error_stack(lines, this, 0, this.id);
        if (this.error) {
            // this.add_error_stack(lines, this.error, 1);
            this.add_error_stack(lines, this.error, 0);
        }
        if (Spinners.has_active()) {
            console.log();
        }
        console.error(Colors.end + lines.join("\n"));
    }
}
// /**
//  * Log an error.
//  */
// export function error(...err: any[]): void {
//     let str = "";
//     err.forEach(e => {
//         if (e instanceof Error && e.stack) {
//             str += "\n" + e.stack;
//         } else {
//             str += e.toString();
//         }
//     });
//     str = str.trim();
//     if (str.startsWith("Error: ") || str.startsWith("error: ")) {
//         str = str.substring(7).trim();
//     }
//     console.error(`${Color.red("Error")}: ${str}`);
// }
// /**
//  * Throw an error and stop with exit code 1.
//  */
// export function throw_error(...err: any[]): never {
//     error(...err);
//     process.exit(1);
// }
//# sourceMappingURL=error.js.map