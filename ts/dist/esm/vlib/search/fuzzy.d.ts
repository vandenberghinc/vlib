/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Inspired by https://github.com/farzher/fuzzysort/blob/master/fuzzysort.js#L450.
 */
/**
 * Module for perform fuzzy searches.
 */
export declare namespace Fuzzy {
    /**
     * {Fuzzy Search}
     *
     * Perform a fuzzy similairity match between a query and an array of targets.
     *
     * @return Returns an array with the targets sorted from best match to lowest match, unless parameter `get_matches` is enabled.
     *
     * @param query The search query.
     * @param targets
     *      The target with target strings.
     *      When the nested items are objects then the parameter `key` should be defined to retrieve the query string.
     *      When the nested items are arrays then the first value of the array will be used as the query string.
     * @param limit Limit the number of results. Define the limit as `null` or `-1` to set no limit.
     * @param case_match When the `case_match` flag is enabled the similairity match is capital sensitive.
     * @param allow_exceeding_chars
     *      Allow matches where the single character count of the search query exceeds that of the single character count of the target.
     *      So when the query is "aa" and the target is "a" then no match will be given since the "a" count of the target (2) is higher than the "a" count of the query (1).
     * @param get_matches When the `get_matches` flag is enabled the function returns an array with nested arrays containing the similairity match `[similairity <number>, <target>]`.
     * @param key The key for the query string when the array's target items are objects. The key may also be an array with keys to use the best match of the key's value.
     * @param nested_key
     *      When the target items are objects and the object may have nested children that also should be searched, then the `nested_key` parameter can be defined to define the key used for the nested children.
     *      The value for the nested key should also be an array of objects and use the same structure for parameter `key`, otherwise it will cause undefined behaviour.
     *      The nested key will be ignored if the nested key does not exist in a target object.
     *
     * @libris
     */
    function search({ query, targets, limit, case_match, allow_exceeding_chars, get_matches, key, nested_key, }: {
        query: string;
        targets?: any[];
        limit?: number;
        case_match?: boolean;
        allow_exceeding_chars?: boolean;
        get_matches?: boolean;
        key?: string | string[] | null;
        nested_key?: string | null;
    }): any[];
    /**
     * {Fuzzy Match}
     *
     * Perform a fuzzy similairity match between a query and a target.
     *
     * @return Returns a floating number indicating the similairity a lower value represents a better match.
     *
     * @param search The search query.
     * @param target The target string.
     * @param allow_exceeding_chars Allow matches where the single character count of the search query exceeds that of the single character count of the target.
     *          So when the query is "aa" and the target is "a" then no match will be given since the "a" count of the target (2) is higher than the "a" count of the query (1).
     *          The function returns `null` when this flag is enabled and detected.
     *
     * @libris
     */
    function match(search: string, target: string, allow_exceeding_chars?: boolean): number | null;
}
export { Fuzzy as fuzzy };
