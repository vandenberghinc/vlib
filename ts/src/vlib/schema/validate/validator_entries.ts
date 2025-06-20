/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { ArrayUtils } from "../../primitives/array.js";
import { Cast } from "./cast.js";
import { Entries, Entry, TupleEntries, ValueEntries } from "../infer/entry.js";

/** Base object or array. */
type ObjOrArr = any[] | Record<string, any>


/** Symbol to indicate there was no value provided, instead of `undefined`. */
export const NoValue: unique symbol = Symbol('vlib.Schema.Entry.NoValue');
export type NoValue = typeof NoValue;

/** Helper type to detect if an entry opts results in a union type. */
type IsUnionType<Ent extends Entry.Opts> = Entry.FromOpts<Ent>["type"] extends readonly any[] ? true : false;

// ------------------------------------------------------------

/**
 * An initialized entry object that can be validated using the {@link Validator} class.
 * This class is not inferrable.
 * This class is for internal use only, ensure this is not exported in the `index.*.ts` file.
 * 
 * @template Opts The options for constructing an entry, 
 *                see {@link Entry} and {@link Entry.Opts} for more info.
 * 
 * @note Keep this under a separate name then the public type util `Entry`.
 * @private
 */
export class ValidatorEntry<
    const Opts extends Entry.Opts = Entry.Opts, // entries options
    // the following generics are system generics and auto inferred from Opts.
    Ent extends Entry.FromOpts<Opts> = Entry.FromOpts<Opts>, // entry type from the options.
    const IsUn extends IsUnionType<Opts> = IsUnionType<Opts>, // is union type, required for distriminated `type` attribute.
