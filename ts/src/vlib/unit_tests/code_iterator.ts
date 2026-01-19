/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
"use strict";

// Imports.
import { Module } from "@vandenberghinc/vlib/vtest";
import { Path } from "@vlib/generic/path.js";
import { Iterator, Language, Languages } from "@vlib/code/iterator.js";
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


// ai generated somewhat bad tests
// // ==================================================================================================
// // Helpers (wrapper for tests.add 3rd arg)
// //
// // Pattern:
// //   tests.add(name, "success", with_it(src, (it) => "...string..."))
// //
// // The callback MUST return a short string so it’s easy to eyeball “OK/FAIL + trace”.
// // ==================================================================================================

// /** Create a test callback that initializes an iterator once and returns a short string. */
// function with_it(
//     src: string,
//     run: (it: Iterator) => string,
//     opts?: { language?: Language; exclude_comments?: boolean }
// ): () => string {
//     return () => {
//         const it = new Iterator(
//             { data: src },
//             { language: opts?.language ?? Languages.ts, exclude_comments: opts?.exclude_comments ?? false },
//         );
//         return run(it);
//     };
// }

// /** Collect a tiny trace around all backticks we encounter. */
// function trace_backticks(it: Iterator, maxLines = 12): string {
//     const out: string[] = [];
//     let n = 0;

//     it.walk((s) => {
//         if (s.char === "`") {
//             const ctx =
//                 s.is_comment ? `comment:${s.is_comment.type}` :
//                     s.is_str ? `str:${s.is_str.open}` :
//                         s.is_regex ? `regex` :
//                             "code";
//             out.push(`${s.line}:${s.col} \` => ${ctx}`);
//             n++;
//             if (out.length >= maxLines) return false;
//         }
//         return true;
//     });

//     if (n === 0) return "OK (no backticks found)";
//     if (n > maxLines) out.push(`... (${n - maxLines} more)`);
//     return out.join("\n");
// }

// /** Assert helper that returns a compact OK/FAIL string. */
// function ok_or_fail(ok: boolean, okMsg: string, failMsg: string, extra?: string): string {
//     if (ok) return `OK: ${okMsg}`;
//     return `FAIL: ${failMsg}${extra ? "\n" + extra : ""}`;
// }

// // ==================================================================================================
// // New unit tests
// // ==================================================================================================

// /**
//  * Bug #1 (most important): closing-scan happens before set_defaults(), using stale char/is_not_escaped.
//  *
//  * Repro idea:
//  * - We place backticks inside a block comment/docstring.
//  * - Correct behavior: iterator must remain in comment context; must NOT enter string on backticks.
//  *
//  * When bug triggers, you tend to see the iterator flip in/out of string at backticks in comments.
//  */
// tests.add("iterator:backticks-in-block-comment-do-not-start-string", "success", with_it(`
// /**
//  * Doc text with inline code: \`a{ b{ c, d }, e}f\`
//  * More: \`foo\` and \`bar\`
//  */
// const x = 1;
// `.dedent(), (it) => {
//     // Walk and verify: whenever char is `, we must be inside a block comment (and NOT inside string).
//     let ok = true;
//     const problems: string[] = [];

//     it.walk((s) => {
//         if (s.char === "`") {
//             const inBlockComment = !!(s.is_comment && s.is_comment.type === "block");
//             const inString = !!s.is_str;
//             if (!inBlockComment || inString) {
//                 ok = false;
//                 problems.push(`${s.line}:${s.col} ctx=${inBlockComment ? "comment:block" : inString ? "string" : "code"}`);
//                 // keep going but don’t explode output
//                 if (problems.length >= 3) return false;
//             }
//         }
//         return true;
//     });

//     return ok_or_fail(
//         ok,
//         "all backticks stayed inside block-comment context",
//         "a backtick flipped state (expected comment:block, got string/code)",
//         !ok ? ("Problems:\n" + problems.join("\n") + "\n\nTrace:\n" + trace_backticks(new Iterator({ data: it.source.data }, { language: it.lang }))) : undefined
//     );
// }));

// /**
//  * Bug #1 – minimal “single backtick” doc example, close to your reported failure point.
//  * This keeps output tiny but still shows you exactly what state the iterator thinks it’s in at each backtick.
//  */
// tests.add("iterator:docstring-minimal-backtick-trace", "success", with_it(`
// /**
//  * For example, \`a{ b{ c, d }, e}f\` is not supported.
//  */
// `.dedent(), (it) => {
//     // Just return a short trace the user can eyeball.
//     // Expected: every line reports ` => comment:block
//     return trace_backticks(it);
// }));

// /**
//  * Suggestion #2: normalize comment.block when user supplies tuple form ["/*","*\/"].
//  *
//  * This test is specifically to catch the bug where:
//  *   for (const [open, close] of this.lang.comment.block)
//  * iterates incorrectly over strings if block is not an array - of - pairs.
//  */
// tests.add("language:block-comment-tuple-form-normalization", "success", with_it(`
// /* has \`backticks\` inside */
// const y = 2;
// `.dedent(), (it) => {
//     const lang = new Language({
//         // minimal: only block comment + backtick strings
//         comment: { block: ["/*", "*/"] },   // <-- tuple form (the risky one)
//         string: ["`"],
//     });

//     // Re-init iterator with this language
//     const it2 = new Iterator({ data: it.source.data }, { language: lang, exclude_comments: false });

//     // Expected: first char is '/', iterator should enter block comment immediately and remain until "*/".
//     // We’ll just sample the first backtick and ensure we’re still in comment:block there.
//     let sawBacktick = false;
//     let ok = true;
//     let firstBacktickCtx = "";

//     it2.walk((s) => {
//         if (s.char === "`") {
//             sawBacktick = true;
//             const ctx =
//                 s.is_comment ? `comment:${s.is_comment.type}` :
//                     s.is_str ? `str:${s.is_str.open}` :
//                         "code";
//             firstBacktickCtx = `${s.line}:${s.col} ${ctx}`;
//             if (!(s.is_comment && s.is_comment.type === "block") || s.is_str) ok = false;
//             return false;
//         }
//         return true;
//     });

//     if (!sawBacktick) return "FAIL: no backtick found (test source unexpected)";
//     return ok_or_fail(
//         ok,
//         `tuple-form block comment works (${firstBacktickCtx})`,
//         `tuple-form block comment broken (${firstBacktickCtx})`,
//         !ok ? ("\nTrace:\n" + trace_backticks(it2)) : undefined
//     );
// }, { /* ignored */ }));

// /**
//  * Suggestion #3: has_patterns computed before regex assigned.
//  * This test ensures a Language with ONLY regex patterns still sets has_patterns=true.
//  * (Even though your current js/ts defaults don’t enable regex, this guards the constructor.)
//  */
// tests.add("language:has_patterns-includes-regex-only", "success", () => {
//     const lang = new Language({
//         // If regex is the only thing provided, has_patterns should still be true.
//         regex: [["/", "/"]],
//     });
//     return ok_or_fail(
//         lang.has_patterns === true,
//         "has_patterns is true for regex-only language",
//         `has_patterns is false (got ${String(lang.has_patterns)})`,
//         `\n(lang.first_regex_chars=${lang.first_regex_chars ? [...lang.first_regex_chars].join("") : "undefined"})`
//     );
// });

// // ==================================================================================================
// export default tests;
