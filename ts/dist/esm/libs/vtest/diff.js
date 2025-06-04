/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// External imports.
import { diffLines } from 'diff';
import { Color, debug } from '../../index.js';
/**
 * Log the difference between cached data and new data strings.
 *
 * @param new_data The new data string to compare against the old data.
 * @param old The cached data string to compare against the new data.
 * @param log_level The log level to use for logging the differences. Default is 0.
 * @param prefix An optional prefix to add to the log messages. When a number is provided, it will be used to create an indent string of that many spaces.
 * @param trim Whether to trim data lines where no edits have been made. Default is true.
 * @param trim_keep The number of lines to keep when trimming unchanged lines. Default is 3.
 * @param detected_changes Optional message to log when changes are detected.
 *
 */
export function diff({ new: new_data, old, log_level, prefix = "", trim = true, trim_keep = 3, detected_changes }) {
    // const level = log_level == null ? debugging.Mode.debug : new debugging.ActiveLogLevel(log_level);
    const level = log_level ?? 0;
    if (typeof prefix === 'number') {
        prefix = ' '.repeat(prefix);
    }
    // Completely identical.
    if (old === new_data) {
        if (debug.on(0, level))
            debug.raw(level, prefix, "Old and new data are identical.");
        return { status: "identical" };
    }
    // Otherwise compute a line-by-line diff.
    if (debug.on(0, level))
        debug.raw(level, prefix, detected_changes ?? "Detected changes between old and new data, computing diff...");
    // console.log("---------\n" + old + "\n---------\n" + new_data + "\n---------");
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
    let line_nr = 0;
    diffs.forEach((part, index) => {
        // Line prefix.
        const line_prefix = (part.added
            ? Color.green_bold('+')
            : part.removed
                ? Color.red_bold('-')
                : ' ');
        let local_line_nr = part.removed ? line_nr : undefined;
        // Dump lines.
        let last_dots = false;
        diff_lines[index].walk((line, i, arr) => {
            if (local_line_nr != null) {
                ++local_line_nr;
            }
            else {
                ++line_nr;
            }
            // skip the final empty split after the last newline
            if (i === arr.length - 1 && line === '')
                return;
            // skip no edit lines.
            if (trim && !part.added && !part.removed && !(i < trim_keep || i >= arr.length - trim_keep)) {
                if (!last_dots && (i === trim_keep || i === arr.length - trim_keep - 1)) {
                    if (debug.on(0, level))
                        debug.raw(level, `${whitespace_prefix} ${String().padEnd(max_line_nr_length, ' ')} | ${line_prefix} ${Color.italic("... unchanged ...")}`);
                    last_dots = true;
                }
                return;
            }
            // dump line.
            if (debug.on(0, level))
                debug.raw(level, `${whitespace_prefix} ${String(local_line_nr != null ? local_line_nr : line_nr).padEnd(max_line_nr_length, ' ')} | ${line_prefix} ${line}`);
            last_dots = false;
        });
        --line_nr;
    });
    return { status: "diff", changes: diffs };
}
//# sourceMappingURL=diff.js.map