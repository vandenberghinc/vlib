/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Compute the Levenshtein distance between two strings.
 * Implementation is O(a_len × b_len) but strings here are short (field names),
 * so speed is not a concern.
 */
function levenshtein_distance(a, b) {
    const a_len = a.length;
    const b_len = b.length;
    // Initialise the DP matrix.
    const dp = new Array(a_len + 1);
    for (let i = 0; i <= a_len; ++i) {
        dp[i] = new Array(b_len + 1);
        dp[i][0] = i; // deletion cost
    }
    for (let j = 0; j <= b_len; ++j) {
        dp[0][j] = j; // insertion cost
    }
    // Fill the matrix.
    for (let i = 1; i <= a_len; ++i) {
        const ch_a = a.charCodeAt(i - 1);
        for (let j = 1; j <= b_len; ++j) {
            const ch_b = b.charCodeAt(j - 1);
            const cost = ch_a === ch_b ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, /* deletion    */ dp[i][j - 1] + 1, /* insertion   */ dp[i - 1][j - 1] + cost);
        }
    }
    return dp[a_len][b_len];
}
/**
 * Attempts to find the *closest* valid attribute for a mistyped one.
 *
 * @param incorrect_name
 *      The invalid / mistyped attribute name.
 * @param valid_names
 *      A list of valid attribute names to match against.
 * @param similarity_threshold
 *      A number **0 – 1** expressing how tolerant the matcher should be:
 *      * **0** → always suggest the closest candidate, even if very different.
 *      * **1** → only suggest when the candidate is an exact match.
 *      A good default for typo-help is **`0.7`** (≈ ≤ 30 % edits).
 * @returns
 *      The *best match* when its similarity is **≥ similarity_threshold**;
 *      otherwise `undefined`.
 */
export function suggest_attribute(incorrect_name, valid_names, similarity_threshold = 0.7) {
    // Normalise to lower case for case-insensitive comparison.
    const needle = incorrect_name.toLowerCase();
    let best_match;
    let best_distance = Number.POSITIVE_INFINITY;
    for (const candidate of valid_names) {
        const distance = levenshtein_distance(needle, candidate.toLowerCase());
        if (distance < best_distance) {
            best_distance = distance;
            best_match = candidate;
            // Early-exit: perfect match in other casing.
            if (distance === 0)
                return candidate;
        }
    }
    if (!best_match)
        return undefined;
    // ------------------------------------------------------------
    // Convert edit distance → similarity ∈ [0, 1]
    //  similarity = 1 - (distance / maxLen)
    const max_len = Math.max(incorrect_name.length, best_match.length, 1);
    const similarity = 1 - best_distance / max_len;
    return similarity >= similarity_threshold ? best_match : undefined;
}
//# sourceMappingURL=suggest_attr.js.map