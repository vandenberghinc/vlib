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
namespace StringUtils {
    /**
     * Removes common indentation from multiline strings.
     * @docs
     */
    export function dedent(data: string | String, allow_empty_first_line = false): string {
        
        // Allow empty first line.
        if (allow_empty_first_line) {
            const line_break = data.indexOf("\n");
            if (line_break !== -1) {
                data = data.slice(line_break + 1);
            } else {
                data = data.trimStart();
            }
        }

        // Split the string into lines.
        const lines = data.split('\n');

        // Find minimum indentation.
        const indent = lines
            .filter(line => line.trim())
            .map(line => line.match(/^[ \t]*/)?.[0].length ?? Infinity)
            .reduce((min, curr) => Math.min(min, curr), Infinity);

        // Remove common indentation.
        return lines
            .map(line => line.slice(indent))
            .join('\n')
            .trim();
    }

    /**
     * Returns the first character of the string.
     * @docs
     */
    export function first(data: string | String): string | undefined {
        return (data as string)[0];
    }

    /**
     * Returns the last character of the string.
     * @docs
     */
    export function last(data: string | String): string | undefined {
        const s = data as string;
        return s[s.length - 1];
    }

    /**
     * Gets the first non-whitespace character. Optionally ignores newline as whitespace.
     * @docs
     */
    export function first_non_whitespace(data: string | String, line_break = false): string | null {
        const s = data as string;
        for (let i = 0; i < s.length; i++) {
            const char = s.charAt(i);
            if (char !== " " && char !== "\t" && (!line_break || char !== "\n")) {
                return char;
            }
        }
        return null;
    }

    /**
     * Gets the last non-whitespace character. Optionally ignores newline as whitespace.
     * @docs
     */
    export function last_non_whitespace(data: string | String, line_break = false): string | null {
        const s = data as string;
        for (let i = s.length - 1; i >= 0; i--) {
            const char = s.charAt(i);
            if (char !== " " && char !== "\t" && (!line_break || char !== "\n")) {
                return char;
            }
        }
        return null;
    }

    /**
     * Gets the first character not in the exclude list, starting from an index.
     * @docs
     */
    export function first_not_of(data: string | String, exclude: string[] = [], start_index = 0): string | null {
        const s = data as string;
        for (let i = start_index; i < s.length; i++) {
            if (!exclude.includes(s.charAt(i))) return s.charAt(i);
        }
        return null;
    }

    /**
     * Gets the index of the first character not in the exclude list, starting from an index.
     * @docs
     */
    export function first_index_not_of(data: string | String, exclude: string[] = [], start_index = 0): number | null {
        const s = data as string;
        for (let i = start_index; i < s.length; i++) {
            if (!exclude.includes(s.charAt(i))) return i;
        }
        return null;
    }

    /**
     * Gets the last character not in the exclude list, searching backward.
     * @docs
     */
    export function last_not_of(data: string | String, exclude: string[] = [], start_index: number = -1): string | null {
        const s = data as string;
        let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
        for (let i = idx; i >= 0; i--) {
            if (!exclude.includes(s.charAt(i))) return s.charAt(i);
        }
        return null;
    }

    /**
     * Gets the index of the last character not in the exclude list, searching backward.
     * @docs
     */
    export function last_index_not_of(data: string | String, exclude: string[] = [], start_index: number = -1): number | null {
        const s = data as string;
        let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
        for (let i = idx; i >= 0; i--) {
            if (!exclude.includes(s.charAt(i))) return i;
        }
        return null;
    }

    /**
     * Inserts a substring at the given index.
     * @docs
     */
    export function insert(data: string | String, index: number, substr: string): string {
        const s = data as string;
        return s.slice(0, index) + substr + s.slice(index);
    }

    /**
     * Removes characters between start and end indices.
     * @docs
     */
    export function remove_indices(data: string | String, start: number, end: number): string {
        const s = data as string;
        return s.slice(0, start) + s.slice(end);
    }

    /**
     * Replaces characters between start and end indices with the given substring.
     * @docs
     */
    export function replace_indices(data: string | String, substr: string, start: number, end: number): string {
        const s = data as string;
        return s.slice(0, start) + substr + s.slice(end);
    }

    /**
     * Checks if the string starts with the given substring at an optional index.
     * @docs
     */
    export function eq_first(data: string | String, substr: string, start_index = 0): boolean {
        const s = data as string;
        if (start_index + substr.length > s.length) return false;
        return s.substr(start_index, substr.length) === substr;
    }

    /**
     * Checks if the string ends with the given substring.
     * @docs
     */
    export function eq_last(data: string | String, substr: string): boolean {
        const s = data as string;
        if (substr.length > s.length) return false;
        return s.slice(s.length - substr.length) === substr;
    }

    /**
     * Ensures the string ends with one of the given characters, appending the first if not.
     * @docs
     */
    export function ensure_last(data: string | String, ensure_last: string): string {
        const s = data as string;
        if (!ensure_last.includes(s.charAt(s.length - 1))) return s + ensure_last.charAt(0);
        return s;
    }

