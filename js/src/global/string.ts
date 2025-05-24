/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * @note FRONTEND - This file should also be accessable from the frontend.
 */

namespace StringUtils {
    /**
     * Removes common indentation from multiline strings.
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
     */
    export function first(data: string | String): string | undefined {
        return (data as string)[0];
    }

    /**
     * Returns the last character of the string.
     */
    export function last(data: string | String): string | undefined {
        const s = data as string;
        return s[s.length - 1];
    }

    /**
     * Gets the first non-whitespace character. Optionally ignores newline as whitespace.
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
     */
    export function insert(data: string | String, index: number, substr: string): string {
        const s = data as string;
        return s.slice(0, index) + substr + s.slice(index);
    }

    /**
     * Removes characters between start and end indices.
     */
    export function remove_indices(data: string | String, start: number, end: number): string {
        const s = data as string;
        return s.slice(0, start) + s.slice(end);
    }

    /**
     * Replaces characters between start and end indices with the given substring.
     */
    export function replace_indices(data: string | String, substr: string, start: number, end: number): string {
        const s = data as string;
        return s.slice(0, start) + substr + s.slice(end);
    }

    /**
     * Checks if the string starts with the given substring at an optional index.
     */
    export function eq_first(data: string | String, substr: string, start_index = 0): boolean {
        const s = data as string;
        if (start_index + substr.length > s.length) return false;
        return s.substr(start_index, substr.length) === substr;
    }

    /**
     * Checks if the string ends with the given substring.
     */
    export function eq_last(data: string | String, substr: string): boolean {
        const s = data as string;
        if (substr.length > s.length) return false;
        return s.slice(s.length - substr.length) === substr;
    }

    /**
     * Ensures the string ends with one of the given characters, appending the first if not.
     */
    export function ensure_last(data: string | String, ensure_last: string): string {
        const s = data as string;
        if (!ensure_last.includes(s.charAt(s.length - 1))) return s + ensure_last.charAt(0);
        return s;
    }

    /**
     * Returns true if all characters are uppercase (digits optional).
     */
    export function is_uppercase(data: string | String, allow_digits = false): boolean {
        let allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (allow_digits) allowed += "0123456789";
        return [...(data as string)].every(c => allowed.includes(c));
    }

    /**
     * Capitalizes only the first letter of the string.
     */
    export function capitalize_word(data: string | String): string {
        const s = data as string;
        if (/[a-z]/.test(s.charAt(0))) return s.charAt(0).toUpperCase() + s.slice(1);
        return s;
    }

    /**
     * Capitalizes the first letter of each word separated by whitespace.
     */
    export function capitalize_words(data: string | String): string {
        return (data as string).split(/(\s+)/).map(part => /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('');
    }

    /**
     * Removes all instances of the given character(s) from the string.
     */
    export function drop(data: string | String, char: string | string[]): string {
        const exclude = Array.isArray(char) ? char : [char];
        return [...(data as string)].filter(c => !exclude.includes(c)).join('');
    }

    /**
     * Returns the reversed string.
     */
    export function reverse(data: string | String): string {
        return (data as string).split('').reverse().join('');
    }

    /**
     * Generates a random alphanumeric string of the given length.
     */
    export function random(length = 32): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = '';
        for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    }

    /**
     * Returns true if the string contains only digits.
     */
    export function is_integer_string(data: string | String): boolean {
        return /^[0-9]+$/.test(data as string);
    }

    /**
     * Returns true if the string is a valid floating-point representation.
     */
    export function is_floating_string(data: string | String): boolean {
        return /^[0-9]*\.[0-9]+$/.test(data as string);
    }

    /**
     * Returns info or boolean about numeric string (integer/floating).
     */
    export function is_numeric_string(data: string | String, info = false): boolean | { integer: boolean; floating: boolean } {
        const s = data as string;
        const integer = /^[0-9]+$/.test(s);
        const floating = /^[0-9]*\.[0-9]+$/.test(s);
        return info ? { integer, floating } : integer || floating;
    }

    /**
     * Removes matching quotes from the ends of the string.
     */
    export function unquote(data: string | String): string {
        const s = data as string;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
        return s;
    }

    /**
     * Wraps the string in quotes if not already quoted.
     */
    export function quote(data: string | String): string {
        const s = data as string;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s;
        return `"${s}"`;
    }
}
export { StringUtils as String };

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

// ---------------------------------------------------------------------------------------------
// OLD

// declare global {

//     // String interface extensions
//     interface String {
//         /**
//          * Returns the first character of the string.
//          */
//         first(): string | undefined;

//         /**
//          * Returns the last character of the string.
//          */
//         last(): string | undefined;

