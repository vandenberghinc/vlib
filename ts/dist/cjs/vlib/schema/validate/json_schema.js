var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  create_json_schema: () => create_json_schema,
  create_json_schema_sync: () => create_json_schema_sync
});
module.exports = __toCommonJS(stdin_exports);
var import_path = require("../../generic/path.js");
var import_index_m_uni = require("../index.m.uni.js");
var import_validator_entries = require("./validator_entries.js");
const entry_to_json_schema = (entry, state) => {
  const json = {};
  const map_type = (t) => {
    if (typeof t === "string") {
      return t === "string" || t === "number" || t === "boolean" || t === "object" || t === "array" || t === "null" ? t : void 0;
    }
    if (typeof t === "function")
      return "object";
    return void 0;
  };
  const type_kw = Array.isArray(entry.type) ? entry.type.map(map_type).filter(Boolean) : map_type(entry.type);
  if (type_kw && (!Array.isArray(type_kw) || type_kw.length)) {
    json.type = type_kw;
  }
  const has_type = (t) => Array.isArray(json.type) ? json.type.includes(t) : json.type === t;
  if (entry.enum)
    json.enum = entry.enum;
  if (entry.default !== import_validator_entries.NoValue)
    json.default = entry.default;
  if (typeof entry.min === "number") {
    if (has_type("string"))
      json.minLength = entry.min;
    else if (has_type("array"))
      json.minItems = entry.min;
    else if (has_type("number"))
      json.minimum = entry.min;
  }
  if (typeof entry.max === "number") {
    if (has_type("string"))
      json.maxLength = entry.max;
    else if (has_type("array"))
      json.maxItems = entry.max;
    else if (has_type("number"))
      json.maximum = entry.max;
  }
  if (entry.schema) {
    const props = {};
    const req = [];
    for (const [k, v] of entry.schema.entries()) {
      props[k] = entry_to_json_schema(v, v.unknown !== import_validator_entries.NoValue ? { unknown: v.unknown } : state);
      if (v.required)
        req.push(k);
    }
    json.type = "object";
    json.properties = props;
    if (req.length)
      json.required = req;
    if (entry.value_schema) {
      json.additionalProperties = entry_to_json_schema(entry.value_schema, entry.value_schema.unknown !== import_validator_entries.NoValue ? { unknown: entry.value_schema.unknown } : state);
    } else if (entry.unknown === import_validator_entries.NoValue ? !state.unknown : !entry.unknown) {
      json.additionalProperties = false;
    }
    return json;
  }
  if (entry.tuple_schema) {
    json.type = "array";
    json.items = entry.tuple_schema.map((v) => entry_to_json_schema(v, v.unknown !== import_validator_entries.NoValue ? { unknown: v.unknown } : state));
    if (entry.value_schema) {
      json.additionalItems = entry_to_json_schema(entry.value_schema, entry.value_schema.unknown !== import_validator_entries.NoValue ? { unknown: entry.value_schema.unknown } : state);
    } else {
      json.additionalItems = false;
    }
    if (typeof entry.min === "number")
      json.minItems = entry.min;
    if (typeof entry.max === "number")
      json.maxItems = entry.max;
    return json;
  }
  if (entry.value_schema && has_type("array")) {
    json.items = entry_to_json_schema(entry.value_schema, entry.value_schema.unknown !== import_validator_entries.NoValue ? { unknown: entry.value_schema.unknown } : state);
  }
  return json;
};
function create_json_schema_sync(opts) {
  if (!opts?.schema) {
    throw new import_index_m_uni.InvalidUsageError("Validator.create_json_schema() requires the `schema` option.");
  }
  const entries = new import_validator_entries.ValidatorEntries(opts.schema);
  const properties = {};
  const required = [];
  for (const [key, entry] of entries) {
    properties[key] = entry_to_json_schema(entry, {
      unknown: opts.unknown ?? true
    });
    if (entry.required !== false)
      required.push(key);
  }
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties
  };
  if (required.length)
    schema.required = required;
  if (opts.unknown === false)
    schema.additionalProperties = false;
  if (opts?.output) {
    const path = typeof opts?.output === "string" ? new import_path.Path(opts.output) : opts?.output;
    path.save_sync(JSON.stringify(schema, null, opts.indent));
  }
  return schema;
}
async function create_json_schema(opts) {
  const schema = create_json_schema_sync({
    schema: opts.schema,
    unknown: opts.unknown,
    output: void 0
    // ensure its not saved in sync.
  });
  const path = typeof opts.output === "string" ? new import_path.Path(opts.output) : opts.output;
  await path.save(JSON.stringify(schema, null, opts.indent));
  return schema;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  create_json_schema,
  create_json_schema_sync
});
