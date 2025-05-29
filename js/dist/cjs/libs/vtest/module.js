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
  modules: () => modules
});
module.exports = __toCommonJS(stdin_exports);
var zlib = __toESM(require("zlib"));
var ts = __toESM(require("typescript"));
var import_js_beautify = __toESM(require("js-beautify"));
var import__ = require("../../index.js");
var import_source_loc = require("../../debugging/source_loc.js");
var import_compute_diff = require("../vts/utils/compute_diff.js");
const { js: beautify } = import_js_beautify.default;
class Module {
  // Module name.
  name;
  // Added unit tests.
  unit_tests = {};
  // Mod cache.
  mod_cache;
  /**
   * Create a unit test module.
   * @param name The name of the module.
   */
  constructor({ name }) {
    if (modules.find((i) => i.name === name)) {
      throw new Error(`Unit test module "${name}" already exists.`);
    }
    this.name = name;
    modules.push(this);
  }
  add() {
    let id, expect, callback, refresh;
    if (arguments.length === 1) {
      ({ id, expect, callback, refresh = false } = arguments[0]);
    } else if (arguments.length === 2) {
      id = arguments[0];
      expect = "success";
      callback = arguments[1];
      refresh = false;
    } else if (arguments.length >= 3) {
      id = arguments[0];
      expect = arguments[1];
      callback = arguments[2];
      refresh = arguments[3] ?? false;
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
    const override_refresh = refresh;
    this.unit_tests[id] = async ({ log_level, interactive, cache, index, all_yes = false, no_changes = false, refresh: refresh2 = false }) => {
      const use_refresh = override_refresh || (typeof refresh2 === "string" && refresh2 === id || refresh2 === true);
      const logs = [];
      const debug = (level, ...args) => {
        logs.push({
          active: typeof log_level === "number" && level <= log_level || typeof log_level === "string" && log_level === id,
          items: args
        });
      };
      const dump_active_logs = () => {
        for (const log of logs) {
          if (log.active) {
            console.log(...log.items);
          }
        }
        logs.length = 0;
      };
      const dump_all_logs = () => {
        for (const log of logs) {
          console.log(...log.items);
        }
        logs.length = 0;
      };
      const extract_input = async (id2, source_file2) => {
        if (source_file2 == null)
          return void 0;
        const file = new import__.Path(source_file2);
        if (!file.exists()) {
          debug(0, import__.Color.red(`Source file "${source_file2}" does not exist.`));
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
        debug(0, `${import__.Color.bold("Unit test " + import__.Color.blue(id))} ${import__.Color.red_bold("failed")}`, `[${index + 1}/${Object.keys(this.unit_tests).length}]`);
        debug(0, `The unit test has failed, the ${import__.Color.bold(expect)} output hash is different from the cached hash.`);
        debug(0, import__.Color.magenta_bold("Entering interactive mode."));
        debug(0, ` * Press Ctrl+C to abort.`);
        if (source_location) {
          debug(0, ` * Source file: ${import__.Color.gray(source_location)}`);
        }
        debug(0, ` * Expected result type: ${import__.Color.gray(expect)}`);
        debug(0, ` * Unit test output hash: ${import__.Color.gray(new_hash)}`);
        const input = await extract_input(id, source_file);
        if (input) {
          debug(0, ` * Input callback: 
${input.split("\n").map((l) => `   | ${import__.Color.gray(l)}`).join("\n")}`);
        }
        debug(0, ` * Unit test output: 
${response.split("\n").map((l) => `   | ${l}`).join("\n")}`);
        if (cached_data) {
          (0, import_compute_diff.compute_diff)({
            new: response,
            old: cached_data,
            log_level: void 0,
            // use default.
            prefix: " * "
          });
        }
        dump_all_logs();
        let answer = all_yes ? "y" : void 0;
        if (!answer) {
          try {
            answer = await import__.logging.prompt(`${import__.Color.magenta_bold("[Interactive mode]")} Did this unit test actually succeed? [y/n]: `);
          } catch (e) {
            debug(0, import__.Color.yellow("\nAborted."));
            dump_all_logs();
            process.exit(1);
          }
        }
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          this.mod_cache[id] = {
            hash: new_hash,
            data: zlib.gzipSync(response, { level: 9 }).toString("base64"),
            expect
          };
          await this.save_mod_cache(cache);
          return { success: true, hash: new_hash, output: response, expect };
        } else {
          return { success: false, hash: new_hash, output: response, expect };
        }
      };
      debug(1, "\n" + import__.logging.terminal_divider() + import__.Color.bold("Commencing unit test " + import__.Color.blue(id)));
      let source_location, source_file;
      if (loc.file.startsWith("file://")) {
        let ts_file = loc.file;
        ts_file = loc.file.slice(7);
        for (const [from, to] of [
          ["/dist/src/", "/src/"],
          ["/dist/", "/src/"]
        ]) {
          const replaced = ts_file.replace(from, to).slice(0, -3) + ".ts";
          if (new import__.Path(replaced).exists()) {
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
          hash: import__.Utils.hash,
          debug,
          log_level,
          expect
        });
        if (res instanceof Promise) {
          res = await res;
        }
        if (expect === "error") {
          debug(0, import__.Color.red_bold("Encountered success while expecting an error."));
          dump_all_logs();
          return { success: false, hash: void 0, output: void 0, expect };
        }
        let res_str = typeof res === "object" && res !== null ? import__.Color.json(res) : typeof res === "string" ? res : JSON.stringify(res);
        let cached = use_refresh ? void 0 : this.mod_cache[id];
        if (cached && cached.expect !== expect) {
          debug(0, import__.Color.yellow(`Unit test "${id}" seems to have changed the expected result to "${expect}" from "${cached?.expect}", resetting cached result.`));
          cached = void 0;
        }
        const h = import__.Utils.hash(res_str, "sha256", "hex");
        const success = cached?.hash === h;
        if (success || !interactive) {
          debug(1, `Unit test output: 
${res_str.split("\n").map((l) => ` | ${l}`).join("\n")}`);
          debug(1, `Unit test output hash: ${import__.Color.gray(h)}`);
        }
        if (success) {
          dump_active_logs();
          return { success: true, hash: h, output: res_str, expect };
        }
        if (interactive) {
          return enter_interactive_on_failure(h, res_str);
        }
        dump_all_logs();
        return { success: false, hash: h, output: res_str, expect };
      } catch (e) {
        if (expect !== "error") {
          debug(0, import__.Color.red_bold("Encountered an error while expecting success."));
          dump_all_logs();
          throw e;
        }
        let cached = use_refresh ? void 0 : this.mod_cache[id];
        if (cached?.expect !== expect) {
          cached = void 0;
        }
        const res_str = String(e?.message ?? e);
        const h = import__.Utils.hash(res_str, "sha256", "hex");
        const success = cached?.hash === h;
        if (success || !interactive) {
          debug(1, "Unit test error output:", e);
          debug(1, "Unit test hash:", import__.Color.gray(h));
        }
        if (success) {
          dump_active_logs();
          return { success: true, hash: h, output: res_str, expect };
        }
        if (interactive) {
          return enter_interactive_on_failure(h, res_str);
        }
        dump_all_logs();
        return { success: false, hash: h, output: res_str, expect };
      }
    };
  }
  /**
   * Save the module cache to the given path.
   */
  async save_mod_cache(cache) {
    if (!this.mod_cache) {
      throw new Error(`Module cache is not defined, please call add() before save_mod_cache().`);
    }
    await cache.join(this.name.replaceAll("/", "_") + ".json").save(JSON.stringify(this.mod_cache));
  }
  /**
   * Try load the mod cache
   */
  async init_mod_cache(cache) {
    if (this.mod_cache)
      return;
    const path = cache.join(this.name.replaceAll("/", "_") + ".json");
    if (path.exists()) {
      this.mod_cache = await path.load({ type: "json" });
    } else {
      this.mod_cache ??= {};
    }
  }
  /**
   * Run the unit tests of the module
   * @private
   */
  async _run({ target, stop_on_failure = false, stop_after, debug = 0, interactive = true, cache, all_yes = false, repeat = 0, no_changes = false, refresh = false }) {
    console.log(import__.Color.cyan_bold(`
Commencing ${this.name} unit tests.`));
    if (repeat > 0 && all_yes) {
      throw new Error(`The --yes option is not compatible with the --repeat option.`);
    }
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
    await this.init_mod_cache(cache);
    const all_yes_insertions = [];
    for (let i = 0; i <= repeat; ++i) {
      if (repeat !== 0) {
        console.log(import__.Color.cyan_bold(`
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
            log_level: debug,
            cache,
            interactive: all_yes ? false : interactive,
            index: id_index,
            all_yes: false,
            no_changes,
            refresh
          });
        } catch (e) {
          console.log(`${import__.Colors.red}${import__.Colors.bold}Error${import__.Colors.end}: Encountered an error during unit test "${id}".`);
          throw e;
        }
        const prefix2 = typeof debug === "string" || debug > 0 ? import__.Color.bold("Unit test " + import__.Color.blue(id)) : import__.Color.blue_bold(id);
        if (res.success === true) {
          console.log(`${debug === 0 && (last_success === void 0 || last_success) ? " * " : ""}${prefix2} ${import__.Colors.green}${import__.Colors.bold}succeeded${import__.Colors.end}`);
          ++succeeded;
        } else {
          if (all_yes) {
            if (res.hash && res.output) {
              all_yes_insertions.push({ id, hash: res.hash, output: res.output, expect: res.expect });
            } else {
              console.log(`${import__.Color.red_bold(`Unable assign a "success" status for unit test "${id}" because the hash and output are not defined.`)}`);
            }
          }
          console.log(`${prefix2} ${import__.Colors.red}${import__.Colors.bold}failed${import__.Colors.end}`);
          ++failed;
          if (stop_on_failure || res.hash == null && interactive) {
            console.log(`Stopping unit tests on failure.`);
            break;
          }
        }
        if (stop_after === id) {
          console.log(`Stopping unit tests after "${id}".`);
          return { status: false, failed, succeeded };
        }
        last_success = res.success;
      }
    }
    if (all_yes && all_yes_insertions.length > 0) {
      if (!interactive) {
        throw new Error(`The --yes option is only available when interactive mode is enabled.`);
      }
      console.log(`${import__.Color.red_bold(`
Warning: you enabled the --yes option in interactive mode.`)}`);
      console.log(`${import__.Color.yellow(`This will automatically assign a "success" status for the following failed unit tests:`)}`);
      for (const item of all_yes_insertions) {
        console.log(` * ${import__.Color.gray(item.id)}`);
      }
      try {
        const answer = await import__.logging.prompt(`${import__.Color.bold("Do you want to continue?")} [y/n]: `);
        if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
          console.log(import__.Color.yellow("Aborted."));
          return { status: false, failed, succeeded };
        }
      } catch (e) {
        console.log(import__.Color.yellow("Aborted."));
        return { status: false, failed, succeeded };
      }
      for (const item of all_yes_insertions) {
        this.mod_cache[item.id] = {
          hash: item.hash,
          data: zlib.gzipSync(item.output, { level: 9 }).toString("base64"),
          expect: item.expect
        };
      }
      await this.save_mod_cache(cache);
      console.log(`Saved ${all_yes_insertions.length} unit test hashes to the cache.`);
      return { status: true, failed, succeeded };
    }
    const prefix = debug === 0 ? " * " : "";
    if (failed === 0) {
      console.log(`${prefix}All ${failed + succeeded} unit tests ${import__.Colors.green}${import__.Colors.bold}passed${import__.Colors.end} successfully.`);
    } else {
      console.log(`${prefix}Encountered ${failed === 0 ? import__.Colors.green : import__.Colors.red}${import__.Colors.bold}${failed}${import__.Colors.end} failed unit tests.`);
    }
    return { status: true, failed, succeeded };
  }
}
const modules = [];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Module,
  modules
});
