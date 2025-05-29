/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Plugin } from "./plugin.js";
/**
 * Recursively fills template matches in the data.
 *
 * @param templates The object map with `key => value` replacements.
 * @param prefix The global template prefix, e.g `{{`
 * @param suffix The global template suffix, e.g `}}`
 * @param quote Whether to quote the values, defaults to false.
 */
export declare class FillTemplates extends Plugin {
    /** Set id. */
    static id: Plugin.Id;
    /** Number of templates. */
    template_count: number;
    /** Replacement pattern. */
    private pattern;
    /** Template values. */
    private templates_map;
    /** Quote flag. */
    private quote_values;
    /** Create a new instance of the plugin. */
    constructor({ templates, prefix, suffix, quote }: {
        templates: Record<string, any>;
        prefix?: string;
        suffix?: string;
        quote?: boolean;
    });
    /** Plugin callback to replace templates. */
    callback(source: {
        data: string;
        changed?: boolean;
    }): void;
}
