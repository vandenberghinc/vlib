/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as vlib from "@vlib";
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
export class NoDebug extends Plugin {

    /** Set id. */
    static id = new Plugin.Id("vts-no-debug");

    /** Create a new instance of the plugin. */
    constructor() {
        super({
            type: "dist",
        });
    }

    /** Callback. */
    callback(src) {
        const data = src.data!;
        const edits: { start: number; end: number }[] = [];
        let match: RegExpExecArray | null;
        const debug_call_re = /^\s*debug\s*\(/gm;

        // find each `debug(` occurrence
        while ((match = debug_call_re.exec(data)) !== null) {
            const match_start = match.index;
            // locate the '(' within the match
            const paren_index = match_start + match[0].lastIndexOf("(");

            // use a context‐aware iterator to walk from the '('
            const it = new vlib.code.Iterator(
                { data, offset: paren_index },
                vlib.code.Iterator.opts.ts
            );

            // walk until the matching ')' at depth 1
            while (it.avail()) {
                if (it.state.peek === ")" && it.state.depth.parenth === 1 && it.state.is_code) {
                    // calculate end offset (inclusive of ')')
                    let end_offset = it.state.nested_offset + it.state.offset + 1;
                    // include a trailing semicolon if present
                    if (data[end_offset] === ";") {
                        end_offset++;
                    }
                    debug_call_re.lastIndex = end_offset;
                    edits.push({ start: match_start, end: end_offset });
                    break;
                }
                it.advance();
            }
        }

        // nothing to do
        if (edits.length === 0) {
            return;
        }

        // rebuild the file with all edits applied in one pass
        const parts: string[] = [];
        let last_index = 0;

        for (const { start, end } of edits) {
            // append unchanged span
            parts.push(data.slice(last_index, start));

            // comment out the debug call (preserve line structure)
            const snippet = data.slice(start, end);
            const commented = snippet
                .split("\n")
                .map(line => "//" + line)
                .join("\n");
            parts.push(commented);

            last_index = end;
        }

        /**
         * @todo also remove now become empty `if (x.x.x.on()) { }` blocks
         */

        // append any remaining tail
        parts.push(data.slice(last_index));

        src.data = parts.join("");
        src.changed = true;
    }
}