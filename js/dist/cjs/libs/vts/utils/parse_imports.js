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
  parse_imports: () => parse_imports
});
module.exports = __toCommonJS(stdin_exports);
var import_esbuild = __toESM(require("esbuild"));
var import_fs = require("fs");
var import_path = __toESM(require("path"));
async function parse_imports(file_path, options = {}) {
  const { recursive = false, external = false, include_exports: includeExports = true } = options;
  const visited = /* @__PURE__ */ new Set();
  const results = /* @__PURE__ */ new Set();
  async function _walk(file, depth) {
    const resolved_entry = await resolve_file(file);
    if (visited.has(resolved_entry))
      return;
    visited.add(resolved_entry);
    let sourceText;
    try {
      sourceText = await import_fs.promises.readFile(resolved_entry, "utf8");
    } catch {
      results.add(file);
      return;
    }
    const build = await import_esbuild.default.build({
      entryPoints: [resolved_entry],
      bundle: false,
      write: false,
      metafile: true,
      platform: "node",
      format: "esm",
      absWorkingDir: process.cwd(),
      logLevel: "silent"
    });
    const meta = build.metafile;
    for (const info of Object.values(meta.outputs)) {
      if (info.entryPoint && import_path.default.resolve(info.entryPoint) === resolved_entry) {
        for (const imp of info.imports) {
          await process_specifier(imp.path, imp.external ?? false, resolved_entry, depth);
        }
        break;
      }
    }
    for (const m of sourceText.matchAll(/\brequire\(\s*['"](.+?)['"]\s*\)/g)) {
      await process_specifier(m[1], false, resolved_entry, depth);
    }
    if (includeExports) {
      for (const m of sourceText.matchAll(/export\s+(?:\*|\{[\s\S]*?\})\s+from\s+['"](.+?)['"]/g)) {
        await process_specifier(m[1], false, resolved_entry, depth);
      }
    }
  }
  async function process_specifier(spec, is_external, importer, depth) {
    if (is_external) {
      if (external)
        results.add(spec);
    } else {
      let target;
      try {
        target = require.resolve(spec, { paths: [import_path.default.dirname(importer)] });
      } catch {
        target = await resolve_file(import_path.default.resolve(import_path.default.dirname(importer), spec));
      }
      if (!results.has(target)) {
        results.add(target);
        if (recursive && (options.max_depth === void 0 || depth < options.max_depth)) {
          await _walk(target, depth + 1);
        }
      }
    }
  }
  async function resolve_file(p) {
    const exts = ["", ".js", ".ts", ".tsx", ".mjs", ".cjs", "/index.js", "/index.ts"];
    for (const ext of exts) {
      const full = p + ext;
      try {
        await import_fs.promises.access(full);
        return import_path.default.resolve(full);
      } catch {
        continue;
      }
    }
    return import_path.default.resolve(p);
  }
  await _walk(file_path, 0);
  return results;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parse_imports
});
