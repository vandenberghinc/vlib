/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Cast } from "./cast.js";
import { Entry, EntryObject } from "./entry.js";
import { InferEntries, InferTupleEntries, InferValueEntries } from "./infer.js";

/**
 * A record of entries, a.k.a a schema.
 */
export class Entries extends Map<string, Entry> {

    /** Initialize a scheme object. */
    constructor(
        /** The scheme to initialize. */
        schema: Entries.Opts,
        /**
         * The parent scheme.
         * When defined with parent_key then the attribute under this key will be replaced with the new scheme instance.
         * This is useful subsequent requests from cached objects.
         * For example when validating volt endpoint parameters.
         */
        parent?: object,
        /** The key under which the entry is listed. */
        parent_key?: string,
    ) {

        // Initialize the map.
        super();

        // Skip empty values to avoid runtime errors.
        for (const [key, value] of Object.entries(schema)) {
            if (!value) continue;
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
    get aliases(): Map<string, Entry> {
        if (this._aliases == null) {
            this._aliases = new Map<string, Entry>();
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
    private _aliases?: Map<string, Entry>;
    
}

/** Entries types. */
export namespace Entries {
    
    /**
     * Inferrable input options.
     * Somehow we need to define the explicit T type here or it might cause issues when 
     * Constructing an new `Entries` instance with nested `Entry` instances instead of `EntryObject` items.
     */
    export type Opts = Record<string, Entry.Opts<Cast.Castable>>

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Infer<T extends Opts> = InferEntries<T>;
}

/**
 * Value entries. Basically a single value entry.
 * However, still keep this as a seperate type because 
 * The infer strategy treats it differently than a normal entry.
 */
export namespace ValueEntries {

    /** Inferrable input options. */
    export type Opts = Entry.Opts;

    /** Extract the value‐type for a normal (named) Scheme.Opts object */
    export type Infer<
        ParentT extends "array" | "object",
        V extends Opts,
    > = InferValueEntries<ParentT, V>;
}

/**
 * Tuple entries.
 * This can be used to verify a tuple array.
 * So a fixed length array with a specific type for each position.
 */
export namespace TupleEntries {

    /** Inferrable input options. */
    export type Opts = Entry.Opts[];

    /** Extract the value‐type for a tuple, preserving tuple positions */
    export type Infer<T extends Opts> = InferTupleEntries<T>;
}
