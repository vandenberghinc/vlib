var import_query = require("./query.js");
const cast_test_nr = 42;
const cast_test_str = "hello";
const cast_test_bool_arr = [true];
const cast_test_bool_arr_err = [void 0];
function test_infer_args(i, callback) {
}
test_infer_args([
  // Name based.
  { name: "some_def_str" },
  { name: "some_str", type: "string" },
  { name: "some_nr", type: "number" },
  { name: "some_opt_nr", type: "number", required: false },
  {
    name: "some_opt_nr_2",
    type: "number",
    required: () => {
      return true;
    }
  },
  { name: "some_list", type: "string[]" },
  { name: "some_bool_list", type: "boolean[]" },
  // Name based.
  { id: "id_some_def_str" },
  { id: "--id_some_str", type: "string" },
  { id: "--id-some-nr", type: "number" },
  { id: "--id_some_opt_nr", type: "number", required: false },
  {
    name: "id_some_opt_nr_2",
    type: "number",
    required: () => {
      return true;
    }
  },
  { id: "id_some_list", type: "string[]" },
  { id: "id_some_bool_list", type: "boolean[]" },
  // Index based.
  { index: 0, type: "number" },
  // OR id.
  { id: ["--id_some_or_nr", "-i"], type: "number" },
  // AND id.
  { id: new import_query.And("--id_and_1", "--x"), type: "number" },
  { id: new import_query.And("--id_and_1", "--y"), type: "boolean" },
  { id: new import_query.And("--id_and_2", "--nested", "--x"), type: "number" },
  { id: new import_query.And("--id_and_2", "--nested", "--y"), type: "boolean" },
  { id: new import_query.And("--id_and_2", "--nested", "--z"), type: "string" },
  // Enum.
  { id: "--some_enum", enum: ["a", "b", "c"] },
  // Omitted type.
  { name: "omitted_type_1" },
  // Optional.
  { name: "some_optional_1", required: false },
  { name: "some_optional_2", def: "some_val" },
  { name: "some_optional_3", def: void 0 },
  // Some type+def number, caused error in the past.
  { id: "some_type_plus_def_nr", def: 0, type: "number" }
], (args) => {
  const some_def_str = args.some_def_str;
  const some_str = args.some_str;
  const some_nr = args.some_nr;
  const some_opt_nr = args.some_opt_nr;
  const some_opt_nr_2 = args.some_opt_nr_2;
  const some_list = args.some_list;
  const some_bool_list = args.some_bool_list;
  const id_some_def_str = args.id_some_def_str;
  const id_some_str = args.id_some_str;
  const id_some_nr = args.id_some_nr;
  const id_some_opt_nr = args.id_some_opt_nr;
  const id_some_opt_nr_2 = args.id_some_opt_nr_2;
  const id_some_list = args.some_list;
  const id_some_bool_list = args.id_some_bool_list;
  const _index_some_nr = args.arg_0;
  const id_some_or_nr = args.id_some_or_nr;
  args.unknown;
  const id_and_1 = args.id_and_1;
  const id_and_2_nested = args.id_and_2.nested;
  const id_and_2 = args.id_and_2;
  const some_enum = args.some_enum;
  const some_enum_unknown = args.some_enum_unknown;
  const omitted_type_1 = args.omitted_type_1;
  const some_optional_1 = args.some_optional_1;
  const some_optional_2 = args.some_optional_2;
  const some_optional_3 = args.some_optional_3;
  const some_type_plus_def_nr = args.some_type_plus_def_nr;
});
