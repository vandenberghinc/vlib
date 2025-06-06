"use strict";
var import_vtest = require("../../vtest/index.js");
var import_transformer = require("../transformer/transformer.js");
var import_plugins = require("../plugins/plugins.js");
const tests = new import_vtest.Module({ name: "vts/fill-templates" });
const create_unit_test = (files) => {
  if (typeof files === "string") {
    files = { "unit_test.js": files };
  }
  Object.keys(files).walk((k) => {
    files[k] = files[k].dedent(true);
  });
  const t = new import_transformer.Transformer({
    plugins: [
      new import_plugins.Plugins.FillTemplates({
        templates: {
          "MyTemplate": "'Hello World from MyTemplate!'"
        },
        prefix: "{{",
        suffix: "}}",
        quote: false
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
    console.log({{MyTemplate}});
`));
