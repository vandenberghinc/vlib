/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as crypto from 'crypto';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { Color, Colors } from './colors.js';
import { Path } from './path.js';
import { SourceLoc } from '../debugging/source_loc.js';

/*  @docs:
    @chapter: Utils
    @title: Utils
    @desc: The utilities module.
    @parse: false
*/
// @todo convert to namespace.
export class Utils {
    
    /** @docs:
     *  @title: Sleep
     *  @desc: Sleep for an amount of milliseconds.
     *  @param:
     *      @name: msec
     *      @desc: The amount of milliseconds
     *      @type: number
    */
    static async sleep(msec: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, msec))
    }

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
    static debounce(delay: number, func: (...args: any[]) => void): (...args: any[]) => void {
        let timeout: NodeJS.Timeout;
        return function(...args) {
            clearTimeout(timeout);
            // timeout = setTimeout(() => func.apply(this, args), delay);
            timeout = setTimeout(() => func(args), delay);
        };
    }

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
    static format_bytes(value: string | number): string {
        if (typeof value === "string") {
            value = Buffer.byteLength(value, "utf-8");
        }
        if (value > 1024 * 1024 * 1024 * 1024) {
            return `${(value / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
        }
        else if (value > 1024 * 1024 * 1024) {
            return `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;
        }
        else if (value > 1024 * 1024) {
            return `${(value / (1024 * 1024)).toFixed(2)}MB`;
        }
        else if (value > 1024) {
            return `${(value / 1024).toFixed(2)}KB`;
        }
        return `${Math.floor(value as number)}B`;
    }

    /*  @docs:
        @title: Hash
        @descr: Wrapper function to create hashes.
    */
    static hash(data: string | Buffer, algo?: string, format?: crypto.BinaryToTextEncoding): string
    static hash(data: string | Buffer, algo?: string, format?: false): crypto.Hash
    static hash(data: string | Buffer, algo: string = "sha256", format: crypto.BinaryToTextEncoding | false = "hex"): string | crypto.Hash {
        const hash = crypto.createHash(algo);
        hash.update(data)
        if (format) {
            return hash.digest(format);
        }
        return hash;
    }

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
    static fuzzy_search({
        query, 
        targets = [], 
        limit = 25,
        case_match = false,
        allow_exceeding_chars = true,
        get_matches = false,
        key = null, 
        nested_key = null,
    }: {
        query: string;
        targets?: any[];
        limit?: number;
        case_match?: boolean;
        allow_exceeding_chars?: boolean;
        get_matches?: boolean;
        key?: string | string[] | null;
        nested_key?: string | null;
    }): any[] {
        
        // Checks.
        if (query == null) {
            throw Error("Define parameter \"query\".");
        }

        // Vars.
        const is_obj = targets.length > 0 && typeof targets[0] === "object";
        const is_array = targets.length > 0 && Array.isArray(targets[0]);
        if (is_obj && key == null) { key = "query"; }
        const is_key_array = Array.isArray(key);
        const results: any[] = [];
        if (case_match === false) { query = query.toLowerCase(); }

        // Calculate the similairities.
        const calc_sims = (targets: any[] = []) => {
            for (let i = 0; i < targets.length; i++) {
                let match;
                if (is_array) {
                    match = Utils.fuzzy_match(
                        query,
                        // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
                        case_match ? targets[i] : targets[i].toLowerCase(),
                        allow_exceeding_chars
                    );
                    
                } else if (is_obj) {
                    const target = targets[i];
                    if (key) {
                        key = key as string[]
                        let min_match = null;
                        for (let k = 0; k < key.length; k++) {
                            if (target[key[k]] == null) { continue; }
                            match = Utils.fuzzy_match(
                                query, 
                                case_match ? target[key[k]] : target[key[k]].toLowerCase(),
                                allow_exceeding_chars
                            );
                            if (match != null && (min_match === null || match < min_match)) {
                                min_match = match;
                            }
                        }
                        match = min_match;
                    } else {
                        if (target[key as string] == null) { continue; }
                        match = Utils.fuzzy_match(
                            query,
                            case_match ? target[key as string] : target[key as string].toLowerCase(),
                            allow_exceeding_chars
                        );
                    }
                    if (nested_key !== null && target[nested_key] != null) {
                        calc_sims(target[nested_key]);
                    }
                } else {
                    if (targets[i] == null) { continue; }
                    match = Utils.fuzzy_match(
                        query, 
                        // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
                        case_match ? targets[i] : targets[i].toLowerCase(),
                        allow_exceeding_chars
                    );
                }
                if (match !== null) {
                    results.push([match, targets[i]]);
                }
            }
        }

        // Calculate the similairities.
        calc_sims(targets);

        // Sort the results.
        results.sort((a, b) => b[0] - a[0]);

        // Limit the results.
        if (limit !== null && limit >= 0 && results.length > limit) {
            results.length = limit;
        }

        // Convert the results to targets only.
        if (get_matches === false) {
            let converted: any[] = [];
            results.iterate((item) => {
                converted.push(item[1]);
            })
            return converted;
        }

        // Return the results.
        return results;
    }

    // Fuzzy match.
    // Inspired by https://github.com/farzher/fuzzysort/blob/master/fuzzysort.js#L450.
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
    static fuzzy_match(search: string, target: string, allow_exceeding_chars: boolean = true): number | null {
        // Check exceeding chars.
        if (allow_exceeding_chars === false) {
        
            // Exceeding length.
            if (search.length > target.length) {
                return null;
            }

            // Create the target count.
            let text_count = {};
            for (let i = 0; i < target.length; i++) {
                const c = target.charAt(i);
                if (text_count[c] == null) {
                    text_count[c] = 1;
                } else {
                    ++text_count[c];
                }
            }

            // Create the query count.
            let query_count = {};
            for (let i = 0; i < search.length; i++) {
                const c = search.charAt(i);
                if (query_count[c] == null) {
                    query_count[c] = 1;
                } else {
                    ++query_count[c];
                }
                if (text_count[c] == null || query_count[c] > text_count[c]) {
                    return null;
                }
            }
        }

        // Wrappers.
        const get_search_code = (index) => {
            if (index >= 0 && index < search.length) {
                return search.charCodeAt(index);
            }
            return -1;
        };
        const get_target_code = (index) => {
            if (index >= 0 && index < target.length) {
                return target.charCodeAt(index);
            }
            return -1;
        };
        var prepareBeginningIndexes = (target) => {
            var targetLen = target.length
            // var beginningIndexes = [];
            var beginningIndexesLen = 0
            var wasUpper = false
            var wasAlphanum = false
            for(var i = 0; i < targetLen; ++i) {
                var targetCode = target.charCodeAt(i)
                var isUpper = targetCode>=65&&targetCode<=90
                var isAlphanum = isUpper || targetCode>=97&&targetCode<=122 || targetCode>=48&&targetCode<=57
                var isBeginning = isUpper && !wasUpper || !wasAlphanum || !isAlphanum
                wasUpper = isUpper
                wasAlphanum = isAlphanum
                if(isBeginning) beginningIndexes[beginningIndexesLen++] = i
            }
            return beginningIndexes
        }
        var prepareNextBeginningIndexes = (target) => {
            var targetLen = target.length
            var beginningIndexes = prepareBeginningIndexes(target)
            // var nextBeginningIndexes = []; // new Array(targetLen)     sparse array is too slow
            var lastIsBeginning = beginningIndexes[0]
            var lastIsBeginningI = 0
            for(var i = 0; i < targetLen; ++i) {
                if(lastIsBeginning > i) {
                    nextBeginningIndexes[i] = lastIsBeginning
                } else {
                    lastIsBeginning = beginningIndexes[++lastIsBeginningI]
                    nextBeginningIndexes[i] = lastIsBeginning===undefined ? targetLen : lastIsBeginning
                }
            }
            return nextBeginningIndexes
        }

        // Vars.
        let searchI = 0;
        let searchLen = search.length;
        let searchCode = get_search_code(searchI);
        let searchLower = search.toLowerCase();
        let targetI = 0;
        let targetLen = target.length;
        let targetCode = get_target_code(targetI);
        let targetLower = target.toLowerCase();
        let matchesSimple: any[] = [];
        let matchesSimpleLen = 0;
        let successStrict = false
        let matchesStrict: any[] = [];
        let matchesStrictLen = 0
        var beginningIndexes: number[] = []; 
        var nextBeginningIndexes: number[] = [];

        // very basic fuzzy match; to remove non-matching targets ASAP!
        // walk through target. find sequential matches.
        // if all chars aren't found then exit
        for(;;) {
            var isMatch = searchCode === get_target_code(targetI)
            if(isMatch) {
                matchesSimple[matchesSimpleLen++] = targetI
                ++searchI;
                if(searchI === searchLen) break
                searchCode = get_search_code(searchI)
            }
            ++targetI;
            if(targetI >= targetLen) {
                return null
            } // Failed to find searchI
        }

        searchI = 0
        targetI = 0

        // var nextBeginningIndexes = prepared._nextBeginningIndexes
        // if(nextBeginningIndexes === NULL) nextBeginningIndexes = prepared._nextBeginningIndexes = prepareNextBeginningIndexes(prepared.target)
        nextBeginningIndexes = prepareNextBeginningIndexes(target);
        var firstPossibleI = targetI = matchesSimple[0]===0 ? 0 : nextBeginningIndexes[matchesSimple[0]-1];
        // const nextBeginningIndexes = [0];

        // Our target string successfully matched all characters in sequence!
        // Let's try a more advanced and strict test to improve the score
        // only count it as a match if it's consecutive or a beginning character!
        var backtrackCount = 0
        if(targetI !== targetLen) {
            for(;;) {
                if(targetI >= targetLen) {

                    // We failed to find a good spot for this search char, go back to the previous search char and force it forward
                    if(searchI <= 0) break // We failed to push chars forward for a better match

                    ++backtrackCount; if(backtrackCount > 200) break // exponential backtracking is taking too long, just give up and return a bad match

                    --searchI
                    var lastMatch = matchesStrict[--matchesStrictLen]
                    targetI = nextBeginningIndexes[lastMatch]

                } else {
                    var isMatch = get_search_code(searchI) === get_target_code(targetI)
                    if(isMatch) {
                        matchesStrict[matchesStrictLen++] = targetI
                        ++searchI; if(searchI === searchLen) { successStrict = true; break }
                        ++targetI
                    } else {
                        targetI = nextBeginningIndexes[targetI]
                    }
                }
            }
        }

        // check if it's a substring match
        var substringIndex = targetLower.indexOf(searchLower, matchesSimple[0]); // perf: this is slow
        var isSubstring = ~substringIndex;
        if(isSubstring && !successStrict) { // rewrite the indexes from basic to the substring
            for(var i=0; i<matchesSimpleLen; ++i) {
                matchesSimple[i] = substringIndex+i
            }
        }
        var isSubstringBeginning = false;
        if(isSubstring) {
            isSubstringBeginning = nextBeginningIndexes[substringIndex-1] === substringIndex
        }


        // tally up the score & keep track of matches for highlighting later
        {
            if(successStrict) { var matchesBest = matchesStrict; var matchesBestLen = matchesStrictLen }
            else { var matchesBest = matchesSimple; var matchesBestLen = matchesSimpleLen }

            var score = 0

            var extraMatchGroupCount = 0
            for(var i = 1; i < searchLen; ++i) {
                if(matchesBest[i] - matchesBest[i-1] !== 1) {
                    score -= matchesBest[i]; 
                    ++extraMatchGroupCount
                }
            }
            var unmatchedDistance = matchesBest[searchLen-1] - matchesBest[0] - (searchLen-1)

            score -= (12+unmatchedDistance) * extraMatchGroupCount // penality for more groups

            if(matchesBest[0] !== 0) score -= matchesBest[0]*matchesBest[0]*.2 // penality for not starting near the beginning

            if(!successStrict) {
                score *= 1000
            } else {
            
                // successStrict on a target with too many beginning indexes loses points for being a bad target
                var uniqueBeginningIndexes = 1
                // @ts-ignore
                for(var i = nextBeginningIndexes[0]; i < targetLen; i=nextBeginningIndexes[i]) {
                    ++uniqueBeginningIndexes
                }

                if(uniqueBeginningIndexes > 24) score *= (uniqueBeginningIndexes-24)*10 // quite arbitrary numbers here ...
            }

            if(isSubstring)          score /= 1+searchLen*searchLen*1; // bonus for being a full substring
            if(isSubstringBeginning) score /= 1+searchLen*searchLen*1; // bonus for substring starting on a beginningIndex

            score -= targetLen - searchLen; // penality for longer targets
            // prepared.score = score

            // for(var i = 0; i < matchesBestLen; ++i) prepared._indexes[i] = matchesBest[i]
            // prepared._indexes.len = matchesBestLen
            return score
        }
    }
    /* Pre TS func
    fuzzy_match(search: string, target: string, allow_exceeding_chars: boolean = true): number | null {
        // Check exceeding chars.
        if (allow_exceeding_chars === false) {
        
            // Exceeding length.
            if (search.length > target.length) {
                return null;
            }

            // Create the target count.
            let text_count = {};
            for (let i = 0; i < target.length; i++) {
                const c = target.charAt(i);
                if (text_count[c] == null) {
                    text_count[c] = 1;
                } else {
                    ++text_count[c];
                }
            }

            // Create the query count.
            let query_count = {};
            for (let i = 0; i < search.length; i++) {
                const c = search.charAt(i);
                if (query_count[c] == null) {
                    query_count[c] = 1;
                } else {
                    ++query_count[c];
                }
                if (text_count[c] == null || query_count[c] > text_count[c]) {
                    return null;
                }
            }
        }

        // Wrappers.
        const get_search_code = (index) => {
            if (index >= 0 && index < search.length) {
                return search.charCodeAt(index);
            }
            return -1;
        };
        const get_target_code = (index) => {
            if (index >= 0 && index < target.length) {
                return target.charCodeAt(index);
            }
            return -1;
        };
        var prepareBeginningIndexes = (target) => {
            var targetLen = target.length
            var beginningIndexes = []; var beginningIndexesLen = 0
            var wasUpper = false
            var wasAlphanum = false
            for(var i = 0; i < targetLen; ++i) {
                var targetCode = target.charCodeAt(i)
                var isUpper = targetCode>=65&&targetCode<=90
                var isAlphanum = isUpper || targetCode>=97&&targetCode<=122 || targetCode>=48&&targetCode<=57
                var isBeginning = isUpper && !wasUpper || !wasAlphanum || !isAlphanum
                wasUpper = isUpper
                wasAlphanum = isAlphanum
                if(isBeginning) beginningIndexes[beginningIndexesLen++] = i
            }
            return beginningIndexes
        }
        var prepareNextBeginningIndexes = (target) => {
            var targetLen = target.length
            var beginningIndexes = prepareBeginningIndexes(target)
            var nextBeginningIndexes = []; // new Array(targetLen)     sparse array is too slow
            var lastIsBeginning = beginningIndexes[0]
            var lastIsBeginningI = 0
            for(var i = 0; i < targetLen; ++i) {
                if(lastIsBeginning > i) {
                    nextBeginningIndexes[i] = lastIsBeginning
                } else {
                    lastIsBeginning = beginningIndexes[++lastIsBeginningI]
                    nextBeginningIndexes[i] = lastIsBeginning===undefined ? targetLen : lastIsBeginning
                }
            }
            return nextBeginningIndexes
        }

        // Vars.
        let searchI = 0;
        let searchLen = search.length;
        let searchCode = get_search_code(searchI);
        let searchLower = search.toLowerCase();
        let targetI = 0;
        let targetLen = target.length;
        let targetCode = get_target_code(targetI);
        let targetLower = target.toLowerCase();
        let matchesSimple = [];
        let matchesSimpleLen = 0;
        let successStrict = false
        let matchesStrict = [];
        let matchesStrictLen = 0

        // very basic fuzzy match; to remove non-matching targets ASAP!
        // walk through target. find sequential matches.
        // if all chars aren't found then exit
        for(;;) {
            var isMatch = searchCode === get_target_code(targetI)
            if(isMatch) {
                matchesSimple[matchesSimpleLen++] = targetI
                ++searchI;
                if(searchI === searchLen) break
                searchCode = get_search_code(searchI)
            }
            ++targetI;
            if(targetI >= targetLen) {
                return null
            } // Failed to find searchI
        }

        searchI = 0
        targetI = 0

        // var nextBeginningIndexes = prepared._nextBeginningIndexes
        // if(nextBeginningIndexes === NULL) nextBeginningIndexes = prepared._nextBeginningIndexes = prepareNextBeginningIndexes(prepared.target)
        nextBeginningIndexes = prepareNextBeginningIndexes(target);
        var firstPossibleI = targetI = matchesSimple[0]===0 ? 0 : nextBeginningIndexes[matchesSimple[0]-1];
        // const nextBeginningIndexes = [0];

        // Our target string successfully matched all characters in sequence!
        // Let's try a more advanced and strict test to improve the score
        // only count it as a match if it's consecutive or a beginning character!
        var backtrackCount = 0
        if(targetI !== targetLen) {
            for(;;) {
                if(targetI >= targetLen) {

                    // We failed to find a good spot for this search char, go back to the previous search char and force it forward
                    if(searchI <= 0) break // We failed to push chars forward for a better match

                    ++backtrackCount; if(backtrackCount > 200) break // exponential backtracking is taking too long, just give up and return a bad match

                    --searchI
                    var lastMatch = matchesStrict[--matchesStrictLen]
                    targetI = nextBeginningIndexes[lastMatch]

                } else {
                    var isMatch = get_search_code(searchI) === get_target_code(targetI)
                    if(isMatch) {
                        matchesStrict[matchesStrictLen++] = targetI
                        ++searchI; if(searchI === searchLen) { successStrict = true; break }
                        ++targetI
                    } else {
                        targetI = nextBeginningIndexes[targetI]
                    }
                }
            }
        }

        // check if it's a substring match
        var substringIndex = targetLower.indexOf(searchLower, matchesSimple[0]); // perf: this is slow
        var isSubstring = ~substringIndex;
        if(isSubstring && !successStrict) { // rewrite the indexes from basic to the substring
            for(var i=0; i<matchesSimpleLen; ++i) {
                matchesSimple[i] = substringIndex+i
            }
        }
        var isSubstringBeginning = false;
        if(isSubstring) {
            isSubstringBeginning = nextBeginningIndexes[substringIndex-1] === substringIndex
        }


        // tally up the score & keep track of matches for highlighting later
        {
            if(successStrict) { var matchesBest = matchesStrict; var matchesBestLen = matchesStrictLen }
            else { var matchesBest = matchesSimple; var matchesBestLen = matchesSimpleLen }

            var score = 0

            var extraMatchGroupCount = 0
            for(var i = 1; i < searchLen; ++i) {
                if(matchesBest[i] - matchesBest[i-1] !== 1) {
                    score -= matchesBest[i]; 
                    ++extraMatchGroupCount
                }
            }
            var unmatchedDistance = matchesBest[searchLen-1] - matchesBest[0] - (searchLen-1)

            score -= (12+unmatchedDistance) * extraMatchGroupCount // penality for more groups

            if(matchesBest[0] !== 0) score -= matchesBest[0]*matchesBest[0]*.2 // penality for not starting near the beginning

            if(!successStrict) {
                score *= 1000
            } else {
            
                // successStrict on a target with too many beginning indexes loses points for being a bad target
                var uniqueBeginningIndexes = 1
                // @ts-ignore
                for(var i = nextBeginningIndexes[0]; i < targetLen; i=nextBeginningIndexes[i]) {
                    ++uniqueBeginningIndexes
                }

                if(uniqueBeginningIndexes > 24) score *= (uniqueBeginningIndexes-24)*10 // quite arbitrary numbers here ...
            }

            if(isSubstring)          score /= 1+searchLen*searchLen*1; // bonus for being a full substring
            if(isSubstringBeginning) score /= 1+searchLen*searchLen*1; // bonus for substring starting on a beginningIndex

            score -= targetLen - searchLen; // penality for longer targets
            // prepared.score = score

            // for(var i = 0; i < matchesBestLen; ++i) prepared._indexes[i] = matchesBest[i]
            // prepared._indexes.len = matchesBestLen
            return score
        }
    },
    */


    static _npm_package_version_cache = new Map<string, string>();
    /** Load the version from a npm package.json or any other json file that has a `version: string` attribute. */
    static load_npm_package_version(package_json_path: string, def: string = "1.0.0") {
        if (Utils._npm_package_version_cache.has(package_json_path)) {
            return Utils._npm_package_version_cache.get(package_json_path);
        }
        const p = new Path(package_json_path);
        if (!p.exists()) {
            throw new Error(`Version file "${p.abs().str()}" does not exist.`);
        }
        const version = p.load_sync({ type: "object" }).version ?? def;
        Utils._npm_package_version_cache.set(package_json_path, version);
        return version;
    }

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
    static __dirname(import_meta: {url: string}): string {
        return dirname(fileURLToPath(import_meta.url));
    }    
    static __filename(import_meta: { url: string }): string {
        return fileURLToPath(import_meta.url);
    }    

    /** Safe exit with a traceable log message and status code */
    static safe_exit(code: number = 1, message?: string) {
        const id = new SourceLoc(1).abs_id;
        if (message) {
            console.log(Color.red(">>>"), message)
        }
        console.log(`${Color.red_bold("Warning")}: Safe exit requested from ${Color.bold(id)}, exiting process with exit status ${Color.bold(code.toString())}.`);
        process.exit(code);
    }

    // ---------------------------------------------------------------------------
    // DEPRECATED


    /** @docs
     * @deprecated use the `logging/Logger` module instead. 
     *  @title: print
     *  @desc Print arguments to console without inserting spaces
     *  @param args Arguments to print
     */
    static print(...args: any[]): void {
        console.log(args.join(""));
    }

    /** @docs
     * @deprecated use the `logging/Logger` module instead. 
     *  @title: printe
     *  @desc Print arguments to console error without inserting spaces
     *  @param args Arguments to print
     */
    static printe(...args: any[]): void {
        console.error(args.join(""));
    }

    /** @docs
     * @deprecated use the `logging/Logger` module instead. 
     *  @title: print_marker
     *  @desc Print text with a blue marker prefix
     *  @param args Arguments to print
     */
    static print_marker(...args: any[]): void {
        Utils.print(Colors.blue, ">>> ", Colors.end, ...args);
    }

    /** @docs
     * @deprecated use the `logging/Logger` module instead. 
     *  @title: print_warning
     *  @desc Print text with a yellow warning prefix
     *  @param args Arguments to print
     */
    static print_warning(...args: any[]): void {
        Utils.print(Colors.yellow, ">>> ", Colors.end, ...args);
    }

    /**
     * @deprecated use the `logging/Logger` module instead. 
     * @docs
     *  @title: print_error
     *  @desc Print text with a red error prefix to stderr
     *  @param args Arguments to print
     */
    static print_error(...args: any[]): void {
        Utils.printe(Colors.red, ">>> ", Colors.end, ...args);
    }

    /** @docs:
     * @deprecated use vlib.Objects.deep_copy instead.
     *  @title: Deep copy
     *  @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
     */
    static deep_copy(obj: any): any {
        if (Array.isArray(obj)) {
            const copy: any[] = [];
            obj.iterate((item) => {
                copy.append(Utils.deep_copy(item));
            })
            return copy;
        }
        else if (obj !== null && obj instanceof String) {
            return new String(obj.toString());
        }
        else if (obj !== null && typeof obj === "object") {
            const copy = {};
            const keys = Object.keys(obj);
            const values = Object.values(obj);
            for (let i = 0; i < keys.length; i++) {
                try {
                    copy[keys[i]] = Utils.deep_copy(values[i]);
                } catch (err: any) {
                    if (err.message.startsWith("Unable to copy attribute")) {
                        throw err;
                    }
                    err.message = `Unable to copy attribute "${keys[i]}": ${err.message}.`;
                    throw err;
                }
            }
            return copy;
        }
        else {
            return obj;
        }
    }

};
export { Utils as utils}