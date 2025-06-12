/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Cast } from "./cast.js";
import { Entries, Entry } from "./entry.js";

/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>


/** Symbol to indicate there was no default value provided, instead of `undefined`. */
export const NoDefault: unique symbol = Symbol('vlib.Schema.Entry.NoDefault');
export type NoDefault = typeof NoDefault;

// ------------------------------------------------------------
/**
 * An initialized entry object that can be validated using the {@link Validator} class.
 * This class is not inferrable.
 * This class is for internal use only, ensure this is not exported in the `index.*.ts` file.
 * @note Keep this under a separate name then the public type util `Entry`.
 * @private
 */
export class ValidatorEntry<
    const T extends Entry.Type.Castable<"mutable"> = Entry.Type.Castable<"mutable">, // type of entry (use const for when T is an array of types).
    V extends Entry.Type.Cast<T> = Entry.Type.Cast<T>, // value of entry
    P extends ObjOrArr = ObjOrArr, // parent
> {

    // ------------------------------------------------------------------
    // Attributes with the same type as the Entry.Plain type.

    readonly type?: T;
    required: Entry.Plain<T, V, P>["required"];
    allow_empty: Entry.Plain<T, V, P>["allow_empty"];
    min: Entry.Plain<T, V, P>["min"];
    max: Entry.Plain<T, V, P>["max"];
    enum: Entry.Plain<T, V, P>["enum"];
    alias: Entry.Plain<T, V, P>["alias"];
    verify: Entry.Plain<T, V, P>["verify"];
    preprocess: Entry.Plain<T, V, P>["preprocess"];
    postprocess: Entry.Plain<T, V, P>["postprocess"];
    charset: Entry.Plain<T, V, P>["charset"];
    // def: Entry.Plain<T, V, P>["def"]; // ignore the alias.

    // ------------------------------------------------------------------
    // Attributes with a different type from the Entry.Plain type.
    // Ensure these types are also inferred by the `infer.ts` file.
    // Also ensure we dont change the name between Entry.Plain, so we keep it universal for `infer.ts`.

    /**
     * The default value for the entry.
     * `NoDefault` will be used to indicate that no default value was provided.
     * This way we can also support `undefined` and `null` as a default value.
     */
    default: NoDefault | Entry.Plain<T, V, P>["default"];

    /**
     * A nested schema for when the attribute is an object.
     */
    schema?: ValidatorEntries;

    /**
     * A nested schema for the array items for when the attribute is an array.
     * Or a schema for the value's of an object.
     */
    value_schema?: ValidatorEntry;

    /**
     * Tuple schema for when the input object is an array.
     * This can be used to verify each item in an array specifically with a predefined length.
     * 
     * Each index of the schema option corresponds to the index of the input array.
     * 
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple?: readonly ValidatorEntry[];

    /**
     * Cast string to boolean/number.
     * Only allowed when type is exactly `boolean` or `number`.
     */
    cast?: T extends "boolean"
        ? { type: "boolean", opts: Cast.boolean.Opts<"preserve"> }
        : T extends "number"
        ? { type: "number", opts: Cast.number.Opts<"preserve"> }
        : never

    /** Constructor options. */
    constructor(opts: Entry.Opts<T, V, P>) {
        if (typeof opts === "string" || typeof opts === "function" || Array.isArray(opts)) {
            opts = { type: opts as T };
        }
        this.type = opts.type;
        this.default = (
            !opts || typeof opts !== "object" ? NoDefault :
            "default" in opts ? opts.default : 
            "def" in opts ? opts.def :
            NoDefault
        );
        // opts.default ?? opts.def;
        this.required = opts.required ?? true;
        this.allow_empty = opts.allow_empty ?? true;
        this.min = opts.min;
        this.max = opts.max;
        if (opts.schema) this.schema = new ValidatorEntries(opts.schema);
        if (opts.value_schema) this.value_schema = new ValidatorEntry(opts.value_schema);
        if (opts.tuple) this.tuple = opts.tuple.map(e => new ValidatorEntry(e));
        this.enum = opts.enum;
        this.alias = opts.alias;
        this.verify = opts.verify;
        this.preprocess = opts.preprocess;
        this.postprocess = opts.postprocess;
        if (opts.cast != null && opts.cast !== false) {
            if (this.type === "boolean" || this.type === "number") {
                const cast: Cast.number.Opts<"preserve"> | Cast.boolean.Opts<"preserve"> =
                    typeof opts.cast === "object"
                        ? { ...opts.cast, preserve: true }
                        : { strict: true, preserve: true }
                this.cast = { type: this.type, opts: cast, } as unknown as ValidatorEntry<T, V, P>["cast"];
            } else {
                throw new TypeError(`Cannot cast type "${this.type}" with cast options.`);
            }
        } else {
            this.cast = undefined as never;
        }
        this.charset = opts.charset;
    }

    /**
     * Get the type as a string.
     * Useful for generating type errors.
     */
    type_name(prefix: string = ""): string {
        let type_error_str = "";
        if (Array.isArray(this.type)) {
            type_error_str = prefix;
            for (let i = 0; i < this.type.length; i++) {
                if (typeof this.type[i] === "function") {
                    try {
                        type_error_str += `"${(this.type[i] as unknown as Function).name}"`
                    } catch (e) {
                        type_error_str += `"${this.type[i]}"`
                    }
                } else {
                    type_error_str += `"${this.type[i]}"`
                }
                if (i === this.type.length - 2) {
                    type_error_str += " or "
                } else if (i < this.type.length - 2) {
                    type_error_str += ", "
                }
            }
        } else {
            type_error_str = `${prefix}"${this.type}"`
        }
        return type_error_str;
    }

    /** Is required wrapper. */
    is_required(object: any): boolean {
        return this.required == null
            ? true
            : typeof this.required === "function"
                ? this.required(object)
                : this.required;
    }
}


// ------------------------------------------------------------
/**
 * A record of entries, a.k.a a schema.
 * @note Keep this under a separate name then the public type util `Entries`.
 */
export class ValidatorEntries extends Map<string, ValidatorEntry> {

    /** Initialize a scheme object. */
    constructor(
        /** The scheme to initialize. */
        schema: Entries.Opts,
    ) {

        // Initialize the map.
        super();

        // Skip empty values to avoid runtime errors.
        for (const [key, value] of Object.entries(schema)) {
            if (!value) continue;
            this.set(key, value instanceof ValidatorEntry ? value : new ValidatorEntry(value));
        }
    }

    /**
     * A map of aliases. Is initialized be initialized on demand.
     */
    get aliases(): Map<string, ValidatorEntry> {
        if (this._aliases == null) {
            this._aliases = new Map<string, ValidatorEntry>();
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
    private _aliases?: Map<string, ValidatorEntry>;
    
}
