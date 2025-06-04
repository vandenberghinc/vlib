/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import { Path, debug } from "../../../index.js";

// Imports.
import { Dirname } from "./dirname.js";
import { FillTemplates } from "./fill_templates.js";
import { Header } from "./header.js";
import { NoDebug } from "./no_debug.js";
import { UpsertRuntimeVars } from "./upsert_runtime_vars.js";
import { Version } from "./version.js";
import { RegexReplace } from "./regex_replace.js";

// Re-exports.
export * from "./plugin.js";

/**
 * Create a list of all plugins.
 */
export const Plugins = {
    Dirname: Dirname,
    dirname: Dirname,
    FillTemplates: FillTemplates,
    fill_templates: FillTemplates,
    Header: Header,
    header: Header,
    NoDebug: NoDebug,
    no_debug: NoDebug,
    UpsertRuntimeVars: UpsertRuntimeVars,
    upsert_runtime_vars: UpsertRuntimeVars,
    Version: Version,
    version: Version,
    RegexReplace: RegexReplace,
    regex_replace: RegexReplace,
} as const;
export type Plugins = typeof Plugins;
export { Plugins as plugins };

/**
 * Create a list of plugins from CLI supported like arguments.
 */
export function create_plugins({
    tsconfig,
    pkg_json,
    header,
    dirname = false,
    yes = false,
    version,
    no_debug = false,
    templates,
    exact_templates,
}: {
    tsconfig?: string | Path,
    pkg_json?: string | Path,
    header?: { author: string, year?: number },
    yes?: boolean;
    dirname?: boolean,
    version?: string | Path,
    no_debug?: boolean,
    templates?: Record<string, string>,
    exact_templates?: Record<string, string>,
}) {
    if (dirname && !tsconfig) {
        throw new Error(`Plugin ${Plugins.Dirname.id} requires a tsconfig path or directory with tsconfig.json.`);
    }
    return [
        header ? new Plugins.Header({ ...header, start_year: header.year, yes }) : undefined,
        dirname ? new Plugins.dirname({ tsconfig: tsconfig!, pkg_json }) : undefined,
        version ? new Plugins.version({ pkg_json: version ?? pkg_json }) : undefined,
        no_debug ? new Plugins.no_debug() : undefined,
        templates ? new Plugins.fill_templates({ templates, prefix: "{{", suffix: "}}" }) : undefined,
        exact_templates ? new Plugins.fill_templates({ templates: exact_templates, prefix: "", suffix: "" }) : undefined,
    ]
}