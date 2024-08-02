/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Utils.

/*  @docs:
    @chapter: Utils
    @title: Utils
    @name: vlib.utils
    @desc: The utilities module.
    @parse: false
*/
vlib.utils = {};

/*  @docs:
    @title: Sleep
    @desc: Sleep for an amout of milliseconds.
    @param:
        @name: msec
        @desc: The amount of milliseconds
        @type: number
*/
vlib.utils.sleep = async function(msec) {
    return new Promise((resolve) => setTimeout(resolve, msec))
}

// Edit object keys.
// DEPRECATED BUT STILL USED.
vlib.utils.edit_obj_keys = (obj = {}, rename = [["old", "new"]], remove = []) => {
    remove.iterate((key) => {
        delete obj[key];
    })
    rename.iterate((key) => {
        obj[key[1]] = obj[key[0]];
        delete obj[key[0]];
    })
    return obj;
}

// Verify that a variable is an object, if not error will be thrown.
/*
vlib.utils.verify_array = function(name, array) {
    if (Array.isArray(array) === false) {
        throw new Error(`Parameter "${name}" should be a defined value of type "object".`);
    }
}
*/

// Verify that a variable is an object and verify its attrs attributes, if not an error will be thrown.
// Attributes are defined like `{ "myattr": {type: "string", default: null}}`.
/*
vlib.utils.verify_object = function(
    obj,
    name = "obj", 
    attrs = {}
) {
    if (this == null || typeof obj !== "object" || Array.isArray(obj)) {
        throw new Error(`Parameter "${name}" should be a defined value of type "object".`);
    }
    attrs.iterate((item) => {
        const value = obj[item[key]];
        if (value === undefined) {
            if (item.def) {
                obj[item[key]] = item.def;
                return null;
            }
            throw new Error(`Parameter "${name}.${item[key]}" should be a defined value of type "${item.type}".`);
        }
        else if (
            item.type === "array" && Array.isArray(value) === false ||
            item.type !== typeof obj[item[key]] ||
            value == null && item.type === "object"
        ) {
            throw new Error(`Parameter "${name}.${item[key]}" should be a defined value of type "${item.type}".`);
        }
    })
}
*/

