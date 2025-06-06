/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Plugin, Source } from "./plugin.js";
/**
 * Add/update @author and @copyright to the top of the source file.
 * When already present then replace the content.
 * Ensure we keep the start year
 */
export declare class Header extends Plugin {
    /** Set id. */
    static id: Plugin.Id;
    /**
     * Header tags transformations.
     * Only accepts single line replacements.
     */
    transformations: [RegExp, string][];
    /** The header regex. */
    header_regex: RegExp;
    /** Attributes. */
    current_year: number;
    /** Whether to skip confirmation prompts. */
    yes: boolean;
    /** Create a new instance of the plugin. */
    constructor(args: {
        author: string;
        start_year?: number;
        yes?: boolean;
    });
    callback(source: Source<"loaded">): Promise<void>;
}
