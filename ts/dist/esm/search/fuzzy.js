/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Inspired by https://github.com/farzher/fuzzysort/blob/master/fuzzysort.js#L450.
 */
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
export function search({ query, targets = [], limit = 25, case_match = false, allow_exceeding_chars = true, get_matches = false, key = null, nested_key = null, }) {
    // Checks.
    if (query == null) {
        throw Error("Define parameter \"query\".");
    }
    // Vars.
    const is_obj = targets.length > 0 && typeof targets[0] === "object";
    const is_array = targets.length > 0 && Array.isArray(targets[0]);
    if (is_obj && key == null) {
        key = "query";
    }
    const is_key_array = Array.isArray(key);
    const results = [];
    if (case_match === false) {
        query = query.toLowerCase();
    }
    // Calculate the similairities.
    const calc_sims = (targets = []) => {
        for (let i = 0; i < targets.length; i++) {
            let match;
            if (is_array) {
                match = globalThis.match(query, 
                // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
                case_match ? targets[i] : targets[i].toLowerCase(), allow_exceeding_chars);
            }
            else if (is_obj) {
                const target = targets[i];
                if (key) {
                    key = key;
                    let min_match = null;
                    for (let k = 0; k < key.length; k++) {
                        if (target[key[k]] == null) {
                            continue;
                        }
                        match = globalThis.match(query, case_match ? target[key[k]] : target[key[k]].toLowerCase(), allow_exceeding_chars);
                        if (match != null && (min_match === null || match < min_match)) {
                            min_match = match;
                        }
                    }
                    match = min_match;
                }
                else {
                    if (target[key] == null) {
                        continue;
                    }
                    match = globalThis.match(query, case_match ? target[key] : target[key].toLowerCase(), allow_exceeding_chars);
                }
                if (nested_key !== null && target[nested_key] != null) {
                    calc_sims(target[nested_key]);
                }
            }
            else {
                if (targets[i] == null) {
                    continue;
                }
                match = globalThis.match(query, 
                // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
                case_match ? targets[i] : targets[i].toLowerCase(), allow_exceeding_chars);
            }
            if (match !== null) {
                results.push([match, targets[i]]);
            }
        }
    };
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
        let converted = [];
        results.iterate((item) => {
            converted.push(item[1]);
        });
        return converted;
    }
    // Return the results.
    return results;
}
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
export function match(search, target, allow_exceeding_chars = true) {
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
            }
            else {
                ++text_count[c];
            }
        }
        // Create the query count.
        let query_count = {};
        for (let i = 0; i < search.length; i++) {
            const c = search.charAt(i);
            if (query_count[c] == null) {
                query_count[c] = 1;
            }
            else {
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
        var targetLen = target.length;
        // var beginningIndexes = [];
        var beginningIndexesLen = 0;
        var wasUpper = false;
        var wasAlphanum = false;
        for (var i = 0; i < targetLen; ++i) {
            var targetCode = target.charCodeAt(i);
            var isUpper = targetCode >= 65 && targetCode <= 90;
            var isAlphanum = isUpper || targetCode >= 97 && targetCode <= 122 || targetCode >= 48 && targetCode <= 57;
            var isBeginning = isUpper && !wasUpper || !wasAlphanum || !isAlphanum;
            wasUpper = isUpper;
            wasAlphanum = isAlphanum;
            if (isBeginning)
                beginningIndexes[beginningIndexesLen++] = i;
        }
        return beginningIndexes;
    };
    var prepareNextBeginningIndexes = (target) => {
        var targetLen = target.length;
        var beginningIndexes = prepareBeginningIndexes(target);
        // var nextBeginningIndexes = []; // new Array(targetLen)     sparse array is too slow
        var lastIsBeginning = beginningIndexes[0];
        var lastIsBeginningI = 0;
        for (var i = 0; i < targetLen; ++i) {
            if (lastIsBeginning > i) {
                nextBeginningIndexes[i] = lastIsBeginning;
            }
            else {
                lastIsBeginning = beginningIndexes[++lastIsBeginningI];
                nextBeginningIndexes[i] = lastIsBeginning === undefined ? targetLen : lastIsBeginning;
            }
        }
        return nextBeginningIndexes;
    };
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
    let successStrict = false;
    let matchesStrict = [];
    let matchesStrictLen = 0;
    var beginningIndexes = [];
    var nextBeginningIndexes = [];
    // very basic fuzzy match; to remove non-matching targets ASAP!
    // walk through target. find sequential matches.
    // if all chars aren't found then exit
    for (;;) {
        var isMatch = searchCode === get_target_code(targetI);
        if (isMatch) {
            matchesSimple[matchesSimpleLen++] = targetI;
            ++searchI;
            if (searchI === searchLen)
                break;
            searchCode = get_search_code(searchI);
        }
        ++targetI;
        if (targetI >= targetLen) {
            return null;
        } // Failed to find searchI
    }
    searchI = 0;
    targetI = 0;
    // var nextBeginningIndexes = prepared._nextBeginningIndexes
    // if(nextBeginningIndexes === NULL) nextBeginningIndexes = prepared._nextBeginningIndexes = prepareNextBeginningIndexes(prepared.target)
    nextBeginningIndexes = prepareNextBeginningIndexes(target);
    var firstPossibleI = targetI = matchesSimple[0] === 0 ? 0 : nextBeginningIndexes[matchesSimple[0] - 1];
    // const nextBeginningIndexes = [0];
    // Our target string successfully matched all characters in sequence!
    // Let's try a more advanced and strict test to improve the score
    // only count it as a match if it's consecutive or a beginning character!
    var backtrackCount = 0;
    if (targetI !== targetLen) {
        for (;;) {
            if (targetI >= targetLen) {
                // We failed to find a good spot for this search char, go back to the previous search char and force it forward
                if (searchI <= 0)
                    break; // We failed to push chars forward for a better match
                ++backtrackCount;
                if (backtrackCount > 200)
                    break; // exponential backtracking is taking too long, just give up and return a bad match
                --searchI;
                var lastMatch = matchesStrict[--matchesStrictLen];
                targetI = nextBeginningIndexes[lastMatch];
            }
            else {
                var isMatch = get_search_code(searchI) === get_target_code(targetI);
                if (isMatch) {
                    matchesStrict[matchesStrictLen++] = targetI;
                    ++searchI;
                    if (searchI === searchLen) {
                        successStrict = true;
                        break;
                    }
                    ++targetI;
                }
                else {
                    targetI = nextBeginningIndexes[targetI];
                }
            }
        }
    }
    // check if it's a substring match
    var substringIndex = targetLower.indexOf(searchLower, matchesSimple[0]); // perf: this is slow
    var isSubstring = ~substringIndex;
    if (isSubstring && !successStrict) { // rewrite the indexes from basic to the substring
        for (var i = 0; i < matchesSimpleLen; ++i) {
            matchesSimple[i] = substringIndex + i;
        }
    }
    var isSubstringBeginning = false;
    if (isSubstring) {
        isSubstringBeginning = nextBeginningIndexes[substringIndex - 1] === substringIndex;
    }
    // tally up the score & keep track of matches for highlighting later
    {
        if (successStrict) {
            var matchesBest = matchesStrict;
            var matchesBestLen = matchesStrictLen;
        }
        else {
            var matchesBest = matchesSimple;
            var matchesBestLen = matchesSimpleLen;
        }
        var score = 0;
        var extraMatchGroupCount = 0;
        for (var i = 1; i < searchLen; ++i) {
            if (matchesBest[i] - matchesBest[i - 1] !== 1) {
                score -= matchesBest[i];
                ++extraMatchGroupCount;
            }
        }
        var unmatchedDistance = matchesBest[searchLen - 1] - matchesBest[0] - (searchLen - 1);
        score -= (12 + unmatchedDistance) * extraMatchGroupCount; // penality for more groups
        if (matchesBest[0] !== 0)
            score -= matchesBest[0] * matchesBest[0] * .2; // penality for not starting near the beginning
        if (!successStrict) {
            score *= 1000;
        }
        else {
            // successStrict on a target with too many beginning indexes loses points for being a bad target
            var uniqueBeginningIndexes = 1;
            // @ts-ignore
            for (var i = nextBeginningIndexes[0]; i < targetLen; i = nextBeginningIndexes[i]) {
                ++uniqueBeginningIndexes;
            }
            if (uniqueBeginningIndexes > 24)
                score *= (uniqueBeginningIndexes - 24) * 10; // quite arbitrary numbers here ...
        }
        if (isSubstring)
            score /= 1 + searchLen * searchLen * 1; // bonus for being a full substring
        if (isSubstringBeginning)
            score /= 1 + searchLen * searchLen * 1; // bonus for substring starting on a beginningIndex
        score -= targetLen - searchLen; // penality for longer targets
        // prepared.score = score
        // for(var i = 0; i < matchesBestLen; ++i) prepared._indexes[i] = matchesBest[i]
        // prepared._indexes.len = matchesBestLen
        return score;
    }
}
//# sourceMappingURL=fuzzy.js.map