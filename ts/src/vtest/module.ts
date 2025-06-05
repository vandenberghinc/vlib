/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as zlib from 'zlib';
import * as ts from 'typescript';
import pkg from 'js-beautify';
const { js: beautify } = pkg;

// Imports.
import { Color, Colors, Utils, Path, logging } from "@vlib";
import { SourceLoc } from '@vlib/debugging/source_loc.js';
import { compute_diff } from '../vts/utils/compute_diff.js';

// -----------------------------------------------------------------
// Types.

/** Expect type. */
type Expect = "error" | "success";

/** User inputted unit test callback type */
type Callback = (args: {
    id: string;
    hash: (data: string) => string;
    debug: (...args: any[]) => void;
    log_level: string | number;
    expect: Expect,
}) => Promise<any> | any;

/** Cache for all unit test responses mapped per module per unit test */
type CacheRecord = {
    hash: string;
    data: string;
    expect: Expect;
}

// -----------------------------------------------------------------
// Module class.

/** 
 * Unit test module.
 * @note Should be created at file-level scope.
 */
export class Module {

    // Module name.
    name: string;

    // Added unit tests.
    unit_tests: Record<string, (args: {
        log_level: string | number,
        cache: Path,
        interactive: boolean,
        index: number, // index of the unit test in the module.
        all_yes?: boolean,
        no_changes?: boolean,
        refresh?: string | boolean,
    }) => Promise<{ success: boolean, hash?: string, output?: string, expect: Expect }>> = {};

    // Mod cache.
    mod_cache?: Record<string, CacheRecord>;

    /** 
     * Create a unit test module.
     * @param name The name of the module.
     */
    constructor({ name }: {
        name: string,
    }) {

        // Check errors.
        if (modules.find(i => i.name === name)) {
            throw new Error(`Unit test module "${name}" already exists.`);
        }

        // Attributes.
        this.name = name;

        // Add to unit test modules.
        modules.push(this);
    }

