/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
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
 *
 * @internal
 */
export declare function suggest_attribute(incorrect_name: string, valid_names: string[], similarity_threshold?: number): string | undefined;
