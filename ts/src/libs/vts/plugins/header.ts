/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as vlib from "../../../index.js";
import { Plugin, Source } from "./plugin.js";

/**
 * Add/update @author and @copyright to the top of the source file.
 * When already present then replace the content.
 * Ensure we keep the start year 
 */
export class Header extends Plugin {

    /** Set id. */
    static id = new Plugin.Id("vts-header");

    /**
     * Header tags transformations.
     * Only accepts single line replacements.
     */
    transformations: [RegExp, string][] = [];

    /** The header regex. */
    header_regex = /^\/\*\*([\s\S]*?)(?!<\\)\*\//;

    /** Attributes. */
    current_year = new Date().getFullYear();

    /** Whether to skip confirmation prompts. */
    yes: boolean;

    /** Create a new instance of the plugin. */
    constructor(args: {
        author: string,
        start_year?: number,
        yes?: boolean,
    }) {
        super({
            type: ["dist", "src"],
        });

        this.yes = args.yes === true;
        this.transformations = [
            [
                /@author\b[\s\S]*?$/g,
                `@author ${args.author}`
            ],
            [
                /@copyright\b[\s\S]*?$/g,
                `@copyright © ${args.start_year == null
                    ? this.current_year
                    : `${args.start_year} - ${this.current_year}`
                } ${args.author}. All rights reserved.`
            ]
        ];
    }

    async callback(source: Source<"loaded">) {
        const match = source.data.match(this.header_regex);
        let header: string | undefined;
        let changed = false;

        if (match) {
            const match_start = match.index;
            if (match_start == null) {
                this.error(source, "Header match index is null, this should not happen.");
                return;
            }
            header = match[0];

            for (const [pattern, replacement] of this.transformations) {
                pattern.lastIndex = 0;
                const pattern_match = pattern.exec(header);
                if (pattern_match) {
                    const start_idx = pattern_match.index!;
                    const end_idx = header.indexOf("\n", start_idx) === -1
                        ? header.length
                        : header.indexOf("\n", start_idx);
                    if (this.on(1)) this.log(source, `Replacing header pattern ${pattern} with ${replacement}.`);
                    changed = true;
                    if (this.debug.on(2)) {
                        this.log(source, `Header before replacement:\n${header.split('\n').map(l => `     | ${l}`).join('\n')}`);
                    }
                    header = vlib.String.replace_indices(
                        header,
                        replacement,
                        start_idx,
                        end_idx
                    );
                    if (this.debug.on(2)) {
                        this.log(source, `Header after replacement:\n${header.split('\n').map(l => `     | ${l}`).join('\n')}`);
                    }
                } else {
                    if (this.on(1)) this.log(source, `Inserting header pattern ${replacement}.`);
                    changed = true;
                    if (this.debug.on(2)) {
                        this.log(source, `Header before insertion:\n${header.split('\n').map(l => `     | ${l}`).join('\n')}`);
                    }
                    const close_index = header.lastIndexOf("*/");
                    if (close_index !== -1) {
                        header = header.slice(0, close_index) + ` * ${replacement}\n` + header.slice(close_index);
                    }
                    if (this.debug.on(2)) {
                        this.log(source, `Header after insertion:\n${header.split('\n').map(l => `     | ${l}`).join('\n')}`);
                    }
                }
            }
        } else {
            if (this.on(1)) this.log(source, "Inserting header.");
            changed = true;
            header =
                "/**\n" +
                this.transformations.map(([_, replacement]) => ` * ${replacement}`).join("\n") +
                "\n */\n";
        }

        if (changed) {
            if (!header.endsWith("*/\n") && !header.endsWith("*/")) {
                header += "\n */";
            }
            if (!match) {
                source.data = header + source.data;
            } else {
                source.replace_indices(
                    header!,
                    match.index!,
                    match.index! + match[0].length
                );
            }
            source.changed = true;
        }
    }
}
