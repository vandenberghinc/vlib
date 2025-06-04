/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Change } from 'diff';
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
export declare function diff({ new: new_data, old, log_level, prefix, trim, trim_keep, detected_changes }: {
    new: string;
    old: string;
    log_level?: undefined | number;
    prefix?: string | number;
    trim?: boolean;
    trim_keep?: number;
    detected_changes?: string;
}): {
    status: "identical";
    changes?: never;
} | {
    status: "diff";
    changes: Change[];
};