//         /**
//          * Gets the first non-whitespace character.
//          * @param line_break Whether to consider line breaks as whitespace.
//          * @returns The first non-whitespace character or null if none found.
//          */
//         first_non_whitespace(line_break?: boolean): string | null;

//         /**
//          * Gets the last non-whitespace character.
//          * @param line_break Whether to consider line breaks as whitespace.
//          * @returns The last non-whitespace character or null if none found.
//          */
//         last_non_whitespace(line_break?: boolean): string | null;

//         /**
//          * Finds the first character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching from.
//          * @returns The first character not excluded or null if none found.
//          */
//         first_not_of(exclude: string[], start_index?: number): string | null;

//         /**
//          * Finds the index of the first character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching from.
//          * @returns The index or null if none found.
//          */
//         first_index_not_of(exclude: string[], start_index?: number): number | null;

//         /**
//          * Finds the last character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching backwards from.
//          * @returns The last character not excluded or null if none found.
//          */
//         last_not_of(exclude: string[], start_index?: number): string | null;

//         /**
//          * Finds the index of the last character not in the exclude list.
//          * @param exclude An array of characters to exclude.
//          * @param start_index The index to start searching backwards from.
//          * @returns The index or null if none found.
//          */
//         last_index_not_of(exclude: string[], start_index?: number): number | null;

//         /**
//          * Inserts a substring at the specified index.
//          * @param index The index to insert at.
//          * @param substr The substring to insert.
//          * @returns The new string.
//          */
//         insert(index: number, substr: string): string;

//         /**
//          * Removes a substring between the specified indices.
//          * @param start The starting index.
//          * @param end The ending index.
//          * @returns The new string.
//          */
//         remove_indices(start: number, end: number): string;

//         /**
//          * Replaces a substring between the specified indices with another substring.
//          * @param substr The substring to insert.
//          * @param start The starting index.
//          * @param end The ending index.
//          * @returns The new string.
//          */
//         replace_indices(substr: string, start: number, end: number): string;

//         /**
//          * Checks if the string starts with a given substring at a specified index.
//          * @param substr The substring to check.
//          * @param start_index The index to start checking from.
//          * @returns True if equal, false otherwise.
//          */
//         eq_first(substr: string, start_index?: number): boolean;

//         /**
//          * Checks if the string ends with a given substring.
//          * @param substr The substring to check.
//          * @returns True if equal, false otherwise.
//          */
//         eq_last(substr: string): boolean;

//         /**
//          * Ensures the string ends with one of the specified characters.
//          * @param ensure_last A string of characters.
//          * @returns The modified string.
//          */
//         ensure_last(ensure_last: string): string;

//         /**
//          * Checks if the string is uppercase.
//          * @param allow_digits Whether to allow digits as uppercase.
//          * @returns True if uppercase, false otherwise.
//          */
//         is_uppercase(allow_digits?: boolean): boolean;

//         /**
//          * Capitalizes the first letter of the string.
//          * @returns The capitalized string.
//          */
//         capitalize_word(): string;

//         /**
//          * Capitalizes the first letter of each word in the string.
//          * @returns The string with each word capitalized.
//          */
//         capitalize_words(): string;

//         /**
//          * Removes specified characters from the string.
//          * @param char A character or array of characters to remove.
//          * @returns The modified string.
//          */
//         drop(char: string | string[]): string;

//         /**
//          * Reverses the string.
//          * @returns The reversed string.
//          */
//         reverse(): string;

//         /**
//          * Checks if the string represents an integer.
//          * @returns True if it represents an integer, false otherwise.
//          */
//         is_integer_string(): boolean;

//         /**
//          * Checks if the string represents a floating-point number.
//          * @returns True if it represents a float, false otherwise.
//          */
//         is_floating_string(): boolean;

//         /**
//          * Checks if the string is numeric.
//          * @param info If true, returns an object with details.
//          * @returns True if numeric, false otherwise, or an info object.
//          */
//         is_numeric_string(info?: boolean): boolean | { integer: boolean; floating: boolean };

//         /**
//          * Removes surrounding quotes from the string.
//          * @returns The unquoted string.
//          */
//         unquote(): string;

//         /**
//          * Adds quotes around the string if not already quoted.
//          * @returns The quoted string.
//          */
//         quote(): string;
        
//         /**
//          * Dedent a string.
//          * @returns The dedented string.
//          */
//         dedent(): string;
//     }

//     // StringConstructor extensions
//     interface StringConstructor {
//         /**
//          * Generates a random alphanumeric string.
//          * @param length The length of the string. Default is 32.
//          * @returns A random string.
//          */
//         random(length?: number): string;
//     }
// }
// export {} // is required.

