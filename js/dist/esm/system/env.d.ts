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
     * @param path - The path to the .env file.
     * @param opts.refresh - By default cached files are not reloaded, refresh can be set to true to force a reload.
     */
    function import_file(path: string, opts?: {
        refresh?: boolean;
    }): void;
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
