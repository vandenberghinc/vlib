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
  suggest_attribute: () => suggest_attribute
});
module.exports = __toCommonJS(stdin_exports);
function levenshtein_distance(a, b) {
  const a_len = a.length;
  const b_len = b.length;
  const dp = new Array(a_len + 1);
  for (let i = 0; i <= a_len; ++i) {
    dp[i] = new Array(b_len + 1);
    dp[i][0] = i;
  }
  for (let j = 0; j <= b_len; ++j) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= a_len; ++i) {
    const ch_a = a.charCodeAt(i - 1);
    for (let j = 1; j <= b_len; ++j) {
      const ch_b = b.charCodeAt(j - 1);
      const cost = ch_a === ch_b ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        /* deletion    */
        dp[i][j - 1] + 1,
        /* insertion   */
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a_len][b_len];
}
function suggest_attribute(incorrect_name, valid_names, similarity_threshold = 0.7) {
  const needle = incorrect_name.toLowerCase();
  let best_match;
  let best_distance = Number.POSITIVE_INFINITY;
  for (const candidate of valid_names) {
    const distance = levenshtein_distance(needle, candidate.toLowerCase());
    if (distance < best_distance) {
      best_distance = distance;
      best_match = candidate;
      if (distance === 0)
        return candidate;
    }
  }
  if (!best_match)
    return void 0;
  const max_len = Math.max(incorrect_name.length, best_match.length, 1);
  const similarity = 1 - best_distance / max_len;
  return similarity >= similarity_threshold ? best_match : void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  suggest_attribute
});
