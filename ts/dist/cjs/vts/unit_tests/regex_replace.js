"use strict";
var import_vtest = require("../../vtest/index.js");
var import_transformer = require("../transformer/transformer.js");
var import_plugins = require("../plugins/plugins.js");
const tests = new import_vtest.Module({ name: "vts/regex-replace" });
const create_unit_test = (files, replacements) => {
  if (typeof files === "string") {
    files = { "unit_test.js": files };
  }
  Object.keys(files).walk((k) => {
    files[k] = files[k].dedent(true);
  });
  const t = new import_transformer.Transformer({
    plugins: [
      new import_plugins.Plugins.RegexReplace({ replacements })
    ],
    files,
    async: false
  });
  return async () => {
    const { error } = await t.run();
    if (error)
      throw new Error(error.message);
    return t.sources.get("unit_test.js")?.data ?? "<no data>";
  };
};
tests.add("replace:1", create_unit_test(`
    const str = "foo foo";
    `, [
  { pattern: /foo/g, replacement: "bar" }
]));
tests.add("replace:2", create_unit_test(`
    const str = "foo baz foo";
    `, [
  { pattern: /foo/g, replacement: "bar" },
  { pattern: /baz/g, replacement: "qux" }
]));
tests.add("replace:3", create_unit_test(`
    const count = 4;
    `, [
  {
    pattern: /(\d+)/g,
    replacement: (match) => (parseInt(match[0], 10) * 2).toString()
  }
]));
