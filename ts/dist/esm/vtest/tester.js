/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import pkg from 'js-beautify';
const { js: beautify } = pkg;
// Imports.
import { Color, Colors, logger, Path } from "../vlib/index.js";
import * as vlib from "../vlib/index.js";
import { modules } from './module.js';
// -----------------------------------------------------------------
// Perform the unit tests.
export class Tester {
    /**
     * The initialized configuration object.
     */
    config;
    /**
     * Construct a tester instance.
     * Loads the configuration from the provided file path or object.
     */
    constructor(config) {
        // Parse config from file path.
        let config_path;
        if (typeof config.base === "string") {
            config.base = [config.base];
        }
        if (Array.isArray(config.base)) {
            // Parse glob patterns.
            if (config.base.some(vlib.GlobPattern.is)) {
                config.base = vlib.Path.glob_sync(config.base, {
                    string: true,
                    only_files: true,
                    absolute: true,
                });
            }
            // Try to load the config from the provided paths.
            let data;
            for (const p of config.base) {
                if (typeof p !== "string") {
                    throw new TypeError(`Invalid config path "${p}", expected a string or an array of strings.`);
                }
                if (Path.exists(p)) {
                    data = vlib.jsonc.load_sync(p);
                    config_path = p;
                    break;
                }
            }
            if (!data) {
                throw new Error(`No valid config file found in the provided paths: ${config.base.join(", ")}`);
            }
            // Validate the loaded config.
            this.config = vlib.scheme.validate(data, {
                throw: true,
                unknown: false,
                scheme: Tester.config_scheme,
                err_prefix: `Invalid vtest configuration file "${config_path ?? "[object]"}": `,
            });
            // Merge the new options.
            this.merge(config);
        }
        // Parse config from object.
        else {
            this.config = vlib.scheme.validate(config, {
                throw: true,
                unknown: false,
                scheme: Tester.config_scheme,
                err_prefix: `Invalid vtest configuration file "${config_path ?? "[object]"}": `,
            });
        }
    }
    /**
     * Merge an additional configuration object into the current configuration.
     * The new attributes override the existing ones.
     * @param config The configuration object to merge.
     */
    merge(config) {
        for (const key of Object.keys(config)) {
            if (key !== "base") {
                this.config[key] = config[key];
            }
        }
    }
    /** Run the unit tests. */
    async run() {
        const config = this.config;
        // Import environment files.
        if (config.env?.length) {
            const env = typeof config.env === "string" ? [config.env] : config.env;
            for (const e of env) {
                if (config.debug >= 1)
                    logger.marker(`Importing environment file ${e}`);
                vlib.env.from(e);
            }
        }
        // List imports paths.
        if (!config.include?.length) {
            console.log(config);
            throw new Error(`No include patterns defined, please define at least one include pattern in the configuration.`);
        }
        const included = await Path.glob(config.include, { exclude: config.exclude, string: true });
        // Dump the included paths and exit.
        if (config.list_files) {
            console.log(`Include patterns: ${config.include?.map(i => `\n - ${i}`).join("")}`);
            console.log(`Exclude patterns: ${config.exclude?.map(i => `\n - ${i}`).join("")}`);
            console.log(`Found ${included.length} included paths: ${included?.map(i => `\n - ${i}`).join("")}`);
            return true;
        }
        // Import the included unit test modules.
        for (const p of included) {
            if (typeof config.debug === "number" && config.debug >= 1) {
                logger.marker(`Importing unit test module: ${p}`);
            }
            await import(new Path(p).abs().str());
        }
        // List modules.
        if (config.list_modules) {
            if (modules.length === 0) {
                console.log(`Available unit test modules: None`);
            }
            else {
                console.log(`Available unit test modules:`);
                for (const mod of modules) {
                    console.log(` * ${mod.name}`);
                }
            }
            return true;
        }
        // Error when no unit tests are defined.
        if (modules.length === 0) {
            console.log(`${Color.red("Error")}: No unit tests defined, add unit tests using the add() function.`);
            return false;
        }
        // Check results dir.
        const results_dir = new Path(config.results);
        if (!results_dir.exists()) {
            throw new Error(`Cache directory "${config.results}" does not exist.`);
        }
        else if (!results_dir.is_dir()) {
            throw new Error(`Cache path "${config.results}" is not a directory.`);
        }
        // Test target module or only a single module defined.
        if (config.module != null || modules.length === 1) {
            const mod = modules.find(m => config.module == null || m.name === config.module);
            if (!mod) {
                throw new Error(`Module "${config.module}" was not found, the available modules are: [${modules.map(i => i.name).join(", ")}]`);
            }
            const res = await mod._run({
                target: config.target,
                stop_on_failure: config.stop_on_failure,
                stop_after: config.stop_after,
                debug: config.debug,
                interactive: config.interactive,
                cache: results_dir,
                yes: config.yes,
                repeat: config.repeat,
                no_changes: config.no_changes,
                refresh: config.refresh,
            });
            return res.status;
        }
        // Test all modules.
        let succeeded = 0, failed = 0;
        for (const mod of modules) {
            if (config.yes) {
                throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
            }
            const res = await mod._run({
                target: config.target,
                stop_on_failure: config.stop_on_failure,
                stop_after: config.stop_after,
                debug: config.debug,
                interactive: config.interactive,
                cache: results_dir,
                yes: config.yes,
                repeat: config.repeat,
                no_changes: config.no_changes,
                refresh: config.refresh,
            });
            if (!res.status) {
                return false;
            }
            succeeded += res.succeeded || 0;
            failed += res.failed || 0;
        }
        const prefix = config.debug === 0 ? " * " : "";
        if (failed === 0) {
            if (succeeded === 0) {
                console.log(`${Color.red("Error")}: No unit tests are defined.`);
                return false;
            }
            console.log(Color.cyan_bold(`\nExecuted ${modules.length} test modules.`));
            console.log(`${prefix}All ${failed + succeeded} unit tests ${Colors.green}${Colors.bold}passed${Colors.end} successfully.`);
            return true;
        }
        else {
            console.log(Color.cyan_bold(`\nExecuted ${modules.length} test modules.`));
            console.log(`${prefix}Encountered ${failed === 0 ? Colors.green : Colors.red}${Colors.bold}${failed}${Colors.end} failed unit tests.`);
            return false;
        }
    }
}
/** Tester types. */
(function (Tester) {
    /**
     * The config validator scheme.
     */
    Tester.config_scheme = {
        include: {
            type: "array",
            default: ["**/unit_tests/**/*.js", "**/tests/**/*.js"],
            value_scheme: { type: "string" },
        },
        exclude: {
            type: "array",
            default: ["**/node_modules/**"],
            value_scheme: { type: "string" },
        },
        results: { type: "string", default: ".vtest_results" },
        module: { type: "string", required: false },
        target: { type: "string", required: false },
        stop_on_failure: { type: "boolean", default: false },
        stop_after: { type: "string", required: false },
        debug: { type: ["number", "string"], default: 0 },
        interactive: { type: "boolean", default: false },
        yes: { type: "boolean", default: false },
        repeat: { type: "number", default: 1, min: 1, max: 1000 },
        no_changes: { type: "boolean", default: false },
        refresh: { type: ["boolean", "string"], default: false },
        env: {
            type: ["array", "string"], // Also accept single string type for config files.
            required: false,
            default: [],
            value_scheme: { type: "string" },
        },
        list_files: { type: "boolean", default: false },
        list_modules: { type: "boolean", default: false },
        base: {
            type: ["string", "array"],
            required: false,
        },
    };
})(Tester || (Tester = {}));
//# sourceMappingURL=tester.js.map