> {

    // ------------------------------------------------------------------
    // Attributes with the same type as the Entry type.

    required?: Ent["required"];
    allow_empty?: Ent["allow_empty"];
    min?: Ent["min"];
    max?: Ent["max"];
    enum?: Ent["enum"];
    alias?: Ent["alias"];
    verify?: Ent["verify"];
    preprocess?: Ent["preprocess"];
    postprocess?: Ent["postprocess"];
    charset?: Ent["charset"];
    // def: Entry<T, V, P>["def"]; // ignore the alias.

    // ------------------------------------------------------------------
    // Attributes with a different type from the Entry type.
    // Ensure these types are also inferred by the `infer.ts` file.
    // Also ensure we dont change the name between Entry, so we keep it universal for `infer.ts`.

    /**
     * The field type, e.g. "attribute", "query", "body", etc.
     * Ensure the chosen word fits in sentences like: `Attribte X is ...`, etc.
     * The word is automatically capitalized where needed.
     * We use `NoValue` so the validation process can robustly detect if the field type was not provided.
     * Also automatically casted to `NoValue` when the provided string is empty.
     */
    field_type: string | NoValue;

    /**
     * The default value for the entry.
     * `NoDefault` will be used to indicate that no default value was provided.
     * This way we can also support `undefined` and `null` as a default value.
     */
    default: NoValue | Ent["default"];

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
     * It is inputted as an array of entries,
     * However, its stored as `tuple_1: Entry, tuple_2: Entry, ...` etc.
     * This is how it needs to be validated.
     * 
     * @note this attribute is ignored when the input object is not an array.
     */
    tuple_schema?: ValidatorEntry[];

    /**
     * Cast string to boolean/number.
     * Only allowed when type is exactly `boolean` or `number`.
     */
    cast?: typeof this.validated extends boolean
        ? { type: "boolean", opts: Cast.boolean.Opts<"preserve"> }
        : typeof this.validated extends boolean
        ? { type: "number", opts: Cast.number.Opts<"preserve"> }
        : never

    /**
     * Allow unknown attributes, defaults to `true`.
     * However, internally use `NoDefault` so we can detect changes
     * while traversing down the entries.
     */
    unknown: boolean | NoValue;

    // ------------------------------------------------------------------
    // New attributes.

    /**
     * A boolean flag indicating if the `array` or `object` type requires validation.
     * For instance, nested arrays and objects without any schema do not require validation.
     * Note that this is a readonly attribute, hence it is changed, also not once validated.
     */
    readonly requires_validation: boolean;

    /**
     * The inferred value.
     */
    validated!: Entry.Infer<Opts>;

    /** Check if the `type` attribute is a single type, so not an array indicating a union type. */
    readonly is_union_type: IsUn extends true ? true : false;

    /** Check if the `type` attribute is a single type, so not an array indicating a union type. */
    readonly is_single_type: IsUn extends true ? false : true;

    /** The type. */
    type?: IsUn extends true
        ? Entry.Type.Castable.Base[]
        : Entry.Type.Castable.Base; // allow any type, not just the `Entry.Type` castable types.

    /** Constructor options. */
    constructor(entry_opts: Opts) {
        const opts: Ent = Entry.Type.Castable.is_fast(entry_opts)
            ? { type: entry_opts }
            : entry_opts as any // @todo;
        this.type = opts.type as any;
        this.default = (
            !opts || typeof opts !== "object" ? NoValue :
            "default" in opts ? opts.default : 
            "def" in opts ? opts.def :
            NoValue
        );
        // opts.default ?? opts.def;
        this.required = opts.required ?? true;
        this.allow_empty = opts.allow_empty ?? true;
        this.min = opts.min;
        this.max = opts.max;
        if (opts.schema) this.schema = new ValidatorEntries(opts.schema);
        if (opts.value_schema) this.value_schema = new ValidatorEntry(opts.value_schema);
        if (opts.tuple) this.tuple_schema = opts.tuple.map(e => new ValidatorEntry(e));
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
                this.cast = { type: this.type, opts: cast, } as unknown as ValidatorEntry<Opts>["cast"];
            } else {
                throw new TypeError(`Cannot cast type '${this.type}' with cast options.`);
            }
        } else {
            this.cast = undefined as never;
        }
        this.unknown = opts.unknown ?? NoValue;
        this.charset = opts.charset;
        this.field_type = opts.field_type || NoValue;
        this.requires_validation = this.schema != null || this.value_schema != null || this.tuple_schema != null;
        /** @warning also assign to `true` if `length` is `0`, since validator still needs to treat this as a union type. */
        this.is_union_type = ArrayUtils.is_any(this.type) as any;
        /** @warning when the type is undefined then dont assign to `true` since the validator is not going to validate the undefined type. */
        this.is_single_type = !this.is_union_type && (this.type != null && typeof this.type !== "object") as any;
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
                        type_error_str += `'${(this.type[i] as unknown as Function).name}'`
                    } catch (e) {
                        type_error_str += `'${this.type[i]}'`
                    }
                } else {
                    type_error_str += `'${this.type[i]}'`
                }
                if (i === this.type.length - 2) {
                    type_error_str += " or "
                } else if (i < this.type.length - 2) {
                    type_error_str += ", "
                }
            }
        } else {
            type_error_str = `${prefix}'${this.type}'`
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
 * 
 * For optimal performance, this class should be initialized 
 * and re-used as an argument for the `validate()` fuction.
 * 
 * @note Keep this under a separate name then the public type util `Entries`.
 */
export class ValidatorEntries<const S extends Entries.Opts = Entries.Opts> extends Map<string, ValidatorEntry> {

    /**
     * A map of all aliases from the direct entries.
     * The alias name is used as key, pointing to the original entry.
     */
    aliases = new Map<string, ValidatorEntry>();

    /**
     * An attribute with the inferred type of the entries.
     * Note that this value is undefined at runtime.
     * @example
     * ```
     * const validated_data: typeof val_entries.validated ...
     * ```
     */
    validated!: Entries.Infer<S>

    /** Initialize a scheme object. */
    constructor(
        /**
         * The scheme to initialize.
         * Note that we only support inferrable entries here.
         * This is because the entire tree of nested entries will be initialized.
         * Therefore we dont need to accept any validator instances,
         * allowing us to infer the entries type.
         */
        schema: S,
    ) {

        // Initialize the map.
        super();
        for (const [key, value] of Object.entries(schema)) {
            if (!value) continue; // skip empty values to avoid runtime errors.
            const entry = value instanceof ValidatorEntry ? value : new ValidatorEntry(value);
            this.set(key, entry);

            // Add the aliases.
            if (entry.alias?.length) {
                for (let i = 0; i < entry.alias.length; i++) {
                    this.aliases.set(entry.alias[i], entry);
                }
            }
        }
    }
}