// // String prototype functions.
// String.prototype.first = function() {
//     return this[0];
// };
// String.prototype.last = function() {
//     return this[this.length - 1];
// };

// // Get the first non whitespace char, does not count \n as whitespace by default.
// String.prototype.first_non_whitespace = function(line_break = false) {
//     for (let i = 0; i < this.length; i++) {
//         const char = this.charAt(i);
//         if (char != " " && char != "\t" && (line_break == false || char != "\n")) {
//             return char;
//         }
//     }
//     return null;
// };

// // Get the last non whitespace char, does not count \n as whitespace by default.
// String.prototype.last_non_whitespace = function(line_break = false) {
//     for (let i = this.length - 1; i >= 0; i--) {
//         const char = this.charAt(i);
//         if (char != " " && char != "\t" && (line_break == false || char != "\n")) {
//             return char;
//         }
//     }
//     return null;
// };

// // Get the first non excluded character (index).
// String.prototype.first_not_of = function(exclude: string[] = [], start_index: number = 0) {
//     for (let i: number = start_index; i < this.length; i++) {
//         if (!exclude.includes(this.charAt(i))) {
//             return this.charAt(i);
//         }
//     }
//     return null;
// };
// String.prototype.first_index_not_of = function(exclude: string[] = [], start_index: number = 0) {
//     for (let i: number = start_index; i < this.length; i++) {
//         if (!exclude.includes(this.charAt(i))) {
//             return i;
//         }
//     }
//     return null;
// };

// // Get the last non excluded character (index).
// String.prototype.last_not_of = function(exclude: string[] = [], start_index: number = -1) {
//     if (start_index === -1 || start_index == null) {
//         start_index = this.length - 1;
//     }
//     for (let i = start_index as any as number; i >= 0; i--) {
//         if (!exclude.includes(this.charAt(i))) {
//             return this.charAt(i);
//         }
//     }
//     return null;
// };
// String.prototype.last_index_not_of = function(exclude: string[] = [], start_index: number = -1) {
//     if (start_index === -1 || start_index == null) {
//         start_index = this.length - 1;
//     }
//     for (let i = start_index as any as number; i >= 0; i--) {
//         if (!exclude.includes(this.charAt(i))) {
//             return i;
//         }
//     }
//     return null;
// };

// // Insert substr at index.
// String.prototype.insert = function(index, substr) {
//     let edited = this.substr(0, index);
//     edited += substr;
//     edited += this.substr(index);
//     return edited;
// };

// // Remove substr at index.
// String.prototype.remove_indices = function(start, end) {
//     let edited = this.substr(0, start);
//     edited += this.substr(end);
//     return edited;
// };

// // Remove substr at index.
// String.prototype.replace_indices = function(substr, start, end) {
//     let edited = this.substr(0, start);
//     edited += substr;
//     edited += this.substr(end);
//     return edited;
// };

// // Check if the first chars of the main string equals a substring, optionally with start index.
// String.prototype.eq_first = function(substr, start_index = 0) {
//     if (start_index + substr.length > this.length) {
//         return false;
//     }
//     const end = start_index + substr.length;
//     let y = 0;
//     for (let x = start_index; x < end; x++) {
//         if (this.charAt(x) != substr.charAt(y)) {
//             return false;
//         }
//         ++y;
//     }
//     return true;
// }

// // Check if the last chars of the main string equals a substring.
// String.prototype.eq_last = function(substr) {
//     if (substr.length > this.length) {
//         return false;
//     }
//     let y = 0;
//     for (let x = this.length - substr.length; x < this.length; x++) {
//         if (this.charAt(x) != substr.charAt(y)) {
//             return false;
//         }
//         ++y;
//     }
//     return true;
// }

// // Ensure last, checks if one of the characters of the `ensure_last` parameter is the last character, if not then it adds the first character of the `ensure_last` parameter to the end of the string.
// // The newly created string will be returned.
// String.prototype.ensure_last = function(ensure_last) {
//     if (ensure_last.indexOf(this.charAt(this.length - 1)) === -1) {
//         return this + ensure_last.charAt(0);
//     }
//     if (this instanceof String) {
//         return this.toString()
//     }
//     return this;
// }

// // Check if a word is uppercase only.
// String.prototype.is_uppercase = function(allow_digits = false) {
//     let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     if (allow_digits) {
//         uppercase += "0123456789";
//     }
//     for (let i = 0; i < this.length; i++) {
//         if (uppercase.indexOf(this.charAt(i)) === -1) {
//             return false;
//         }
//     }
//     return true;
// }

