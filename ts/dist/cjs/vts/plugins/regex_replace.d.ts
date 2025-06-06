/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Plugin, Source } from "./plugin.js";
/** Single regex replacement rule. */
export interface RegexReplacement {
    pattern: RegExp;
    replacement: string | ((match: RegExpMatchArray, source: Source<"loaded">) => string);
}
/**
 * Plugin that applies one or more regex-based replacements to source files.
 */
export declare class RegexReplace extends Plugin {
    /** Set id. */
    static id: Plugin.Id;
    /** The list of regex replacements. */
    replacements: RegexReplacement[];
    /**
     * Create a new instance of the regex replace plugin.
     * @param replacements  List of regex patterns and their replacements.
     */
    constructor({ replacements }: {
        replacements: RegexReplacement[];
    });
    /** Process source files and apply replacements. */
    callback(source: Source<"loaded">): Promise<void>;
}
