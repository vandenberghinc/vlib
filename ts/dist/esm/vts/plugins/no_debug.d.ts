/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Plugin } from "./plugin.js";
/**
 * Plugin that comments out all top‐level `debug(...)` calls in distribution files.
 *
 * It scans for lines beginning with `debug(`, then uses a fast, context‐aware
 * code Iterator to find the matching closing parenthesis (even across nested
 * or multi‐line arguments). All found spans are batch‐commented out in one go.
 *
 * Highly optimized for watch‐mode:
 * - Reuses a single, precompiled RegExp
 * - Minimizes temporary allocations
 * - Applies all edits in a single string rebuild
 */
export declare class NoDebug extends Plugin {
    /** Set id. */
    static id: Plugin.Id;
    /** Create a new instance of the plugin. */
    constructor();
    /** Callback. */
    callback(src: any): void;
}
