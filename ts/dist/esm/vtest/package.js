/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import * as vlib from "../vlib/index.js";
import { Color, Colors, log, Path } from "../vlib/index.js";
import { Modules } from './module.js';
/** The root path to `vlib/ts`, not yet checked if it exists. */
const __root = import.meta.dirname.split("vlib/ts/")[0] + "/vlib/ts/";
// -----------------------------------------------------------------
/**
 * The unit test package class.
 * Responsible for executing managing its included modules and unit tests.
 */
export class Package {
    /**
     * The initialized configuration object.
     */
    config;
    /** Flag to indicate if the modules are already initialized by `init_modules()` */
    modules_initialized = false;
    /**
     * Resolve a path search to a file path, basically an OR operation if any file exists.
     * @returns The resolved path or undefined when no path is provided.
     */
    static resolve_path_search(path) {
        let paths;
        if ((Array.isArray(path) && vlib.GlobPatternList.is(path)) ||
            (typeof path === "string" && vlib.GlobPattern.is(path))) {
            paths = vlib.Path.glob_sync(path, {
                string: false,
                only_files: true,
                absolute: true,
            });
        }
        else {
            paths = Array.isArray(path) ? path.map(p => new Path(p)) : [new Path(path)];
        }
        if (paths.length === 0) {
            return undefined;
        }
        return paths.find(p => p.exists() && p.is_file());
    }
    /** Construct a unit test package. */
    constructor(config) {
        this.config = config;
    }
    // --------------------------------------------------------------------
    // Executing the package unit tests.
    /**
     * Run the unit tests.
     * @param opts Optional context options to override the current configuration options with.
     * @returns A promise to a boolean indicating whether the unit tests succeeded or not.
     */
    async run(opts) {
        const config = this.config;
        // Optionally override the context.
        const ctx = opts
            ? Package.Context.merge(config.ctx, opts, true)
            : config.ctx;
        // console.log(`Running unit test package with context: ${Color.object(ctx, { max_depth: 2 })}`);
        // Import environment files.
        this.init_env();
        // Initialize the modules.
        await this.init_modules();
        // No modules defined, return false.
        if (Modules.length === 0) {
            throw new Error("No unit test modules defined, add unit tests using the 'vtest.Module.add()` function.");
        }
        // Filter the selected modules.
        const mods = Modules.filter(m => ctx.module == null || ctx.module.match(m.name));
        if (mods.length === 0) {
            // when no module is found, then `ctx.module` was invalid since we already asserted `Modules` is not empty.
            throw new Error(`Module "${ctx.module?.length === 1 ? ctx.module[0] : ctx.module}" was not found, the available modules are: [${Modules.map(i => i.name).join(", ")}]`);
        }
        // If we have a single module then run that module directly,
        // so we can use a diferent indentation style.
        if (mods.length === 1) {
            const res = await mods[0].run(ctx);
            return res.status;
        }
        // Test all modules.
        let succeeded = 0, failed = 0;
        for (const mod of mods) {
            if (ctx.yes) {
                throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
            }
            const res = await mod.run(ctx);
            if (!res.status) {
                return false;
            }
            succeeded += res.succeeded || 0;
            failed += res.failed || 0;
        }
        const prefix = ctx.debug === 0 ? " * " : "";
        if (failed === 0) {
            if (succeeded === 0) {
                console.log(`${Color.red("Error")}: No unit tests are defined.`);
                return false;
            }
            console.log(Color.cyan_bold(`\nExecuted ${mods.length} test modules.`));
            console.log(`${prefix}All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
            return true;
        }
        else {
            console.log(Color.cyan_bold(`\nExecuted ${mods.length} test modules.`));
            console.log(`${prefix}Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
            return false;
        }
    }
    // --------------------------------------------------------------------
    // Other public methods.
    /**
     * List all included files to the console.
     */
    async list_files() {
        const included = await this.parse_includes();
        console.log(`Include patterns: ${this.config.include?.map(i => `\n - ${i}`).join("")}`);
        console.log(`Exclude patterns: ${this.config.exclude?.map(i => `\n - ${i}`).join("")}`);
        console.log(`Found ${included.length} included paths: ${included?.map(i => `\n - ${i}`).join("")}`);
    }
    /**
     * List all included modules to the console.
     */
    async list_modules() {
        await this.init_modules();
        if (Modules.length === 0) {
            console.log(`Available unit test modules: None`);
        }
        else {
            console.log(`Available unit test modules:`);
            for (const mod of Modules) {
                console.log(` * ${mod.name}`);
            }
        }
    }
    /**
     * Reset certain unit test results.
     * @param module The module name to reset the unit tests for.
     * @param ids The unit test ids to reset. Supports glob patterns.
     * @param yes Automatically answer yes to all prompts.
     */
    async reset_unit_tests({ module, target, yes = false, }) {
        await this.init_modules();
        const mod = Modules.find(m => m.name === module);
        if (!mod) {
            throw new Error(`Module "${module}" was not found, the available modules are: [${Modules.map(i => i.name).join(", ")}]`);
        }
        return mod.reset_unit_tests({
            results: new Path(this.config.output),
            target,
            yes,
        });
    }
    // --------------------------------------------------------------------
    // Private methods.
    /** Parse the included files. */
    async parse_includes() {
        if (this.parsed_includes != null)
            return this.parsed_includes;
        if (!this.config.include?.length) {
            throw new Error(`No include patterns defined, please define at least one include pattern in the configuration.`);
        }
        this.parsed_includes = await Path.glob(this.config.include, { exclude: this.config.exclude, string: true });
        return this.parsed_includes;
    }
    parsed_includes = undefined;
    /** Initialize the environment files. */
    init_env() {
        if (this.config.env?.length) {
            const env = typeof this.config.env === "string" ? [this.config.env] : this.config.env;
            for (const e of env) {
                log.raw(`Importing environment file ${e}`);
                vlib.env.from(e);
            }
        }
    }
    /** Parse includes and initialize all unit test modules. */
    async init_modules() {
        if (this.modules_initialized)
            return;
        // List imports paths.
        const included = await this.parse_includes();
        // Import the included unit test modules.
        const imported_paths = new Set();
        for (const p of included) {
            const abs = new Path(p).abs().str();
            if (imported_paths.has(abs)) {
                log.marker(`Skipping already imported unit test module: ${p}`);
                if (typeof this.config.ctx.debug === "number" && this.config.ctx.debug >= 1) {
                    log.marker(`Skipping already imported unit test module: ${p}`);
                }
                continue;
            }
            imported_paths.add(abs);
            if (typeof this.config.ctx.debug === "number" && this.config.ctx.debug >= 1) {
                log.marker(`Importing unit test module: ${p}`);
            }
            await import(abs);
        }
        // Error when no unit tests are defined.
        if (Modules.length === 0) {
            throw new Error("No unit tests defined, add unit tests using the 'vtest.Module.add()` function.");
        }
        // Set flag.
        this.modules_initialized = true;
    }
}
/** Package types. */
(function (Package) {
    /** Types for the context type. */
    let Context;
    (function (Context) {
        /** A validator schema for the context options. */
        Context.Schema = {
            $schema: "any",
            module: { type: ["string", "array"], required: false },
            target: { type: "string", required: false },
            debug: { type: ["string", "number"], required: false },
            yes: { type: "boolean", required: false },
            interactive: { type: "boolean", required: false },
            no_changes: { type: "boolean", required: false },
            stop_on_failure: { type: "boolean", required: false },
            stop_after: { type: "string", required: false },
            refresh: { type: "boolean", required: false },
            repeat: { type: "number", required: false },
            strip_colors: { type: "boolean", required: false },
            /**
             * @warning Keep this not required since this field
             * is often ignored and added more in terms of consistency.
             * Otherwise the `Config.create()` function will need to be updated
             * since that does not expect the `output` field to be required
             * in the `Config.options` field.
             */
            output: { type: "string", required: false },
        };
        /** Create a context object from its input options. */
        function create(opts) {
            const output = new Path(opts.output).abs();
            if (!output.exists() || !output.is_dir()) {
                throw new Error(`Output directory "${opts.output}" does not exist or is not a directory.`);
            }
            return {
                output,
                target: opts.target,
                debug: opts.debug ?? 0,
                yes: opts.yes ?? false,
                interactive: opts.interactive ?? true,
                no_changes: opts.no_changes ?? false,
                stop_on_failure: opts.stop_on_failure ?? false,
                stop_after: opts.stop_after,
                repeat: opts.repeat ?? 0,
                strip_colors: opts.strip_colors ?? false,
                refresh: opts.refresh ?? false,
                module: opts.module ? new vlib.GlobPatternList(opts.module) : undefined,
            };
        }
        Context.create = create;
        /**
         * Merge an additional context object into a current context object.
         * The new context attributes will override the existing ones.
         * @param base The base context object.
         * @param override The context object that will override the base context.
         * @param copy Whether to copy the base context object (true) or update it in place (false).
         * @returns The updated base context object.
         */
        function merge(base, override, copy = true) {
            // Merge.
            if (copy)
                base = { ...base };
            for (const key of Object.keys(override)) {
                if (override[key] === undefined)
                    continue; // skip undefined values.
                base[key] = override[key];
            }
            // Initialize the output path.
            if (typeof base.output === "string") {
                base.output = new Path(base.output).abs();
                if (!base.output.exists() || !base.output.is_dir()) {
                    throw new Error(`Output directory "${base.output}" does not exist or is not a directory.`);
                }
            }
            // Validate potentially overrided props.
            if (base.module != null && base.module instanceof vlib.GlobPatternList === false) {
                base.module = new vlib.GlobPatternList(base.module);
            }
            // Response.
            return base;
        }
        Context.merge = merge;
    })(Context = Package.Context || (Package.Context = {}));
})(Package || (Package = {}));
/** Configuration options. */
export var Config;
(function (Config) {
    ;
    /** Initialize the schema validator. */
    Config.Schema = new vlib.Schema.Validator({
        throw: false,
        unknown: false,
        schema: {
            $schema: "any",
            output: { type: "string", required: true },
            include: {
                type: "array",
                value_schema: { type: "string" },
                required: true,
                preprocess: (v) => typeof v === "string" ? [v] : v,
            },
            exclude: {
                type: "array",
                default: ["**/node_modules/**"],
                value_schema: { type: "string" },
                preprocess: (v) => typeof v === "string" ? [v] : v,
            },
            env: {
                type: "array",
                required: false,
                default: [],
                value_schema: { type: "string" },
                preprocess: (v) => typeof v === "string" ? [v] : v,
            },
            extends: {
                type: ["string", "array"],
                required: false,
            },
            options: {
                type: "object",
                schema: Package.Context.Schema,
                required: false,
            },
        },
    });
    if (process.argv.includes("--vlib-generate-schemas")) {
        vlib.Schema.create_json_schema_sync({
            unknown: false,
            output: `${__root}assets/schemas/vtest.json`,
            schema: Config.Schema.schemas.schema
        });
        log(`Generated JSON schema 'vtest.json' at '${__root}assets/schemas/vtest.json'`);
    }
    /**
     * Load or initialize a new configuration object.
     * @param opts
     *      The configuration options to initialize the configuration object with.
     *      1) The string "__default__" to search & load the default configuration file.
     *      2) A single path or an array with path options to load the configuration from,
     *         note that a path string supports glob patterns.
     *      3) An object type with the configuration options.
     * @param override
     *      An optional object which will be used to override the loaded configuration.
     * @param _exclude
     *      A system exclude set to ignore already included base paths to prevent infinite recursion.
     *      Do not manually pass this parameter, as it is a system parameter
     * @returns The initialized configuration object, or an object with an `error` field.
     */
    function load(opts = "__default__", override, _exclude = new Set()) {
        // Load the options from a file path.
        let config_path = undefined;
        if (typeof opts === "string" || Array.isArray(opts)) {
            let found;
            // Search the config file.
            if (opts === "__default__") {
                found = vlib.cli.find_config_path({
                    name: ["vtest", ".vtest"],
                    extension: ["", ".json", ".jsonc"],
                    up: 1,
                    cwd: process.cwd(),
                });
                if (!found) {
                    return { error: `Could not find a default configuration file named 'vtest.json' in the current working directory "${process.cwd()}" or 1 level above.` };
                }
            }
            else {
                found = Package.resolve_path_search(opts);
                if (!found) {
                    return { error: `No valid configuration file found in the provided path(s): ${typeof opts === "string" ? opts : opts.join(", ")}` };
                }
            }
            // Prevent infinite recursion when the base config is already included.
            if (_exclude.has(found.path)) {
                return { error: `Configuration file '${found.path}' circularly references itself.` };
            }
            _exclude.add(found.path);
            // Found the config file, load the data.
            config_path = found.path;
            const opts_data = found.load_sync({ type: "jsonc" });
            if (!opts_data) {
                return { error: `No valid JSONC data found at config file '${found.path}'` };
            }
            ;
            opts = opts_data;
        }
        // Validate the loaded config.
        const response = Config.Schema.validate(opts, {
            error_prefix: config_path
                ? `Invalid configuration file "${config_path}": `
                : `Invalid configuration object: `,
        });
        if (typeof response.error === "string") {
            return response;
        }
        // Load the base configuration file.
        let base_config = undefined;
        if (response.data.extends) {
            const res = load(response.data.extends, undefined, _exclude);
            if (typeof res === "object" && "error" in res) {
                return res; // return the error object.
            }
            base_config = res;
        }
        // Build context object.
        let ctx_opts;
        if (response.data.options) {
            ctx_opts = response.data.options;
            ctx_opts.output = response.data.output;
        }
        else {
            ctx_opts = { output: response.data.output };
        }
        const ctx = Package.Context.create(ctx_opts);
        // Build the configuration object.
        let config = {
            include: response.data.include,
            exclude: response.data.exclude,
            env: response.data.env,
            extends: response.data.extends,
            ctx: ctx,
            output: ctx.output, // for opts/initialized consistency.
            options: ctx_opts, // for opts/initialized consistency.
        };
        // Merge the base configuration in place.
        if (base_config) {
            config = Config.merge(config, base_config, false);
        }
        // Merge the override configuration in place.
        if (override && Object.keys(override).length > 0) {
            config = Config.merge(config, override, false);
        }
        // Response.
        return config;
    }
    Config.load = load;
    /**
     * Merge an additional configuration object into a current configuration.
     * The new config attributes will override the existing ones.
     * @param base The base configuration object.
     * @param override The configuration object that will override the base configuration.
     * @param copy Whether to copy the base context object (true) or update it in place (false).
     * @returns The updated base configuration object.
     */
    function merge(base, override, copy = true) {
        if (copy)
            base = { ...base };
        for (const key of Object.keys(override)) {
            switch (key) {
                case "include":
                case "exclude":
                case "env":
                    if (!base[key]) {
                        base[key] = [];
                    }
                    else if (copy) {
                        base[key] = [...base[key]];
                    }
                    if (typeof override[key] === "string") {
                        base[key] = [...base[key], override[key]];
                    }
                    else if (Array.isArray(override[key])) {
                        base[key] = [...base[key], ...override[key]];
                    }
                    else {
                        throw new TypeError(`Invalid type for "${key}", expected a string or an array of strings.`);
                    }
                    break;
                case "options":
                    base.ctx = Package.Context.merge(base.ctx, override.options ?? {}, copy);
                    break;
                case "ctx":
                    /**
                     * @warning Dont use field `ctx` also for a `Config` type ...
                     *          the `options` field is kept, and if we would use Package.Context.merge
                     *          on the `ctx` field, then it would override all fields since all fields are required.
                     *          Therefore, overridding the ctx with all default options and ignoring the actual `options`.
                     *          So we use the `options` field instead to correctly merge extended configurations. */
                    break;
                default:
                    if (override[key] === undefined)
                        continue; // skip undefined values.
                    base[key] = override[key];
                    break;
            }
        }
        return base;
    }
    Config.merge = merge;
})(Config || (Config = {}));
//# sourceMappingURL=package.js.map