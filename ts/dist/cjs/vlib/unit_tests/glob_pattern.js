"use strict";
var import_vtest = require("../../vtest/index.js");
var import_glob_pattern = require("../generic/glob_pattern.js");
const tests = new import_vtest.Module({ name: "glob_pattern" });
const test_match = (pattern, value) => () => {
  const gp = new import_glob_pattern.GlobPattern(pattern);
  return { match: gp.test(value) };
};
tests.add("match:1", "success", test_match("*.ts", "file.ts"));
tests.add("match:2", "success", test_match("src/**/*.ts", "src/utils/index.ts"));
tests.add("match:3", "success", test_match("src/**/test*.js", "src/a/b/test1.js"));
tests.add("match:4", "success", test_match("src/*/file.txt", "src/a/file.txt"));
tests.add("match:5", "success", test_match("src/*/file.txt", "src/a/b/file.txt"));
tests.add("match:6", "success", test_match("src/?/file.txt", "src/a/file.txt"));
tests.add("match:7", "success", test_match("src/[ab]/file.txt", "src/b/file.txt"));
tests.add("match:8", "success", test_match("src/[!a]/file.txt", "src/b/file.txt"));
tests.add("match:9", "success", test_match("{src,test}/**/*.ts", "test/unit/test.ts"));
