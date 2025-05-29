"use strict";
var import_vtest = require("../../vtest/index.js");
var import_transformer = require("../transformer/transformer.js");
var import_plugins = require("../plugins/plugins.js");
const tests = new import_vtest.Module({ name: "vts/version" });
const create_unit_test = (files) => {
  if (typeof files === "string") {
    files = { "unit_test.ts": files, "unit_test.js": files };
  }
  Object.keys(files).walk((k) => {
    files[k] = files[k].dedent(true);
  });
  const t = new import_transformer.Transformer({
    plugins: [
      new import_plugins.Plugins.Version({
        version: "1.2.3"
      })
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
tests.add("insert:1", "success", create_unit_test(`
    console.log(__version);
`));
tests.add("upsert:2", "success", create_unit_test(`
    /** vts-version */ const __version="1.2.3"; /** vts-version END */
    console.log(__version);
`));
tests.add("ignore:1", "success", create_unit_test(`
    console.log("Hi!");
`));
