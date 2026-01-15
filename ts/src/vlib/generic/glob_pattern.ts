/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Note that this file is used in both Node.js and browser environments.
 */

/**
 * The GlobPattern class compiles a glob‐style pattern into a regular expression
 * and allows matching and filtering of strings (typically file paths) against that pattern.
 *
 * Supported features:
 *  1. Single‐character wildcard `?` matches exactly one character, except for `/`.
 *  2. Single‐segment wildcard `*` matches zero or more characters within a path segment, but not `/`.
 *     For example, `foo/*.js` matches `foo/bar.js` but not `foo/bar/baz.js`.
 *  3. Multi‐segment wildcard `**`:
 *     - When followed by a slash (`**\/`), it matches zero or more full path segments,
 *       including the trailing `/ `. For example, ` ** /baz/ *.js` matches `baz / qux.js`, `foo / baz / qux.js`, etc.
 *     - When used alone (`** `), it matches any sequence of characters (including ` / `). For example,
 *       `src/**\/ *.ts` matches `src / a.ts`, `src / foo / b.ts`, and so on.
 *  4. Character classes `[abc]`, `[a - z]`, and negated sets `[!a - z]`. These match any single character
 *     in (or not in) the specified set, except `/ `.
 *  5. Braced alternation `{ foo, bar, baz } ` expands to a non‐capturing group in the regex,
 *     equivalent to `(?: foo | bar | baz)`.
 *  6. Escape sequences with backslash `\` to match literal special characters (e.g. `\* `, `\?`, `\[`).
 *  7. All backslashes in both patterns and tested strings are normalized to forward slashes (`/ `) before matching,
 *     making glob patterns Unix‐style even on Windows.
 *
 * Limitations:
 *  - Brace expansions cannot be nested. For example, `a{ b{ c, d }, e}f` is not supported.
 *  - Character classes do not support POSIX character classes (e.g. `[: alnum: ]`).
 *  - There is no support for extended globs like `@(pattern | pattern)`, `+(pattern)`, ` ? (pattern)`, `!(pattern)`.
 *  - Patterns are anchored: they must match the entire string, not just a substring. Internally the regex is
 *    constructed with `^...$` to enforce full‐string matching.
 *
 * Example usage:
 * ```ts
    * const gp = new GlobPattern("src/**\/*.ts");
 * gp.test("src/index.ts");        // true
 * gp.test("src/utils/helper.ts"); // true
 * gp.test("src/utils/helper.js"); // false
 *
 * const files = [
 * "src/index.ts",
 * "src/app.js",
 * "src/lib/module.ts",
 * "test/spec.ts"
    * ];
 * // Filters only .ts files under src/ (possibly nested)
 * const tsFiles = gp.filter(files);
 * // tsFiles === ["src/index.ts", "src/lib/module.ts"]
 * ```
 *
 * The static method `GlobPattern.is(str)` can be used to quickly check if a string
 * contains any glob wildcard characters (`* `, ` ? `, `[`, `]`, `{ `, or ` }`).
 * 
 * @note This class is not meant to glob actual file paths from the filesystem.
 *       Use `vlib.Path.glob()` for that purpose.
 * 
 * @docs
 */
export class GlobPattern {

    /** The original glob pattern. */
    pattern: string;

    /** The generated regular expression. */
    private regex: RegExp;

    /**
     * Create a new glob pattern matcher.
     * @param pattern - The glob pattern to compile.
     * @docs
     */
    constructor(pattern: string) {
        this.pattern = pattern;
        this.regex = GlobPattern.compile(pattern);
    }

    /**
     * Get the length.
     * @docs
     */
    get length(): number { return this.pattern.length; }

    /**
     * Update the pattern on the current instance.
     * @param pattern - The new glob pattern.
     * @docs
     */
    update(pattern: string): void {
        this.pattern = pattern;
        this.regex = GlobPattern.compile(pattern);
    }

    /**
     * Test a value against the glob pattern.
     * @param value - The string to test.
     * @returns True when the value matches the pattern.
     * @docs
     */
    test(value: string): boolean {
        const normalized = value.replace(/\\/g, '/');
        return this.regex.test(normalized);
    }
    /**
     * Test a value against the glob pattern.
     * @param value - The string to test.
     * @returns True when the value matches the pattern.
     * @docs
     */
    match(value: string): boolean {
        const normalized = value.replace(/\\/g, '/');
        return this.regex.test(normalized);
    }

    /**
     * Filter an array of values by this pattern.
     * @param values - The values to filter.
     * @returns The matched values.
     * @docs
     */
    filter(values: string[]): string[] {
        return values.filter(v => this.test(v));
    }

    /**
     * Static helper to directly match a value.
     * @docs
     */
    static matches(pattern: string, value: string): boolean {
        return new GlobPattern(pattern).test(value);
    }

    /**
     * Checks whether a given string is a glob pattern (contains
     * wildcard characters) or just a regular path.
     * @param str - The string to inspect.
     * @returns True if `str` looks like a glob pattern; false otherwise.
     * @docs
     */
    static is(str: string): boolean {
        // If the string contains any of: *, ?, [, ], {, or }
        for (let i = 0, n = str.length; i < n; ++i) {
            switch (str.charCodeAt(i)) {
                case 42:  // *
                case 63:  // ?
                case 91:  // [
                case 93:  // ]
                case 123: // {
                case 125: // }
                    return true;
            }
        }
        return false;
        // return /[\*\?\[\]\{\}]/.test(str);
    }

