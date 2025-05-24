/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2024 Daan van den Bergh.
 */
import { Color, Colors } from '../system/colors.js';
import { Utils } from '../global/utils.js';
import { Path } from '../system/path.js';
import { cli } from '../cli/cli.js';
import { terminal_divider } from '../logging/terminal_divider.js';
import * as zlib from 'zlib';
import { diffLines } from 'diff';
import { SourceLoc } from '../logging/source_loc.js';
import pkg from 'js-beautify';
const { js: beautify } = pkg;
import * as ts from 'typescript';
Error.stackTraceLimit = Infinity;
export var UnitTests;
(function (UnitTests) {
    /**
     * Unit test module.
     * @note Should be created at file-level scope.
     */
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
            // Check errors.
            if (_unit_test_modules.find(i => i.name === name)) {
                throw new Error(`Unit test module "${name}" already exists.`);
            }
            // Attributes.
            this.name = name;
            // Add to unit test modules.
            _unit_test_modules.push(this);
        }
        add() {
            // Parse args.
            let id, expect, callback, refresh;
            if (arguments.length === 1) {
                ({ id, expect, callback, refresh = false } = arguments[0]);
            }
            else if (arguments.length === 2) {
                id = arguments[0];
                expect = "success";
                callback = arguments[1];
                refresh = false;
            }
            else if (arguments.length >= 3) {
                id = arguments[0];
                expect = arguments[1];
                callback = arguments[2];
                refresh = arguments[3] ?? false;
            }
            else {
                throw new Error(`Invalid number of arguments, expected 1 or 3, got ${arguments.length}.`);
            }
            // Check errors.
            if (expect !== "error" && expect !== "success") {
                throw new Error(`Invalid value of parameter expect "${expect}" from unit test "${id}", valid values are ["error", "success"].`);
            }
            else if (Object.keys(this.unit_tests).includes(id)) {
                throw new Error(`Invalid unit test "${id}", this unit test id is already defined.`);
            }
            else if (!/[a-zA-Z0-9-_:/\*]+/.test(id)) {
                throw new Error(`Invalid unit test id "${id}", this should only contain alphanumeric characters, dashes, underscores, slashes and asterisks.`);
            }
            // Get source location.
            const loc = new SourceLoc(1);
            // Add unit test.
            const override_refresh = refresh;
            this.unit_tests[id] = async ({ log_level, interactive, cache, index, all_yes = false, no_changes = false, refresh = false }) => {
                // Combine refresh.
                const use_refresh = override_refresh || ((typeof refresh === "string" && refresh === id) ||
                    refresh === true);
                // Debug function.
                // Also passed to the user.
                const logs = [];
                const debug = (level, ...args) => {
                    logs.push({
                        active: (typeof log_level === "number" && level <= log_level) || (typeof log_level === "string" && log_level === id),
                        items: args,
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
                /**
                 * Try to extract the 3rd argument (the input‐callback) from a source file
                 * where a call like `tests.add("…id…", …, <inputFn>)` occurs.
                 */
                /**
                 * Try to extract the test callback (3rd positional argument, or
                 * the `callback` property in object form) from a source file
                 * where a call like:
                 *   tests.add("…id…", …, <callback>)
                 * or
                 *   tests.add({ id: "…id…", …, callback: <callback> })
                 * occurs.
                 */
                const extract_input = async (id, source_file) => {
                    if (source_file == null)
                        return undefined;
                    const file = new Path(source_file);
                    if (!file.exists()) {
                        debug(0, Color.red(`Source file "${source_file}" does not exist.`));
                        return undefined;
                    }
                    const source = await file.load();
                    // Fast check
                    if (!new RegExp(`\\b${id}\\b`).test(source)) {
                        return undefined;
                    }
                    // Parse with TS for code-aware boundaries
                    const sf = ts.createSourceFile(source_file, source, ts.ScriptTarget.Latest, true);
                    let inputText;
                    function visit(node) {
                        if (inputText != null)
                            return;
                        if (ts.isCallExpression(node)) {
                            const args = node.arguments;
                            // Positional form: tests.add(id, status, callback)
                            if (args.length >= 1 && ts.isStringLiteral(args[0]) && args[0].text === id) {
                                if (args.length >= 3) {
                                    const cb = args[2];
                                    inputText = ts.isArrowFunction(cb)
                                        ? cb.body.getText(sf)
                                        : cb.getText(sf);
                                    return;
                                }
                                else if (args.length === 2) {
                                    const cb = args[1];
                                    inputText = ts.isArrowFunction(cb)
                                        ? cb.body.getText(sf)
                                        : cb.getText(sf);
                                    return;
                                }
                            }
                            // Object form: tests.add({ id, status, callback })
                            if (args.length === 1 && ts.isObjectLiteralExpression(args[0])) {
                                let foundId = false;
                                let callbackNode;
                                for (const prop of args[0].properties) {
                                    if (!ts.isPropertyAssignment(prop))
                                        continue;
                                    const name = prop.name;
                                    const key = ts.isIdentifier(name)
                                        ? name.text
                                        : ts.isStringLiteral(name)
                                            ? name.text
                                            : '';
                                    if (key === 'id' &&
                                        ts.isStringLiteral(prop.initializer) &&
                                        prop.initializer.text === id) {
                                        foundId = true;
                                    }
                                    if (key === 'callback') {
                                        callbackNode = prop.initializer;
                                    }
                                }
                                if (foundId && callbackNode) {
                                    inputText = ts.isArrowFunction(callbackNode)
                                        ? callbackNode.body.getText(sf)
                                        : callbackNode.getText(sf);
                                    return;
                                }
                            }
                        }
                        ts.forEachChild(node, visit);
                    }
                    visit(sf);
                    if (!inputText)
                        return undefined;
                    // Helper to re-indent a block of text by `spaces` spaces,
                    // removing any common leading indentation first.
                    return beautify(inputText.trim(), {
                        indent_size: 4,
                        indent_char: ' ',
                        max_preserve_newlines: 1,
                        preserve_newlines: true,
                        keep_array_indentation: false,
                        break_chained_methods: false,
                        indent_scripts: 'normal',
                        brace_style: 'collapse', // expand
                        space_before_conditional: false,
                        unescape_strings: false,
                        jslint_happy: false,
                        end_with_newline: false,
                        wrap_line_length: 0,
                        indent_empty_lines: false,
                        comma_first: false,
                        e4x: false,
                    });
                };
                /** Log the difference between cached data and new data strings. */
                function log_diff(new_data, old_data) {
                    if (no_changes) {
                        return;
                    }
                    // debug(3, ' * Scanning for differences between cached and new data...');
                    // Completely identical.
                    if (old_data === new_data) {
                        if (!use_refresh) {
                            debug(0, " *", Color.red_bold('Cached data and new data are identical, this should not occur, carefully check the unit test output. When the unit test is validated you can ignore this message and answer [Y].'));
                        }
                        return;
                    }
                    // Otherwise compute a line-by-line diff.
                    // debug(0, 'Detected differences between cached and new data. ⚠️');
                    debug(0, " *", Color.yellow_bold('Detected differences between cached- and new outut:'));
                    const diffs = diffLines(old_data, new_data);
                    diffs.forEach((part, index) => {
                        const prev_part = diffs[index - 1];
                        const next_part = diffs[index + 1];
                        if (!part.added && !part.removed &&
                            (prev_part == null || (!prev_part.added && !prev_part.removed)) &&
                            (next_part == null || (!next_part.added && !next_part.removed))) {
                            return;
                        }
                        // part.added=true → new lines (green +)
                        // part.removed=true → old lines (red -)
                        // otherwise unchanged (gray space)
                        const prefix = "  | " + (part.added
                            ? Color.green('+')
                            : part.removed
                                ? Color.red('-')
                                : ' ');
                        // indent one space so the prefix lines up
                        let last_was_dots = false;
                        part.value.split('\n').forEach((line, i, arr) => {
                            // skip the final empty split after the last newline
                            if (i === arr.length - 1 && line === '')
                                return;
                            debug(0, ` ${prefix} ${line}`);
                        });
                    });
                }
                // Enter interactive mode on failure.
                const enter_interactive_on_failure = async (new_hash, response) => {
                    // Variables.
                    const cached = this.mod_cache[id];
                    const cached_data = !cached?.data ? undefined : zlib.gunzipSync(Buffer.from(cached.data, 'base64')).toString();
                    // Show interactive mode.
                    debug(0, `${Color.bold("Unit test " + Color.blue(id))} ${Color.red_bold("failed")}`, `[${index + 1}/${Object.keys(this.unit_tests).length}]`);
                    debug(0, `The unit test has failed, the ${Color.bold(expect)} output hash is different from the cached hash.`);
                    debug(0, Color.magenta_bold("Entering interactive mode."));
                    debug(0, ` * Press Ctrl+C to abort.`);
                    if (source_location) {
                        debug(0, ` * Source file: ${Color.gray(source_location)}`);
                    }
                    debug(0, ` * Expected result type: ${Color.gray(expect)}`);
                    debug(0, ` * Unit test output hash: ${Color.gray(new_hash)}`);
                    // Try to extract the input function.
                    const input = await extract_input(id, source_file);
                    if (input) {
                        debug(0, ` * Input callback: \n${input.split("\n").map(l => `   | ${Color.gray(l)}`).join("\n")}`);
                    }
                    // Always show output logs even when showing the diff.
                    // Since the diff can be a bit confusing when its largely edited.
                    debug(0, ` * Unit test output: \n${response.split("\n").map(l => `   | ${l}`).join("\n")}`);
                    // Provide additional info show what has changed based on previous data.
                    if (cached_data) {
                        log_diff(response, cached_data);
                    }
                    // Dump all logs.
                    dump_all_logs();
                    // Prompt for unit test success.
                    let answer = all_yes ? "y" : undefined;
                    if (!answer) {
                        try {
                            answer = await Utils.prompt(`${Color.magenta_bold("[Interactive mode]")} Did this unit test actually succeed? [y/n]: `);
                        }
                        catch (e) {
                            debug(0, Color.yellow("\nAborted."));
                            dump_all_logs();
                            process.exit(1);
                        }
                    }
                    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                        this.mod_cache[id] = {
                            hash: new_hash,
                            data: zlib.gzipSync(response, { level: 9 }).toString('base64'),
                            expect: expect,
                        };
                        await this.save_mod_cache(cache);
                        return { success: true, hash: new_hash, output: response, expect };
                    }
                    else {
                        return { success: false, hash: new_hash, output: response, expect };
                    }
                };
                // Logs,
                debug(1, "\n" + terminal_divider() +
                    Color.bold("Commencing unit test " + Color.blue(id)));
                // Try to extract ts source file.
                let source_location, source_file;
                if (loc.file.startsWith("file://")) {
                    let ts_file = loc.file;
                    ts_file = loc.file.slice(7);
                    for (const [from, to] of [
                        ["/dist/src/", "/src/"],
                        ["/dist/", "/src/"],
                    ]) {
                        const replaced = ts_file.replace(from, to).slice(0, -3) + ".ts";
                        if (new Path(replaced).exists()) {
                            ts_file = replaced;
                            break;
                        }
                    }
                    if (ts_file) {
                        source_file = ts_file;
                        source_location = `file://${ts_file}:0:0`;
                    }
                }
                else if (!loc.is_unknown()) {
                    if (loc.file.startsWith("file://")) {
                        source_file = loc.file.slice(7);
                    }
                    source_location = `${loc.file}:${loc.line}:${loc.column}`;
                }
                // Execute.
                try {
                    let res = callback({
                        id,
                        hash: Utils.hash,
                        debug,
                        log_level: log_level,
                        expect,
                    });
                    if (res instanceof Promise) {
                        res = await res;
                    }
                    if (expect === "error") {
                        debug(0, Color.red_bold("Encountered success while expecting an error."));
                        // no interactive mode possible.
                        dump_all_logs();
                        return { success: false, hash: undefined, output: undefined, expect };
                    }
                    let res_str = typeof res === "object" && res !== null ? Colors.json(res) : typeof res === "string" ? res : JSON.stringify(res);
                    // Extract previous hash & data.
                    let cached = use_refresh ? undefined : this.mod_cache[id];
                    if (cached && cached.expect !== expect) {
                        debug(0, Color.yellow(`Unit test "${id}" seems to have changed the expected result to "${expect}" from "${cached?.expect}", resetting cached result.`));
                        cached = undefined;
                    }
                    // Check hash,
                    const h = Utils.hash(res_str, "sha256", "hex");
                    const success = cached?.hash === h;
                    if (success || !interactive) {
                        debug(1, `Unit test output: \n${res_str.split("\n").map(l => ` | ${l}`).join("\n")}`);
                        debug(1, `Unit test output hash: ${Color.gray(h)}`);
                    }
                    if (success) {
                        dump_active_logs();
                        return { success: true, hash: h, output: res_str, expect };
                    }
                    // Interactive mode.
                    if (interactive) {
                        return enter_interactive_on_failure(h, res_str);
                    }
                    // Response.
                    dump_all_logs();
                    return { success: false, hash: h, output: res_str, expect };
                }
                catch (e) {
                    // Did not expect error.
                    if (expect !== "error") {
                        debug(0, Color.red_bold("Encountered an error while expecting success."));
                        dump_all_logs();
                        throw e;
                    }
                    // Variables.
                    let cached = use_refresh ? undefined : this.mod_cache[id];
                    if (cached?.expect !== expect) {
                        cached = undefined;
                    }
                    const res_str = String(e?.message ?? e);
                    const h = Utils.hash(res_str, "sha256", "hex");
                    const success = cached?.hash === h;
                    // Logs.
                    if (success || !interactive) {
                        debug(1, "Unit test error output:", e);
                        debug(1, "Unit test hash:", Color.gray(h));
                    }
                    // Success.
                    if (success) {
                        dump_active_logs();
                        return { success: true, hash: h, output: res_str, expect };
                    }
                    // Interactive mode.
                    if (interactive) {
                        return enter_interactive_on_failure(h, res_str);
                    }
                    // Response.
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
            await cache.join(this.name.replaceAll("/", "_") + ".json")
                .save(JSON.stringify(this.mod_cache));
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
            }
            else {
                this.mod_cache ??= {};
            }
        }
        /**
         * Run the unit tests of the module
         * @private
         */
        async _run({ target, stop_on_failure = false, stop_after, debug = 0, interactive = true, cache, all_yes = false, repeat = 0, no_changes = false, refresh = false, }) {
            // Logs.
            console.log(Color.green_bold(`\nCommencing ${this.name} unit tests.`));
            // Check opts.
            if (repeat > 0 && all_yes) {
                throw new Error(`The --yes option is not compatible with the --repeat option.`);
            }
            // Variables.
            let failed = 0, succeeded = 0;
            let unit_tests = this.unit_tests;
            // Extract target.
            if (target != null) {
                if (target.includes("*")) {
                    const regex = new RegExp(target.replaceAll("*", ".*?"));
                    unit_tests = Object.fromEntries(Object.entries(this.unit_tests).filter(([id]) => regex.test(id)));
                }
                else {
                    if (unit_tests[target] === undefined) {
                        throw new Error(`Unit test "${target}" was not found`);
                    }
                    const unit_test = unit_tests[target];
                    unit_tests = { [target]: unit_test };
                }
            }
            // Initialize cache.
            await this.init_mod_cache(cache);
            // Cached all yes insertions.
            const all_yes_insertions = [];
            // For every repeat.
            for (let i = 0; i <= repeat; ++i) {
                if (repeat !== 0) {
                    console.log(Color.green_bold(`\nCommencing repetition ${i + 1} of unit test ${this.name}.`));
                }
                failed = 0, succeeded = 0;
                // Start test.
                const ids = Object.keys(unit_tests);
                let last_success;
                for (let id_index = 0; id_index < ids.length; ++id_index) {
                    const id = ids[id_index];
                    // Execute unit test.
                    let res;
                    try {
                        res = await unit_tests[id]({
                            log_level: debug,
                            cache,
                            interactive: all_yes ? false : interactive,
                            index: id_index,
                            all_yes: false,
                            no_changes,
                            refresh,
                        });
                    }
                    catch (e) {
                        console.log(`${Colors.red}${Colors.bold}Error${Colors.end}: Encountered an error during unit test "${id}".`);
                        throw e;
                    }
                    // Success.
                    const prefix = typeof debug === "string" || debug > 0 ? Color.bold("Unit test " + Color.blue(id)) : Color.blue_bold(id);
                    if (res.success === true) {
                        // add dot for when multiple successfull.
                        console.log(`${debug === 0 && (last_success === undefined || last_success) ? " * " : ""}${prefix} ${Colors.green}${Colors.bold}succeeded${Colors.end}`);
                        ++succeeded;
                    }
                    // Failed.
                    else {
                        if (all_yes) {
                            if (res.hash && res.output) {
                                all_yes_insertions.push({ id, hash: res.hash, output: res.output, expect: res.expect });
                            }
                            else {
                                console.log(`${Color.red_bold(`Unable assign a "success" status for unit test "${id}" because the hash and output are not defined.`)}`);
                            }
                        }
                        console.log(`${prefix} ${Colors.red}${Colors.bold}failed${Colors.end}`);
                        ++failed;
                        if (stop_on_failure
                            || (res.hash == null && interactive) // also stop when interactive is enabled and false is returned because that means that we could not assign a success status.
                        ) {
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
            // All yes insertions.
            if (all_yes && all_yes_insertions.length > 0) {
                // Error.
                if (!interactive) {
                    throw new Error(`The --yes option is only available when interactive mode is enabled.`);
                }
                // Show all yes insertions.
                console.log(`${Color.red_bold(`\nWarning: you enabled the --yes option in interactive mode.`)}`);
                console.log(`${Color.yellow(`This will automatically assign a "success" status for the following failed unit tests:`)}`);
                for (const item of all_yes_insertions) {
                    console.log(` * ${Color.gray(item.id)}`);
                }
                // All yes permission.
                try {
                    const answer = await Utils.prompt(`${Color.bold("Do you want to continue?")} [y/n]: `);
                    if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
                        console.log(Color.yellow("Aborted."));
                        return false;
                    }
                }
                catch (e) {
                    console.log(Color.yellow("Aborted."));
                    return false;
                }
                // Save all yes insertions.
                for (const item of all_yes_insertions) {
                    this.mod_cache[item.id] = {
                        hash: item.hash,
                        data: zlib.gzipSync(item.output, { level: 9 }).toString('base64'),
                        expect: item.expect,
                    };
                }
                await this.save_mod_cache(cache);
                console.log(`Saved ${all_yes_insertions.length} unit test hashes to the cache.`);
                return true;
            }
            // Show logs.
            if (failed === 0) {
                console.log(`All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
            }
            else {
                console.log(`Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
            }
            return true;
        }
    }
    UnitTests.Module = Module;
    /**
     * The unit tests cache.
     * @warning Keep this private to enforce the use of the add() function.
     * @warning Dont use a `Set` so we can retain the order of the unit tests modules in which they were added.
     *          This is especially useful since some unit tests require to be executed in a specific order.
     */
    const _unit_test_modules = [];
    /**
     * Perform all unit tests of all added modules.
     * @param results The path to a results cache directory. This should reside inside your repo and should not be ignored by git etc.
     * @warning When the results directory is deleted all unit test hashes will be lost. Causing a full manual re-evaluation of all unit tests.
     * @param module The module name to run. If not defined all modules will be run.
     * @param target The target unit test to run. If not defined all unit tests will be run. Asterisks (*) are supported to run multiple targeted unit tests.
     * @param stop_on_failure Whether to stop on a failed unit test.
     * @param stop_after The unit test id to stop after.
     * @param debug The active debug level to use for the unit tests. However this may also be a unit test id, in which case all logs of this unit test will be shown, while hiding all other logs.
     * @param interactive Whether to enter interactive mode on failure.
     * @param no_changes Do not show the diff from cached and new data.
     *
     * @example
     * ```ts
     * import { UnitTests } from "@vandenberghinc/vlib";
     *
     * // Create a unit test module.
     * // This can be defined at file-level scope to create multiple modules.
     * const unit_tests = new UnitTests.Module({ name: "MyModule" });
     *
     * // Add a unit test to the module.
     * unit_tests.add("MyUnitTest", "success", () => somefunc()); // somefunc() may return anything.
     *
     * // Add a unit test with object based arguments.
     * unit_tests.add({ id: "MyUnitTest2", expect: "error", callback: ({ id, hash, debug }) => { ... } });
     *
     * // Perform the added unit tests.
     * UnitTests.perform({
     *     results: "./unit_tests/results/",
     * })
     * .then((success) => console.log("Unit tests succeeded:", success))
     * .catch(console.error);
     * ```
     */
    async function perform({ results, module = cli.get({ id: "--module", def: undefined }), target = cli.get({ id: "--target" }), stop_on_failure = cli.present("--stop-on-failure"), stop_after = cli.get({ id: "--stop-after", def: undefined }), debug = cli.get({ id: "--debug", def: 0, type: "number" }), interactive = cli.present("--interactive"), all_yes = cli.present(["--yes", "-y"]), repeat = cli.get({ id: "--repeat", def: 0, type: "number" }), list_modules = cli.present(["--list-modules", "--list"]), no_changes = cli.present(["--no-changes", "-nc"]), refresh = cli.present("--refresh") ? true : cli.get({ id: "--refresh", def: false, type: "string" }), }) {
        // List modules.
        if (list_modules) {
            if (_unit_test_modules.length === 0) {
                console.log(`Available unit test modules: None`);
            }
            else {
                console.log(`Available unit test modules:`);
                for (const mod of _unit_test_modules) {
                    console.log(` * ${mod.name}`);
                }
            }
            return true;
        }
        // Error when no unit tests are defined.
        if (_unit_test_modules.length === 0) {
            console.log(`${Color.red("Error")}: No unit tests defined, add unit tests using the add() function.`);
            return false;
        }
        // Error when interactive mode and no module is defined.
        if (interactive && !module) {
            console.log(`${Color.red("Error")}: Interactive mode is only available when a module is defined.`);
            return false;
        }
        // Check cache.
        const cache_path = new Path(results);
        if (!cache_path.exists()) {
            throw new Error(`Cache directory "${results}" does not exist.`);
        }
        else if (!cache_path.is_dir()) {
            throw new Error(`Cache path "${results}" is not a directory.`);
        }
        // Test target module.
        if (module != null) {
            const mod = _unit_test_modules.find(m => m.name === module);
            if (!mod) {
                throw new Error(`Module "${module}" was not found, the available modules are: [${_unit_test_modules.map(i => i.name).join(", ")}]`);
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
                refresh,
            });
        }
        // Test all modules.
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
                refresh,
            });
            if (!proceed) {
                return false;
            }
        }
        return true;
    }
    UnitTests.perform = perform;
    /**
     * Filter (output) data based on a simple scheme, then sort object key's by defined scheme order.
     * This can be useful for producing a consistent output format.
     * @param data {Record<string, any> | any[]} The input data.
     * @param include Include only a list of keys, all other keys will be excluded, formatted as an object with boolean values or nested include schemes.
     * @param exclude Exclude a list of keys, all other keys will still be included, formatted as an object with boolean values or nested exclude schemes.
     * @param visit Allows for defining postprocess visit functions for each key, formatted as an object with function values or nested visit schemes.
     * @param opts.drop_empty Drop all empty values from objects and arrays - such as null, undefined, empty strings, empty arrays and empty objects.
     * @param opts.drop_undef Drop all null and undefined values from objects and arrays.
     * @example
     *
     * const data = {
     *    key1: "value1",
     *    key2: "value2",
     *    key3: "",
     *    key4: null,
     *    key5: {
     *       key1: undefined,
     *       key2: undefined,
     *    },
     * };
     *
     * // Using include.
     * UnitTests.filter_output(data, {
     *    include: {
     *       key1: true,
     *       key5: { key1: true },
     *    },
     * }); // => { key1: "value1", key5: { key1: undefined } }
     *
     * // Using exclude.
     * UnitTests.filter_output(data, {
     *    exclude: {
     *       key2: true,
     *       key3: true,
     *       key4: true,
     *       key5: { key2: true },
     *    },
     * }); // => { key1: "value1", key5: { key1: undefined } }
     *
     */
    function filter_output(data, opts) {
        const { include, exclude, visit, drop_undef = false, drop_empty = false } = opts;
        if (include && exclude) {
            throw new Error(`Cannot use both include and exclude options at the same time.`);
        }
        // Is undefined or not an object.
        if (data == null || typeof data !== "object") {
            if (typeof visit === "function") {
                return visit(data);
            }
            return data;
        }
        // Still an object/array but only a visit func defined and no other opts.
        // This can also happen because of the nested filter_output() calls from Array objects.
        if (!exclude && !include && typeof visit === "function") {
            // otherwise we will clone the object while that is 1) not needed and 2) might be specifically only referenced in the visit to not clone the node.
            return visit(data);
        }
        // Handle arrays.
        if (Array.isArray(data)) {
            let out = [];
            for (let i = 0; i < data.length; ++i) {
                // console.log("Processing array item", i, Scheme.value_type(data[i]), Colors.object(data[i], { max_length: 100 }));
                // Add raw if there are no directions left.
                const l_exclude = exclude;
                const l_include = include;
                const l_visit = visit && typeof visit === "object" ? visit : undefined;
                // Filter.
                let res;
                if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
                    res = data[i];
                }
                else {
                    res = filter_output(data[i], {
                        include: l_include,
                        exclude: l_exclude,
                        visit: l_visit,
                        drop_empty,
                        drop_undef,
                    });
                }
                if ((drop_undef && res == null) ||
                    (drop_empty && typeof res !== "number" && !res) ||
                    (drop_empty && typeof res === "object" && Object.keys(res).length === 0) // also works for arrays.
                ) {
                    continue;
                }
                out.push(res);
            }
            if (typeof visit === "function") {
                return visit(out);
            }
            return out;
        }
        // Handle objects.
        const obj = data;
        const add_keys = (exclude ? Object.keys(obj).filter(k => (exclude[k] != null && typeof exclude[k] === "object") || !exclude[k]) :
            include ? Object.keys(include) :
                Object.keys(obj))
            .sort((a, b) => a.localeCompare(b));
        const result = {};
        for (const key of add_keys) {
            // console.log("Processing obj key", key, Scheme.value_type(data[key]), Colors.object(data[key], { max_length: 100 }));
            // Add raw if there are no directions left.
            const l_exclude = !exclude ? undefined : typeof exclude[key] === "boolean" ? undefined : exclude[key];
            const l_include = !include ? undefined : typeof include[key] === "boolean" ? undefined : include[key];
            const l_visit = visit && typeof visit === "object" ? visit[key] : undefined;
            // Filter.
            let res;
            if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
                res = obj[key];
            }
            else {
                res = filter_output(obj[key], {
                    exclude: l_exclude,
                    include: l_include,
                    visit: l_visit,
                    drop_empty,
                    drop_undef,
                });
            }
            if ((drop_undef && res == null) ||
                (drop_empty && typeof res !== "number" && !res) ||
                (drop_empty && typeof res === "object" && Object.keys(res).length === 0) // also works for arrays.
            ) {
                continue;
            }
            result[key] = res;
        }
        if (typeof visit === "function") {
            return visit(result);
        }
        return result;
    }
    UnitTests.filter_output = filter_output;
})(UnitTests || (UnitTests = {}));
export { UnitTests as unit_tests }; // also export as lowercase for compatibility.
export default UnitTests;
// =================================================================
// Tests for the `filter_output()` function.
// const data = {
//     key1: "value1",
//     key2: "value2",
//     key3: "",
//     key4: null,
//     key5: {
//         key1: undefined,
//         key2: undefined,
//     },
// };
// logger.debug(0,  "================================================================\nUsing include: ");
// logger.debug(0,  "Result:          ", UnitTests.filter_output(data, {
//     include: {
//         key1: true,
//         key5: { key1: true },
//     },
// }))
// logger.debug(0,  "Expected result: ", { key1: "value1", key5: { key1: undefined } });
// logger.debug(0, "================================================================\nUsing exclude: ");
// logger.debug(0, "Result:          ", UnitTests.filter_output(data, {
//     exclude: {
//         key2: true,
//         key3: true,
//         key4: true,
//         key5: { key2: true },
//     },
// }));
// logger.debug(0, "Expected result: ", { key1: "value1", key5: { key1: undefined } });
// logger.debug(0,  "================================================================\nUsing drop empty: ");
// logger.debug(0,  "Result:          ", UnitTests.filter_output(data, { drop_empty: true }))
// logger.debug(0,  "Expected result: ", {
//     key1: "value1",
//     key2: "value2",
// });
// logger.debug(0,  "================================================================\nUsing drop undef: ");
// logger.debug(0,  "Result:          ", UnitTests.filter_output(data, { drop_undef: true }))
// logger.debug(0,  "Expected result: ", {
//     key1: "value1",
//     key2: "value2",
//     key3: "",
//     key5: {},
// });
// logger.debug(0, "================================================================\nUsing drop undef: ");
// const joined: string[] = []
// UnitTests.filter_output(data, {
//     visit: {
//         key1: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key2: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key3: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key4: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key5: {
//             key1: (item: any) => { joined.push((item||"<blank>").toString()); },
//             key2: (item: any) => { joined.push((item||"<blank>").toString()); },
//         },
//     }
// });
// logger.debug(0, "Result:          ", joined.join("-"));
// logger.debug(0, "Expected result: ", "value1-value2-<blank>-<blank>-<blank>-<blank>");
// Utils.safe_exit();
//# sourceMappingURL=unit_tests.js.map