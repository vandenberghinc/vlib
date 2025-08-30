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
  ImportGraphPlugin: () => ImportGraphPlugin
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../../vlib/index.js");
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
class ImportGraphPlugin {
  options;
  graph = /* @__PURE__ */ new Map();
  entry_points = /* @__PURE__ */ new Set();
  /** ESBuild plugin instance */
  plugin;
  constructor(options = {}) {
    this.options = options;
    this.plugin = {
      name: "import-graph",
      setup: (build) => {
        if (build.initialOptions.entryPoints) {
          const entry_points = build.initialOptions.entryPoints;
          if (Array.isArray(entry_points)) {
            entry_points.forEach((ep) => {
              const resolved = typeof ep === "string" ? path.resolve(ep) : path.resolve(ep.in);
              this.entry_points.add(resolved);
              this.ensure_node(resolved);
            });
          } else {
            Object.values(entry_points).forEach((ep) => {
              const resolved = path.resolve(ep);
              this.entry_points.add(resolved);
              this.ensure_node(resolved);
            });
          }
        }
        build.onResolve({ filter: /.*/ }, (args) => {
          return void 0;
        });
        build.onLoad({ filter: /.*/ }, async (args) => {
          const file_path = args.path;
          if (!this.options.track_externals && this.is_external(file_path)) {
            return void 0;
          }
          this.ensure_node(file_path);
          try {
            const content = await fs.promises.readFile(file_path, "utf-8");
            const imports = this.parse_imports(content, file_path);
            for (const import_spec of imports) {
              const resolved = await this.resolve_import(import_spec, file_path);
              if (resolved) {
                if (!/node_modules/.test(file_path)) {
                  if (this.options.debug?.on(1))
                    this.options.debug(`Resolved import "${import_spec}" in file "${file_path}" to "${resolved}"`);
                }
                this.add_import_relation(file_path, resolved);
              }
            }
          } catch (err) {
            if (this.options.debug?.on(1))
              this.options.debug(`${import_vlib.Color.red("Error")} reading file ${file_path}: ${err instanceof Error ? err.message : String(err)}`);
          }
          return void 0;
        });
        build.onEnd((result) => {
          if (this.options.debug?.on(1))
            this.options.debug(import_vlib.Color.gray(`[ImportGraph] Build ended. Graph has ${this.graph.size} nodes`));
          if (result.metafile) {
            if (this.options.debug?.on(1))
              this.options.debug(import_vlib.Color.gray("[ImportGraph] Enhancing graph with metafile data"));
            this.enhance_with_metafile(result.metafile);
          }
          if (this.graph.size > 0) {
            if (this.options.debug?.on(1))
              this.options.debug(import_vlib.Color.gray("[ImportGraph] Sample nodes with imports:"));
            let count = 0;
            for (const [file, node] of this.graph.entries()) {
              if (node.imports.size > 0 && count < 3) {
                if (this.options.debug?.on(1))
                  this.options.debug(import_vlib.Color.gray(`  ${file} imports ${node.imports.size} files`));
                count++;
              }
            }
          }
        });
      }
    };
  }
  /**
   * Parse import statements from file content
   */
  parse_imports(content, file_path) {
    const imports = [];
    const ext = path.extname(file_path);
    const is_typescript = ext === ".ts" || ext === ".tsx";
    const is_javascript = ext === ".js" || ext === ".jsx" || ext === ".mjs" || ext === ".cjs";
    if (!is_typescript && !is_javascript) {
      return imports;
    }
    const es6_import_regex = /import\s+(?:(?:\*\s+as\s+\w+|{[^}]+}|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6_import_regex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    const require_regex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = require_regex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    const dynamic_import_regex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamic_import_regex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }
  /**
   * Resolve an import specifier to an absolute path
   */
  async resolve_import(import_spec, importer) {
    if (import_spec.startsWith("data:") || import_spec.startsWith("http")) {
      return null;
    }
    if (import_spec.startsWith(".") || import_spec.startsWith("/")) {
      const base_path = path.resolve(path.dirname(importer), import_spec);
      const extensions = ["", ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".json"];
      for (const ext of extensions) {
        const full_path = base_path + ext;
        if (await this.file_exists(full_path)) {
          return full_path;
        }
      }
      for (const ext of extensions) {
        const index_path = path.join(base_path, "index" + ext);
        if (await this.file_exists(index_path)) {
          return index_path;
        }
      }
    } else {
      let current_dir = path.dirname(importer);
      while (current_dir !== path.dirname(current_dir)) {
        const parts = import_spec.split("/");
        const isScoped = import_spec.startsWith("@");
        const pkgNameParts = isScoped ? parts.slice(0, 2) : parts.slice(0, 1);
        const pkgName = pkgNameParts.join("/");
        const subPath = parts.slice(pkgNameParts.length).join("/");
        const exportKey = subPath ? `./${subPath}` : ".";
        const pkgRoot = path.join(current_dir, "node_modules", pkgName);
        const pkgJsonPath = path.join(pkgRoot, "package.json");
        if (await this.file_exists(pkgJsonPath)) {
          try {
            const pkgJson = JSON.parse(await fs.promises.readFile(pkgJsonPath, "utf-8"));
            if (pkgJson.exports && typeof pkgJson.exports === "object") {
              const expDef = pkgJson.exports[exportKey];
              if (expDef) {
                let targetRel = null;
                if (typeof expDef === "string") {
                  targetRel = expDef;
                } else {
                  targetRel = expDef.import || expDef.require || null;
                }
                if (targetRel) {
                  const absTarget = path.resolve(path.dirname(pkgJsonPath), targetRel);
                  const exts2 = ["", ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".json"];
                  for (const ext of exts2) {
                    const candidate = absTarget + ext;
                    if (await this.file_exists(candidate)) {
                      return candidate;
                    }
                  }
                }
              }
            }
            const mainFile = pkgJson.main || "index.js";
            const absMain = path.join(pkgRoot, mainFile);
            if (await this.file_exists(absMain)) {
              return absMain;
            }
          } catch {
          }
        }
        const baseDir = subPath ? path.join(pkgRoot, subPath) : pkgRoot;
        const exts = ["", ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".json"];
        for (const ext of exts) {
          const f = baseDir + ext;
          if (await this.file_exists(f)) {
            return f;
          }
        }
        for (const ext of exts) {
          const idx = path.join(baseDir, "index" + ext);
          if (await this.file_exists(idx)) {
            return idx;
          }
        }
        current_dir = path.dirname(current_dir);
      }
    }
    return null;
  }
  /**
   * Check if a file exists
   */
  async file_exists(file_path) {
    try {
      await fs.promises.access(file_path);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Enhance the graph with data from esbuild's metafile
   */
  enhance_with_metafile(metafile) {
    for (const [input_path, input] of Object.entries(metafile.inputs)) {
      const importer = path.resolve(input_path);
      if (input.imports) {
        for (const imp of input.imports) {
          if (!this.options.track_externals && imp.external) {
            continue;
          }
          const imported = path.resolve(imp.path);
          this.add_import_relation(importer, imported);
        }
      }
    }
  }
  /**
   * Ensure a node exists in the graph
   */
  ensure_node(file_path) {
    const normalized = path.resolve(file_path);
    if (!this.graph.has(normalized)) {
      this.graph.set(normalized, { imports: /* @__PURE__ */ new Set(), imported_by: /* @__PURE__ */ new Set() });
    }
  }
  /**
   * Add an import relationship to the graph
   */
  add_import_relation(importer, imported) {
    if (!this.options.track_externals && this.is_external(imported)) {
      return;
    }
    const importer_normalized = path.resolve(importer);
    const imported_normalized = path.resolve(imported);
    this.ensure_node(importer_normalized);
    this.ensure_node(imported_normalized);
    const importer_node = this.graph.get(importer_normalized);
    const imported_node = this.graph.get(imported_normalized);
    importer_node.imports.add(imported_normalized);
    imported_node.imported_by.add(importer_normalized);
  }
  /**
   * Check if a path represents an external module
   */
  is_external(file_path) {
    return file_path.includes("node_modules") || !file_path.startsWith(".") && !file_path.startsWith("/") && !path.isAbsolute(file_path);
  }
  /**
   * Get all import chains leading to target file
   */
  get_import_chains(target_path) {
    const candidates = [
      target_path,
      path.resolve(target_path),
      path.normalize(target_path),
      // Remove ./ prefix if present
      target_path.replace(/^\.\//, ""),
      path.resolve(target_path.replace(/^\.\//, ""))
    ];
    let resolved_target = target_path;
    let node = void 0;
    for (const candidate of candidates) {
      node = this.graph.get(candidate);
      if (node) {
        resolved_target = candidate;
        break;
      }
    }
    if (!node) {
      const target_basename = path.basename(target_path);
      for (const [graph_path, graph_node] of this.graph.entries()) {
        if (graph_path.endsWith(target_path) || path.basename(graph_path) === target_basename) {
          node = graph_node;
          resolved_target = graph_path;
          if (this.options.debug?.on(1))
            this.options.debug(`Found target by partial match: ${graph_path}`);
          break;
        }
      }
    }
    if (!node) {
      if (this.options.debug?.on(1)) {
        this.options.debug(`Target not found: ${target_path}`);
        this.options.debug(`Graph has ${this.graph.size} nodes`);
        if (this.graph.size > 0) {
          this.options.debug(`Files with path.js in name:`);
          for (const p of this.graph.keys()) {
            if (p.includes("path.js")) {
              this.options.debug(`  - ${p}`);
            }
          }
        }
      }
      return { target: target_path, chains: [], found: false };
    }
    const chains = [];
    const visited = /* @__PURE__ */ new Set();
    const find_chains = (current, chain = []) => {
      if (visited.has(current))
        return;
      visited.add(current);
      chain = [...chain, current];
      const current_node = this.graph.get(current);
      if (!current_node || current_node.imported_by.size === 0) {
        chains.push([...chain].reverse());
      } else {
        for (const importer of current_node.imported_by) {
          find_chains(importer, chain);
        }
      }
      visited.delete(current);
    };
    find_chains(resolved_target);
    if (chains.length === 0 && this.entry_points.has(resolved_target)) {
      chains.push([resolved_target]);
    }
    return {
      target: target_path,
      chains: chains.length > 0 ? chains : [[resolved_target]],
      found: true
    };
  }
  /**
   * Format a list of import chains.
   */
  format_import_chains(import_chains, indent = "", limit = -1) {
    const all_import_chains_paths = [];
    for (const chain of import_chains) {
      for (const c of chain.chains) {
        if (c.length > 0) {
          all_import_chains_paths.push(...c);
        }
      }
      all_import_chains_paths.push(chain.target);
    }
    const common_base = import_vlib.Path.find_common_base_path(all_import_chains_paths);
    let common_base_slice;
    if (common_base) {
      common_base_slice = new import_vlib.Path(common_base).abs().str().length;
    }
    let limit_count = 0;
    const import_chains_formatted = [];
    for (const chain of import_chains) {
      const target = common_base_slice ? "." + path.resolve(chain.target).slice(common_base_slice) : chain.target;
      if (!chain.found) {
        import_chains_formatted.push(`No import chain found for target "${target}"`);
        continue;
      }
      if (chain.chains.length === 0) {
        import_chains_formatted.push(`No import chain found for target "${target}"`);
        continue;
      }
      const lines = [];
      for (const c of chain.chains) {
        if (c.length === 0)
          continue;
        if (limit !== -1 && limit_count > limit) {
          break;
        }
        ++limit_count;
        lines.push(`${indent}${import_vlib.Color.gray("note")}: Import chain:` + c.map((l) => `
${indent}    ${import_vlib.Color.italic(common_base_slice ? "." + path.resolve(l).slice(common_base_slice) : l)}`).join(import_vlib.Color.blue(" => ")));
      }
      const add = lines.join("\n");
      if (import_chains_formatted[import_chains_formatted.length - 1] !== add) {
        import_chains_formatted.push(lines.join("\n"));
      }
    }
    return import_chains_formatted;
  }
  /**
   * Debug: Print the current state of the import graph
   */
  debug_print() {
    console.log(import_vlib.Color.yellow("\n=== Import Graph Debug ==="));
    console.log(import_vlib.Color.yellow(`Total nodes: ${this.graph.size}`));
    console.log(import_vlib.Color.yellow(`Entry points: ${this.entry_points.size}`));
    console.log(import_vlib.Color.yellow("\nLooking for path.js files:"));
    for (const [file, relations] of this.graph.entries()) {
      if (file.includes("path.js") || file.includes("path.ts")) {
        console.log(import_vlib.Color.cyan(`
${file}:`));
        if (relations.imports.size > 0) {
          console.log(import_vlib.Color.green("  imports:"));
          for (const imp of relations.imports) {
            console.log(import_vlib.Color.gray(`    -> ${imp}`));
          }
        }
        if (relations.imported_by.size > 0) {
          console.log(import_vlib.Color.magenta("  imported by:"));
          for (const imp of relations.imported_by) {
            console.log(import_vlib.Color.gray(`    <- ${imp}`));
          }
        }
      }
    }
    console.log(import_vlib.Color.yellow("=== End Debug ===\n"));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ImportGraphPlugin
});
