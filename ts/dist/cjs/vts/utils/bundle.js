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
  bundle: () => bundle
});
module.exports = __toCommonJS(stdin_exports);
var pathlib = __toESM(require("path"));
var esbuild = __toESM(require("esbuild"));
var import_vlib = require("../../vlib/index.js");
;
async function bundle(options) {
  let {
    entry_paths = [],
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
    opts = {},
    postprocess = void 0,
    log_level = 0,
    analyze = true
  } = options;
  if (entry_paths.length > 0) {
    include = include.concat(entry_paths);
  }
  const errors = [];
  let bundled_code = void 0;
  let bundled_source_map = void 0;
  let inputs = [];
  const outfile = !output || typeof output === "string" ? output : output[0];
  const import_tracker = analyze ? new ImportTracker() : void 0;
  try {
    const result = await esbuild.build({
      entryPoints: include,
      bundle: true,
      platform,
      plugins: [...opts.plugins || [], import_tracker?.plugin],
      format,
      target,
      minify,
      sourcemap,
      write: false,
      metafile: extract_inputs,
      logLevel: typeof debug === "boolean" ? debug ? "debug" : "silent" : debug,
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
      ...opts
    });
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        errors.push(format_esbuild_warning_error(error));
        const e = format_esbuild_warning_error(error);
        errors.push(e);
        import_tracker?.add_error(e);
      }
    }
    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        const e = format_esbuild_warning_error(warning);
        errors.push(e);
        import_tracker?.add_error(e);
      }
    }
    if (extract_inputs && result.metafile?.inputs) {
      inputs = Object.keys(result.metafile.inputs).map(resolve_path);
    }
    if (result.outputFiles && result.outputFiles.length > 0) {
      bundled_code = result.outputFiles.filter((f) => f.path === "<stdout>" || f.path.endsWith(".js") && !f.path.endsWith(".d.js")).map((f) => f.text).join("\n");
      if (sourcemap) {
        const mapFile = result.outputFiles.find((f) => f.path.endsWith(".map"));
        if (mapFile)
          bundled_source_map = mapFile.text;
      }
    } else {
      errors.push({ data: "No output files were generated during bundling." });
    }
    if (analyze && result.metafile) {
      const res = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
      console.log("Meta:\n" + res);
    }
  } catch (err) {
    let processed = false;
    if (Array.isArray(err.errors)) {
      for (const error of err.errors) {
        const e = format_esbuild_warning_error(error);
        errors.push(e);
        import_tracker?.add_error(e);
      }
      processed = true;
    }
    if (Array.isArray(err.warnings)) {
      for (const warning of err.warnings) {
        const e = format_esbuild_warning_error(warning);
        errors.push(e);
        import_tracker?.add_error(e);
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
  if (log_level >= 1) {
    const first_path = typeof output === "string" ? output : Array.isArray(output) ? output[0] : void 0;
    if (first_path != null) {
      const p = new import_vlib.Path(first_path);
      import_vlib.logger.marker(`Bundled ${p.full_name()} (${p.str()}) [${import_vlib.Utils.format_bytes(p.size)}].`);
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
        const res = import_tracker?.show_import_chain(include, e, "    ");
        if (res) {
          lines.push(res);
        }
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
function resolve_path(path) {
  path = pathlib.resolve(path);
  if (process.platform === "darwin" && path.startsWith("/private/tmp/")) {
    path = path.slice(8);
  }
  return path;
}
const format_esbuild_warning_error = (warning) => {
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
      if (note.suggestion) {
        console.error("@todo handle suggestion:" + note.suggestion + " note: " + JSON.stringify(note, null, 4));
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
class ImportTracker {
  plugin;
  import_graph = /* @__PURE__ */ new Map();
  errors = [];
  error_files = /* @__PURE__ */ new Set();
  constructor() {
    const import_graph = this.import_graph;
    this.plugin = {
      name: "import-tracker",
      setup(build) {
        build.onResolve({ filter: /^(\.|\/)/ }, (args) => {
          const importer = args.importer || "__cwd__";
          const resolved = pathlib.resolve(pathlib.dirname(importer === "__cwd__" ? process.cwd() : importer), args.path);
          const arr = import_graph.get(importer) || [];
          arr.push(resolved);
          import_graph.set(importer, arr);
          return { path: resolved };
        });
        build.onResolve({ filter: /^[^\.\/]/ }, (args) => {
          const importer = args.importer || "__cwd__";
          const arr = import_graph.get(importer) || [];
          arr.push(args.path);
          import_graph.set(importer, arr);
          return { path: args.path, external: true };
        });
      }
    };
  }
  /** Add an esbuild error or warning. */
  add_error(error) {
    this.errors.push(error);
    if (error.file_name) {
      this.error_files.add(resolve_path(error.file_name));
    }
  }
  /** Show the import chain for an error. */
  show_import_chain(include, error, indent = "") {
    let out_lines = [];
    let error_path;
    if (this.error_files.size === 0 || !(error_path = resolve_path(typeof error === "string" ? error : error.file_name)) || !this.error_files.has(error_path)) {
      return;
    }
    const as_relative = (path) => include.length === 1 ? pathlib.relative(include[0], path) : path;
    const prepare_paths = (paths) => {
      let p = paths.filter(Boolean).map(resolve_path);
      if (p.length > 0) {
        const common_base = import_vlib.Path.find_common_base_path(p);
        if (common_base) {
          const slice_start = new import_vlib.Path(common_base).abs().str().length;
          for (let i = 0; i < p.length; i++) {
            p[i] = "." + p[i].slice(slice_start);
          }
        }
      }
      return p;
    };
    const walk = (curr, chain) => {
      if (curr === error_path || pathlib.resolve(curr) === error_path) {
        const lines = prepare_paths(chain.concat(curr)).map((l, i) => false ? import_vlib.Color.italic(l) : `${indent}  ${import_vlib.Color.italic(l)}`).map((l, i, arr) => i === arr.length - 1 ? l : `${l} ${import_vlib.Color.blue("\u2192")}`).map((l, i, arr) => {
          if (!l) {
            return l;
          }
          const next = arr[i + 1]?.trimStart();
          if (next && l.length + next.length <= 125) {
            arr[i + 1] = "";
            return l + " " + next;
          } else if (next === l) {
            arr[i + 1] = "";
            return l;
          }
          return l;
        }).filter(Boolean).join("\n");
        out_lines.push(`${indent}${import_vlib.Color.gray("note")}: Import chain for error 
${lines}`);
        return;
      }
      const children = this.import_graph.get(curr) || [];
      for (const next of children) {
        if (chain.includes(next))
          continue;
        walk(next, chain.concat(curr));
      }
    };
    for (const entry of include.map(resolve_path)) {
      walk(entry, []);
    }
    return out_lines.length > 0 ? out_lines.join("\n") : void 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bundle
});
