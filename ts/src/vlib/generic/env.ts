/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import * as Scheme from '../schema/index.m.node.js';

/**
 * Manages loading, caching, and syncing of environment variables.
 */
export namespace Env {
    

    /**
     * Supported environment variable types.
     */
    export type EnvType =
        | 'string'
        | 'number'
        | 'boolean'
        | 'object'
        | 'array'
        | 'string_array'
        | 'number_array'
        | 'boolean_array';

    /**
    * Options for retrieving a typed environment variable.
    * @todo apply cast from arg/scheme modules or new infer
    */
    export interface GetOptions {
        name: string;
        type?: EnvType | EnvType[];
        throw?: boolean;
    }

    /**
     * Environment variable cache.
     * This is a map of environment variable names to their values.
     */
    export const map: Map<string, string> = new Map();
    for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) { map.set(key, value); }
    }

    /**
     * Loaded dotenv file paths.
     */
    const loaded_dotenvs = new Set<string>();

    /**
     * Import a dotenv file path.
     * This joins all found environment variables into the current environment.
     * @param path - The path to the .env file.
     * @param opts.refresh - By default cached files are not reloaded, refresh can be set to true to force a reload.
     * @param opts.override - When true, existing environment variables will be overridden by those in the .env file.
     */
    export function from(
        path: string,
        opts: { refresh?: boolean, override?: boolean } = { refresh: false, override: true }
    ): void {

        // Check cache.
        if (loaded_dotenvs.has(path) && !opts.refresh) {
            return;
        }

        // Load .env file into process.env if it exists
        if (fs.existsSync(path)) {
            const result = config({ path: path, override: opts.override });
            if (result.error) {
                throw result.error;
            }
            // console.log("Result:", result);
        } else {
            throw new Error(`Environment file '${path}' does not exist.`);
        }

        // Add to loaded dotenvs
        loaded_dotenvs.add(path);

        // Cache all current process.env entries
        for (const [key, value] of Object.entries(process.env)) {
            if (value !== undefined) {
                // console.log("Adding to map:", key, value);
                map.set(key, value);
            }
        }
    }
    export const import_file = from; // Alias for compatibility

    /**
     * Check whether an environment variable is set.
     */
    export function has(name: string): boolean {
        return map.has(name);
    }

    /**
     * Retrieve an environment variable.
     * Optionally with type parsing, and error throwing on undefined.
     */
    export function get<T = string>(name: string): string | undefined;
    export function get<T = string>(name: string, throw_err: true): string;
    export function get<T = string>(name: string, type: GetOptions['type']): string;
    export function get<T>(options: GetOptions & { throw: true }): string | T;
    export function get<T>(options: GetOptions & { throw?: false, type: NonNullable<GetOptions['type']> }): T | undefined;
    export function get<T>(options: GetOptions & { throw: true,   type: NonNullable<GetOptions['type']> }): T;
    export function get<T>(...args: any[]): string | T | undefined {

        // Init arguments.
        let name: string;
        let types: EnvType | EnvType[] | undefined;
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
            } else {
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
            } else if (typeof second === 'object' && second !== null) {
                // Object - so name + options.
                types = second.type;
                throw_err = second.throw ?? false;
            } else {
                throw new Error(`Invalid second argument, expected boolean or options object, not ${Scheme.value_type(second)}`);
            }
        }
        else {
            // Invalid arguments.
            throw new Error(`Invalid arguments length (${args.length}), expected 1 or 2.`);
        }

        // Check if the environment variable is set.
        if (!map.has(name)) {
            if (throw_err) {
                throw new Error(`Environment variable '${name}' is not defined.`);
            }
            return undefined;
        }

        // Get value.
        const raw_value = map.get(name)!;
        if (!types) {
            return raw_value;
        }

        // Parse type.
        return parse_typed_value(raw_value, types);
    }

    /**
     * Set or update an environment variable (both in cache and in process.env).
     */
    export function set(name: string, value: any): void {
        const string_value =
            typeof value === 'string' ? value : JSON.stringify(value);
        map.set(name, string_value);
        process.env[name] = string_value;
    }

    /**
     * Parse a raw string into one or more EnvType definitions.
     * Throws on type mismatch.
     */
    function parse_typed_value(
        value: string,
        types: EnvType | EnvType[]
    ): any {
        const try_parse = (type: EnvType): any => {
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
                    if (lower === 'true') return true;
                    if (lower === 'false') return false;
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
                        if (t === 'true') return true;
                        if (t === 'false') return false;
                        throw new Error(`Element '${v}' is not a valid boolean.`);
                    });
                case "array":
                case 'object':
                    try {
                        return JSON.parse(value);
                    } catch (err) {
                        throw new Error(`Value is not a valid JSON object: ${err}`);
                    }
                default:
                    throw new Error(`Unsupported type '${type}'.`);
            }
        };

        if (Array.isArray(types)) {
            const errors: Error[] = [];
            for (const t of types) {
                try {
                    return try_parse(t);
                } catch (err) {
                    errors.push(err as Error);
                }
            }
            throw new Error(
                `Value '${value}' does not match any of types [${types.join(
                    ', '
                )}]: ${errors.map(e => e.message).join('; ')}`
            );
        }

        return try_parse(types);
    }
}
export { Env as env };// env.ts
