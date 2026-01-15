var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  JSONC: () => JSONC,
  jsonc: () => JSONC
});
module.exports = __toCommonJS(stdin_exports);
var commentjson = __toESM(require("comment-json"));
var import_jsonc_parser = require("jsonc-parser");
var import_path = require("../generic/path.js");
var JSONC;
(function(JSONC2) {
  function parse(data) {
    return commentjson.parse(data, void 0, true);
  }
  JSONC2.parse = parse;
  async function load(path) {
    const p = path instanceof import_path.Path ? path : new import_path.Path(path);
    return parse(await p.load({ type: "string" }));
  }
  JSONC2.load = load;
  function load_sync(path) {
    const p = path instanceof import_path.Path ? path : new import_path.Path(path);
    return parse(p.load_sync({ type: "string" }));
  }
  JSONC2.load_sync = load_sync;
  async function save(path, obj) {
    const p = path instanceof import_path.Path ? path : new import_path.Path(path);
    if (!p.exists()) {
      throw new Error(`File "${path}" does not exist.`);
    }
    const file = await p.load({ type: "string" });
    await p.save(insert_into_file(file, obj));
  }
  JSONC2.save = save;
  function save_sync(path, obj) {
    const p = path instanceof import_path.Path ? path : new import_path.Path(path);
    if (!p.exists()) {
      throw new Error(`File "${path}" does not exist.`);
    }
    const file = p.load_sync({ type: "string" });
    p.save_sync(insert_into_file(file, obj));
  }
  JSONC2.save_sync = save_sync;
  function insert_into_file(file_content, obj, formatting_overrides = {}) {
    const is_plain_object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    if (!is_plain_object(obj)) {
      throw new TypeError('insert_into_file: "obj" must be a non-null plain object.');
    }
    let current_text = file_content.trim().length === 0 ? "{}\n" : file_content;
    const formatting_options = {
      insertSpaces: true,
      tabSize: 2,
      eol: "\n",
      ...formatting_overrides
    };
    const modification_options = {
      formattingOptions: formatting_options
    };
    const apply_value_at_path = (path, value) => {
      const edits = (0, import_jsonc_parser.modify)(current_text, path, value, modification_options);
      if (!edits || edits.length === 0) {
        return;
      }
      current_text = (0, import_jsonc_parser.applyEdits)(current_text, edits);
    };
    const parsed_root = (0, import_jsonc_parser.parse)(current_text, void 0, {
      allowTrailingComma: true,
      allowEmptyContent: true
    });
    if (!is_plain_object(parsed_root)) {
      apply_value_at_path([], obj);
      return current_text;
    }
    const merge_full_object = (old_value, new_value, base_path) => {
      const old_keys = Object.keys(old_value);
      for (const key of old_keys) {
        if (!(key in new_value)) {
          const delete_path = base_path.concat(key);
          apply_value_at_path(delete_path, void 0);
        }
      }
      const new_keys = Object.keys(new_value);
      for (const key of new_keys) {
        const child_path = base_path.concat(key);
        const old_child = old_value[key];
        const new_child = new_value[key];
        const old_is_plain = is_plain_object(old_child);
        const new_is_plain = is_plain_object(new_child);
        if (old_is_plain && new_is_plain) {
          merge_full_object(old_child, new_child, child_path);
        } else {
          apply_value_at_path(child_path, new_child);
        }
      }
    };
    merge_full_object(parsed_root, obj, []);
    return current_text;
  }
  JSONC2.insert_into_file = insert_into_file;
})(JSONC || (JSONC = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JSONC,
  jsonc
});
