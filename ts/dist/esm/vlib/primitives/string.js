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
var StringUtils;
(function (StringUtils) {
    /**
     * Removes common indentation from multiline strings.
     * @docs
     */
    function dedent(data, allow_empty_first_line = false) {
        // Allow empty first line.
        if (allow_empty_first_line) {
            const line_break = data.indexOf("\n");
            if (line_break !== -1) {
                data = data.slice(line_break + 1);
            }
            else {
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
    StringUtils.dedent = dedent;
    /**
     * Returns the first character of the string.
     * @docs
     */
    function first(data) {
        return data[0];
    }
    StringUtils.first = first;
    /**
     * Returns the last character of the string.
     * @docs
     */
    function last(data) {
        const s = data;
        return s[s.length - 1];
    }
    StringUtils.last = last;
    /**
     * Gets the first non-whitespace character. Optionally ignores newline as whitespace.
     * @docs
     */
    function first_non_whitespace(data, line_break = false) {
        const s = data;
        for (let i = 0; i < s.length; i++) {
            const char = s.charAt(i);
            if (char !== " " && char !== "\t" && (!line_break || char !== "\n")) {
                return char;
            }
        }
        return null;
    }
    StringUtils.first_non_whitespace = first_non_whitespace;
    /**
     * Gets the last non-whitespace character. Optionally ignores newline as whitespace.
     * @docs
     */
    function last_non_whitespace(data, line_break = false) {
        const s = data;
        for (let i = s.length - 1; i >= 0; i--) {
            const char = s.charAt(i);
            if (char !== " " && char !== "\t" && (!line_break || char !== "\n")) {
                return char;
            }
        }
        return null;
    }
    StringUtils.last_non_whitespace = last_non_whitespace;
    /**
     * Gets the first character not in the exclude list, starting from an index.
     * @docs
     */
    function first_not_of(data, exclude = [], start_index = 0) {
        const s = data;
        for (let i = start_index; i < s.length; i++) {
            if (!exclude.includes(s.charAt(i)))
                return s.charAt(i);
        }
        return null;
    }
    StringUtils.first_not_of = first_not_of;
    /**
     * Gets the index of the first character not in the exclude list, starting from an index.
     * @docs
     */
    function first_index_not_of(data, exclude = [], start_index = 0) {
        const s = data;
        for (let i = start_index; i < s.length; i++) {
            if (!exclude.includes(s.charAt(i)))
                return i;
        }
        return null;
    }
    StringUtils.first_index_not_of = first_index_not_of;
    /**
     * Gets the last character not in the exclude list, searching backward.
     * @docs
     */
    function last_not_of(data, exclude = [], start_index = -1) {
        const s = data;
        let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
        for (let i = idx; i >= 0; i--) {
            if (!exclude.includes(s.charAt(i)))
                return s.charAt(i);
        }
        return null;
    }
    StringUtils.last_not_of = last_not_of;
    /**
     * Gets the index of the last character not in the exclude list, searching backward.
     * @docs
     */
    function last_index_not_of(data, exclude = [], start_index = -1) {
        const s = data;
        let idx = start_index === -1 || start_index == null ? s.length - 1 : start_index;
        for (let i = idx; i >= 0; i--) {
            if (!exclude.includes(s.charAt(i)))
                return i;
        }
        return null;
    }
    StringUtils.last_index_not_of = last_index_not_of;
    /**
     * Inserts a substring at the given index.
     * @docs
     */
    function insert(data, index, substr) {
        const s = data;
        return s.slice(0, index) + substr + s.slice(index);
    }
    StringUtils.insert = insert;
    /**
     * Removes characters between start and end indices.
     * @docs
     */
    function remove_indices(data, start, end) {
        const s = data;
        return s.slice(0, start) + s.slice(end);
    }
    StringUtils.remove_indices = remove_indices;
    /**
     * Replaces characters between start and end indices with the given substring.
     * @docs
     */
    function replace_indices(data, substr, start, end) {
        const s = data;
        return s.slice(0, start) + substr + s.slice(end);
    }
    StringUtils.replace_indices = replace_indices;
    /**
     * Checks if the string starts with the given substring at an optional index.
     * @docs
     */
    function eq_first(data, substr, start_index = 0) {
        const s = data;
        if (start_index + substr.length > s.length)
            return false;
        return s.substr(start_index, substr.length) === substr;
    }
    StringUtils.eq_first = eq_first;
    /**
     * Checks if the string ends with the given substring.
     * @docs
     */
    function eq_last(data, substr) {
        const s = data;
        if (substr.length > s.length)
            return false;
        return s.slice(s.length - substr.length) === substr;
    }
    StringUtils.eq_last = eq_last;
    /**
     * Ensures the string ends with one of the given characters, appending the first if not.
     * @docs
     */
    function ensure_last(data, ensure_last) {
        const s = data;
        if (!ensure_last.includes(s.charAt(s.length - 1)))
            return s + ensure_last.charAt(0);
        return s;
    }
    StringUtils.ensure_last = ensure_last;
    /**
     * Returns true if all characters are uppercase (digits optional).
     * @docs
     */
    function is_uppercase(data, allow_digits = false) {
        const set = allow_digits ? is_uppercase_plus_num_set : StringUtils.charset.uppercase_set;
        for (let i = 0; i < data.length; i++) {
            if (!set.has(data.charAt(i)))
                return false;
        }
        return true;
    }
    StringUtils.is_uppercase = is_uppercase;
    const is_uppercase_plus_num_set = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(''));
    /**
     * Charsets.
     * @docs
     */
    StringUtils.charset = {
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
    function capitalize_word(data) {
        const s = data;
        if (StringUtils.charset.lowercase_set.has(s.charAt(0)))
            return s.charAt(0).toUpperCase() + s.slice(1);
        return s;
    }
    StringUtils.capitalize_word = capitalize_word;
    /**
     * Capitalizes the first letter of each word separated by whitespace.
     * @docs
     */
    function capitalize_words(data) {
        return data.split(/(\s+)/).map(part => /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('');
    }
    StringUtils.capitalize_words = capitalize_words;
    /**
     * Removes all instances of the given character(s) from the string.
     * @docs
     */
    function drop(data, char) {
        const exclude = Array.isArray(char) ? char : [char];
        return [...data].filter(c => !exclude.includes(c)).join('');
    }
    StringUtils.drop = drop;
    /**
     * Returns the reversed string.
     * @docs
     */
    function reverse(data) {
        return data.split('').reverse().join('');
    }
    StringUtils.reverse = reverse;
    /**
     * Generates a random alphanumeric string of the given length.
     * @param length The length of the random string, default is 32.
     * @param charset Optional custom character set to use, default is alphanumeric.
     *                Defaults to `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`.
     * @docs
    */
    function random(length = 32, charset) {
        let result = '';
        if (charset) {
            for (let i = 0; i < length; i++)
                result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        else {
            for (let i = 0; i < length; i++)
                result += default_random_charset.charAt(Math.floor(Math.random() * default_random_charset.length));
        }
        return result;
    }
    StringUtils.random = random;
    const default_random_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    /**
     * Returns true if the string contains only digits.
     * @docs
     */
    function is_integer_string(data) {
        return /^[0-9]+$/.test(data);
    }
    StringUtils.is_integer_string = is_integer_string;
    /**
     * Returns true if the string is a valid floating-point representation.
     * @docs
     */
    function is_floating_string(data) {
        return /^[0-9]*\.[0-9]+$/.test(data);
    }
    StringUtils.is_floating_string = is_floating_string;
    /**
     * Returns info or boolean about numeric string (integer/floating).
     * @docs
     */
    function is_numeric_string(data, info = false) {
        const s = data;
        const integer = /^[0-9]+$/.test(s);
        const floating = /^[0-9]*\.[0-9]+$/.test(s);
        return info ? { integer, floating } : integer || floating;
    }
    StringUtils.is_numeric_string = is_numeric_string;
    /**
     * Removes matching quotes from the ends of the string.
     *
     * @param data The string to unquote.
     *
     * @docs
     */
    function unquote(data) {
        const s = data;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
            return s.slice(1, -1);
        return s;
    }
    StringUtils.unquote = unquote;
    /**
     * Wraps the string in quotes if not already quoted.
     * @returns the default string when the data is an empty string or null/undefined.
     * @param data The string to quote.
     * @param def Optional default value to return if data is null/undefined, default is `""`.
     *
     * @docs
     */
    function quote(data, def = '""') {
        if (!data) {
            return def instanceof String ? def.valueOf() : def;
        }
        const s = data;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
            return s;
        return `"${s}"`;
    }
    StringUtils.quote = quote;
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
    function truncate(data, max, truncated_suffix) {
        const truncated = data.length > max ? data.slice(0, max) : data instanceof String ? data.valueOf() : data;
        if (truncated_suffix) {
            return `${truncated}${truncated_suffix}`;
        }
        return truncated;
    }
    StringUtils.truncate = truncate;
})(StringUtils || (StringUtils = {}));
export { StringUtils as String };
export { StringUtils as string }; // for snake_case compatibility
String.prototype.first = function () { return this[0]; };
String.prototype.last = function () { return this[this.length - 1]; };
String.prototype.dedent = function (allow_empty_first_line = false) { return StringUtils.dedent(this, allow_empty_first_line); };
//# sourceMappingURL=string.js.map