/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Plugin } from "./plugin.js";
/**
 * Recursively fills template matches in the data.
 *
 * @param templates The object map with `key => value` replacements.
 * @param prefix The global template prefix, e.g `{{`
 * @param suffix The global template suffix, e.g `}}`
 * @param quote Whether to quote the values, defaults to false.
 */
export class FillTemplates extends Plugin {
    /** Set id. */
    static id = new Plugin.Id("vts-fill-templates");
    /** Number of templates. */
    template_count;
    /** Replacement pattern. */
    pattern;
    /** Template values. */
    templates_map;
    /** Quote flag. */
    quote_values;
    /** Create a new instance of the plugin. */
    constructor({ templates, prefix = "", suffix = "", quote = false }) {
        super({ type: "dist" });
        // Escape special regex characters
        const escape_regexp = (str) => str.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
        const keys = Object.keys(templates);
        this.template_count = keys.length;
        this.templates_map = templates;
        this.quote_values = quote;
        // Build optimized pattern
        let pattern_str;
        const escaped_prefix = escape_regexp(prefix);
        const escaped_suffix = escape_regexp(suffix);
        const joined_keys = keys.map(escape_regexp).join("|");
        if (!prefix && !suffix) {
            // match whole words when no delimiters
            pattern_str = `\\b(${joined_keys})\\b`;
        }
        else if (prefix && suffix) {
            pattern_str = `${escaped_prefix}(${joined_keys})${escaped_suffix}`;
        }
        else if (prefix) {
            pattern_str = `${escaped_prefix}(${joined_keys})\\b`;
        }
        else { // suffix only
            pattern_str = `\\b(${joined_keys})${escaped_suffix}`;
        }
        this.pattern = new RegExp(pattern_str, "g");
    }
    /** Plugin callback to replace templates. */
    callback(source) {
        if (this.template_count === 0)
            return;
        let changed = false;
        const templates = this.templates_map;
        const quote = this.quote_values;
        const out = source.data.replace(this.pattern, (_match, key) => {
            const value = templates[key];
            if (value === undefined)
                return _match;
            changed = true;
            const text = String(value);
            return quote ? `"${text}"` : text;
        });
        if (changed) {
            source.data = out;
            source.changed = true;
        }
    }
}
//# sourceMappingURL=fill_templates.js.map