    /**
     * Returns true if all characters are uppercase (digits optional).
     * @docs
     */
    export function is_uppercase(data: string | String, allow_digits = false): boolean {
        const set = allow_digits ? is_uppercase_plus_num_set : charset.uppercase_set;
        for (let i = 0; i < data.length; i++) {
            if (!set.has(data.charAt(i))) return false;
        }
        return true;
    }
    const is_uppercase_plus_num_set = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(''));

    /**
     * Charsets.
     * @docs
     */
    export const charset = {

        /** All uppercase alphabetical characters. */
        uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        uppercase_set: new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')),

        /** All lowercase alphabetical characters. */
        lowercase: "abcdefghijklmnopqrstuvwxyz",
        lowercase_set: new Set("abcdefghijklmnopqrstuvwxyz".split('')),

        /** All digits. */
        digits: "0123456789",
        digits_set: new Set("0123456789".split('')),
    };

    /**
     * Capitalizes only the first letter of the string.
     * @docs
     */
    export function capitalize_word(data: string | String): string {
        const s = data as string;
        if (charset.lowercase_set.has(s.charAt(0))) return s.charAt(0).toUpperCase() + s.slice(1);
        return s;
    }

    /**
     * Capitalizes the first letter of each word separated by whitespace.
     * @docs
     */
    export function capitalize_words(data: string | String): string {
        return (data as string).split(/(\s+)/).map(part => /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('');
    }

    /**
     * Removes all instances of the given character(s) from the string.
     * @docs
     */
    export function drop(data: string | String, char: string | string[]): string {
        const exclude = Array.isArray(char) ? char : [char];
        return [...(data as string)].filter(c => !exclude.includes(c)).join('');
    }

    /**
     * Returns the reversed string.
     * @docs
     */
    export function reverse(data: string | String): string {
        return (data as string).split('').reverse().join('');
    }

    /**
     * Generates a random alphanumeric string of the given length.
     * @param length The length of the random string, default is 32.
     * @param charset Optional custom character set to use, default is alphanumeric.
     *                Defaults to `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`.
     * @docs
    */
   export function random(length = 32, charset?: string): string {
       let result = '';
       if (charset) {
           for (let i = 0; i < length; i++) result += charset.charAt(Math.floor(Math.random() * charset.length));
        } else {
            for (let i = 0; i < length; i++) result += default_random_charset.charAt(Math.floor(Math.random() * default_random_charset.length));
        }
        return result;
    }
    const default_random_charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    /**
     * Returns true if the string contains only digits.
     * @docs
     */
    export function is_integer_string(data: string | String): boolean {
        return /^[0-9]+$/.test(data as string);
    }

    /**
     * Returns true if the string is a valid floating-point representation.
     * @docs
     */
    export function is_floating_string(data: string | String): boolean {
        return /^[0-9]*\.[0-9]+$/.test(data as string);
    }

    /**
     * Returns info or boolean about numeric string (integer/floating).
     * @docs
     */
    export function is_numeric_string(data: string | String, info = false): boolean | { integer: boolean; floating: boolean } {
        const s = data as string;
        const integer = /^[0-9]+$/.test(s);
        const floating = /^[0-9]*\.[0-9]+$/.test(s);
        return info ? { integer, floating } : integer || floating;
    }

    /**
     * Removes matching quotes from the ends of the string.
     * 
     * @param data The string to unquote.
     * 
     * @docs
     */
    export function unquote(data: string | String): string {
        const s = data as string;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
        return s;
    }

    export function quote(data: undefined | null | string | String, def: undefined): undefined | string
    export function quote(data: undefined | null | string | String, def?: string | String): string
    /**
     * Wraps the string in quotes if not already quoted.
     * @returns the default string when the data is an empty string or null/undefined.
     * @param data The string to quote.
     * @param def Optional default value to return if data is null/undefined, default is `""`.
     * 
     * @docs
     */
    export function quote(data: undefined | null | string | String, def: string | String = '""'): undefined | string {
        if (!data) {
            return def instanceof String ? def.valueOf() : def
        }
        const s = data as string;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s;
        return `"${s}"`;
    }

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
    export function truncate(data: string | String, max: number, truncated_suffix?: string): string {
        const truncated = data.length > max ? data.slice(0, max) : data instanceof String ? data.valueOf() : data;
        if (truncated_suffix) {
            return `${truncated}${truncated_suffix}`;
        }
        return truncated;
    }
}
export { StringUtils as String };
export { StringUtils as string }; // for snake_case compatibility

/** Extend global string with some basic methods. */
declare global {
    interface String {
        first(): string | undefined;
        last(): string | undefined;
        dedent(allow_empty_first_line?: boolean): string;
    }
}
String.prototype.first = function(): string | undefined { return this[0]; };
String.prototype.last = function(): string | undefined { return this[this.length - 1]; };
String.prototype.dedent = function(allow_empty_first_line = false): string { return StringUtils.dedent(this, allow_empty_first_line); };
