"use strict";
// Imports.
import { Module } from "../../vtest/index.js";
import { GlobPattern } from "../generic/glob_pattern.js";
// Unit tests module.
const tests = new Module({ name: "glob_pattern" });
// ---------------------------------------------------------------
// Helpers
const test_match = (pattern, value) => () => {
    const gp = new GlobPattern(pattern);
    return { match: gp.test(value) };
};
// ---------------------------------------------------------------
// Basic matching
tests.add("match:1", "success", test_match("*.ts", "file.ts"));
tests.add("match:2", "success", test_match("src/**/*.ts", "src/utils/index.ts"));
tests.add("match:3", "success", test_match("src/**/test*.js", "src/a/b/test1.js"));
tests.add("match:4", "success", test_match("src/*/file.txt", "src/a/file.txt"));
tests.add("match:5", "success", test_match("src/*/file.txt", "src/a/b/file.txt"));
tests.add("match:6", "success", test_match("src/?/file.txt", "src/a/file.txt"));
tests.add("match:7", "success", test_match("src/[ab]/file.txt", "src/b/file.txt"));
tests.add("match:8", "success", test_match("src/[!a]/file.txt", "src/b/file.txt"));
tests.add("match:9", "success", test_match("{src,test}/**/*.ts", "test/unit/test.ts"));
//# sourceMappingURL=glob_pattern.js.map