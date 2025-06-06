"use strict";
var import_vtest = require("../../vtest/index.js");
var import_transformer = require("../transformer/transformer.js");
var import_plugins = require("../plugins/plugins.js");
const tests = new import_vtest.Module({ name: "vts/no-debug" });
const create_unit_test = (data) => {
  const files = { "unit_test.js": data };
  Object.keys(files).walk((k) => {
    files[k] = files[k].dedent(true);
  });
  const t = new import_transformer.Transformer({
    plugins: [new import_plugins.Plugins.NoDebug()],
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
tests.add("no_debug_none:1", "success", create_unit_test(`
// no debug calls \u2014 expect identical input/output
const a = 1;
function foo() {
    return a;
}
`));
tests.add("no_debug_simple:2", "success", create_unit_test(`
// single debug \u2014 the line "debug('test');" should be "//debug('test');"
debug("test");
const x = 1;
`));
tests.add("no_debug_nested:3", "success", create_unit_test(`
// nested debug \u2014 the whole "debug(foo(bar));" should be commented
debug(foo(bar));
`));
tests.add("no_debug_multiline:4", "success", create_unit_test(`
// multiline debug \u2014 each line from "debug(" to its closing ")" (plus semicolon) should be "//"-commented
debug(
    foo(
        "a",
        debug("inner"),
        baz
    )
);
const y = 2;
`));
