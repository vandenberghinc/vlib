/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as crypto from 'crypto';
export declare class Utils {
    /** @docs:
     *  @title: Sleep
     *  @desc: Sleep for an amount of milliseconds.
     *  @param:
     *      @name: msec
     *      @desc: The amount of milliseconds
     *      @type: number
    */
    static sleep(msec: number): Promise<void>;
    /** @docs
     *  @title: Edit object keys
     *  @desc: Edit object keys - DEPRECATED BUT STILL USED
     *  @param
     *      @name obj
     *      @desc The object to modify
     *      @type Record<string, any>
     *  @param
     *      @name rename
     *      @desc Array of [old_key, new_key] pairs
     *      @type [string, string][]
     *  @param
     *      @name remove
     *      @desc Array of keys to remove
     *      @type string[]
     */
    static rename_attributes(obj?: Record<string, any>, rename?: [string, string][], remove?: string[]): Record<string, any>;
    /** @docs
     *  @title: Debounce
     *  @desc: Create a debounced version of a function
     *  @param
     *      @name delay
     *      @desc Delay in milliseconds
     *      @type number
     *  @param
     *      @name func
     *      @desc Function to debounce
     *      @type Function
     */
    static debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void;
    /** @docs:
     *  @title: Deep copy
     *  @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
     */
    static deep_copy(obj: any): any;
    /** @docs
     *  @title: Prompt
     *  @desc: Prompt a question from the user
     *  @param
     *      @name question
     *      @desc The question to display
     *      @type string
     *  @returns
     *      @type Promise<string>
     *      @desc The user's response
     */
    static prompt(question: string): Promise<string>;
    /** @docs
     *  @title: Format bytes
     *  @desc: Format a byte size to human readable string
     *  @param
     *      @name value
     *      @desc The value in bytes or a string to get byte length of
     *      @type string | number
     *  @returns
     *      @type string
     *      @desc Formatted string (e.g., "1.5MB")
     */
    static format_bytes(value: string | number): string;
    static hash(data: string | Buffer, algo?: string, format?: crypto.BinaryToTextEncoding): string;
    static hash(data: string | Buffer, algo?: string, format?: false): crypto.Hash;
    /** @docs:
     * @title: Fuzzy Search
     * @description:
     *     Perform a fuzzy similairity match between a query and an array of targets.
     * @type: number
     * @return:
     *     Returns an array with the targets sorted from best match to lowest match, unless parameter `get_matches` is enabled.
     * @param:
     *     @name: query
     *     @description: The search query.
     *     @type: string
     * @param:
     *     @name: targets
     *     @description:
     *         The target with target strings.
     *         When the nested items are objects then the parameter `key` should be defined to retrieve the query string.
     *         When the nested items are arrays then the first value of the array will be used as the query string.
     *     @type: array[string, object, array]
     * @param:
     *     @name: limit
     *     @description: Limit the number of results. Define the limit as `null` or `-1` to set no limit.
     *     @type: number
     * @param:
     *     @name: case_match
     *     @description:
     *         When the `case_match` flag is enabled the similairity match is capital sensitive.
     *     @type: boolean
     * @param:
     *     @name: allow_exceeding_chars
     *     @description:
     *         Allow matches where the single character count of the search query exceeds that of the single character count of the target.
     *         So when the query is "aa" and the target is "a" then no match will be given since the "a" count of the target (2) is higher than the "a" count of the query (1).
     *     @type: boolean
     * @param:
     *     @name: get_matches
     *     @description:
     *         When the `get_matches` flag is enabled the function returns an array with nested arrays containing the similairity match `[similairity <number>, <target>]`.
     *     @type: boolean
     * @param:
     *     @name: key
     *     @description: The key for the query string when the array's target items are objects. The key may also be an array with keys to use the best match of the key's value.
     *     @type: string, array[string]
     * @param:
     *     @name: nested_key
     *     @description:
     *         When the target items are objects and the object may have nested children that also should be searched, then the `nested_key` parameter can be defined to define the key used for the nested children.
     *         The value for the nested key should also be an array of objects and use the same structure for parameter `key`, otherwise it will cause undefined behaviour.
     *         The nested key will be ignored if the nested key does not exist in a target object.
     *     @type: string
     */
    static fuzzy_search({ query, targets, limit, case_match, allow_exceeding_chars, get_matches, key, nested_key, }: {
        query: string;
        targets?: any[];
        limit?: number;
        case_match?: boolean;
        allow_exceeding_chars?: boolean;
        get_matches?: boolean;
        key?: string | string[] | null;
        nested_key?: string | null;
    }): any[];
    /** @docs:
     *  @nav: JS
     *  @chapter: Utils
     *  @title: Fuzzy Match
     *  @description:
     *      Perform a fuzzy similairity match between a query and a target.
     *  @type: number
     *  @return:
     *      Returns a floating number indicating the similairity a lower value represents a better match.
     *  @param:
     *      @name: search
     *      @description: The search query.
     *      @type: string
     *  @param:
     *      @name: target
     *      @description: The target string.
     *      @type: string
     *  @param:
     *      @name: allow_exceeding_chars
     *      @description:
     *          Allow matches where the single character count of the search query exceeds that of the single character count of the target.
     *          So when the query is "aa" and the target is "a" then no match will be given since the "a" count of the target (2) is higher than the "a" count of the query (1).
     *          The function returns `null` when this flag is enabled and detected.
     *      @type: boolean
     */
    static fuzzy_match(search: string, target: string, allow_exceeding_chars?: boolean): number | null;
    static _npm_package_version_cache: Map<string, string>;
    /** Load the version from a npm package.json or any other json file that has a `version: string` attribute. */
    static load_npm_package_version(package_json_path: string, def?: string): any;
    /**
     * Get __dirname from `import` for ESM modules.
     * @title: Get __dirname
     * @desc Get __dirname from `import` for ESM modules.
     * @warning This function should only be used in ESM modules.
     * @param:
     *     @name: _import
     *     @descr: The default `import` variable for ESM modules.
     * @example:
     * ```ts
     * const __dirname = vlib.Utils.__dirname(import.meta);
     * ```
     * @deprecated use import.meta.dirname node20+.
     * @libris
     */
    static __dirname(import_meta: {
        url: string;
    }): string;
    static __filename(import_meta: {
        url: string;
    }): string;
    /** Safe exit with a traceable log message and status code */
    static safe_exit(code?: number, message?: string): void;
    /** @docs
     * @deprecated use the `logging/Logger` module instead.
     *  @title: print
     *  @desc Print arguments to console without inserting spaces
     *  @param args Arguments to print
     */
    static print(...args: any[]): void;
    /** @docs
     * @deprecated use the `logging/Logger` module instead.
     *  @title: printe
     *  @desc Print arguments to console error without inserting spaces
     *  @param args Arguments to print
     */
    static printe(...args: any[]): void;
    /** @docs
     * @deprecated use the `logging/Logger` module instead.
     *  @title: print_marker
     *  @desc Print text with a blue marker prefix
     *  @param args Arguments to print
     */
    static print_marker(...args: any[]): void;
    /** @docs
     * @deprecated use the `logging/Logger` module instead.
     *  @title: print_warning
     *  @desc Print text with a yellow warning prefix
     *  @param args Arguments to print
     */
    static print_warning(...args: any[]): void;
    /**
     * @deprecated use the `logging/Logger` module instead.
     * @docs
     *  @title: print_error
     *  @desc Print text with a red error prefix to stderr
     *  @param args Arguments to print
     */
    static print_error(...args: any[]): void;
}
export { Utils as utils };
export default Utils;
