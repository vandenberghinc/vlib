/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Manages loading, caching, and syncing of environment variables.
 */
export declare namespace Env {
    /**
     * Supported environment variable types.
     */
    type EnvType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'string_array' | 'number_array' | 'boolean_array';
    /**
    * Options for retrieving a typed environment variable.
    * @todo apply cast from arg/scheme modules or new infer
    */
    interface GetOptions {
        name: string;
        type?: EnvType | EnvType[];
        throw?: boolean;
    }
    /**
     * Environment variable cache.
     * This is a map of environment variable names to their values.
     */
    const map: Map<string, string>;
    /**
     * Import a dotenv file path.
     * This joins all found environment variables into the current environment.
     * @param path - The path to the .env file.
     * @param opts.refresh - By default cached files are not reloaded, refresh can be set to true to force a reload.
     * @param opts.override - When true, existing environment variables will be overridden by those in the .env file.
     */
    function from(path: string, opts?: {
        refresh?: boolean;
        override?: boolean;
    }): void;
    const import_file: typeof from;
    /**
     * Check whether an environment variable is set.
     */
    function has(name: string): boolean;
    /**
     * Retrieve an environment variable.
     * Optionally with type parsing, and error throwing on undefined.
     */
    function get<T = string>(name: string): string | undefined;
    function get<T = string>(name: string, throw_err: true): string;
    function get<T = string>(name: string, type: GetOptions['type']): string;
    function get<T>(options: GetOptions & {
        throw: true;
    }): string | T;
    function get<T>(options: GetOptions & {
        throw?: false;
        type: NonNullable<GetOptions['type']>;
    }): T | undefined;
    function get<T>(options: GetOptions & {
        throw: true;
        type: NonNullable<GetOptions['type']>;
    }): T;
    /**
     * Set or update an environment variable (both in cache and in process.env).
     */
    function set(name: string, value: any): void;
}
export { Env as env };
