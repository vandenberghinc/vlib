/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
/**
 * String utilities.
 * @name String
 * @docs
 */
declare namespace StringUtils {
    /**
     * Removes common indentation from multiline strings.
     * @docs
     */
    function dedent(data: string | String, allow_empty_first_line?: boolean): string;
    /**
     * Returns the first character of the string.
     * @docs
     */
    function first(data: string | String): string | undefined;
    /**
     * Returns the last character of the string.
     * @docs
     */
    function last(data: string | String): string | undefined;
    /**
     * Gets the first non-whitespace character. Optionally ignores newline as whitespace.
     * @docs
     */
    function first_non_whitespace(data: string | String, line_break?: boolean): string | null;
    /**
     * Gets the last non-whitespace character. Optionally ignores newline as whitespace.
     * @docs
     */
    function last_non_whitespace(data: string | String, line_break?: boolean): string | null;
    /**
     * Gets the first character not in the exclude list, starting from an index.
     * @docs
     */
    function first_not_of(data: string | String, exclude?: string[], start_index?: number): string | null;
    /**
     * Gets the index of the first character not in the exclude list, starting from an index.
     * @docs
     */
    function first_index_not_of(data: string | String, exclude?: string[], start_index?: number): number | null;
    /**
     * Gets the last character not in the exclude list, searching backward.
     * @docs
     */
    function last_not_of(data: string | String, exclude?: string[], start_index?: number): string | null;
    /**
     * Gets the index of the last character not in the exclude list, searching backward.
     * @docs
     */
    function last_index_not_of(data: string | String, exclude?: string[], start_index?: number): number | null;
    /**
     * Inserts a substring at the given index.
     * @docs
     */
    function insert(data: string | String, index: number, substr: string): string;
    /**
     * Removes characters between start and end indices.
     * @docs
     */
    function remove_indices(data: string | String, start: number, end: number): string;
    /**
     * Replaces characters between start and end indices with the given substring.
     * @docs
     */
    function replace_indices(data: string | String, substr: string, start: number, end: number): string;
    /**
     * Checks if the string starts with the given substring at an optional index.
     * @docs
     */
    function eq_first(data: string | String, substr: string, start_index?: number): boolean;
    /**
     * Checks if the string ends with the given substring.
     * @docs
     */
    function eq_last(data: string | String, substr: string): boolean;
    /**
     * Ensures the string ends with one of the given characters, appending the first if not.
     * @docs
     */
    function ensure_last(data: string | String, ensure_last: string): string;
    /**
     * Returns true if all characters are uppercase (digits optional).
     * @docs
     */
    function is_uppercase(data: string | String, allow_digits?: boolean): boolean;
    /**
     * Charsets.
     * @docs
     */
    const charset: {
        /** All uppercase alphabetical characters. */
        uppercase: string;
        uppercase_set: Set<string>;
        /** All lowercase alphabetical characters. */
        lowercase: string;
        lowercase_set: Set<string>;
        /** All digits. */
        digits: string;
        digits_set: Set<string>;
    };
    /**
     * Capitalizes only the first letter of the string.
     * @docs
     */
    function capitalize_word(data: string | String): string;
    /**
     * Capitalizes the first letter of each word separated by whitespace.
     * @docs
     */
    function capitalize_words(data: string | String): string;
    /**
     * Removes all instances of the given character(s) from the string.
     * @docs
     */
    function drop(data: string | String, char: string | string[]): string;
    /**
     * Returns the reversed string.
     * @docs
     */
    function reverse(data: string | String): string;
    /**
     * Generates a random alphanumeric string of the given length.
     * @param length The length of the random string, default is 32.
     * @param charset Optional custom character set to use, default is alphanumeric.
     *                Defaults to `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`.
     * @docs
    */
    function random(length?: number, charset?: string): string;
    /**
     * Returns true if the string contains only digits.
     * @docs
     */
    function is_integer_string(data: string | String): boolean;
    /**
     * Returns true if the string is a valid floating-point representation.
     * @docs
     */
    function is_floating_string(data: string | String): boolean;
    /**
     * Returns info or boolean about numeric string (integer/floating).
     * @docs
     */
    function is_numeric_string(data: string | String, info?: boolean): boolean | {
        integer: boolean;
        floating: boolean;
    };
    /**
     * Removes matching quotes from the ends of the string.
     *
     * @param data The string to unquote.
     *
     * @docs
     */
    function unquote(data: string | String): string;
    function quote(data: undefined | null | string | String, def: undefined): undefined | string;
    function quote(data: undefined | null | string | String, def?: string | String): string;
    /**
     * Truncate a string to max length, the string remains the same
     * if the string's length is below `max`, otherwise its truncated to `max`.
     *
     * @param data The string to limit.
     * @param max The maximum length of the string.
     * @param truncated_suffix Optional suffix to append if the string is truncated, by default the string is truncated without suffix.
     *
     * @docs
     */
    function truncate(data: string | String, max: number, truncated_suffix?: string): string;
}
export { StringUtils as String };
export { StringUtils as string };
/** Extend global string with some basic methods. */
declare global {
    interface String {
        first(): string | undefined;
        last(): string | undefined;
        dedent(allow_empty_first_line?: boolean): string;
    }
}
