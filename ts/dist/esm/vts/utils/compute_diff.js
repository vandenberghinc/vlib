/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// External imports.
import { diffLines } from 'diff';
import { Color } from "../../vlib/index.js";
/**
 * Detect and log the difference between cached data and new data strings.
 */
export function compute_diff({ new: new_data, old, prefix = "", trim = true, trim_keep = 3 }) {
    if (typeof prefix === 'number') {
        prefix = ' '.repeat(prefix);
    }
    // Completely identical.
    if (old === new_data) {
        return { status: "identical" };
    }
    // Otherwise compute a line-by-line diff.
    const diffs = diffLines(old, new_data)
        // Join subsequent unchanged chunks of text.
        .reduce((acc, part) => {
        if (!part.added && !part.removed) {
            const prev = acc[acc.length - 1];
            if (prev && !prev.added && !prev.removed) {
                prev.value += part.value;
                return acc;
            }
        }
        if (part.value !== '') {
            acc.push(part);
        }
        return acc;
    }, []);
    // Split all lines since we need to know the line number padding.
    let line_count = 0;
    const diff_lines = diffs.map(part => {
        const s = part.value.split('\n');
        line_count += s.length - 1; // -1 for the final empty line.
        return s;
    });
    const max_line_nr_length = String(line_count).length;
    const whitespace_prefix = ' '.repeat(prefix.length > 1 ? prefix.length - 1 : 0);
    const dumped_lines = [];
    const plus_str = Color.green_bold('+');
    const minus_str = Color.red_bold('-');
    let line_nr = 0;
    for (let index = 0; index < diffs.length; ++index) {
        const part = diffs[index];
        // Line prefix.
        const line_prefix = (part.added
            ? plus_str
            : part.removed
                ? minus_str
                : ' ');
        let local_line_nr = part.removed ? line_nr : undefined;
        // Dump lines.
        let last_dots = false;
        const iter_diff_lines = diff_lines[index];
        for (let line_index = 0; index < iter_diff_lines.length; ++index) {
            const line = iter_diff_lines[line_index];
            if (local_line_nr != null) {
                ++local_line_nr;
            }
            else {
                ++line_nr;
            }
            // skip the final empty split after the last newline
            if (line_index === iter_diff_lines.length - 1 && line === '')
                continue;
            // skip no edit lines.
            if (trim && !part.added && !part.removed && !(line_index < trim_keep || line_index >= iter_diff_lines.length - trim_keep)) {
                if (!last_dots && (line_index === trim_keep || line_index === iter_diff_lines.length - trim_keep - 1)) {
                    dumped_lines.push(`${whitespace_prefix} ${String().padEnd(max_line_nr_length, ' ')} | ${line_prefix} ${Color.italic("... unchanged ...")}`);
                    last_dots = true;
                }
                continue;
            }
            // dump line.
            dumped_lines.push(`${whitespace_prefix} ${String(local_line_nr != null ? local_line_nr : line_nr).padEnd(max_line_nr_length, ' ')} | ${line_prefix} ${line}`);
            last_dots = false;
        }
        ;
        --line_nr;
    }
    ;
    return { status: "diff", changes: diffs, diff: dumped_lines.join('\n') };
}
//# sourceMappingURL=compute_diff.js.map