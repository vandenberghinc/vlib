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
  UnitTests: () => UnitTests,
  default: () => stdin_default,
  unit_tests: () => UnitTests
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
var import_utils = require("../global/utils.js");
var import_path = require("../system/path.js");
var import_cli = require("../cli/cli.js");
var import_terminal_divider = require("../logging/terminal_divider.js");
var zlib = __toESM(require("zlib"));
var import_diff = require("diff");
var import_source_loc = require("../logging/source_loc.js");
var import_js_beautify = __toESM(require("js-beautify"));
var ts = __toESM(require("typescript"));
const { js: beautify } = import_js_beautify.default;
Error.stackTraceLimit = Infinity;
var UnitTests;
(function(UnitTests2) {
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
      if (_unit_test_modules.find((i) => i.name === name)) {
        throw new Error(`Unit test module "${name}" already exists.`);
      }
      this.name = name;
      _unit_test_modules.push(this);
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
          const file = new import_path.Path(source_file2);
          if (!file.exists()) {
            debug(0, import_colors.Color.red(`Source file "${source_file2}" does not exist.`));
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
        function log_diff(new_data, old_data) {
          if (no_changes) {
            return;
          }
          if (old_data === new_data) {
            if (!use_refresh) {
              debug(0, " *", import_colors.Color.red_bold("Cached data and new data are identical, this should not occur, carefully check the unit test output. When the unit test is validated you can ignore this message and answer [Y]."));
            }
            return;
          }
          debug(0, " *", import_colors.Color.yellow_bold("Detected differences between cached- and new outut:"));
          const diffs = (0, import_diff.diffLines)(old_data, new_data);
          diffs.forEach((part, index2) => {
            const prev_part = diffs[index2 - 1];
            const next_part = diffs[index2 + 1];
            if (!part.added && !part.removed && (prev_part == null || !prev_part.added && !prev_part.removed) && (next_part == null || !next_part.added && !next_part.removed)) {
              return;
            }
            const prefix = "  | " + (part.added ? import_colors.Color.green("+") : part.removed ? import_colors.Color.red("-") : " ");
            let last_was_dots = false;
            part.value.split("\n").forEach((line, i, arr) => {
              if (i === arr.length - 1 && line === "")
                return;
              debug(0, ` ${prefix} ${line}`);
            });
          });
        }
        const enter_interactive_on_failure = async (new_hash, response) => {
          const cached = this.mod_cache[id];
          const cached_data = !cached?.data ? void 0 : zlib.gunzipSync(Buffer.from(cached.data, "base64")).toString();
          debug(0, `${import_colors.Color.bold("Unit test " + import_colors.Color.blue(id))} ${import_colors.Color.red_bold("failed")}`, `[${index + 1}/${Object.keys(this.unit_tests).length}]`);
          debug(0, `The unit test has failed, the ${import_colors.Color.bold(expect)} output hash is different from the cached hash.`);
          debug(0, import_colors.Color.magenta_bold("Entering interactive mode."));
          debug(0, ` * Press Ctrl+C to abort.`);
          if (source_location) {
            debug(0, ` * Source file: ${import_colors.Color.gray(source_location)}`);
          }
          debug(0, ` * Expected result type: ${import_colors.Color.gray(expect)}`);
          debug(0, ` * Unit test output hash: ${import_colors.Color.gray(new_hash)}`);
          const input = await extract_input(id, source_file);
          if (input) {
            debug(0, ` * Input callback: 
${input.split("\n").map((l) => `   | ${import_colors.Color.gray(l)}`).join("\n")}`);
          }
          debug(0, ` * Unit test output: 
${response.split("\n").map((l) => `   | ${l}`).join("\n")}`);
          if (cached_data) {
            log_diff(response, cached_data);
          }
          dump_all_logs();
          let answer = all_yes ? "y" : void 0;
          if (!answer) {
            try {
              answer = await import_utils.Utils.prompt(`${import_colors.Color.magenta_bold("[Interactive mode]")} Did this unit test actually succeed? [y/n]: `);
            } catch (e) {
              debug(0, import_colors.Color.yellow("\nAborted."));
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
        debug(1, "\n" + (0, import_terminal_divider.terminal_divider)() + import_colors.Color.bold("Commencing unit test " + import_colors.Color.blue(id)));
        let source_location, source_file;
        if (loc.file.startsWith("file://")) {
          let ts_file = loc.file;
          ts_file = loc.file.slice(7);
          for (const [from, to] of [
            ["/dist/src/", "/src/"],
            ["/dist/", "/src/"]
          ]) {
            const replaced = ts_file.replace(from, to).slice(0, -3) + ".ts";
            if (new import_path.Path(replaced).exists()) {
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
            hash: import_utils.Utils.hash,
            debug,
            log_level,
            expect
          });
          if (res instanceof Promise) {
            res = await res;
          }
          if (expect === "error") {
            debug(0, import_colors.Color.red_bold("Encountered success while expecting an error."));
            dump_all_logs();
            return { success: false, hash: void 0, output: void 0, expect };
          }
          let res_str = typeof res === "object" && res !== null ? import_colors.Colors.json(res) : typeof res === "string" ? res : JSON.stringify(res);
          let cached = use_refresh ? void 0 : this.mod_cache[id];
          if (cached && cached.expect !== expect) {
            debug(0, import_colors.Color.yellow(`Unit test "${id}" seems to have changed the expected result to "${expect}" from "${cached?.expect}", resetting cached result.`));
            cached = void 0;
          }
          const h = import_utils.Utils.hash(res_str, "sha256", "hex");
          const success = cached?.hash === h;
          if (success || !interactive) {
            debug(1, `Unit test output: 
${res_str.split("\n").map((l) => ` | ${l}`).join("\n")}`);
            debug(1, `Unit test output hash: ${import_colors.Color.gray(h)}`);
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
            debug(0, import_colors.Color.red_bold("Encountered an error while expecting success."));
            dump_all_logs();
            throw e;
          }
          let cached = use_refresh ? void 0 : this.mod_cache[id];
          if (cached?.expect !== expect) {
            cached = void 0;
          }
          const res_str = String(e?.message ?? e);
          const h = import_utils.Utils.hash(res_str, "sha256", "hex");
          const success = cached?.hash === h;
          if (success || !interactive) {
            debug(1, "Unit test error output:", e);
            debug(1, "Unit test hash:", import_colors.Color.gray(h));
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
      console.log(import_colors.Color.green_bold(`
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
          console.log(import_colors.Color.green_bold(`
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
            console.log(`${import_colors.Colors.red}${import_colors.Colors.bold}Error${import_colors.Colors.end}: Encountered an error during unit test "${id}".`);
            throw e;
          }
          const prefix = typeof debug === "string" || debug > 0 ? import_colors.Color.bold("Unit test " + import_colors.Color.blue(id)) : import_colors.Color.blue_bold(id);
          if (res.success === true) {
            console.log(`${debug === 0 && (last_success === void 0 || last_success) ? " * " : ""}${prefix} ${import_colors.Colors.green}${import_colors.Colors.bold}succeeded${import_colors.Colors.end}`);
            ++succeeded;
          } else {
            if (all_yes) {
              if (res.hash && res.output) {
                all_yes_insertions.push({ id, hash: res.hash, output: res.output, expect: res.expect });
              } else {
                console.log(`${import_colors.Color.red_bold(`Unable assign a "success" status for unit test "${id}" because the hash and output are not defined.`)}`);
              }
            }
            console.log(`${prefix} ${import_colors.Colors.red}${import_colors.Colors.bold}failed${import_colors.Colors.end}`);
            ++failed;
            if (stop_on_failure || res.hash == null && interactive) {
              console.log(`Stopping unit tests on failure.`);
              break;
            }
          }
          if (stop_after === id) {
            console.log(`Stopping unit tests after "${id}".`);
            return false;
          }
          last_success = res.success;
        }
      }
      if (all_yes && all_yes_insertions.length > 0) {
        if (!interactive) {
          throw new Error(`The --yes option is only available when interactive mode is enabled.`);
        }
        console.log(`${import_colors.Color.red_bold(`
Warning: you enabled the --yes option in interactive mode.`)}`);
        console.log(`${import_colors.Color.yellow(`This will automatically assign a "success" status for the following failed unit tests:`)}`);
        for (const item of all_yes_insertions) {
          console.log(` * ${import_colors.Color.gray(item.id)}`);
        }
        try {
          const answer = await import_utils.Utils.prompt(`${import_colors.Color.bold("Do you want to continue?")} [y/n]: `);
          if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
            console.log(import_colors.Color.yellow("Aborted."));
            return false;
          }
        } catch (e) {
          console.log(import_colors.Color.yellow("Aborted."));
          return false;
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
        return true;
      }
      if (failed === 0) {
        console.log(`All ${failed + succeeded} unit tests ${import_colors.Colors.green}${import_colors.Colors.bold}passed${import_colors.Colors.end} successfully.`);
      } else {
        console.log(`Encountered ${failed === 0 ? import_colors.Colors.green : import_colors.Colors.red}${import_colors.Colors.bold}${failed}${import_colors.Colors.end} failed unit tests.`);
      }
      return true;
    }
  }
  UnitTests2.Module = Module;
  const _unit_test_modules = [];
  async function perform({ results, module: module2 = import_cli.cli.get({ id: "--module", def: void 0 }), target = import_cli.cli.get({ id: "--target" }), stop_on_failure = import_cli.cli.present("--stop-on-failure"), stop_after = import_cli.cli.get({ id: "--stop-after", def: void 0 }), debug = import_cli.cli.get({ id: "--debug", def: 0, type: "number" }), interactive = import_cli.cli.present("--interactive"), all_yes = import_cli.cli.present(["--yes", "-y"]), repeat = import_cli.cli.get({ id: "--repeat", def: 0, type: "number" }), list_modules = import_cli.cli.present(["--list-modules", "--list"]), no_changes = import_cli.cli.present(["--no-changes", "-nc"]), refresh = import_cli.cli.present("--refresh") ? true : import_cli.cli.get({ id: "--refresh", def: false, type: "string" }) }) {
    if (list_modules) {
      if (_unit_test_modules.length === 0) {
        console.log(`Available unit test modules: None`);
      } else {
        console.log(`Available unit test modules:`);
        for (const mod of _unit_test_modules) {
          console.log(` * ${mod.name}`);
        }
      }
      return true;
    }
    if (_unit_test_modules.length === 0) {
      console.log(`${import_colors.Color.red("Error")}: No unit tests defined, add unit tests using the add() function.`);
      return false;
    }
    if (interactive && !module2) {
      console.log(`${import_colors.Color.red("Error")}: Interactive mode is only available when a module is defined.`);
      return false;
    }
    const cache_path = new import_path.Path(results);
    if (!cache_path.exists()) {
      throw new Error(`Cache directory "${results}" does not exist.`);
    } else if (!cache_path.is_dir()) {
      throw new Error(`Cache path "${results}" is not a directory.`);
    }
    if (module2 != null) {
      const mod = _unit_test_modules.find((m) => m.name === module2);
      if (!mod) {
        throw new Error(`Module "${module2}" was not found, the available modules are: [${_unit_test_modules.map((i) => i.name).join(", ")}]`);
      }
      return mod._run({
        target,
        stop_on_failure,
        stop_after,
        debug,
        interactive,
        cache: cache_path,
        all_yes,
        repeat,
        no_changes,
        refresh
      });
    }
    for (const mod of _unit_test_modules) {
      if (all_yes) {
        throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
      }
      const proceed = await mod._run({
        target,
        stop_on_failure,
        stop_after,
        debug,
        interactive,
        cache: cache_path,
        all_yes: false,
        refresh
      });
      if (!proceed) {
        return false;
      }
    }
    return true;
  }
  UnitTests2.perform = perform;
  function filter_output(data, opts) {
    const { include, exclude, visit, drop_undef = false, drop_empty = false } = opts;
    if (include && exclude) {
      throw new Error(`Cannot use both include and exclude options at the same time.`);
    }
    if (data == null || typeof data !== "object") {
      if (typeof visit === "function") {
        return visit(data);
      }
      return data;
    }
    if (!exclude && !include && typeof visit === "function") {
      return visit(data);
    }
    if (Array.isArray(data)) {
      let out = [];
      for (let i = 0; i < data.length; ++i) {
        const l_exclude = exclude;
        const l_include = include;
        const l_visit = visit && typeof visit === "object" ? visit : void 0;
        let res;
        if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
          res = data[i];
        } else {
          res = filter_output(data[i], {
            include: l_include,
            exclude: l_exclude,
            visit: l_visit,
            drop_empty,
            drop_undef
          });
        }
        if (drop_undef && res == null || drop_empty && typeof res !== "number" && !res || drop_empty && typeof res === "object" && Object.keys(res).length === 0) {
          continue;
        }
        out.push(res);
      }
      if (typeof visit === "function") {
        return visit(out);
      }
      return out;
    }
    const obj = data;
    const add_keys = (exclude ? Object.keys(obj).filter((k) => exclude[k] != null && typeof exclude[k] === "object" || !exclude[k]) : include ? Object.keys(include) : Object.keys(obj)).sort((a, b) => a.localeCompare(b));
    const result = {};
    for (const key of add_keys) {
      const l_exclude = !exclude ? void 0 : typeof exclude[key] === "boolean" ? void 0 : exclude[key];
      const l_include = !include ? void 0 : typeof include[key] === "boolean" ? void 0 : include[key];
      const l_visit = visit && typeof visit === "object" ? visit[key] : void 0;
      let res;
      if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
        res = obj[key];
      } else {
        res = filter_output(obj[key], {
          exclude: l_exclude,
          include: l_include,
          visit: l_visit,
          drop_empty,
          drop_undef
        });
      }
      if (drop_undef && res == null || drop_empty && typeof res !== "number" && !res || drop_empty && typeof res === "object" && Object.keys(res).length === 0) {
        continue;
      }
      result[key] = res;
    }
    if (typeof visit === "function") {
      return visit(result);
    }
    return result;
  }
  UnitTests2.filter_output = filter_output;
})(UnitTests || (UnitTests = {}));
var stdin_default = UnitTests;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UnitTests,
  unit_tests
});
