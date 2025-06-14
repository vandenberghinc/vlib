/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Color, Colors, log, Path } from "../vlib/index.js";
import * as vlib from "../vlib/index.js";
import { Module, Modules } from './module.js';
/** Configuration options. */
export var Config;
(function (Config) {
    ;
    /** Initialize the schema validator. */
    Config.Schema = new vlib.Schema.Validator({
        throw: true,
        unknown: false,
        schema: {
            output: {
                type: "string",
                required: true,
            },
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
            base: {
                type: ["string", "array"],
                required: false,
            },
            strip_colors: {
                type: ["boolean"],
                required: false,
            },
        },
    });
})(Config || (Config = {}));
// -----------------------------------------------------------------
/**
 * The unit test package class.
 * Responsible for executing managing its included modules and unit tests.
 */
export class Package {
    /**
     * The initialized configuration object.
     */
    // config: ReturnType<typeof this.validator.validate>;
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
    /**
     * Construct a unit test package.
     * Loads the configuration from the provided file path or object.
     */
    constructor(config) {
        // Parse config from file path.
        let config_path;
        if (typeof config.extends === "string") {
            config.extends = [config.extends];
        }
        if (Array.isArray(config.extends)) {
            // Load the base file.
            const found = Package.resolve_path_search(config.extends);
            if (!found) {
                throw new Error(`No valid configuration file found in the provided paths: ${config.extends.join(", ")}`);
            }
            const base_data = found.load_sync({ type: "jsonc" });
            if (!base_data) {
                throw new Error(`No valid data found at config file: ${found.path}`);
            }
            // @todo not resolving the base's extends attribute here.
            // Validate the loaded config.
            this.config = Config.Schema.validate(base_data, {
                error_prefix: `Invalid base configuration file "${found.path}": `,
            });
            // Merge the new options.
            this.merge(config);
        }
        // Parse config from object.
        else {
            this.config = Config.Schema.validate(config, {
                error_prefix: `Invalid vtest configuration file "${config_path ?? "[object]"}": `,
            });
        }
        // Check output dir.
        const output_dir = new Path(config.output);
        if (!output_dir.exists()) {
            throw new Error(`Output directory "${config.output}" does not exist.`);
        }
        else if (!output_dir.is_dir()) {
            throw new Error(`Output path "${config.output}" is not a directory.`);
        }
    }
    /**
     *
     */
    /**
     * Try to load a package by input file or if omitted by searching for a default configuration file.
     * If no input paths are provided, this function will search for a configuration file
     * like 'vtest.json', '.vtest.json' etc. in the current working directory or 1 level above.
     * @throw An error when no configuration file is found.
     * @param inputs The input file path(s) to load the configuration from.
     *               If not provided, the function will search for a default configuration file.
     * @param override An optional object to override the loaded configuration.
     */
    static async from_file(inputs, override = {}) {
        let data;
        // Load from input paths.
        if (inputs) {
            const found = Package.resolve_path_search(inputs);
            if (!found) {
                throw new Error(`No valid configuration file found in the provided paths: ${Array.isArray(inputs) ? inputs.join(", ") : inputs}`);
            }
            data = found.load_sync({ type: "jsonc" });
            if (!data) {
                throw new Error(`Invalid configuration file data at ${found.path}`);
            }
        }
        // Load the default configuration file.
        else {
            const found = vlib.cli.find_config_path({
                name: ["vtest", ".vtest"],
                extension: ["", ".json", ".jsonc"],
                up: 1,
                cwd: process.cwd(),
            });
            if (!found) {
                throw new Error(`No default configuration file found, please provide a configuration file or use the 'extends' option to load a base configuration.`);
            }
            // Try to load the config from the provided paths.
            data = await found.load({ type: "jsonc" });
            if (!data) {
                throw new Error(`No valid config file found in the current working directory "${process.cwd()}" or 1 level above.`);
            }
        }
        // Response.
        if (!data) {
            throw new Error(`Unable to load configuration data from the provided paths or default configuration file.`);
        }
        return new Package({
            ...data,
            ...override,
        });
    }
    /**
     * Merge an additional configuration object into the current configuration.
     * The new attributes override the existing ones.
     * @param config The configuration object to merge.
     */
    merge(config) {
        for (const key of Object.keys(config)) {
            switch (key) {
                case "include":
                case "exclude":
                case "env":
                    if (!this.config[key]) {
                        this.config[key] = [];
                    }
                    if (typeof config[key] === "string") {
                        this.config[key] = [...this.config[key], config[key]];
                    }
                    else if (Array.isArray(config[key])) {
                        this.config[key] = [...this.config[key], ...config[key]];
                    }
                    else {
                        throw new TypeError(`Invalid type for "${key}", expected a string or an array of strings.`);
                    }
                    break;
                default:
                    this.config[key] = config[key];
            }
        }
    }
    /** Run the unit tests. */
    async run(opts) {
        const config = this.config;
        // Import environment files.
        this.init_env();
        // List imports paths, before initializing the modules.
        const included = await this.parse_includes();
        // Initialize the modules.
        await this.init_modules();
        // Check output dir, checked in the constructor.
        const output_dir = new Path(config.output);
        // Test target module or only a single module defined.
        if (opts.module != null || Modules.length === 1) {
            const mod = Modules.find(m => opts.module == null || m.name === opts.module);
            if (!mod) {
                throw new Error(`Module "${opts.module}" was not found, the available modules are: [${Modules.map(i => i.name).join(", ")}]`);
            }
            const res = await mod.run(Module.Context.create({ output: output_dir, ...opts }));
            return res.status;
        }
        // Test all modules.
        let succeeded = 0, failed = 0;
        for (const mod of Modules) {
            if (opts.yes) {
                throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
            }
            const res = await mod.run(Module.Context.create({ output: output_dir, ...opts }));
            if (!res.status) {
                return false;
            }
            succeeded += res.succeeded || 0;
            failed += res.failed || 0;
        }
        const prefix = opts.debug === 0 ? " * " : "";
        if (failed === 0) {
            if (succeeded === 0) {
                console.log(`${Color.red("Error")}: No unit tests are defined.`);
                return false;
            }
            console.log(Color.cyan_bold(`\nExecuted ${Modules.length} test modules.`));
            console.log(`${prefix}All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
            return true;
        }
        else {
            console.log(Color.cyan_bold(`\nExecuted ${Modules.length} test modules.`));
            console.log(`${prefix}Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
            return false;
        }
    }
    /**
     * Reset unit tests.
     */
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
        if (!this.config.include?.length) {
            throw new Error(`No include patterns defined, please define at least one include pattern in the configuration.`);
        }
        return Path.glob(this.config.include, { exclude: this.config.exclude, string: true });
    }
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
        const config = this.config;
        // List imports paths.
        const included = await this.parse_includes();
        // Import the included unit test modules.
        const imported_paths = new Set();
        for (const p of included) {
            const abs = new Path(p).abs().str();
            if (imported_paths.has(abs)) {
                log.marker(`Skipping already imported unit test module: ${p}`);
                if (typeof config.debug === "number" && config.debug >= 1) {
                    log.marker(`Skipping already imported unit test module: ${p}`);
                }
                continue;
            }
            imported_paths.add(abs);
            if (typeof config.debug === "number" && config.debug >= 1) {
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
//# sourceMappingURL=package.js.map