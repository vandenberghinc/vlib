/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../vlib/index.js";
import { Dirname } from "./dirname.js";
import { FillTemplates } from "./fill_templates.js";
import { Header } from "./header.js";
import { NoDebug } from "./no_debug.js";
import { UpsertRuntimeVars } from "./upsert_runtime_vars.js";
import { Version } from "./version.js";
import { RegexReplace } from "./regex_replace.js";
export * from "./plugin.js";
/**
 * Create a list of all plugins.
 */
export declare const Plugins: {
    readonly Dirname: typeof Dirname;
    readonly dirname: typeof Dirname;
    readonly FillTemplates: typeof FillTemplates;
    readonly fill_templates: typeof FillTemplates;
    readonly Header: typeof Header;
    readonly header: typeof Header;
    readonly NoDebug: typeof NoDebug;
    readonly no_debug: typeof NoDebug;
    readonly UpsertRuntimeVars: typeof UpsertRuntimeVars;
    readonly upsert_runtime_vars: typeof UpsertRuntimeVars;
    readonly Version: typeof Version;
    readonly version: typeof Version;
    readonly RegexReplace: typeof RegexReplace;
    readonly regex_replace: typeof RegexReplace;
};
export type Plugins = typeof Plugins;
export { Plugins as plugins };
/**
 * Create a list of plugins from CLI supported like arguments.
 */
export declare function create_plugins({ tsconfig, pkg_json, header, dirname, yes, version, no_debug, templates, exact_templates, }: {
    tsconfig?: string | Path;
    pkg_json?: string | Path;
    header?: {
        author: string;
        year?: number;
    };
    yes?: boolean;
    dirname?: boolean;
    version?: string | Path;
    no_debug?: boolean;
    templates?: Record<string, string>;
    exact_templates?: Record<string, string>;
}): (Dirname | FillTemplates | Header | NoDebug | Version | undefined)[];
