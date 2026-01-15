/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Color, Colors } from '../generic/colors.js';
import { ObjectUtils } from '../primitives/object.js';
/**
 * Format an error into a string with optional colors and depth.
 * Similar to node utils, but for node and browser.
 *
 * @nav Errors
 * @docs
 */
export function format_error(err, options) {
    // Setup.
    const max_depth = options?.depth ?? 5;
    const current_depth = options?.current_depth ?? 0;
    const indent_size = options?.indent ?? 2;
    const start_indent = ((options?.start_indent ?? 0) * indent_size) + (current_depth * indent_size);
    const attrs_indent = " ".repeat(start_indent + indent_size);
    const colored = options?.colored ?? false;
    // Format stack.
    let data = err.stack ?? `${err.name}: ${err.message}`;
    data = data.split("\n").map((line, index) => {
        if (index === 0)
            return line;
        line = line.trimStart();
        if (colored && line.startsWith("at ")) {
            line = Colors.gray + line + Colors.end;
        }
        return attrs_indent + line;
    }).join("\n");
    if (colored) {
        if (options?.type === "warning") {
            data = data.replaceAll(/^Error: /gm, `${Color.yellow("Error")}: `);
        }
        else {
            data = data.replaceAll(/^Error: /gm, `${Color.red("Error")}: `);
        }
    }
    // Format attributes.
    let keys = Object.keys(err);
    if (err.cause != null)
        keys.push("cause");
    let index = -1;
    for (const key of keys) {
        ++index;
        if (key === "name" || key === "message" || key === "stack" || (key === "cause" && index < keys.length - 1 // ensure cause is only processed at the end.
        )) {
            continue;
        }
        const raw_value = err[key];
        let value;
        if (raw_value instanceof Error) {
            if (current_depth + 1 >= max_depth) {
                value = "[Truncated Error]";
            }
            else {
                value = format_error(raw_value, {
                    colored,
                    depth: max_depth,
                    current_depth: current_depth + 1,
                    indent: indent_size,
                    type: options?.type,
                    start_indent: options?.start_indent,
                });
            }
        }
        else {
            value = ObjectUtils.stringify(raw_value, {
                indent: indent_size,
                start_indent: current_depth + 1,
                max_depth: max_depth === -1 ? undefined : max_depth,
                max_length: 10_000,
                json: false,
                colored,
            });
        }
        data += `\n${attrs_indent}${key}: ${value}`;
        // data += `\n${attrs_indent}${colored ? Color.cyan(key) : key}: ${value}`;
    }
    ;
    return data;
}
//# sourceMappingURL=format.js.map