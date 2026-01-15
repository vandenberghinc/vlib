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
  function insert_into_file(file_content, next_value, options = {}) {
    const insert = options.update ?? false;
    let current_text = file_content.trim().length === 0 ? "null\n" : file_content;
    const formatting_options = {
      tabSize: options.indent ?? 2,
      insertSpaces: options.indent_using_spaces ?? true,
      eol: options.eol ?? "\n",
      insertFinalNewline: options.insert_final_eol ?? false,
      keepLines: options.keep_lines ?? false
    };
    const modification_options = {
      formattingOptions: formatting_options
    };
    const apply_value_at_path = (path, value) => {
      const edits = (0, import_jsonc_parser.modify)(current_text, path, value, modification_options);
      if (!edits || edits.length === 0)
        return;
      current_text = (0, import_jsonc_parser.applyEdits)(current_text, edits);
    };
    const is_plain_object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    const is_array = (value) => Array.isArray(value);
    const same_container_type = (a, b) => is_plain_object(a) && is_plain_object(b) || is_array(a) && is_array(b);
    const merge_object = (old_obj, new_obj, base_path) => {
      if (!insert) {
        for (const old_key of Object.keys(old_obj)) {
          if (!(old_key in new_obj)) {
            apply_value_at_path(base_path.concat(old_key), void 0);
          }
        }
      }
      for (const new_key of Object.keys(new_obj)) {
        const child_path = base_path.concat(new_key);
        const old_child = old_obj[new_key];
        const new_child = new_obj[new_key];
        if (is_plain_object(old_child) && is_plain_object(new_child)) {
          merge_object(old_child, new_child, child_path);
          continue;
        }
        if (is_array(old_child) && is_array(new_child)) {
          merge_array(old_child, new_child, child_path);
          continue;
        }
        apply_value_at_path(child_path, new_child);
      }
    };
    const get_value_at_path = (root, path) => {
      let cur = root;
      for (const seg of path) {
        if (cur == null)
          return void 0;
        cur = cur[seg];
      }
      return cur;
    };
    const reparse_current_text = () => (0, import_jsonc_parser.parse)(current_text, void 0, {
      allowTrailingComma: true,
      allowEmptyContent: true
    });
    const merge_array = (old_arr, new_arr, base_path) => {
      for (let i = 0; i < new_arr.length; i++) {
        const child_path = base_path.concat(i);
        const old_child = i < old_arr.length ? old_arr[i] : void 0;
        const new_child = new_arr[i];
        if (is_plain_object(old_child) && is_plain_object(new_child)) {
          merge_object(old_child, new_child, child_path);
          continue;
        }
        if (is_array(old_child) && is_array(new_child)) {
          merge_array(old_child, new_child, child_path);
          continue;
        }
        apply_value_at_path(child_path, new_child);
      }
      if (old_arr.length > new_arr.length) {
        const reparsed_root = reparse_current_text();
        const current_arr = get_value_at_path(reparsed_root, base_path);
        if (Array.isArray(current_arr)) {
          apply_value_at_path(base_path, current_arr.slice(0, new_arr.length));
        } else {
          apply_value_at_path(base_path, new_arr);
        }
      } else if (old_arr.length < new_arr.length) {
      }
    };
    const parsed_root = (0, import_jsonc_parser.parse)(current_text, void 0, {
      allowTrailingComma: true,
      allowEmptyContent: true
    });
    if (!same_container_type(parsed_root, next_value)) {
      apply_value_at_path([], next_value);
      return current_text;
    }
    if (is_plain_object(parsed_root) && is_plain_object(next_value)) {
      merge_object(parsed_root, next_value, []);
      return current_text;
    }
    if (is_array(parsed_root) && is_array(next_value)) {
      merge_array(parsed_root, next_value, []);
      return current_text;
    }
    apply_value_at_path([], next_value);
    return current_text;
  }
  JSONC2.insert_into_file = insert_into_file;
  async function save(path, obj, options = {}) {
    const p = path instanceof import_path.Path ? path : new import_path.Path(path);
    if (!p.exists()) {
      throw new Error(`File "${path}" does not exist.`);
    }
    const file = await p.load({ type: "string" });
    const updated_content = insert_into_file(file, obj, { ...options, update: false });
    await p.save(updated_content);
  }
  JSONC2.save = save;
  async function update(path, obj, options = {}) {
    const p = path instanceof import_path.Path ? path : new import_path.Path(path);
    if (!p.exists()) {
      throw new Error(`File "${path}" does not exist.`);
    }
    const file = await p.load({ type: "string" });
    const updated_content = insert_into_file(file, obj, { ...options, update: true });
    await p.save(updated_content);
  }
  JSONC2.update = update;
})(JSONC || (JSONC = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JSONC,
  jsonc
});
