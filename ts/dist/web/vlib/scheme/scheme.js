/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Entry } from "./entry.js";
/**
 * Scheme object.
 * Mainly to initialize all nested schemes.
 */
export class Scheme extends Map {
    /** Initialize a scheme object. */
    constructor(
    /** The scheme to initialize. */
    scheme, 
    /**
     * The parent scheme.
     * When defined with parent_key then the attribute under this key will be replaced with the new scheme instance.
     * This is useful subsequent requests from cached objects.
     * For example when validating volt endpoint parameters.
     */
    parent, 
    /** The key under which the entry is listed. */
    parent_key) {
        // Initialize the map.
        super();
        // Skip empty values to avoid runtime errors.
        for (const [key, value] of Object.entries(scheme)) {
            if (!value)
                continue;
            this.set(key, value instanceof Entry ? value : new Entry(value));
        }
        // Update instance when parent and parent_key are provided.
        if (parent != null && parent_key != null) {
            parent[parent_key] = this;
        }
    }
    /**
     * A map of aliases. Is initialized be initialized on demand.
     */
    get aliases() {
        if (this._aliases == null) {
            this._aliases = new Map();
            for (const entry of this.values()) {
                if (typeof entry === "object" && entry.alias?.length) {
                    for (let i = 0; i < entry.alias.length; i++) {
                        this._aliases.set(entry.alias[i], entry);
                    }
                }
            }
        }
        return this._aliases;
    }
    _aliases;
}
//# sourceMappingURL=scheme.js.map