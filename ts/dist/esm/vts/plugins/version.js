/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Plugin } from "./plugin.js";
import { UpsertRuntimeVars } from "./upsert_runtime_vars.js";
import { load_pkg_json } from "../utils/pkg_json.js";
/**
 * Version plugin, insert __version into dist files.
 */
export class Version extends Plugin {
    /** Set id. @todo testing no id runtime error */
    static id = new Plugin.Id("vts-version");
    /** Create a new instance of the plugin. */
    constructor({ pkg_json, version }) {
        super({
            type: "dist",
        });
        if (!version && !pkg_json) {
            throw new Error("Either `version` or `pkg_json` must be provided to the Version plugin.");
        }
        const upsert = new UpsertRuntimeVars({
            identifier: Version.id,
            vars: { __version: version ? version : load_pkg_json(pkg_json, { version: true }).version },
        });
        this.callback = (src) => upsert.callback(src);
        this.plugins.push(upsert);
    }
}
//# sourceMappingURL=version.js.map