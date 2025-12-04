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
import { Color, Colors, Utils, Path, logging, GlobPattern, GlobPatternList, debug, Logger } from "@vlib";
import { SourceLoc } from '@vlib/logging/uni/source_loc.js';
import { compute_diff } from '../vts/utils/compute_diff.js';
import { Package } from './package.js';

// -----------------------------------------------------------------
// Types.

/** Expect type. */
type Expect = "error" | "success";

/** User inputted unit test callback type */
export type Callback = (args: {
    id: string;
    expect: Expect,
    debug: Logger<any, any>;
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
    private unit_tests: Record<
        string,
        (
            index: number, // index of the unit test in the module.
            ctx: Package.Context,
        ) => Promise<{ success: boolean, hash?: string, output?: string, expect: Expect }>
    > = {};

    // Mod cache.
    private mod_cache?: Record<string, CacheRecord>;

    /** The path to the `output` directory from the active package. */
    private output?: Path;

    /**
     * The context options that are always used for the unit tests.
     * Keep as opts so we can detect present keys.
     */
    private override_ctx?: Partial<Package.Context.Opts>;

    /** 
     * Create a unit test module.
     * @param name The name of the module.
     */
    constructor(opts: {
        /** The name of the module. */
        name: string,
        /**
         * Optionally strip colors from the unit test outputs, defaults to `false`.
         * Note that when this is defined, this wil always override other context options.
         * So also when providing different options through the CLI or by a parent package.
         */
        strip_colors?: boolean;
    }) {

        // Check errors.
        if (Modules.find(i => i.name === opts.name)) {
            throw new Error(`Unit test module "${opts.name}" already exists.`);
        }

        // Attributes.
        this.name = opts.name;
        this.override_ctx = {
            // dont assign to defaults, keep undefined when not set.
            // this way we can correctly override the package context.
            strip_colors: opts.strip_colors, 
        }

        // Add to unit test modules.
        Modules.push(this);
    }

    /**
     * Try load the mod cache
     */
    private async init_mod_cache(cache: Path) {
        if (this.mod_cache) return;
        this.output = cache;
        const path = cache.join(this.name.replaceAll("/", "_") + ".json")
        if (path.exists()) {
            this.mod_cache = await path.load({ type: "json" }) as any;
        } else {
            this.mod_cache ??= {};
        }
    }

    /**
     * Save the module cache to the given path.
     */
    private async save_mod_cache() {
        if (!this.mod_cache || !this.output) {
            throw new Error(`Module cache is not defined, please call add() before save_mod_cache().`);
        }
        await this.output.join(this.name.replace(/[\\\/]/g, "_") + ".json")
            .save(JSON.stringify(this.mod_cache!));
    }

    /**
     * Add a unit test to the module.
     * @param id The id of the unit test to add.
     * @param expect The expected result of the unit test. This can be either "error" or "success".
     * @param callback The callback function to execute the unit test. This callback should return the result of the test. Thrown errors will be captured.
     * @note When expecting an error, then also throw an error, the error's message will be used for hash comparisons.
     */
    add(opts: { id: string, expect: Expect, callback: Callback }): this;
    add(id: string, callback: Callback): this;
    add(id: string, expect: Expect, callback: Callback): this;
    add(a1: string | { id: string, expect: Expect, callback: Callback }, a2?: Expect | Callback, a3?: Callback): this {

        // Parse args.
        let id: string, expect: Expect, callback: Callback;
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
        this.unit_tests[id] = async (index: number, ctx: Package.Context) => {

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
            ): Promise<string | undefined> => {
                if (source_file == null) return undefined;
                const file = new Path(source_file);
                if (!file.exists()) {
                    debug.raw(Color.red(`Source file "${source_file}" does not exist.`));
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
                debug.raw(
                    `${Color.bold("Unit test " + Color.blue(id))} ${Color.red_bold("failed")} `,
                    `[${index + 1}/${Object.keys(this.unit_tests).length}]`,
                );
                debug.raw(`The unit test has failed, the ${Color.bold(expect as string)} output hash is different from the cached hash.`);
                debug.raw(Color.magenta_bold("Entering interactive mode."));
                debug.raw(` * Press Ctrl+C to abort.`);
                if (source_location) { debug.raw(` * Source file: ${Color.gray(source_location)}`); }
                debug.raw(` * Expected result type: ${Color.gray(expect)}`);
                debug.raw(` * Unit test output hash: ${Color.gray(new_hash)}`);

                // Try to extract the input function.
                const input = await extract_input(id, source_file);
                if (input) {
                    debug.raw(` * Input callback: \n${input.split("\n").map(l => `   | ${Color.gray(l)}`).join("\n")}`);
                }


                // Always show output logs even when showing the diff.
                // Since the diff can be a bit confusing when its largely edited.
                debug.raw(` * Unit test output: \n${response.split("\n").map(l => `   | ${l}`).join("\n")}`);


                // Provide additional info show what has changed based on previous data.
                if (cached_data && !ctx.no_changes) {
                    const { status, diff } = compute_diff({
                        new: response,
                        old: cached_data,
                        prefix: " * ",
                    });
                    if (status === "identical") {
                        debug.raw(" * Old and new data are identical. This should not happen.");
                    } else {
                        debug.raw(` * Detected changes between old and new data:`);
                        debug.raw(diff);
                    }
                }

                // Prompt for unit test success.
                let permission: boolean = false;
                if (!permission) {
                    try {
                        permission = await logging.confirm(`${Color.magenta_bold("[Interactive mode]")} Did this unit test actually succeed?`);
                    } catch (e: any) {
                        debug.raw(Color.yellow("\nAborted."));
                        process.exit(1);
                    }
                }
                if (permission) {
                    this.mod_cache![id] = {
                        hash: new_hash,
                        data: zlib.gzipSync(response, { level: 9 }).toString('base64'),
                        expect: expect,
                    }
                    await this.save_mod_cache();
                    return { success: true, hash: new_hash, output: response, expect };
                } else {
                    return { success: false, hash: new_hash, output: response, expect };
                }
            }

            // Logs,
            debug.raw(
                1,
                "\n", logging.terminal_divider(),
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
                    debug,
                    expect,
                });
                if (res instanceof Promise) { res = await res; }
                if (expect === "error") {
                    debug.raw(Color.red_bold("Encountered success while expecting an error."));
                    // no interactive mode possible.
                    return { success: false, hash: undefined, output: undefined, expect };
                }
                let res_str = typeof res === "object" && res !== null ? Color.object(res) : typeof res === "string" ? res : JSON.stringify(res);

                // Extract previous hash & data.
                let cached: undefined | CacheRecord = this.mod_cache![id];
                if (ctx.refresh) {
                    // reset the cached result by refresh, forcing a re-evaluation.
                    cached = undefined;
                } else if (cached && cached.expect !== expect) {
                    debug.raw(Color.yellow(`Unit test "${id}" seems to have changed the expected result to "${expect}" from "${cached?.expect}", resetting cached result.`));
                    cached = undefined;
                }

                // Check hash,
                const og_hash = Utils.hash(res_str, "sha256", "hex");
                const success = cached?.hash === og_hash;
                if (success || !ctx.interactive) {
                    debug.raw(1, `Unit test output: \n${res_str.split("\n").map(l => ` | ${l}`).join("\n")}`);
                    debug.raw(1, `Unit test output hash: ${Color.gray(og_hash)}`);
                }
                if (success) {
                    return { success: true, hash: og_hash, output: res_str, expect };
                }

                // Check the hash while removing colors.
                // if (ctx.strip_colors) {
                //     console.log('STOP!', ctx.strip_colors, )
                //     process.exit(1)
                // }
                // console.log('STOP!', ctx.strip_colors);
                // (() => process.exit(1))();
                if (
                    ctx.strip_colors
                    && cached
                    && Utils.hash(Color.strip(res_str), "sha256", "hex") ===
                    Utils.hash(Color.strip(zlib.gunzipSync(Buffer.from(cached.data, 'base64')).toString()), "sha256", "hex")
                ) {
                    return { success: true, hash: og_hash, output: res_str, expect };
                }

                // Interactive mode.
                if (ctx.interactive) {
                    return enter_interactive_on_failure(og_hash, res_str);
                }

                // Response.
                return { success: false, hash: og_hash, output: res_str, expect };

                // Handle error, could be expected or not expected.
            } catch (e: any) {

                // Did not expect error.
                if (expect !== "error") {
                    debug.raw(Color.red_bold("Encountered an error while expecting success."));
                    throw e;
                }

                // Variables.
                let cached: undefined | CacheRecord = this.mod_cache![id];
                if (cached?.expect !== expect) {
                    cached = undefined;
                }
                const res_str = String(e?.message ?? e);
                const h = Utils.hash(res_str, "sha256", "hex");
                const success = cached?.hash === h;

                // Logs.
                if (success || !ctx.interactive) {
                    debug.raw(1, "Unit test error output: ", e)
                    debug.raw(1, "Unit test hash: ", Color.gray(h))
                }

                // Success.
                if (success) {
                    return { success: true, hash: h, output: res_str, expect };
                }

                // Interactive mode.
                if (ctx.interactive) {
                    return enter_interactive_on_failure(h, res_str);
                }

                // Response.
                return { success: false, hash: h, output: res_str, expect };
            }
        };
        return this;
    }

    /**
     * Run the unit tests of the module
     */
    async run(ctx: Package.Context): Promise<{ status: boolean, failed: number, succeeded: number }> {

        // Override the context with the module's override context.
        // Ensure we copy the context so we do not modify the original package context.
        if (this.override_ctx) {
            ctx = Package.Context.merge(ctx, this.override_ctx, true);
        }

        // Logs.
        if (typeof ctx.debug === "number") debug.level.set(ctx.debug)
        debug.raw(Color.cyan_bold(`\nCommencing ${this.name} unit tests.`));

        // Variables.
        let failed = 0, succeeded = 0;
        let unit_tests = this.unit_tests;

        // Extract target.
        if (ctx.target != null) {
            if (ctx.target.includes("*")) {
                const regex = new RegExp(ctx.target.replaceAll("*", ".*?"));
                unit_tests = Object.fromEntries(
                    Object.entries(this.unit_tests).filter(([id]) => regex.test(id))
                );
            } else {
                if (unit_tests[ctx.target] === undefined) {
                    throw new Error(`Unit test "${ctx.target}" was not found`);
                }
                const unit_test = unit_tests[ctx.target];
                unit_tests = { [ctx.target]: unit_test };
            }
        }

        // Initialize cache.
        await this.init_mod_cache(ctx.output);

        // Cached all yes insertions.
        // const all_yes_insertions: { id: string, hash: string, output: string, expect: Expect }[] = [];

        // For every repeat.
        for (let i = 0; i <= ctx.repeat; ++i) {
            if (ctx.repeat !== 0) {
                debug.raw(Color.cyan_bold(`\nCommencing repetition ${i + 1} of unit test ${this.name}.`));
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
                    res = await unit_tests[id](id_index, ctx);
                }
                catch (e: any) {
                    debug.raw(`${Colors.red}${Colors.bold}Error${Colors.end}: Encountered an error during unit test "${id}".`);
                    throw e;
                }

                // Success.
                const prefix = typeof debug === "string" || debug.on(1) ? Color.blue_bold(id) : Color.bold("Unit test " + Color.blue(id));
                if (res.success === true) {
                    // add dot for when multiple successfull.
                    debug.raw(`${debug.level.eq(0) && (last_success === undefined || last_success) ? " * " : ""
                        }${prefix} ${Colors.green}${Colors.bold}succeeded${Colors.end}`);
                    ++succeeded;
                }
                // Failed.
                else {
                    debug.raw(`${prefix} ${Colors.red}${Colors.bold}failed${Colors.end}`);
                    ++failed;
                    if (
                        ctx.stop_on_failure
                        || (res.hash == null && ctx.interactive) // also stop when interactive is enabled and false is returned because that means that we could not assign a success status.
                    ) {
                        debug.raw(`Stopping unit tests on failure.`);
                        break;
                    }
                }
                if (ctx.stop_after === id) {
                    debug.raw(`Stopping unit tests after "${id}".`);
                    return { status: false, failed, succeeded };
                }
                last_success = res.success;
            }

        }

        // All yes insertions.
        // if (yes && all_yes_insertions.length > 0) {

        //     // Error.
        //     if (!interactive) {
        //         throw new Error(`The --yes option is only available when interactive mode is enabled.`);
        //     }

        //     // Show all yes insertions.
        //     debug.raw(`${Color.red_bold(`\nWarning: you enabled the --yes option in interactive mode.`)}`);
        //     debug.raw(`${Color.yellow(`This will automatically assign a "success" status for the following failed unit tests:`)}`);
        //     for (const item of all_yes_insertions) {
        //         debug.raw(` * ${Color.gray(item.id)}`);
        //     }

        //     // All yes permission.
        //     try {
        //         const answer = await logging.confirm(`${Color.bold("Do you want to continue?")} [y/n]: `);
        //         if (!answer) {
        //             console.log(Color.yellow("Aborted."));
        //             return { status: false, failed, succeeded };
        //         }
        //     } catch (e: any) {
        //         console.log(Color.yellow("Aborted."));
        //         return { status: false, failed, succeeded };
        //     }

        //     // Save all yes insertions.
        //     for (const item of all_yes_insertions) {
        //         this.mod_cache![item.id] = {
        //             hash: item.hash,
        //             data: zlib.gzipSync(item.output, { level: 9 }).toString('base64'),
        //             expect: item.expect,
        //         }
        //     }
        //     await this.save_mod_cache();
        //     console.log(`Saved ${all_yes_insertions.length} unit test hashes to the cache.`);
        //     return { status: true, failed, succeeded };
        // }

        // Show logs.
        const prefix = debug.level.eq(0) ? " * " : "";
        if (failed === 0) {
            debug.raw(`${prefix}All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
        } else {
            debug.raw(`${prefix}Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
        }
        return { status: true, failed, succeeded };
    }

    /**
     * Reset certain unit test results.
     * @param opts.results The path to the module's results file.
     * @param opts.ids The id or ids to reset, supports glob patterns.
     * @param opts.yes Whether to skip the confirmation prompt.
     */
    async reset_unit_tests(opts: {
        results: string | Path,
        target: GlobPatternList.T | GlobPatternList.T[],
        yes?: boolean,
    }): Promise<void> {
        if (typeof opts.results === "string") {
            opts.results = new Path(opts.results);
        }
        if (!Array.isArray(opts.target)) {
            opts.target = [opts.target];
        }
        await this.init_mod_cache(opts.results);
        const id_list = new GlobPatternList(opts.target);
        const deletions: string[] = [];
        for (const key of Object.keys(this.mod_cache!)) {
            if (id_list.match(key)) {
                deletions.push(key);
            }
        }
        if (deletions.length === 0) {
            throw new Error(`No unit tests matched the provided ids: ${opts.target.join(", ")}`);
        }
        if (!opts.yes) {
            debug.raw(`The following unit tests will be reset upon confirmation:${deletions.map(d => `\n - ${d}`).join("")}`);
            const answer = await logging.confirm(
                `Do you wish to reset the unit tests listed above?`,
            );
            if (!answer) {
                throw new Error(`Write permission denied, not resetting unit tests.`);
            }
        }
        for (const id of deletions) {
            delete this.mod_cache![id];
        }
        await this.save_mod_cache();
        debug.raw(`Reset ${deletions.length} unit tests in module "${this.name}".`);
    }
}

/** 
 * The unit tests module cache.
 * @warning Keep this semi-private to enforce the use of the add() function.
 * @warning Dont use a `Set` so we can retain the order of the unit tests modules in which they were added.
 *          This is especially useful since some unit tests require to be executed in a specific order.
 */
export const Modules: Module[] = [];
