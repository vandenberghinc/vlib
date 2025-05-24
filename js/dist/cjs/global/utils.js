var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Utils: () => Utils,
  default: () => stdin_default,
  utils: () => Utils
});
module.exports = __toCommonJS(stdin_exports);
var crypto = __toESM(require("crypto"));
var readline = __toESM(require("readline"));
var import_url = require("url");
var import_path = require("path");
var import_colors = require("../system/colors.js");
var import_path2 = require("../system/path.js");
var import_source_loc = require("../logging/source_loc.js");
class Utils {
  /** @docs:
   *  @title: Sleep
   *  @desc: Sleep for an amount of milliseconds.
   *  @param:
   *      @name: msec
   *      @desc: The amount of milliseconds
   *      @type: number
  */
  static async sleep(msec) {
    return new Promise((resolve) => setTimeout(resolve, msec));
  }
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
  static rename_attributes(obj = {}, rename = [["old", "new"]], remove = []) {
    remove.iterate((key) => {
      delete obj[key];
    });
    rename.iterate((key) => {
      obj[key[1]] = obj[key[0]];
      delete obj[key[0]];
    });
    return obj;
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
  static debounce(delay, func) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(args), delay);
    };
  }
  /** @docs:
   *  @title: Deep copy
   *  @desc: Perform a deep copy on any type, it does not support classes, only primitive objects.
   */
  static deep_copy(obj) {
    if (Array.isArray(obj)) {
      const copy = [];
      obj.iterate((item) => {
        copy.append(Utils.deep_copy(item));
      });
      return copy;
    } else if (obj !== null && obj instanceof String) {
      return new String(obj.toString());
    } else if (obj !== null && typeof obj === "object") {
      const copy = {};
      const keys = Object.keys(obj);
      const values = Object.values(obj);
      for (let i = 0; i < keys.length; i++) {
        try {
          copy[keys[i]] = Utils.deep_copy(values[i]);
        } catch (err) {
          if (err.message.startsWith("Unable to copy attribute")) {
            throw err;
          }
          err.message = `Unable to copy attribute "${keys[i]}": ${err.message}.`;
          throw err;
        }
      }
      return copy;
    } else {
      return obj;
    }
  }
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
  static async prompt(question) {
    return new Promise((resolve, reject) => {
      const int = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      int.on("SIGINT", () => {
        int.close();
        reject(new Error("Interrupted by user [SIGINT]."));
      });
      try {
        int.question(question, (name) => {
          int.close();
          resolve(name);
        });
      } catch (e) {
        reject(e);
      }
    });
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
  static format_bytes(value) {
    if (typeof value === "string") {
      value = Buffer.byteLength(value, "utf-8");
    }
    if (value > 1024 * 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
    } else if (value > 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    } else if (value > 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(2)}MB`;
    } else if (value > 1024) {
      return `${(value / 1024).toFixed(2)}KB`;
    }
    return `${Math.floor(value)}B`;
  }
  static hash(data, algo = "sha256", format = "hex") {
    const hash = crypto.createHash(algo);
    hash.update(data);
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
  static fuzzy_search({ query, targets = [], limit = 25, case_match = false, allow_exceeding_chars = true, get_matches = false, key = null, nested_key = null }) {
    if (query == null) {
      throw Error('Define parameter "query".');
    }
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
    const calc_sims = (targets2 = []) => {
      for (let i = 0; i < targets2.length; i++) {
        let match;
        if (is_array) {
          match = Utils.fuzzy_match(
            query,
            // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
            case_match ? targets2[i] : targets2[i].toLowerCase(),
            allow_exceeding_chars
          );
        } else if (is_obj) {
          const target = targets2[i];
          if (key) {
            key = key;
            let min_match = null;
            for (let k = 0; k < key.length; k++) {
              if (target[key[k]] == null) {
                continue;
              }
              match = Utils.fuzzy_match(query, case_match ? target[key[k]] : target[key[k]].toLowerCase(), allow_exceeding_chars);
              if (match != null && (min_match === null || match < min_match)) {
                min_match = match;
              }
            }
            match = min_match;
          } else {
            if (target[key] == null) {
              continue;
            }
            match = Utils.fuzzy_match(query, case_match ? target[key] : target[key].toLowerCase(), allow_exceeding_chars);
          }
          if (nested_key !== null && target[nested_key] != null) {
            calc_sims(target[nested_key]);
          }
        } else {
          if (targets2[i] == null) {
            continue;
          }
          match = Utils.fuzzy_match(
            query,
            // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
            case_match ? targets2[i] : targets2[i].toLowerCase(),
            allow_exceeding_chars
          );
        }
        if (match !== null) {
          results.push([match, targets2[i]]);
        }
      }
    };
    calc_sims(targets);
    results.sort((a, b) => b[0] - a[0]);
    if (limit !== null && limit >= 0 && results.length > limit) {
      results.length = limit;
    }
    if (get_matches === false) {
      let converted = [];
      results.iterate((item) => {
        converted.push(item[1]);
      });
      return converted;
    }
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
  static fuzzy_match(search, target, allow_exceeding_chars = true) {
    if (allow_exceeding_chars === false) {
      if (search.length > target.length) {
        return null;
      }
      let text_count = {};
      for (let i2 = 0; i2 < target.length; i2++) {
        const c = target.charAt(i2);
        if (text_count[c] == null) {
          text_count[c] = 1;
        } else {
          ++text_count[c];
        }
      }
      let query_count = {};
      for (let i2 = 0; i2 < search.length; i2++) {
        const c = search.charAt(i2);
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
    var prepareBeginningIndexes = (target2) => {
      var targetLen2 = target2.length;
      var beginningIndexesLen = 0;
      var wasUpper = false;
      var wasAlphanum = false;
      for (var i2 = 0; i2 < targetLen2; ++i2) {
        var targetCode2 = target2.charCodeAt(i2);
        var isUpper = targetCode2 >= 65 && targetCode2 <= 90;
        var isAlphanum = isUpper || targetCode2 >= 97 && targetCode2 <= 122 || targetCode2 >= 48 && targetCode2 <= 57;
        var isBeginning = isUpper && !wasUpper || !wasAlphanum || !isAlphanum;
        wasUpper = isUpper;
        wasAlphanum = isAlphanum;
        if (isBeginning)
          beginningIndexes[beginningIndexesLen++] = i2;
      }
      return beginningIndexes;
    };
    var prepareNextBeginningIndexes = (target2) => {
      var targetLen2 = target2.length;
      var beginningIndexes2 = prepareBeginningIndexes(target2);
      var lastIsBeginning = beginningIndexes2[0];
      var lastIsBeginningI = 0;
      for (var i2 = 0; i2 < targetLen2; ++i2) {
        if (lastIsBeginning > i2) {
          nextBeginningIndexes[i2] = lastIsBeginning;
        } else {
          lastIsBeginning = beginningIndexes2[++lastIsBeginningI];
          nextBeginningIndexes[i2] = lastIsBeginning === void 0 ? targetLen2 : lastIsBeginning;
        }
      }
      return nextBeginningIndexes;
    };
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
    for (; ; ) {
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
      }
    }
    searchI = 0;
    targetI = 0;
    nextBeginningIndexes = prepareNextBeginningIndexes(target);
    var firstPossibleI = targetI = matchesSimple[0] === 0 ? 0 : nextBeginningIndexes[matchesSimple[0] - 1];
    var backtrackCount = 0;
    if (targetI !== targetLen) {
      for (; ; ) {
        if (targetI >= targetLen) {
          if (searchI <= 0)
            break;
          ++backtrackCount;
          if (backtrackCount > 200)
            break;
          --searchI;
          var lastMatch = matchesStrict[--matchesStrictLen];
          targetI = nextBeginningIndexes[lastMatch];
        } else {
          var isMatch = get_search_code(searchI) === get_target_code(targetI);
          if (isMatch) {
            matchesStrict[matchesStrictLen++] = targetI;
            ++searchI;
            if (searchI === searchLen) {
              successStrict = true;
              break;
            }
            ++targetI;
          } else {
            targetI = nextBeginningIndexes[targetI];
          }
        }
      }
    }
    var substringIndex = targetLower.indexOf(searchLower, matchesSimple[0]);
    var isSubstring = ~substringIndex;
    if (isSubstring && !successStrict) {
      for (var i = 0; i < matchesSimpleLen; ++i) {
        matchesSimple[i] = substringIndex + i;
      }
    }
    var isSubstringBeginning = false;
    if (isSubstring) {
      isSubstringBeginning = nextBeginningIndexes[substringIndex - 1] === substringIndex;
    }
    {
      if (successStrict) {
        var matchesBest = matchesStrict;
        var matchesBestLen = matchesStrictLen;
      } else {
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
      score -= (12 + unmatchedDistance) * extraMatchGroupCount;
      if (matchesBest[0] !== 0)
        score -= matchesBest[0] * matchesBest[0] * 0.2;
      if (!successStrict) {
        score *= 1e3;
      } else {
        var uniqueBeginningIndexes = 1;
        for (var i = nextBeginningIndexes[0]; i < targetLen; i = nextBeginningIndexes[i]) {
          ++uniqueBeginningIndexes;
        }
        if (uniqueBeginningIndexes > 24)
          score *= (uniqueBeginningIndexes - 24) * 10;
      }
      if (isSubstring)
        score /= 1 + searchLen * searchLen * 1;
      if (isSubstringBeginning)
        score /= 1 + searchLen * searchLen * 1;
      score -= targetLen - searchLen;
      return score;
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
  static _npm_package_version_cache = /* @__PURE__ */ new Map();
  /** Load the version from a npm package.json or any other json file that has a `version: string` attribute. */
  static load_npm_package_version(package_json_path, def = "1.0.0") {
    if (Utils._npm_package_version_cache.has(package_json_path)) {
      return Utils._npm_package_version_cache.get(package_json_path);
    }
    const p = new import_path2.Path(package_json_path);
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
  static __dirname(import_meta) {
    return (0, import_path.dirname)((0, import_url.fileURLToPath)(import_meta.url));
  }
  static __filename(import_meta) {
    return (0, import_url.fileURLToPath)(import_meta.url);
  }
  /** Safe exit with a traceable log message and status code */
  static safe_exit(code = 1, message) {
    const id = new import_source_loc.SourceLoc(1).abs_id;
    if (message) {
      console.log(import_colors.Color.red(">>>"), message);
    }
    console.log(`${import_colors.Color.red_bold("Warning")}: Safe exit requested from ${import_colors.Color.bold(id)}, exiting process with exit status ${import_colors.Color.bold(code.toString())}.`);
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
  static print(...args) {
    console.log(args.join(""));
  }
  /** @docs
   * @deprecated use the `logging/Logger` module instead.
   *  @title: printe
   *  @desc Print arguments to console error without inserting spaces
   *  @param args Arguments to print
   */
  static printe(...args) {
    console.error(args.join(""));
  }
  /** @docs
   * @deprecated use the `logging/Logger` module instead.
   *  @title: print_marker
   *  @desc Print text with a blue marker prefix
   *  @param args Arguments to print
   */
  static print_marker(...args) {
    Utils.print(import_colors.Colors.blue, ">>> ", import_colors.Colors.end, ...args);
  }
  /** @docs
   * @deprecated use the `logging/Logger` module instead.
   *  @title: print_warning
   *  @desc Print text with a yellow warning prefix
   *  @param args Arguments to print
   */
  static print_warning(...args) {
    Utils.print(import_colors.Colors.yellow, ">>> ", import_colors.Colors.end, ...args);
  }
  /**
   * @deprecated use the `logging/Logger` module instead.
   * @docs
   *  @title: print_error
   *  @desc Print text with a red error prefix to stderr
   *  @param args Arguments to print
   */
  static print_error(...args) {
    Utils.printe(import_colors.Colors.red, ">>> ", import_colors.Colors.end, ...args);
  }
}
;
var stdin_default = Utils;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Utils,
  utils
});