    /**
     * Compile a glob pattern to a regular expression.
     * @param pattern - The pattern to compile.
     * @returns The compiled regular expression.
     * @docs
     */
    private static compile(pattern: string): RegExp {
        pattern = pattern.replace(/\\/g, '/');
        let regex = '^';
        let i = 0;
        let in_group = false;
        while (i < pattern.length) {
            const char = pattern[i];
            if (char === '\\') {
                regex += '\\' + pattern[i + 1];
                i += 2;
                continue;
            }
            if (char === '?') {
                regex += '[^/]';
                i++;
                continue;
            }
            if (char === '*') {
                if (pattern[i + 1] === '*') {
                    if (pattern[i + 2] === '/') {
                        regex += '(?:.*/)?';
                        i += 3;
                        continue;
                    }
                    regex += '.*';
                    i += 2;
                    continue;
                }
                regex += '[^/]*';
                i++;
                continue;
            }
            if (char === '[') {
                let j = i + 1;
                let neg = false;
                if (pattern[j] === '!') {
                    neg = true;
                    j++;
                }
                let set = '';
                for (; j < pattern.length && pattern[j] !== ']'; j++) {
                    const ch = pattern[j];
                    set += ch;
                }
                if (j === pattern.length) {
                    regex += '\\[';
                    i++;
                    continue;
                }
                const esc_set = set.replace(/\\/g, '\\');
                regex += neg ? `[^${esc_set}]` : `[${esc_set}]`;
                i = j + 1;
                continue;
            }
            if (char === '{') {
                regex += '(?:';
                in_group = true;
                i++;
                continue;
            }
            if (char === '}') {
                regex += ')';
                in_group = false;
                i++;
                continue;
            }
            if (char === ',' && in_group) {
                regex += '|';
                i++;
                continue;
            }
            if ('+.^$|()'.indexOf(char) !== -1) {
                regex += '\\' + char;
            } else {
                regex += char;
            }
            i++;
        }
        regex += '$';
        return new RegExp(regex);
    }

    /** To string */
    toString(): string {
        return `GlobPattern("${this.pattern}")`;
    }

    /** Cast to primitives. */
    /** Cast to primitives. */
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number {
        switch (hint) {
            case 'number':
                // A numeric context (`+gp`, `gp > 10`, Math.max(…))
                // – return a cheap, deterministic metric: the pattern’s length.
                return this.pattern.length;

            case 'string':
                // String contexts (`'' + gp`, template literals)
                // – return just the raw glob so it can be embedded directly.
                return this.pattern;
            case 'default':
            default:
                // Loose contexts (`==`, console.log) – show a descriptive label.
                // Re-use `toString()` so the logic stays in one place.
                return this.toString();
        }

    }
};

/**
 * A glob pattern list that can contain multiple glob patterns.
 * Automatically detects and converts string patterns to `GlobPattern` instances.
 * When no glob patterns are present, it behaves like a simple string list.
 * 
 * @note This class is not meant to glob actual file paths from the filesystem.
 *       Use `vlib.Path.glob()` for that purpose.
 * 
 * @docs
 */
export class GlobPatternList {
    items: GlobPatternList.T[];

    /**
     * Construct a new glob pattern list.
     * @param list A single glob pattern or an array of glob patterns.
     * @docs
     */
    constructor(list: GlobPatternList.T | GlobPatternList.T[]) {
        this.items = Array.isArray(list) ? list.map(GlobPatternList.init_list_item) : [GlobPatternList.init_list_item(list)];
    }

    /** Initialize a list item. */
    private static init_list_item(item: GlobPatternList.T): GlobPatternList.T {
        return (
            item instanceof GlobPattern || !GlobPattern.is(item)
                ? item
                : new GlobPattern(item)
        );
    }

    /**
     * Get the length.
     * @docs
     */
    get length(): number { return this.items.length; }

    /**
     * Test if a value matches any of the glob patterns in the list.
     * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
     * @param value - The string to test.
     * @docs
     */
    match(value: string): boolean {
        if (this.items.length === 0) return false;
        return this.items.some(p => typeof p === "string" ? p === value : p.test(value));
    }
    matches(value: string): boolean {
        return this.match(value);
    }
    test(value: string): boolean {
        return this.match(value);
    }
    some(value: string): boolean {
        return this.match(value);
    }

    /**
     * Test if a value matches all glob patterns in the list.
     * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
     * @param value - The string to test.
     * @docs
     */
    every(value: string): boolean {
        return this.items.every(p => typeof p === "string" ? p === value : p.test(value));
    }

    /**
     * Check if an array contains either a string glob patern or a GlobPattern instance.
     * @docs
     */
    static is(list: GlobPatternList.T[]): boolean {
        return list.some(item => item instanceof GlobPattern || GlobPattern.is(item));
    }

    /** To string */
    toString(): string {
        return `GlobPatternList("${this.items.join(", ")}")`;
    }
}
export namespace GlobPatternList {
    export type T = string | GlobPattern;
}