    /**
     * Add a unit test to the module.
     * @param id The id of the unit test to add.
     * @param expect The expected result of the unit test. This can be either "error" or "success".
     * @param callback The callback function to execute the unit test. This callback should return the result of the test. Thrown errors will be captured.
     * @param refresh Refresh the unit test cache. This will remove the cached data for this unit test.
     * @note When expecting an error, then also throw an error, the error's message will be used for hash comparisons.
     */
    add(opts: {
        id: string,
        expect: Expect,
        callback: Callback,
        refresh?: boolean,
    });
    add(id: string, callback: Callback);
    add(id: string, expect: Expect, callback: Callback, refresh?: boolean);
    add() {

        // Parse args.
        let id: string, expect: Expect, callback: Callback, refresh: boolean;
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
        
        // Check errors.
        if (expect !== "error" && expect !== "success") {
            throw new Error(`Invalid value of parameter expect "${expect}" from unit test "${id}", valid values are ["error", "success"].`);
        } else if (Object.keys(this.unit_tests).includes(id)) {
            throw new Error(`Invalid unit test "${id}", this unit test id is already defined.`);
        } else if (!/[a-zA-Z0-9-_:/\*]+/.test(id)) {
            throw new Error(`Invalid unit test id "${id}", this should only contain alphanumeric characters, dashes, underscores, slashes and asterisks.`);
        }

        // Get source location.
        const loc = new SourceLoc(1);

        // Add unit test.
        const override_refresh = refresh;
        this.unit_tests[id] = async ({ log_level, interactive, cache, index, all_yes = false, no_changes = false, refresh = false }) => {

            // Combine refresh.
            const use_refresh = override_refresh || (
                (typeof refresh === "string" && refresh === id) ||
                refresh === true
            )

            // Debug function.
            // Also passed to the user.
            const logs: { active: boolean, items: any[]}[] = [];
            const debug = (level: number, ...args: any[]) => {
                logs.push({
                    active: (typeof log_level === "number" && level <= log_level) || (typeof log_level === "string" && log_level === id),
                    items: args,
                });
            }
            const dump_active_logs = () => {
                for (const log of logs) {
                    if (log.active) { console.log(...log.items); }
                }
                logs.length = 0;
            }
            const dump_all_logs = () => {
                for (const log of logs) { console.log(...log.items); }
                logs.length = 0;
            }


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
            const extract_input = async (
                id: string,
                source_file?: string
            ): Promise<string | undefined> =>{
                if (source_file == null) return undefined;
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
                const sf = ts.createSourceFile(
                    source_file,
                    source,
                    ts.ScriptTarget.Latest,
                    true
                );

                let inputText: string | undefined;
                function visit(node: ts.Node) {
                    if (inputText != null) return;

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
                            } else if (args.length === 2) {
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
                            let callbackNode: ts.Expression | undefined;
                            for (const prop of args[0].properties) {
                                if (!ts.isPropertyAssignment(prop)) continue;
                                const name = prop.name;
                                const key = ts.isIdentifier(name)
                                    ? name.text
                                    : ts.isStringLiteral(name)
                                        ? name.text
                                        : '';
                                if (
                                    key === 'id' &&
                                    ts.isStringLiteral(prop.initializer) &&
                                    prop.initializer.text === id
                                ) {
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
                
                if (!inputText) return undefined;

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
            }
            // Enter interactive mode on failure.
            const enter_interactive_on_failure = async (new_hash: string, response: string) => {

                // Variables.
                const cached: undefined | CacheRecord = this.mod_cache![id];
                const cached_data = !cached?.data ? undefined : zlib.gunzipSync(Buffer.from(cached.data, 'base64')).toString();

                // Show interactive mode.
                debug(0, 
                    `${Color.bold("Unit test " + Color.blue(id))} ${Color.red_bold("failed")}`,
                    `[${index + 1}/${Object.keys(this.unit_tests).length}]`,
                );
                debug(0, `The unit test has failed, the ${Color.bold(expect as string)} output hash is different from the cached hash.`);
                debug(0, Color.magenta_bold("Entering interactive mode."));
                debug(0, ` * Press Ctrl+C to abort.`);
                if (source_location) { debug(0, ` * Source file: ${Color.gray(source_location)}`); }
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
                if (cached_data && !no_changes) {
                    const { status, diff } = compute_diff({
                        new: response,
                        old: cached_data,
                        prefix: " * ",
                    });
                    if (status === "identical") {
                        debug(0, " * Old and new data are identical. This should not happen.");
                    } else {
                        debug(0, ` * Detected changes between old and new data:`);
                        debug(0, diff);
                    }
                }

                // Dump all logs.
                dump_all_logs();

                // Prompt for unit test success.
                let answer = all_yes ? "y" : undefined;
                if (!answer) {
                    try {
                        answer = await logging.prompt(`${Color.magenta_bold("[Interactive mode]")} Did this unit test actually succeed? [y/n]: `);
                    } catch (e: any) {
                        debug(0, Color.yellow("\nAborted."));
                        dump_all_logs();
                        process.exit(1);
                    }
                }
                if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                    this.mod_cache![id] = {
                        hash: new_hash,
                        data: zlib.gzipSync(response, { level: 9 }).toString('base64'),
                        expect: expect,
                    }
                    await this.save_mod_cache(cache);
                    return { success: true, hash: new_hash, output: response, expect };
                } else {
                    return { success: false, hash: new_hash, output: response, expect };
                }
            }

            // Logs,
            debug(
                1,
                "\n" + logging.terminal_divider() +
                Color.bold("Commencing unit test " + Color.blue(id))
            );

            // Try to extract ts source file.
            let source_location: undefined | string, source_file: undefined | string;
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
            } else if (!loc.is_unknown()) {
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
                if (res instanceof Promise) { res = await res; }
                if (expect === "error") {
                    debug(0, Color.red_bold("Encountered success while expecting an error."));
                    // no interactive mode possible.
                    dump_all_logs();
                    return { success: false, hash: undefined, output: undefined, expect };
                }
                let res_str = typeof res === "object" && res !== null ? Color.json(res) : typeof res === "string" ? res : JSON.stringify(res);

                // Extract previous hash & data.
                let cached: undefined | CacheRecord = use_refresh ? undefined : this.mod_cache![id];
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
            } catch (e: any) {

                // Did not expect error.
                if (expect !== "error") {
                    debug(0, Color.red_bold("Encountered an error while expecting success."));
                    dump_all_logs();
                    throw e;
                }

                // Variables.
                let cached: undefined | CacheRecord = use_refresh ? undefined : this.mod_cache![id];
                if (cached?.expect !== expect) {
                    cached = undefined;
                }
                const res_str = String(e?.message ?? e);
                const h = Utils.hash(res_str, "sha256", "hex");
                const success = cached?.hash === h;

                // Logs.
                if (success || !interactive) {
                    debug(1, "Unit test error output:", e)
                    debug(1, "Unit test hash:", Color.gray(h))
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
    private async save_mod_cache(cache: Path) {
        if (!this.mod_cache) {
            throw new Error(`Module cache is not defined, please call add() before save_mod_cache().`);
        }
        await cache.join(this.name.replaceAll("/", "_") + ".json")
            .save(JSON.stringify(this.mod_cache!));
    }

    /**
     * Try load the mod cache
     */
    private async init_mod_cache(cache: Path) {
        if (this.mod_cache) return;
        const path = cache.join(this.name.replaceAll("/", "_") + ".json")
        if (path.exists()) {
            this.mod_cache = await path.load({ type: "json" }) as any;
        } else {
            this.mod_cache ??= {};
        }
    }

    /**
     * Run the unit tests of the module
     * @private
     */
    async _run({ 
        target,
        stop_on_failure = false,
        stop_after,
        debug = 0,
        interactive = true,
        cache,
        all_yes = false,
        repeat = 0,
        no_changes = false,
        refresh = false,
    }: {
        target?: string;
        stop_on_failure?: boolean;
        stop_after?: string;
        debug?: string | number;
        interactive?: boolean;
        cache: Path;
        all_yes?: boolean;
        repeat?: number;
        no_changes?: boolean;
        refresh?: boolean | string;
    }): Promise<{ status: boolean, failed: number, succeeded: number }> {

        // Logs.
        console.log(Color.cyan_bold(`\nCommencing ${this.name} unit tests.`));

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
                unit_tests = Object.fromEntries(
                    Object.entries(this.unit_tests).filter(([id]) => regex.test(id))
                );
            } else {
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
        const all_yes_insertions: { id: string, hash: string, output: string, expect: Expect }[] = [];

        // For every repeat.
        for (let i = 0; i <= repeat; ++i) {
            if (repeat !== 0) {
                console.log(Color.cyan_bold(`\nCommencing repetition ${i+1} of unit test ${this.name}.`));
            }
            failed = 0, succeeded = 0;

            // Start test.
            const ids = Object.keys(unit_tests);
            let last_success: boolean | undefined;
            for (let id_index = 0; id_index < ids.length; ++id_index) {
                const id = ids[id_index];

                // Execute unit test.
                let res: { success: boolean, hash?: string, output?: string, expect: Expect };
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
                catch (e: any) {
                    console.log(`${Colors.red}${Colors.bold}Error${Colors.end}: Encountered an error during unit test "${id}".`);
                    throw e;
                }

                // Success.
                const prefix = typeof debug === "string" || debug > 0 ? Color.bold("Unit test " + Color.blue(id)) : Color.blue_bold(id);
                if (res.success === true) {
                    // add dot for when multiple successfull.
                    console.log(`${
                        debug === 0 && (last_success === undefined || last_success) ? " * " : ""
                    }${prefix} ${Colors.green}${Colors.bold}succeeded${Colors.end}`);
                    ++succeeded;
                }
                // Failed.
                else {
                    if (all_yes) {
                        if (res.hash && res.output) {
                            all_yes_insertions.push({ id, hash: res.hash, output: res.output, expect: res.expect });
                        } else {
                            console.log(`${Color.red_bold(`Unable assign a "success" status for unit test "${id}" because the hash and output are not defined.`)}`);
                        }
                    }
                    console.log(`${prefix} ${Colors.red}${Colors.bold}failed${Colors.end}`);
                    ++failed;
                    if (
                        stop_on_failure
                        || (res.hash == null && interactive) // also stop when interactive is enabled and false is returned because that means that we could not assign a success status.
                    ) {
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
                const answer = await logging.prompt(`${Color.bold("Do you want to continue?")} [y/n]: `);
                if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
                    console.log(Color.yellow("Aborted."));
                    return { status: false, failed, succeeded };
                }
            } catch (e: any) {
                console.log(Color.yellow("Aborted."));
                return { status: false, failed, succeeded };
            }

            // Save all yes insertions.
            for (const item of all_yes_insertions) {
                this.mod_cache![item.id] = {
                    hash: item.hash,
                    data: zlib.gzipSync(item.output, { level: 9 }).toString('base64'),
                    expect: item.expect,
                }
            }
            await this.save_mod_cache(cache);
            console.log(`Saved ${all_yes_insertions.length} unit test hashes to the cache.`);
            return { status: true, failed, succeeded };
        }

        // Show logs.
        const prefix = debug === 0 ? " * " : "";
        if (failed === 0) {
            console.log(`${prefix}All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
        } else {
            console.log(`${prefix}Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
        }
        return { status: true, failed, succeeded };
    }
}

/** 
 * The unit tests module cache.
 * @warning Keep this semi-private to enforce the use of the add() function.
 * @warning Dont use a `Set` so we can retain the order of the unit tests modules in which they were added.
 *          This is especially useful since some unit tests require to be executed in a specific order.
 */
export const modules: Module[] = [];
