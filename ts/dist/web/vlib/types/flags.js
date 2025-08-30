/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Utility types to create a Flags generic type that supports a cpp bitwise style union.
 *
 * See how {@link CLI.Arg} does it.
 */
export {};
// Using `[Extract]` in this context causes ts issues to infer correct variants.
// [Extract<F, K>] extends [never] ? Else : Then;
//# sourceMappingURL=flags.js.map