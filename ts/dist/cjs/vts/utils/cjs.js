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
  cjs: () => cjs
});
module.exports = __toCommonJS(stdin_exports);
var esbuild = __toESM(require("esbuild"));
var import_vlib = require("../../vlib/index.js");
async function cjs({ src, dest, target, platform, override = false, debug = 0 }) {
  const src_path = new import_vlib.Path(src);
  if (!src_path.exists()) {
    throw new Error(`Source path "${src_path.str()}" does not exist.`);
  }
  if (!src_path.is_dir()) {
    throw new Error(`Source path "${src_path.str()}" is not a directory.`);
  }
  const dest_path = new import_vlib.Path(dest);
  if (dest_path.exists()) {
    if (override) {
      await dest_path.del({ recursive: true });
    } else {
      throw new Error(`Destination path "${dest_path.str()}" already exists.`);
    }
  }
  const esm_files = await src_path.paths({ recursive: true, absolute: false });
  if (import_vlib.debug.on(1))
    console.log(`Found ${esm_files.length} files to consider.`);
  for (const esm of esm_files) {
    const abs_esm = src_path.join(esm);
    if (abs_esm.is_dir()) {
      continue;
    }
    const out_path = dest_path.join(esm);
    const out_base = out_path.base();
    if (!out_base) {
      throw new Error(`Failed to resolve base path for output path "${out_path.str()}"`);
    }
    await out_base.mkdir();
    const ext = esm.extension();
    if (ext !== ".js") {
      if (esm.full_name() === "package.json") {
        console.log(`.${esm}
    skipping...`);
        continue;
      }
      if (import_vlib.debug.on(1))
        console.log(`.${esm}
    copied asset to ${out_path} [${import_vlib.Utils.format_bytes(abs_esm.size)}]`);
      await abs_esm.cp(out_path);
      continue;
    }
    const source_code = await abs_esm.load({ type: "buffer" });
    try {
      const result = await esbuild.transform(source_code, {
        loader: "js",
        format: "cjs",
        platform,
        target,
        sourcemap: false
      });
      out_path.save(result.code);
      if (import_vlib.debug.on(1))
        console.log(`.${esm}
    transformed to ${out_path} [${import_vlib.Utils.format_bytes(Buffer.byteLength(result.code, "utf8"))}]`);
    } catch (err) {
      throw new Error(`Failed to convert ${esm} to CJS: ${err.message || err}`);
    }
  }
  const pkg_path = dest_path.join("package.json");
  if (!pkg_path.exists()) {
    pkg_path.save(JSON.stringify({
      type: "commonjs"
    }));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cjs
});
