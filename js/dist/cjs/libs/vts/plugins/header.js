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
  header_plugin: () => header_plugin
});
module.exports = __toCommonJS(stdin_exports);
async function header_plugin(path, author, start_year) {
  const current_year = (/* @__PURE__ */ new Date()).getFullYear();
  const header_regex = /^\/\*\*[\s\S]*?\*\//;
  const copyright = `\xA9 ${start_year == null ? current_year : `${start_year} - ${current_year}`} ${author}. All rights reserved.`;
  const data = await path.load();
  let new_data = data;
  const match = data.match(header_regex);
  if (match) {
    const existing_header = match[0];
    const updated_header = existing_header.replace(/@author\s.*$/m, `@author ${author}`).replace(/@copyright\s.*$/m, `@copyright ${copyright}`);
    new_data = data.replace(existing_header, updated_header);
  } else {
    new_data = `/**
 * @author ${author}
 * @copyright ${copyright}
 */
` + data;
  }
  await path.save(new_data);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  header_plugin
});
