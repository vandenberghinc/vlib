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
  bundle: () => bundle,
  create_esbuild_err: () => create_esbuild_err,
  resolve_path: () => resolve_path
});
module.exports = __toCommonJS(stdin_exports);
var pathlib = __toESM(require("path"));
var esbuild = __toESM(require("esbuild"));
var import_vlib = require("../../vlib/index.js");
function resolve_path(path) {
  if (path instanceof import_vlib.Path) {
    path = path.path;
  }
  if (path === "__cwd__") {
    return process.cwd();
  }
  path = pathlib.resolve(path);
  if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
    path = path.slice(8);
  }
  return path;
}
const create_esbuild_err = (warning) => {
  let output;
  if (warning.location) {
    const trimmed_line = warning.location.lineText.trimStart();
    const removed_start_indent = warning.location.lineText.length - trimmed_line.length;
    output = `${import_vlib.Color.cyan(warning.location.file)}:${import_vlib.Color.yellow(warning.location.line)}:${import_vlib.Color.yellow(warning.location.column)} - ${import_vlib.Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}

` + import_vlib.Colors.bright_bg.white + import_vlib.Colors.black + warning.location.line + import_vlib.Colors.end + "    " + trimmed_line + "\n" + import_vlib.Colors.bright_bg.white + import_vlib.Colors.black + " ".repeat(warning.location.line.toString().length) + import_vlib.Colors.end + " ".repeat(4 + warning.location.column - removed_start_indent) + import_vlib.Color.red("~".repeat(warning.location.length));
  } else {
    output = `${import_vlib.Color.yellow("warning")} [esbuild${warning.id === "" ? "" : `-${warning.id}`}]: ${warning.text}`;
  }
  if (Array.isArray(warning.notes)) {
    for (const note of warning.notes) {
      if (note.location) {
        const trimmed_line = note.location.lineText.trimStart();
        const removed_start_indent = note.location.lineText.length - trimmed_line.length;
        output += `
    ${import_vlib.Color.cyan(note.location.file)}:${import_vlib.Color.yellow(note.location.line)}:${import_vlib.Color.yellow(note.location.column)} - ${import_vlib.Color.gray("note")}: ${note.text}

` + import_vlib.Colors.bright_bg.white + import_vlib.Colors.black + note.location.line + import_vlib.Colors.end + "        " + trimmed_line + "\n" + import_vlib.Colors.bright_bg.white + import_vlib.Colors.black + " ".repeat(note.location.line.toString().length) + import_vlib.Colors.end + " ".repeat(8 + note.location.column - removed_start_indent) + import_vlib.Color.red("~".repeat(note.location.length));
      } else {
        output += `
    ${import_vlib.Color.gray("note")}: ${note.text}`;
      }
    }
  }
  return {
    data: output,
    file_name: warning.location?.file,
    line: warning.location?.line,
    column: warning.location?.column
  };
};
;
async function bundle(options) {
  let {
    include = [],
    externals = [],
    output = void 0,
    platform = "browser",
    format = "iife",
    target = "es2021",
    minify = false,
    sourcemap = false,
    // 'inline'
    error_limit = 25,
    extract_inputs = false,
    tree_shaking = void 0,
    debug = false,
    postprocess = void 0
  } = options;
  const errors = [];
  let bundled_code = void 0;
  let bundled_source_map = void 0;
  let inputs = [];
  let outfile = Array.isArray(output) ? output[0] : output;
  if (outfile instanceof import_vlib.Path)
    outfile = outfile.path;
  let build_result;
  try {
    build_result = await esbuild.build({
      entryPoints: include.map((p) => p instanceof import_vlib.Path ? p.path : p),
      bundle: true,
      platform,
      format,
      target,
      minify,
      sourcemap,
      write: false,
      metafile: extract_inputs,
      logLevel: typeof debug === "boolean" && debug || typeof debug === "number" && debug > 0 ? "debug" : "silent",
      treeShaking: tree_shaking,
      external: externals,
      outfile,
      loader: {
        ".ttf": "file",
        ".woff": "file",
        ".woff2": "file",
        ".eot": "file",
        ".svg": "file"
      },
      ...options.opts || {}
    });
    if (build_result.errors.length > 0) {
      for (const error of build_result.errors) {
        errors.push(create_esbuild_err(error));
      }
    }
    if (build_result.warnings.length > 0) {
      for (const warning of build_result.warnings) {
        errors.push(create_esbuild_err(warning));
      }
    }
    if (extract_inputs && build_result.metafile?.inputs) {
      inputs = Object.keys(build_result.metafile.inputs).map(resolve_path);
    }
    if (build_result.outputFiles && build_result.outputFiles.length > 0) {
      bundled_code = build_result.outputFiles.filter((f) => f.path === "<stdout>" || f.path.endsWith(".js") && !f.path.endsWith(".d.js")).map((f) => f.text).join("\n");
      if (sourcemap) {
        const mapFile = build_result.outputFiles.find((f) => f.path.endsWith(".map"));
        if (mapFile)
          bundled_source_map = mapFile.text;
      }
    } else {
      errors.push({ data: "No output files were generated during bundling." });
    }
  } catch (err) {
    let processed = false;
    if (Array.isArray(err.errors)) {
      for (const error of err.errors) {
        errors.push(create_esbuild_err(error));
      }
      processed = true;
    }
    if (Array.isArray(err.warnings)) {
      for (const warning of err.warnings) {
        errors.push(create_esbuild_err(warning));
      }
      processed = true;
    }
    if (!processed) {
      errors.push({ data: err.message || String(err) });
    }
  }
  if (bundled_code && typeof postprocess === "function") {
    const res = postprocess(bundled_code);
    if (res instanceof Promise) {
      bundled_code = await res;
    } else {
      bundled_code = res;
    }
  }
  if (typeof output === "string") {
    await new import_vlib.Path(output).save(bundled_code ?? "");
  } else if (Array.isArray(output)) {
    for (let i = 0; i < output.length; i++) {
      await new import_vlib.Path(output[i]).save(bundled_code ?? "");
    }
  }
  if (debug === true || typeof debug === "number" && debug >= 1) {
    const first_path = typeof output === "string" ? output : Array.isArray(output) ? output[0] : void 0;
    if (first_path != null) {
      const p = new import_vlib.Path(first_path);
      import_vlib.log.marker(`Bundled ${p.full_name()} (${p.str()}) [${import_vlib.Utils.format_bytes(p.size)}].`);
    }
  }
  return {
    code: bundled_code,
    source_map: bundled_source_map,
    errors,
    inputs,
    debug() {
      let lines = [];
      for (let i = 0; i < Math.min(error_limit, errors.length); i++) {
        const e = errors[i];
        lines.push(e.data);
      }
      if (error_limit != null && errors.length > error_limit) {
        lines.push(`Displayed the first ${error_limit} errors out of ${errors.length}.`);
      } else {
        lines.push(`Encountered ${errors.length} errors.`);
      }
      if (typeof bundled_code === "string" && bundled_code !== "") {
        lines.push(`Generated code of ${import_vlib.Utils.format_bytes(Buffer.byteLength(bundled_code, "utf8"))}`);
      }
      return lines.join("\n");
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bundle,
  create_esbuild_err,
  resolve_path
});
