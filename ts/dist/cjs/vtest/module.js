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
  Module: () => Module,
  Modules: () => Modules
});
module.exports = __toCommonJS(stdin_exports);
var zlib = __toESM(require("zlib"));
var ts = __toESM(require("typescript"));
var import_js_beautify = __toESM(require("js-beautify"));
var import_vlib = require("../vlib/index.js");
var import_source_loc = require("../vlib/logging/uni/source_loc.js");
var import_compute_diff = require("../vts/utils/compute_diff.js");
const { js: beautify } = import_js_beautify.default;
class Module {
  // Module name.
  name;
  // Added unit tests.
  unit_tests = {};
  // Mod cache.
  mod_cache;
  /** The path to the `output` directory from the active package. */
  output;
  /**
   * Create a unit test module.
   * @param name The name of the module.
   */
  constructor({ name }) {
    if (Modules.find((i) => i.name === name)) {
      throw new Error(`Unit test module "${name}" already exists.`);
    }
    this.name = name;
    Modules.push(this);
  }
  /**
   * Try load the mod cache
   */
  async init_mod_cache(cache) {
    if (this.mod_cache)
      return;
    this.output = cache;
    const path = cache.join(this.name.replaceAll("/", "_") + ".json");
    if (path.exists()) {
      this.mod_cache = await path.load({ type: "json" });
    } else {
      this.mod_cache ??= {};
    }
  }
  /**
   * Save the module cache to the given path.
   */
  async save_mod_cache() {
    if (!this.mod_cache || !this.output) {
      throw new Error(`Module cache is not defined, please call add() before save_mod_cache().`);
    }
    await this.output.join(this.name.replace(/[\\\/]/g, "_") + ".json").save(JSON.stringify(this.mod_cache));
  }
  add(a1, a2, a3) {
    let id, expect, callback;
    if (arguments.length === 1) {
      ({ id, expect, callback } = arguments[0]);
    } else if (arguments.length === 2) {
      id = arguments[0];
      expect = "success";
      callback = arguments[1];
    } else if (arguments.length >= 3) {
      id = arguments[0];
      expect = arguments[1];
      callback = arguments[2];
    } else {
      throw new Error(`Invalid number of arguments, expected 1 or 3, got ${arguments.length}.`);
    }
    if (expect !== "error" && expect !== "success") {
      throw new Error(`Invalid value of parameter expect "${expect}" from unit test "${id}", valid values are ["error", "success"].`);
    } else if (Object.keys(this.unit_tests).includes(id)) {
      throw new Error(`Invalid unit test "${id}", this unit test id is already defined.`);
    } else if (!/[a-zA-Z0-9-_:/\*]+/.test(id)) {
      throw new Error(`Invalid unit test id "${id}", this should only contain alphanumeric characters, dashes, underscores, slashes and asterisks.`);
    }
    const loc = new import_source_loc.SourceLoc(1);
    this.unit_tests[id] = async ({ interactive, index, no_changes = false }) => {
      const extract_input = async (id2, source_file2) => {
        if (source_file2 == null)
          return void 0;
        const file = new import_vlib.Path(source_file2);
        if (!file.exists()) {
          import_vlib.debug.raw(import_vlib.Color.red(`Source file "${source_file2}" does not exist.`));
          return void 0;
        }
        const source = await file.load();
        if (!new RegExp(`\\b${id2}\\b`).test(source)) {
          return void 0;
        }
        const sf = ts.createSourceFile(source_file2, source, ts.ScriptTarget.Latest, true);
        let inputText;
        function visit(node) {
          if (inputText != null)
            return;
          if (ts.isCallExpression(node)) {
            const args = node.arguments;
            if (args.length >= 1 && ts.isStringLiteral(args[0]) && args[0].text === id2) {
              if (args.length >= 3) {
                const cb = args[2];
                inputText = ts.isArrowFunction(cb) ? cb.body.getText(sf) : cb.getText(sf);
                return;
              } else if (args.length === 2) {
                const cb = args[1];
                inputText = ts.isArrowFunction(cb) ? cb.body.getText(sf) : cb.getText(sf);
                return;
              }
            }
            if (args.length === 1 && ts.isObjectLiteralExpression(args[0])) {
              let foundId = false;
              let callbackNode;
              for (const prop of args[0].properties) {
                if (!ts.isPropertyAssignment(prop))
                  continue;
                const name = prop.name;
                const key = ts.isIdentifier(name) ? name.text : ts.isStringLiteral(name) ? name.text : "";
                if (key === "id" && ts.isStringLiteral(prop.initializer) && prop.initializer.text === id2) {
                  foundId = true;
                }
                if (key === "callback") {
                  callbackNode = prop.initializer;
                }
              }
              if (foundId && callbackNode) {
                inputText = ts.isArrowFunction(callbackNode) ? callbackNode.body.getText(sf) : callbackNode.getText(sf);
                return;
              }
            }
          }
          ts.forEachChild(node, visit);
        }
        visit(sf);
        if (!inputText)
          return void 0;
        return beautify(inputText.trim(), {
          indent_size: 4,
          indent_char: " ",
          max_preserve_newlines: 1,
          preserve_newlines: true,
          keep_array_indentation: false,
          break_chained_methods: false,
          indent_scripts: "normal",
          brace_style: "collapse",
          // expand
          space_before_conditional: false,
          unescape_strings: false,
          jslint_happy: false,
          end_with_newline: false,
          wrap_line_length: 0,
          indent_empty_lines: false,
          comma_first: false,
          e4x: false
        });
      };
      const enter_interactive_on_failure = async (new_hash, response) => {
        const cached = this.mod_cache[id];
        const cached_data = !cached?.data ? void 0 : zlib.gunzipSync(Buffer.from(cached.data, "base64")).toString();
        import_vlib.debug.raw(`${import_vlib.Color.bold("Unit test " + import_vlib.Color.blue(id))} ${import_vlib.Color.red_bold("failed")} `, `[${index + 1}/${Object.keys(this.unit_tests).length}]`);
        import_vlib.debug.raw(`The unit test has failed, the ${import_vlib.Color.bold(expect)} output hash is different from the cached hash.`);
        import_vlib.debug.raw(import_vlib.Color.magenta_bold("Entering interactive mode."));
        import_vlib.debug.raw(` * Press Ctrl+C to abort.`);
        if (source_location) {
          import_vlib.debug.raw(` * Source file: ${import_vlib.Color.gray(source_location)}`);
        }
        import_vlib.debug.raw(` * Expected result type: ${import_vlib.Color.gray(expect)}`);
        import_vlib.debug.raw(` * Unit test output hash: ${import_vlib.Color.gray(new_hash)}`);
        const input = await extract_input(id, source_file);
        if (input) {
          import_vlib.debug.raw(` * Input callback: 
${input.split("\n").map((l) => `   | ${import_vlib.Color.gray(l)}`).join("\n")}`);
        }
        import_vlib.debug.raw(` * Unit test output: 
${response.split("\n").map((l) => `   | ${l}`).join("\n")}`);
        if (cached_data && !no_changes) {
          const { status, diff } = (0, import_compute_diff.compute_diff)({
            new: response,
            old: cached_data,
            prefix: " * "
          });
          if (status === "identical") {
            import_vlib.debug.raw(" * Old and new data are identical. This should not happen.");
          } else {
            import_vlib.debug.raw(` * Detected changes between old and new data:`);
            import_vlib.debug.raw(diff);
          }
        }
        let permission = false;
        if (!permission) {
          try {
            permission = await import_vlib.logging.confirm(`${import_vlib.Color.magenta_bold("[Interactive mode]")} Did this unit test actually succeed?`);
          } catch (e) {
            import_vlib.debug.raw(import_vlib.Color.yellow("\nAborted."));
            process.exit(1);
          }
        }
        if (permission) {
          this.mod_cache[id] = {
            hash: new_hash,
            data: zlib.gzipSync(response, { level: 9 }).toString("base64"),
            expect
          };
          await this.save_mod_cache();
          return { success: true, hash: new_hash, output: response, expect };
        } else {
          return { success: false, hash: new_hash, output: response, expect };
        }
      };
      import_vlib.debug.raw(1, "\n", import_vlib.logging.terminal_divider(), import_vlib.Color.bold("Commencing unit test " + import_vlib.Color.blue(id)));
      let source_location, source_file;
      if (loc.file.startsWith("file://")) {
        let ts_file = loc.file;
        ts_file = loc.file.slice(7);
        for (const [from, to] of [
          ["/dist/src/", "/src/"],
          ["/dist/", "/src/"]
        ]) {
          const replaced = ts_file.replace(from, to).slice(0, -3) + ".ts";
          if (new import_vlib.Path(replaced).exists()) {
            ts_file = replaced;
            break;
          }
        }
        if (ts_file) {
          source_file = ts_file;
          source_location = `file://${ts_file}:0:0`;
        }
      } else if (!loc.is_unknown()) {
        if (loc.file.startsWith("file://")) {
          source_file = loc.file.slice(7);
        }
        source_location = `${loc.file}:${loc.line}:${loc.column}`;
      }
      try {
        let res = callback({
          id,
          hash: import_vlib.Utils.hash,
          debug: import_vlib.debug,
          expect
        });
        if (res instanceof Promise) {
          res = await res;
        }
        if (expect === "error") {
          import_vlib.debug.raw(import_vlib.Color.red_bold("Encountered success while expecting an error."));
          return { success: false, hash: void 0, output: void 0, expect };
        }
        let res_str = typeof res === "object" && res !== null ? import_vlib.Color.object(res) : typeof res === "string" ? res : JSON.stringify(res);
        let cached = this.mod_cache[id];
        if (cached && cached.expect !== expect) {
          import_vlib.debug.raw(import_vlib.Color.yellow(`Unit test "${id}" seems to have changed the expected result to "${expect}" from "${cached?.expect}", resetting cached result.`));
          cached = void 0;
        }
        const h = import_vlib.Utils.hash(res_str, "sha256", "hex");
        const success = cached?.hash === h;
        if (success || !interactive) {
          import_vlib.debug.raw(1, `Unit test output: 
${res_str.split("\n").map((l) => ` | ${l}`).join("\n")}`);
          import_vlib.debug.raw(1, `Unit test output hash: ${import_vlib.Color.gray(h)}`);
        }
        if (success) {
          return { success: true, hash: h, output: res_str, expect };
        }
        if (interactive) {
          return enter_interactive_on_failure(h, res_str);
        }
        return { success: false, hash: h, output: res_str, expect };
      } catch (e) {
        if (expect !== "error") {
          import_vlib.debug.raw(import_vlib.Color.red_bold("Encountered an error while expecting success."));
          throw e;
        }
        let cached = this.mod_cache[id];
        if (cached?.expect !== expect) {
          cached = void 0;
        }
        const res_str = String(e?.message ?? e);
        const h = import_vlib.Utils.hash(res_str, "sha256", "hex");
        const success = cached?.hash === h;
        if (success || !interactive) {
          import_vlib.debug.raw(1, "Unit test error output: ", e);
          import_vlib.debug.raw(1, "Unit test hash: ", import_vlib.Color.gray(h));
        }
        if (success) {
          return { success: true, hash: h, output: res_str, expect };
        }
        if (interactive) {
          return enter_interactive_on_failure(h, res_str);
        }
        return { success: false, hash: h, output: res_str, expect };
      }
    };
    return this;
  }
  /**
   * Run the unit tests of the module
   */
  async _run({ output, target, stop_on_failure = false, stop_after, interactive = true, repeat = 0, no_changes = false }) {
    import_vlib.debug.raw(import_vlib.Color.cyan_bold(`
Commencing ${this.name} unit tests.`));
    let failed = 0, succeeded = 0;
    let unit_tests = this.unit_tests;
    if (target != null) {
      if (target.includes("*")) {
        const regex = new RegExp(target.replaceAll("*", ".*?"));
        unit_tests = Object.fromEntries(Object.entries(this.unit_tests).filter(([id]) => regex.test(id)));
      } else {
        if (unit_tests[target] === void 0) {
          throw new Error(`Unit test "${target}" was not found`);
        }
        const unit_test = unit_tests[target];
        unit_tests = { [target]: unit_test };
      }
    }
    await this.init_mod_cache(output);
    const all_yes_insertions = [];
    for (let i = 0; i <= repeat; ++i) {
      if (repeat !== 0) {
        import_vlib.debug.raw(import_vlib.Color.cyan_bold(`
Commencing repetition ${i + 1} of unit test ${this.name}.`));
      }
      failed = 0, succeeded = 0;
      const ids = Object.keys(unit_tests);
      let last_success;
      for (let id_index = 0; id_index < ids.length; ++id_index) {
        const id = ids[id_index];
        let res;
        try {
          res = await unit_tests[id]({
            interactive,
            index: id_index,
            no_changes
          });
        } catch (e) {
          import_vlib.debug.raw(`${import_vlib.Colors.red}${import_vlib.Colors.bold}Error${import_vlib.Colors.end}: Encountered an error during unit test "${id}".`);
          throw e;
        }
        const prefix2 = typeof import_vlib.debug === "string" || import_vlib.debug.on(1) ? import_vlib.Color.blue_bold(id) : import_vlib.Color.bold("Unit test " + import_vlib.Color.blue(id));
        if (res.success === true) {
          import_vlib.debug.raw(`${import_vlib.debug.level.eq(0) && (last_success === void 0 || last_success) ? " * " : ""}${prefix2} ${import_vlib.Colors.green}${import_vlib.Colors.bold}succeeded${import_vlib.Colors.end}`);
          ++succeeded;
        } else {
          import_vlib.debug.raw(`${prefix2} ${import_vlib.Colors.red}${import_vlib.Colors.bold}failed${import_vlib.Colors.end}`);
          ++failed;
          if (stop_on_failure || res.hash == null && interactive) {
            import_vlib.debug.raw(`Stopping unit tests on failure.`);
            break;
          }
        }
        if (stop_after === id) {
          import_vlib.debug.raw(`Stopping unit tests after "${id}".`);
          return { status: false, failed, succeeded };
        }
        last_success = res.success;
      }
    }
    const prefix = import_vlib.debug.level.eq(0) ? " * " : "";
    if (failed === 0) {
      import_vlib.debug.raw(`${prefix}All ${failed + succeeded} unit tests ${import_vlib.Colors.green}${import_vlib.Colors.bold}passed${import_vlib.Colors.end} successfully.`);
    } else {
      import_vlib.debug.raw(`${prefix}Encountered ${failed === 0 ? import_vlib.Colors.green : import_vlib.Colors.red}${import_vlib.Colors.bold}${failed}${import_vlib.Colors.end} failed unit tests.`);
    }
    return { status: true, failed, succeeded };
  }
  /**
   * Reset certain unit test results.
   * @param opts.results The path to the module's results file.
   * @param opts.ids The id or ids to reset, supports glob patterns.
   * @param opts.yes Whether to skip the confirmation prompt.
   */
  async reset_unit_tests(opts) {
    if (typeof opts.results === "string") {
      opts.results = new import_vlib.Path(opts.results);
    }
    if (!Array.isArray(opts.target)) {
      opts.target = [opts.target];
    }
    await this.init_mod_cache(opts.results);
    const id_list = new import_vlib.GlobPatternList(opts.target);
    const deletions = [];
    for (const key of Object.keys(this.mod_cache)) {
      if (id_list.match(key)) {
        deletions.push(key);
      }
    }
    if (deletions.length === 0) {
      throw new Error(`No unit tests matched the provided ids: ${opts.target.join(", ")}`);
    }
    if (!opts.yes) {
      import_vlib.debug.raw(`The following unit tests will be reset upon confirmation:${deletions.map((d) => `
 - ${d}`).join("")}`);
      const answer = await import_vlib.logging.confirm(`Do you wish to reset the unit tests listed above?`);
      if (!answer) {
        throw new Error(`Write permission denied, not resetting unit tests.`);
      }
    }
    for (const id of deletions) {
      delete this.mod_cache[id];
    }
    await this.save_mod_cache();
    import_vlib.debug.raw(`Reset ${deletions.length} unit tests in module "${this.name}".`);
  }
}
const Modules = [];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Module,
  Modules
});
