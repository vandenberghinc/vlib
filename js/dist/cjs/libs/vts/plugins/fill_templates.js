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
  fill_exact_templates: () => fill_exact_templates,
  fill_templates: () => fill_templates,
  fill_version: () => fill_version
});
module.exports = __toCommonJS(stdin_exports);
var fs = __toESM(require("fs"));
var pathlib = __toESM(require("path"));
var import_fast_glob = __toESM(require("fast-glob"));
var vlib = __toESM(require("../../../index.js"));
const placeholder_pattern = /\{\{(\w+)\}\}/g;
async function fill_templates(dist, templates, allow_not_found = false) {
  const process_file = async (file) => {
    if (file instanceof vlib.Path) {
      file = file.data;
    }
    const raw = await fs.promises.readFile(file, "utf8");
    if (!raw.includes("{{"))
      return;
    let changed = false;
    const result = raw.replace(placeholder_pattern, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(templates, key)) {
        changed = true;
        return String(templates[key]);
      }
      return match;
    });
    if (changed) {
      await fs.promises.writeFile(file, result, "utf8");
    }
  };
  if (Array.isArray(dist)) {
    await Promise.all(dist.map(process_file));
    return;
  }
  const dist_path = dist instanceof vlib.Path ? dist : new vlib.Path(dist);
  if (!dist_path.exists()) {
    if (allow_not_found) {
      return;
    }
    throw new Error(`Directory "${dist_path.str()}" does not exist.`);
  }
  if (!dist_path.is_dir()) {
    await process_file(dist_path.str());
    return;
  }
  const abs_dir = pathlib.resolve(dist_path.data);
  const files = await (0, import_fast_glob.default)(`${abs_dir.split(pathlib.sep).join("/")}/**/*.{js,jsx,ts,tsx}`, { dot: true, onlyFiles: true });
  await Promise.all(files.map(process_file));
}
async function fill_exact_templates(dist, templates, allow_not_found = false) {
  const process_file = async (file) => {
    if (file instanceof vlib.Path) {
      file = file.data;
    }
    const raw = await fs.promises.readFile(file, "utf8");
    const pattern = new RegExp(`\b$(${Object.keys(templates).join("|")})\b`, "g");
    let changed = false;
    const result = raw.replace(pattern, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(templates, key)) {
        changed = true;
        return String(templates[key]);
      }
      return match;
    });
    if (changed) {
      await fs.promises.writeFile(file, result, "utf8");
    }
  };
  if (Array.isArray(dist)) {
    await Promise.all(dist.map(process_file));
    return;
  }
  const dist_path = dist instanceof vlib.Path ? dist : new vlib.Path(dist);
  if (!dist_path.exists()) {
    if (allow_not_found) {
      return;
    }
    throw new Error(`Directory "${dist_path.str()}" does not exist.`);
  }
  if (!dist_path.is_dir()) {
    await process_file(dist_path.str());
    return;
  }
  const abs_dir = pathlib.resolve(dist_path.data);
  const files = await (0, import_fast_glob.default)(`${abs_dir.split(pathlib.sep).join("/")}/**/*.{js,jsx,ts,tsx}`, { dot: true, onlyFiles: true });
  await Promise.all(files.map(process_file));
}
async function fill_version(paths, package_json, allow_not_found = false, version) {
  if (version) {
    return fill_exact_templates(paths, { __version: version });
  }
  if (!package_json) {
    throw new Error(`Package.json path is not set.`);
  }
  const package_json_path = new vlib.Path(package_json);
  if (!package_json_path.exists()) {
    if (allow_not_found) {
      return;
    }
    throw new Error(`Package.json "${package_json_path.str()}" does not exist.`);
  }
  const data = package_json_path.load_sync({ type: "object" });
  if (!data.version) {
    throw new Error(`Package.json "${package_json_path.str()}" does not contain a version.`);
  }
  return fill_exact_templates(paths, { __version: data.version });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fill_exact_templates,
  fill_templates,
  fill_version
});