// // Capitalize as a word (only the first letter).
// String.prototype.capitalize_word = function() {
//     if ("abcdefghijklmopqrstuvwxyz".includes(this.charAt(0))) {
//         return this.charAt(0).toUpperCase() + this.substr(1);
//     }
//     if (this instanceof String) {
//         return this.toString()
//     }
//     return this;
// }

// // Capitalize the first letter of each word seperated by whitespace in a string.
// String.prototype.capitalize_words = function() {
//     let batch = "";
//     let capitalized = "";
//     for (let i = 0; i < this.length; i++) {
//         const c = this.charAt(i);
//         if (c === " " || c === "\t" || c === "\n") {
//             capitalized += batch.capitalize_word();
//             batch = "";
//             capitalized += c;
//         } else {
//             batch += c;
//         }
//     }
//     capitalized += batch.capitalize_word();
//     return capitalized;
// }

// // Drop a single char or an array of characters.
// String.prototype.drop = function(char) {
//     const is_array = Array.isArray(char);
//     let dropped = "";
//     for (let i = 0; i < this.length; i++) {
//         const c = this.charAt(i);
//         if (is_array) {
//             if (char.includes(c) === false) {
//                 dropped += c;
//             }
//         } else {
//             if (char !== c) {
//                 dropped += c;   
//             }
//         }
//     }
//     return dropped;
// }

// // Reverse the string.
// String.prototype.reverse = function() {
//     let reversed = "";
//     for (let i = this.length - 1; i >= 0; i--) {
//         reversed += this.charAt(i);
//     }
//     return reversed;
// }

// // Generate a random string.
// String.random = function(length = 32) {
//     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let result = "";
//     for (let i = 0; i < length; i++) {
//         result += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return result;
// }

// // Check if a string is a integer in string format
// String.prototype.is_integer_string = function() {
//     const chars = '0123456789';
//     for (let i = 0; i < this.length; i++) {
//         if (chars.indexOf(this.charAt(i)) === -1) {
//             return false;
//         }
//     }
//     return true;
// }

// // Check if a string is a floating in string format
// String.prototype.is_floating_string = function() {
//     const chars = '0123456789';
//     let decimal = false;
//     for (let i = 0; i < this.length; i++) {
//         const char = this.charAt(i);
//         if (char === '.') {
//             if (decimal) { return false; }
//             decimal = true;
//         } else if (chars.indexOf(char) === -1) {
//             return false;
//         }
//     }
//     return decimal;
// }

// // Check if a string is a numeric in string format
// String.prototype.is_numeric_string = function(info = false) {
//     const chars = '0123456789';
//     let decimal = false;
//     for (let i = 0; i < this.length; i++) {
//         const char = this.charAt(i);
//         if (char === '.') {
//             if (decimal) { return false; }
//             decimal = true;
//         } else if (chars.indexOf(char) === -1) {
//             if (info) {
//                 return {integer: false, floating: false};
//             }
//             return false;
//         }
//     }
//     if (info) {
//         return {integer: decimal === false, floating: decimal === true};
//     }
//     return true;
// }

// // Unquote a string.
// String.prototype.unquote = function() {
//     if ((this.startsWith('"') && this.endsWith('"')) || (this.startsWith("'") && this.endsWith("'"))) {
//         return this.slice(1, -1);
//     }
//     if (this instanceof String) {
//         return this.toString()
//     }
//     return this;
// }

// // Quote a string.
// String.prototype.quote = function() {
//     if ((this.startsWith('"') && this.endsWith('"')) || (this.startsWith("'") && this.endsWith("'"))) {
//         if (this instanceof String) {
//             return this.toString()
//         }
//         return this;
//     }
//     return `"${this}"`;
// }

// // Then implement the function
// /** 
//  * @deprecated
//  */

// String.prototype.dedent = function(allow_empty_first_line = false) {

//     // Allow empty first line.
//     let data = this;
//     if (allow_empty_first_line) {
//         const line_break = data.indexOf("\n");
//         if (line_break !== -1) {
//             data = data.slice(line_break + 1).dedent();
//         } else {
//             data = data.trimStart();
//         }
//     }

//     // Split the string into lines.
//     const lines = data.split('\n');

//     // Find minimum indentation.
//     const indent = lines
//         .filter(line => line.trim())
//         .map(line => line.match(/^[ \t]*/)?.[0].length ?? Infinity)
//         .reduce((min, curr) => Math.min(min, curr), Infinity);

//     // Remove common indentation.
//     return lines
//         .map(line => line.slice(indent))
//         .join('\n')
//         .trim();

// };