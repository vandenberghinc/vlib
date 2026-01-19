/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
"use strict";
// Imports.
import { Module } from "@vandenberghinc/vlib/vtest";
import { Path } from "../generic/path.js";
import { Iterator } from "../code/iterator.js";
import { fileURLToPath } from "node:url";
// Unit tests module.
const tests = new Module({ name: "vlib/code_iterator" });
// Real-world bug with unterminated backtick in docstring
// Real-world error example unterimated code line.
tests.add("success:some_lt:1", "success", () => {
    const txt = `
    SKIP
    The GlobPattern class compiles a glob-style pattern into a regular expression
    and allows matching and filtering of strings (typically file paths) against that pattern.

    Supported features:
    1. Single-character wildcard \`? \` matches exactly one character, except for \` / \`.
    2. Single-segment wildcard \`* \` matches zero or more characters within a path segment, but not \` / \`.
        For example, \`foo\/*.js\` matches \`foo/bar.js\` but not \`foo/bar/baz.js\`.
    3. Multi-segment wildcard \`**\`:
        - When followed by a slash (\`**\/\`), it matches zero or more full path segments,
        including the trailing \`/ \`. For example, \` ** /baz/ *.js\` matches \`baz / qux.js\`, \`foo / baz / qux.js\`, etc.
        - When used alone (\`** \`), it matches any sequence of characters (including \` / \`). For example,
        \`src/**\/ *.ts\` matches \`src / a.ts\`, \`src / foo / b.ts\`, and so on.
    4. Character classes \`[abc]\`, \`[a - z]\`, and negated sets \`[!a - z]\`. These match any single character
        in (or not in) the specified set, except \`/ \`.
    5. Braced alternation \`{ foo, bar, baz } \` expands to a non-capturing group in the regex,
        equivalent to \`(?: foo | bar | baz)\`.
    6. Escape sequences with backslash \`\\\` to match literal special characters (e.g. \`\* \`, \`\?\`, \`\[\`).
    7. All backslashes in both patterns and tested strings are normalized to forward slashes (\`/ \`) before matching,
        making glob patterns Unix-style even on Windows.

    Limitations:
    - Brace expansions cannot be nested. For example, \`a{ b{ c, d }, e}f\` is not supported.
    - Character classes do not support POSIX character classes (e.g. \`[: alnum: ]\`).
    - There is no support for extended globs like \`@(pattern | pattern)\`, \`+(pattern)\`, \` ? (pattern)\`, \`!(pattern)\`.
    - Patterns are anchored: they must match the entire string, not just a substring. Internally the regex is
    constructed with \`^...$\` to enforce full-string matching.

    Example usage:
    \`\`\`ts
    * const gp = new GlobPattern("src/**\/*.ts");
    gp.test("src/index.ts");        // true
    gp.test("src/utils/helper.ts"); // true
    gp.test("src/utils/helper.js"); // false

    const files = [
    "src/index.ts",
    "src/app.js",
    "src/lib/module.ts",
    "test/spec.ts"
    * ];
    // Filters only .ts files under src/ (possibly nested)
    const tsFiles = gp.filter(files);
    // tsFiles === ["src/index.ts", "src/lib/module.ts"]
    \`\`\`

    The static method \`GlobPattern.is(str)\` can be used to quickly check if a string
    contains any glob wildcard characters (\`* \`, \` ? \`, \`[\`, \`]\`, \`{ \`, or \` }\`).
    `.dedent();
    const it = new Iterator({
        data: txt,
        language: { string: ["`"] }
    });
    it.jump_to(4, {
        advance: false,
        line: 1,
        col: 0,
    });
    while (it.avail) {
        it.advance();
    }
    return it.is_str == null ? "SUCCESS: backtick string terminated" : "FAIL: backtick string unterminated";
});
// Temporary unit test to fix a bug that is hard to replicate.
tests.add("temporary_unterminated_code_line:1", "success", async () => {
    const txt = await new Path(fileURLToPath(import.meta.url).split("/dist")[0] + "/src/vlib/code/iterator.ts").load();
    const start = 185;
    const end = 2955;
    const it = new Iterator({
        data: txt,
        end: end,
        language: { string: ["`"] }
    });
    it.jump_to(start, {
        advance: false,
        line: 8,
        col: 1,
    });
    while (it.avail) {
        it.advance();
    }
    return it.is_str == null ? "SUCCESS: backtick string terminated" : "FAIL: backtick string unterminated";
});
//# sourceMappingURL=code_iterator.js.map