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
  inspect_bundle: () => inspect_bundle
});
module.exports = __toCommonJS(stdin_exports);
var pathlib = __toESM(require("path"));
var esbuild = __toESM(require("esbuild"));
var import_vlib = require("../../vlib/index.js");
var import_bundle = require("./bundle.js");
var import_import_graph = require("./import_graph.js");
var import_trace_imports = require("./trace_imports.js");
async function inspect_bundle(options) {
  let { include = [], externals = [], output = void 0, platform = "browser", format = "iife", target = "es2021", minify = false, tree_shaking = void 0, opts = {} } = options;
  const errors = [];
  let inputs = [];
  let outfile = Array.isArray(output) ? output[0] : output;
  if (outfile instanceof import_vlib.Path)
    outfile = outfile.path;
  let build_result = void 0;
  let secondary_build_result = void 0;
  const use_import_graph = false;
  const graph = use_import_graph ? new import_import_graph.ImportGraphPlugin({ track_externals: true }) : void 0;
  const import_tracer = !use_import_graph ? new import_trace_imports.ImportTracer() : void 0;
  let plugins = [];
  if (opts.plugins)
    plugins = [...opts.plugins];
  if (graph)
    plugins.push(graph.plugin);
  plugins.push({
    name: "capture-result",
    setup(build) {
      build.onEnd((result) => {
        secondary_build_result = result;
      });
    }
  });
  const ctx = await esbuild.context({
    entryPoints: include.map((p) => p instanceof import_vlib.Path ? p.path : p),
    bundle: true,
    platform,
    format,
    target,
    minify,
    write: false,
    metafile: true,
    logLevel: "silent",
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
    ...opts,
    plugins
  });
  try {
    build_result = await ctx.rebuild();
    for (const msg of build_result?.errors ?? [])
      errors.push((0, import_bundle.create_esbuild_err)(msg));
    for (const msg of build_result?.warnings ?? [])
      errors.push((0, import_bundle.create_esbuild_err)(msg));
  } catch (err) {
    let processed = false;
    if (Array.isArray(err.errors)) {
      for (const error of err.errors)
        errors.push((0, import_bundle.create_esbuild_err)(error));
      processed = true;
    }
    if (Array.isArray(err.warnings)) {
      for (const warning of err.warnings)
        errors.push((0, import_bundle.create_esbuild_err)(warning));
      processed = true;
    }
    if (!processed) {
      errors.push({ data: err.message || String(err) });
    }
  } finally {
    await ctx.dispose();
    if (!build_result) {
      build_result = secondary_build_result;
    }
  }
  if (build_result?.metafile?.inputs) {
    inputs = Object.keys(build_result.metafile.inputs).map(import_bundle.resolve_path);
  }
  let import_chains;
  const get_import_chains = () => {
    import_chains = [];
    if (graph) {
      for (let i = 0; i < errors.length; i++) {
        const p = errors[i].file_name;
        if (!p)
          continue;
        const g = graph.get_import_chains(p);
        if (!g)
          continue;
        import_chains.push(g);
      }
    } else {
      const traces = [];
      for (const e of errors) {
        if (e.file_name) {
          for (const input of include) {
            traces.push({ from: pathlib.resolve(input.toString()), to: pathlib.resolve(e.file_name) });
          }
        }
      }
      import_chains = import_tracer.trace(traces);
    }
    return import_chains;
  };
  return {
    errors,
    format_errors: () => {
      const errors_formatted = [];
      for (let i = 0; i < errors.length; i++) {
        const e = errors[i];
        errors_formatted.push(e.data);
      }
      return errors_formatted;
    },
    inputs,
    import_chains: get_import_chains,
    format_import_chains: () => use_import_graph ? graph.format_import_chains(get_import_chains()) : import_tracer.format_import_chains(get_import_chains()),
    metafile: build_result?.metafile ? esbuild.analyzeMetafileSync(build_result.metafile, { verbose: false }) : void 0,
    debug({ limit, filter }) {
      const lines = [];
      if (limit == null || limit < 0)
        limit = errors.length;
      for (let i = 0; i < Math.min(limit, errors.length); i++) {
        const e = errors[i];
        if (filter && !filter(e))
          continue;
        lines.push(e.data);
        if (e.file_name) {
          const error_chains = use_import_graph ? [graph.get_import_chains(e.file_name)] : import_tracer.trace(include.map((p) => ({ from: pathlib.resolve(p.toString()), to: pathlib.resolve(e.file_name) })));
          if (error_chains?.length) {
            for (const chain of error_chains) {
              if (!chain || !chain.found || chain.chains.length === 0)
                continue;
              const g = use_import_graph ? graph.format_import_chains([chain], "    ", 10) : import_tracer.format_import_chains([chain], "    ", 10);
              lines.push(...g);
              if (g.length > 0) {
                lines.push("");
              }
            }
          }
        }
      }
      return lines.join("\n");
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  inspect_bundle
});
