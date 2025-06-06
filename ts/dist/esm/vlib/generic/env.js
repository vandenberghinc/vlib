/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import fs from 'fs';
import { config } from 'dotenv';
import * as Scheme from '../scheme/index.m.uni.js';
/**
 * Manages loading, caching, and syncing of environment variables.
 */
export var Env;
(function (Env) {
    /**
     * Environment variable cache.
     * This is a map of environment variable names to their values.
     */
    Env.map = new Map();
    for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
            Env.map.set(key, value);
        }
    }
    /**
     * Loaded dotenv file paths.
     */
    const loaded_dotenvs = new Set();
    /**
     * Import a dotenv file path.
     * This joins all found environment variables into the current environment.
     * @param path - The path to the .env file.
     * @param opts.refresh - By default cached files are not reloaded, refresh can be set to true to force a reload.
     */
    function from(path, opts = { refresh: false }) {
        // Check cache.
        if (loaded_dotenvs.has(path) && !opts.refresh) {
            return;
        }
        // Load .env file into process.env if it exists
        if (fs.existsSync(path)) {
            const result = config({ path: path });
            if (result.error) {
                throw result.error;
            }
            // console.log("Result:", result);
        }
        else {
            throw new Error(`Environment file '${path}' does not exist.`);
        }
        // Add to loaded dotenvs
        loaded_dotenvs.add(path);
        // Cache all current process.env entries
        for (const [key, value] of Object.entries(process.env)) {
            if (value !== undefined) {
                // console.log("Adding to map:", key, value);
                Env.map.set(key, value);
            }
        }
    }
    Env.from = from;
    Env.import_file = from; // Alias for compatibility
    /**
     * Check whether an environment variable is set.
     */
    function has(name) {
        return Env.map.has(name);
    }
    Env.has = has;
    function get(...args) {
        // Init arguments.
        let name;
        let types;
        let throw_err = false;
        if (args.length === 1) {
            // Single argument.
            const param = args[0];
            if (typeof param === 'string') {
                // Single name argument.
                name = param;
            }
            else if (typeof param === 'object' && param !== null) {
                // Single options argument.
                name = param.name;
                types = param.type;
                throw_err = param.throw ?? false;
            }
            else {
                throw new Error(`Invalid argument, expected string or options object, not ${Scheme.value_type(param)}`);
            }
        }
        else if (args.length === 2) {
            // Two arguments - name + throw err.
            name = args[0];
            const second = args[1];
            if (second === true) {
                // Boolean - so throw error.
                throw_err = true;
            }
            else if (typeof second === 'object' && second !== null) {
                // Object - so name + options.
                types = second.type;
                throw_err = second.throw ?? false;
            }
            else {
                throw new Error(`Invalid second argument, expected boolean or options object, not ${Scheme.value_type(second)}`);
            }
        }
        else {
            // Invalid arguments.
            throw new Error(`Invalid arguments length (${args.length}), expected 1 or 2.`);
        }
        // Check if the environment variable is set.
        if (!Env.map.has(name)) {
            if (throw_err) {
                throw new Error(`Environment variable '${name}' is not defined.`);
            }
            return undefined;
        }
        // Get value.
        const raw_value = Env.map.get(name);
        if (!types) {
            return raw_value;
        }
        // Parse type.
        return parse_typed_value(raw_value, types);
    }
    Env.get = get;
    /**
     * Set or update an environment variable (both in cache and in process.env).
     */
    function set(name, value) {
        const string_value = typeof value === 'string' ? value : JSON.stringify(value);
        Env.map.set(name, string_value);
        process.env[name] = string_value;
    }
    Env.set = set;
    /**
     * Parse a raw string into one or more EnvType definitions.
     * Throws on type mismatch.
     */
    function parse_typed_value(value, types) {
        const try_parse = (type) => {
            switch (type) {
                case 'string':
                    return value;
                case 'number':
                    const num = Number(value);
                    if (isNaN(num)) {
                        throw new Error(`Value '${value}' is not a valid number.`);
                    }
                    return num;
                case 'boolean':
                    const lower = value.toLowerCase();
                    if (lower === 'true')
                        return true;
                    if (lower === 'false')
                        return false;
                    throw new Error(`Value '${value}' is not a valid boolean.`);
                case 'string_array':
                    return value.split(',').map(v => v.trim());
                case 'number_array':
                    return value.split(',').map(v => {
                        const n = Number(v.trim());
                        if (isNaN(n)) {
                            throw new Error(`Element '${v}' is not a valid number.`);
                        }
                        return n;
                    });
                case 'boolean_array':
                    return value.split(',').map(v => {
                        const t = v.trim().toLowerCase();
                        if (t === 'true')
                            return true;
                        if (t === 'false')
                            return false;
                        throw new Error(`Element '${v}' is not a valid boolean.`);
                    });
                case "array":
                case 'object':
                    try {
                        return JSON.parse(value);
                    }
                    catch (err) {
                        throw new Error(`Value is not a valid JSON object: ${err}`);
                    }
                default:
                    throw new Error(`Unsupported type '${type}'.`);
            }
        };
        if (Array.isArray(types)) {
            const errors = [];
            for (const t of types) {
                try {
                    return try_parse(t);
                }
                catch (err) {
                    errors.push(err);
                }
            }
            throw new Error(`Value '${value}' does not match any of types [${types.join(', ')}]: ${errors.map(e => e.message).join('; ')}`);
        }
        return try_parse(types);
    }
})(Env || (Env = {}));
export { Env as env }; // env.ts
//# sourceMappingURL=env.js.map