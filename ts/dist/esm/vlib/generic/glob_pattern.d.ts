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
export declare class GlobPattern {
    /** The original glob pattern. */
    pattern: string;
    /** The generated regular expression. */
    private regex;
    /**
     * Create a new glob pattern matcher.
     * @param pattern - The glob pattern to compile.
     * @docs
     */
    constructor(pattern: string);
    /**
     * Get the length.
     * @docs
     */
    get length(): number;
    /**
     * Update the pattern on the current instance.
     * @param pattern - The new glob pattern.
     * @docs
     */
    update(pattern: string): void;
    /**
     * Test a value against the glob pattern.
     * @param value - The string to test.
     * @returns True when the value matches the pattern.
     * @docs
     */
    test(value: string): boolean;
    /**
     * Test a value against the glob pattern.
     * @param value - The string to test.
     * @returns True when the value matches the pattern.
     * @docs
     */
    match(value: string): boolean;
    /**
     * Filter an array of values by this pattern.
     * @param values - The values to filter.
     * @returns The matched values.
     * @docs
     */
    filter(values: string[]): string[];
    /**
     * Static helper to directly match a value.
     * @docs
     */
    static matches(pattern: string, value: string): boolean;
    /**
     * Checks whether a given string is a glob pattern (contains
     * wildcard characters) or just a regular path.
     * @param str - The string to inspect.
     * @returns True if `str` looks like a glob pattern; false otherwise.
     * @docs
     */
    static is(str: string): boolean;
    /**
     * Compile a glob pattern to a regular expression.
     * @param pattern - The pattern to compile.
     * @returns The compiled regular expression.
     * @docs
     */
    private static compile;
    /** To string */
    toString(): string;
    /** Cast to primitives. */
    /** Cast to primitives. */
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number;
}
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
export declare class GlobPatternList {
    items: GlobPatternList.T[];
    /**
     * Construct a new glob pattern list.
     * @param list A single glob pattern or an array of glob patterns.
     * @docs
     */
    constructor(list: GlobPatternList.T | GlobPatternList.T[]);
    /** Initialize a list item. */
    private static init_list_item;
    /**
     * Get the length.
     * @docs
     */
    get length(): number;
    /**
     * Test if a value matches any of the glob patterns in the list.
     * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
     * @param value - The string to test.
     * @docs
     */
    match(value: string): boolean;
    matches(value: string): boolean;
    test(value: string): boolean;
    some(value: string): boolean;
    /**
     * Test if a value matches all glob patterns in the list.
     * @note This method does not resolve the `value` path, even when `opts.absolute` is true.
     * @param value - The string to test.
     * @docs
     */
    every(value: string): boolean;
    /**
     * Check if an array contains either a string glob patern or a GlobPattern instance.
     * @docs
     */
    static is(list: GlobPatternList.T[]): boolean;
    /** To string */
    toString(): string;
}
export declare namespace GlobPatternList {
    type T = string | GlobPattern;
}
