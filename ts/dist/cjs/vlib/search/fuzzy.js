var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  match: () => match,
  search: () => search
});
module.exports = __toCommonJS(stdin_exports);
function search({ query, targets = [], limit = 25, case_match = false, allow_exceeding_chars = true, get_matches = false, key = null, nested_key = null }) {
  if (query == null) {
    throw Error('Define parameter "query".');
  } else if (!query) {
    return [];
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
      let matched = null;
      if (is_array) {
        matched = match(
          query,
          // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
          case_match ? targets2[i] : targets2[i].toLowerCase(),
          allow_exceeding_chars
        );
      } else if (is_obj) {
        const target = targets2[i];
        if (key) {
          key = key;
          let min_matched = null;
          for (let k = 0; k < key.length; k++) {
            if (target[key[k]] == null) {
              continue;
            }
            matched = match(query, case_match ? target[key[k]] : target[key[k]].toLowerCase(), allow_exceeding_chars);
            if (matched != null && (min_matched === null || matched < min_matched)) {
              min_matched = matched;
            }
          }
          matched = min_matched;
        } else {
          if (target[key] == null) {
            continue;
          }
          matched = match(query, case_match ? target[key] : target[key].toLowerCase(), allow_exceeding_chars);
        }
        if (nested_key !== null && target[nested_key] != null) {
          calc_sims(target[nested_key]);
        }
      } else {
        if (targets2[i] == null) {
          continue;
        }
        matched = match(
          query,
          // case_match ? targets[i][0] : targets[i][0].toLowerCase(),
          case_match ? targets2[i] : targets2[i].toLowerCase(),
          allow_exceeding_chars
        );
      }
      if (matched !== null) {
        results.push([matched, targets2[i]]);
      }
    }
  };
  calc_sims(targets);
  results.sort((a, b) => b[0] - a[0]);
  if (limit !== null && limit >= 0 && results.length > limit) {
    results.length = limit;
  }
  if (get_matches === false) {
    return results.map((item) => item[1]);
  }
  return results;
}
function match(search2, target, allow_exceeding_chars = true) {
  if (allow_exceeding_chars === false) {
    if (search2.length > target.length) {
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
    for (let i2 = 0; i2 < search2.length; i2++) {
      const c = search2.charAt(i2);
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
    if (index >= 0 && index < search2.length) {
      return search2.charCodeAt(index);
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
  let searchLen = search2.length;
  let searchCode = get_search_code(searchI);
  let searchLower = search2.toLowerCase();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  match,
  search
});
