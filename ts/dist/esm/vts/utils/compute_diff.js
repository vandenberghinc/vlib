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
    const diffs = diffLines(old, new_data).reduce((acc, part) => {
        if (!part.added && !part.removed) {
            const prev = acc[acc.length - 1];
            if (prev && !prev.added && !prev.removed) {
                prev.value += part.value;
                return acc;
            }
        }
        if (part.value !== "")
            acc.push(part);
        return acc;
    }, []);
    // Pre-split lines per diff part (handle \r\n too).
    const diff_lines = diffs.map((part) => part.value.split(/\r?\n/));
    // Pick a stable max line number for padding:
    // we print old numbers for removed lines, and new numbers otherwise.
    const old_total = old.split(/\r?\n/).length - (old.endsWith("\n") || old.endsWith("\r\n") ? 1 : 0);
    const new_total = new_data.split(/\r?\n/).length - (new_data.endsWith("\n") || new_data.endsWith("\r\n") ? 1 : 0);
    const max_line_nr_length = String(Math.max(old_total, new_total, 1)).length;
    const whitespace_prefix = " ".repeat(prefix.length > 1 ? prefix.length - 1 : 0);
    const plus_str = Color.green_bold("+");
    const minus_str = Color.red_bold("-");
    const dumped_lines = [];
    let old_nr = 0;
    let new_nr = 0;
    for (let part_index = 0; part_index < diffs.length; ++part_index) {
        const part = diffs[part_index];
        const line_prefix = part.added ? plus_str : part.removed ? minus_str : " ";
        let last_dots = false;
        const lines = diff_lines[part_index];
        // IMPORTANT: correct loop variables (this was your main regression).
        for (let line_index = 0; line_index < lines.length; ++line_index) {
            const line = lines[line_index];
            // skip final empty split after trailing newline
            if (line_index === lines.length - 1 && line === "")
                continue;
            // advance counters
            if (part.added) {
                ++new_nr;
            }
            else if (part.removed) {
                ++old_nr;
            }
            else {
                ++old_nr;
                ++new_nr;
            }
            // trimming only applies to unchanged parts
            if (trim &&
                !part.added &&
                !part.removed &&
                !(line_index < trim_keep || line_index >= lines.length - trim_keep)) {
                if (!last_dots &&
                    (line_index === trim_keep || line_index === lines.length - trim_keep - 1)) {
                    dumped_lines.push(`${whitespace_prefix} ${"".padEnd(max_line_nr_length, " ")} | ${line_prefix} ${Color.italic("... unchanged ...")}`);
                    last_dots = true;
                }
                continue;
            }
            // choose which number to display in the single column:
            // show old line number for removals, otherwise new line number.
            const display_nr = part.removed ? old_nr : new_nr;
            dumped_lines.push(`${whitespace_prefix} ${String(display_nr).padEnd(max_line_nr_length, " ")} | ${line_prefix} ${line}`);
            last_dots = false;
        }
    }
    return { status: "diff", changes: diffs, diff: dumped_lines.join("\n") };
}
// /**
//  * Detect and log the difference between cached data and new data strings.
//  */
// export function compute_diff_v1({ new: new_data, old, prefix = "", trim = true, trim_keep = 3 }: {
//     /** The new data string to compare against the old data. */
//     new: string,
//     /** The cached data string to compare against the new data. */
//     old: string,
//     /** An optional prefix to add to the log messages. When a number is provided, it will be used to create an indent string of that many spaces. */
//     prefix?: string | number,
//     /** Whether to trim data lines where no edits have been made. Default is true. */
//     trim?: boolean,
//     /** The number of lines to keep when trimming unchanged lines. Default is 3. */
//     trim_keep?: number,
// }): { status: "identical", changes?: never, diff?: never } | { status: "diff", changes: Change[], diff: string } {
//     if (typeof prefix === 'number') { prefix = ' '.repeat(prefix); }
//     // Completely identical.
//     if (old === new_data) {
//         return { status: "identical" };
//     }
//     // Otherwise compute a line-by-line diff.
//     const diffs: Change[] = diffLines(old, new_data)
//         // Join subsequent unchanged chunks of text.
//         .reduce<Change[]>((acc, part) => {
//             if (!part.added && !part.removed) {
//                 const prev = acc[acc.length - 1];
//                 if (prev && !prev.added && !prev.removed) {
//                     prev.value += part.value;
//                     return acc;
//                 }
//             }
//             if (part.value !== '') { acc.push(part); }
//             return acc;
//         }, []);
//     // Split all lines since we need to know the line number padding.
//     let line_count = 0;
//     const diff_lines: string[][] = diffs.map(part => {
//         const s = part.value.split('\n')
//         line_count += s.length - 1; // -1 for the final empty line.
//         return s;
//     });
//     const max_line_nr_length = String(line_count).length;
//     const whitespace_prefix = ' '.repeat(prefix.length > 1 ? prefix.length - 1 : 0);
//     const dumped_lines: string[] = [];
//     const plus_str = Color.green_bold('+');
//     const minus_str = Color.red_bold('-');
//     let line_nr = 0;
//     for (let index = 0; index < diffs.length; ++index) {
//         const part = diffs[index];
//         // Line prefix.
//         const line_prefix = (part.added
//             ? plus_str
//             : part.removed
//                 ? minus_str
//                 : ' ');
//         let local_line_nr = part.removed ? line_nr : undefined;
//         // Dump lines.
//         let last_dots = false;
//         const iter_diff_lines = diff_lines[index];
//         for (let line_index = 0; index < iter_diff_lines.length; ++index) {
//             const line = iter_diff_lines[line_index];
//             if (local_line_nr != null) {
//                 ++local_line_nr;
//             } else {
//                 ++line_nr;
//             }
//             // skip the final empty split after the last newline
//             if (line_index === iter_diff_lines.length - 1 && line === '') continue;
//             // skip no edit lines.
//             if (trim && !part.added && !part.removed && !(
//                 line_index < trim_keep || line_index >= iter_diff_lines.length - trim_keep
//             )) {
//                 if (!last_dots && (line_index === trim_keep || line_index === iter_diff_lines.length - trim_keep - 1)) {
//                     dumped_lines.push(`${whitespace_prefix} ${String().padEnd(max_line_nr_length, ' ')} | ${line_prefix} ${Color.italic("... unchanged ...")}`);
//                     last_dots = true;
//                 }
//                 continue;
//             }
//             // dump line.
//             dumped_lines.push(`${whitespace_prefix} ${String(local_line_nr != null ? local_line_nr : line_nr).padEnd(max_line_nr_length, ' ')} | ${line_prefix} ${line}`);
//             last_dots = false;
//         };
//         --line_nr;
//     };
//     return { status: "diff", changes: diffs, diff: dumped_lines.join('\n') };
// }
//# sourceMappingURL=compute_diff.js.map