/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Change } from 'diff';
/**
 * Detect and log the difference between cached data and new data strings.
 */
export declare function compute_diff({ new: new_data, old, prefix, trim, trim_keep }: {
    /** The new data string to compare against the old data. */
    new: string;
    /** The cached data string to compare against the new data. */
    old: string;
    /** An optional prefix to add to the log messages. When a number is provided, it will be used to create an indent string of that many spaces. */
    prefix?: string | number;
    /** Whether to trim data lines where no edits have been made. Default is true. */
    trim?: boolean;
    /** The number of lines to keep when trimming unchanged lines. Default is 3. */
    trim_keep?: number;
}): {
    status: "identical";
    changes?: never;
    diff?: never;
} | {
    status: "diff";
    changes: Change[];
    diff: string;
};