// @deprecated transition to verify_scheme, 
//   1 different params
//   2 returns `object` instead of `params` when `throw_err` is `false`.
//   3 also renamed nested scheme attribute `attributes` to `scheme`.
vlib.utils.verify_params = function({
    params = {},
    info = {},
    check_unknown = false,
    parent = "",
    error_prefix = "",
    throw_err = true
}) {
    const params_keys = Object.keys(params);
    // if (params_keys.length == 0) { // always check so defaults will be filled even if params is {}.
    // }
    const scheme_keys = Object.keys(info);

    // Throw an error and pop the verify_params from the stacktrace.
    const throw_err_h = (e, field) => {
        const invalid_fields = {};
        invalid_fields[field] = e;
        if (throw_err === false) {
            return {error: e, invalid_fields, params: null};
        }
        const error = new Error(e);
        // let stack = error.stack.split("\n");
        // stack = [stack[0], ...stack.slice(3)];
        // error.stack = stack.join("\n");
        error.json = {error: e, invalid_fields, params: null};
        throw error;
    }

    // Get type error string.
    const type_error_str = (scheme_item, prefix = " of type ") => {
        let type_error_str = "";
        if (Array.isArray(scheme_item.type)) {
            type_error_str = prefix;
            for (let i = 0; i < scheme_item.type.length; i++) {
                type_error_str += `"${scheme_item.type[i]}"`
                if (i === scheme_item.type.length - 2) {
                    type_error_str += " or "
                } else if (i < scheme_item.type.length - 2) {
                    type_error_str += ", "
                }
            }
            type_error_str;
        } else {
            type_error_str = `${prefix}"${scheme_item.type}"`
        }
        return type_error_str;
    }

    // Check type of the parameter function.
    // Scheme key may also be an index for when params is an array.
    const check_type = (scheme_item, scheme_key, type) => {
        switch (type) {
            case "null":
                return params[scheme_key] == null;
            case "array":
                if (Array.isArray(params[scheme_key]) === false) {
                    return false;
                }
                return true;
            case "object":
                if (typeof params[scheme_key] !== "object" || params[scheme_key] == null) {
                    return false;
                }
                if (scheme_item.attributes !== undefined) {
                    let child_parent = `${parent}${scheme_key}.`;
                    try {
                        params[scheme_key] = vlib.utils.verify_params({
                            params: params[scheme_key],
                            info: scheme_item.attributes,
                            check_unknown,
                            parent: child_parent,
                            error_prefix,
                            throw_err: true,
                        });
                    } catch (e) {
                        if (!throw_err && e.json) {
                            return e.json;
                        } else {
                            throw e;
                        }
                    }
                }
                return true;
            default:
                if (type !== typeof params[scheme_key]) {
                    return false;
                }
                return true;
        }
    }

    // When params is an array.
    if (Array.isArray(params)) {

        // Use the scheme as a scheme item for the entire array.
        const scheme_item = scheme; 

        // Iterate array.
        for (let index = 0; index < params.length; i++) {
            
            // Do a type check.
            if (scheme_item.type && scheme_item.type !== "any") {

                // Skip when value is `null` and default is `null`.
                if (!(scheme_item.default == null && params[index] == null)) {

                    // Multiple types supported.
                    if (Array.isArray(scheme_item.type)) {
                        let correct_type = false;
                        for (let i = 0; i < scheme_item.type.length; i++) {
                            const res = check_type(scheme_item, index, scheme_item.type[i]);
                            if (typeof res === "object") { // json error.
                                return res;
                            }
                            else if (res === true) {
                                correct_type = true;
                                break;
                            }
                        }
                        if (correct_type === false) {
                            const field = `${parent}${index}`;
                            const current_type = vlib.utils.value_type(params[index]);
                            return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
                        }
                    }

                    // Single type supported.
                    else {
                        const res = check_type(scheme_item, index, scheme_item.type);
                        if (typeof res === "object") { // json error.
                            return res;
                        }
                        else if (res === false) {
                            const field = `${parent}${index}`;
                            const current_type = vlib.utils.value_type(params[index]);
                            return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
                        }
                    }
                }
            }

            // Do the callback check.
            if (scheme_item.callback) {
                const err = scheme_item.callback(params[index], params);
                if (err) {
                    return throw_err_h(`${error_prefix}${err}`, `${parent}${index}`);
                }
            }
        }
    }

    // When params is an object.
    else {

        // Iterate all info params to check if any params are missing.
        for (let scheme_index = 0; scheme_index < scheme_keys.length; scheme_index++) {
            const scheme_key = scheme_keys[scheme_index];
            let scheme_item;

            // Convert info item into object.
            if (typeof info[scheme_key] === "string") {
                info[scheme_key] = {type: info[scheme_key]}; // for subsequent requests, useful for vweb restapi callback.
                scheme_item = info[scheme_key];
            } else {
                scheme_item = info[scheme_key];
            }

            // Rename aliases "def" and "attrs".
            if (scheme_item.def) {
                scheme_item.default = scheme_item.def;
                delete scheme_item.def;
            }
            if (scheme_item.attrs) {
                scheme_item.attributes = scheme_item.attrs;
                delete scheme_item.attrs;
            }
        

            // Parameter is not found in passed params.
            if (scheme_key in params === false) {

                // Not required.

                // Set default.
                if (scheme_item.default !== undefined) {
                    params[scheme_key] = scheme_item.default;
                }

                // Required unless specified otherwise.
                else {
                    if (scheme_item.required === false) {
                        continue;
                    }
                    else if (typeof item.required === "function") {
                        const required = item.required(params);
                        if (required) {
                            const field = `${parent}${scheme_key}`;
                            return throw_err_h(`${error_prefix}Parameter "${field}" should be a defined value${type_error_str(scheme_item)}.`, field);
                        }
                    } else {
                        const field = `${parent}${scheme_key}`;
                        return throw_err_h(`${error_prefix}Parameter "${field}" should be a defined value${type_error_str(scheme_item)}.`, field);
                    }
                }

                // Continue.
                continue;
            }

            // Do a type check on an already existing parameter.
            else if (scheme_item.type && scheme_item.type !== "any") {

                // Skip when value is `null` and default is `null`.
                if (!(scheme_item.default == null && params[scheme_key] == null)) {

                    // Multiple types supported.
                    if (Array.isArray(scheme_item.type)) {
                        let correct_type = false;
                        for (let i = 0; i < scheme_item.type.length; i++) {
                            const res = check_type(scheme_item, scheme_key, scheme_item.type[i]);
                            if (typeof res === "object") { // json error.
                                return res;
                            }
                            else if (res === true) {
                                correct_type = true;
                                break;
                            }
                        }
                        if (correct_type === false) {
                            const field = `${parent}${scheme_key}`;
                            const current_type = vlib.utils.value_type(params[scheme_key]);
                            return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
                        }
                    }

                    // Single type supported.
                    else {
                        const res = check_type(scheme_item, scheme_key, scheme_item.type);
                        if (typeof res === "object") { // json error.
                            return res;
                        }
                        else if (res === false) {
                            const field = `${parent}${scheme_key}`;
                            const current_type = vlib.utils.value_type(params[scheme_key]);
                            return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item, "")}.`, field);
                        }
                    }
                }
            }

            // Do the callback check.
            if (scheme_item.callback) {
                const err = scheme_item.callback(params[scheme_key], params);
                if (err) {
                    return throw_err_h(`${error_prefix}${err}`, `${parent}${scheme_key}`);
                }
            }
        }

        // Iterate all params to check if there are any undefined params passed.
        if (check_unknown) {
            for (let x = 0; x < params_keys.length; x++) {
                if (params_keys[x] in info === false) {
                    const field = `${parent}${params_keys[x]}`;
                    return throw_err_h(`${error_prefix}Parameter "${field}" is not a valid parameter.`, field);
                }
            }
        }
    }

    // Return when no throw err.
    if (throw_err === false) {
        return {error: null, invalid_fields: {}, params};
    }
    return params;
}


// Perform a deep copy on any type, except it does not support classes, only primitive objects.
/*  @docs:
    @title: Deep copy
    @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
 */
vlib.utils.deep_copy = (obj) => {
    if (Array.isArray(obj)) {
        const copy = [];
        obj.iterate((item) => {
            copy.append(vlib.utils.deep_copy(item));
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
                copy[keys[i]] = vlib.utils.deep_copy(values[i]);
            } catch (err) {
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

// Prompt a question.
vlib.prompt = async function(question) {
    return new Promise((resolve, reject) => {
        const interface = readlinelib.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        // Listen for the SIGINT event emitted on pressing Ctrl+C
        interface.on('SIGINT', () => {
            interface.close(); // Close the readline interface
            reject(new Error("Interrupted by user [SIGINT]."));
        });
        try {
            interface.question(question, (name) => {
                interface.close();
                resolve(name);
            });
        } catch (e) {
            reject(e);
        }
    })
}

// Get a value type for error dumpings.
// @deprecated: moved to vlib.scheme.value_type
vlib.utils.value_type = function (value) {
    if (value == null) { return "null"; } // for both undefined and null.
    else if (typeof value === "object" && Array.isArray(value)) { return "array"; }
    else { return typeof value; }
}

// Format bytes
vlib.utils.format_bytes = function (value) {
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
    return `${parseInt(value)}B`;
}

/*  @docs:
    @title: Hash
    @descr: Wrapper function to create hashes.
*/
vlib.utils.hash = (data, algo = "sha256", format = "hex") => {
    const hash = libcrypto.createHash(algo);
    hash.update(data)
    if (format) {
        return hash.digest(format);
    }
    return hash;
}
// Fuzzy search.
/*  @docs:
    @title: Fuzzy Search
    @description:
        Perform a fuzzy similairity match between a query and an array of targets.
    @type: number
    @return:
        Returns an array with the targets sorted from best match to lowest match, unless parameter `get_matches` is enabled.
    @param:
        @name: query
        @description: The search query.
        @type: string
    @param:
        @name: targets
        @description: 
            The target with target strings.
            When the nested items are objects then the parameter `key` should be defined to retrieve the query string.
            When the nested items are arrays then the first value of the array will be used as the query string.
        @type: array[string, object, array]
    @param:
        @name: limit
        @description: Limit the number of results. Define the limit as `null` or `-1` to set no limit.
        @type: number
    @param:
        @name: case_match
        @description:
            When the `case_match` flag is enabled the similairity match is capital sensitive.
        @type: boolean
    @param:
        @name: allow_exceeding_chars
        @description: 
            Allow matches where the single character count of the search query exceeds that of the single character count of the target.
            So when the query is "aa" and the target is "a" then no match will be given since the "a" count of the target (2) is higher than the "a" count of the query (1).
        @type: boolean
    @param:
        @name: get_matches
        @description:
            When the `get_matches` flag is enabled the function returns an array with nested arrays containing the similairity match `[similairity <number>, <target>]`.
        @type: boolean
    @param:
        @name: key
        @description: The key for the query string when the array's target items are objects. The key may also be an array with keys to use the best match of the key's value.
        @type: string, array[string]
    @param:
        @name: nested_key
        @description:
            When the target items are objects and the object may have nested children that also should be searched, then the `nested_key` parameter can be defined to define the key used for the nested children.
            The value for the nested key should also be an array of objects and use the same structure for parameter `key`, otherwise it will cause undefined behaviour.
            The nested key will be ignored if the nested key does not exist in a target object.
        @type: string
 */
vlib.utils.fuzzy_search = ({
    query, 
    targets = [], 
    limit = 25,
    case_match = false,
    allow_exceeding_chars = true,
    get_matches = false,
    key = null, 
    nested_key = null,
}) => {

    // Checks.
    if (query == null) {
        throw Error("Define parameter \"query\".");
    }

    // Vars.
    const is_obj = targets.length > 0 && typeof targets[0] === "object";
    const is_array = targets.length > 0 && Array.isArray(targets[0]);
    if (is_obj && key == null) { key = "query"; }
    const is_key_array = Array.isArray(key);
    const results = [];
    if (case_match === false) { query = query.toLowerCase(); }

    // Calculate the similairities.
    const calc_sims = (targets = []) => {
        for (let i = 0; i < targets.length; i++) {
            let match;
            if (is_array) {
                match = vlib.utils.fuzzy_match(
                    query,
                    // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
                    case_match ? targets[i] : targets[i].toLowerCase(),
                    allow_exceeding_chars
                );
                
            } else if (is_obj) {
                const target = targets[i];
                if (is_key_array) {
                    let min_match = null;
                    for (let k = 0; k < key.length; k++) {
                        if (target[key[k]] == null) { continue; }
                        match = vlib.utils.fuzzy_match(
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
                    if (target[key] == null) { continue; }
                    match = vlib.utils.fuzzy_match(
                        query,
                        case_match ? target[key] : target[key].toLowerCase(),
                        allow_exceeding_chars
                    );
                }
                if (nested_key !== null && target[nested_key] != null) {
                    calc_sims(target[nested_key]);
                }
            } else {
                if (targets[i] == null) { continue; }
                match = vlib.utils.fuzzy_match(
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
        let converted = [];
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
/*  @docs:
 *  @nav: Frontend
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
vlib.utils.fuzzy_match = (search, target, allow_exceeding_chars = true) => {

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































