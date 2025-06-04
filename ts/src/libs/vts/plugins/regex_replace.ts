/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Plugin, Source } from "./plugin.js";

/** Single regex replacement rule. */
export interface RegexReplacement {
    pattern: RegExp;
    replacement: string | ((match: RegExpMatchArray, source: Source<"loaded">) => string);
}

/**
 * Plugin that applies one or more regex-based replacements to source files.
 */
export class RegexReplace extends Plugin {

    /** Set id. */
    static id = new Plugin.Id("vts-regex-replace");

    /** The list of regex replacements. */
    replacements: RegexReplacement[];

    /**
     * Create a new instance of the regex replace plugin.
     * @param replacements  List of regex patterns and their replacements.
     */
    constructor({ replacements }: {
        replacements: RegexReplacement[];
    }) {
        super({ type: "dist" });
        this.replacements = replacements;
    }

    /** Process source files and apply replacements. */
    async callback(source: Source<"loaded">) {
        if (this.debug.on(3)) this.log(source, "Running regex replace plugin...");

        // Iterate over each replacement rule and apply it to the source data.
        for (const i of this.replacements) {
            const matches = [...source.data.matchAll(i.pattern)]; // // @warning matchAll is spread into an array to allow counting; this can impact performance on large files
            if (matches.length === 0) {
                if (this.debug.on(2)) this.log(source, `Pattern ${i.pattern} not found.`);
                continue;
            }
            if (this.debug.on(1)) this.log(source, `Replacing ${matches.length} occurrences of ${i.pattern}.`);

            source.data = source.data.replace(i.pattern, (...args) => {
                source.changed = true;
                const match_array = args.slice(0, -2) as RegExpMatchArray;
                return typeof i.replacement === "function"
                    ? i.replacement(match_array, source)
                    : i.replacement;
            });
        }

        if (source.changed && this.on(1)) this.log(source, "Source data updated with regex replacements.");
        else if (this.debug.on(2)) this.log(source, "No replacements made.");
    }
}
