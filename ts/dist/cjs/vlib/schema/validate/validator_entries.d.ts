/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Cast } from "./cast.js";
import { Entries, Entry } from "../infer/entry.js";
/** Symbol to indicate there was no value provided, instead of `undefined`. */
export declare const NoValue: unique symbol;
export type NoValue = typeof NoValue;
/** Helper type to detect if an entry opts results in a union type. */
type IsUnionType<Ent extends Entry.Opts> = Entry.FromOpts<Ent>["type"] extends readonly any[] ? true : false;
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
export declare class ValidatorEntry<const Opts extends Entry.Opts = Entry.Opts, // entries options
Ent extends Entry.FromOpts<Opts> = Entry.FromOpts<Opts>> {
    required?: Ent["required"];
    allow_empty: NonNullable<Ent["allow_empty"]>;
    min?: Ent["min"];
    max?: Ent["max"];
    enum?: Ent["enum"];
    alias?: Ent["alias"];
    verify?: Ent["verify"];
    preprocess?: Ent["preprocess"];
    postprocess?: Ent["postprocess"];
    charset?: Ent["charset"];
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
    cast?: typeof this.validated extends boolean ? {
        type: "boolean";
        opts: Cast.boolean.Opts<"preserve">;
    } : typeof this.validated extends boolean ? {
        type: "number";
        opts: Cast.number.Opts<"preserve">;
    } : never;
    /**
     * Allow unknown attributes, defaults to `true`.
     * However, internally use `NoDefault` so we can detect changes
     * while traversing down the entries.
     */
    unknown: boolean | NoValue;
    /**
     * A boolean flag indicating if the `array` or `object` type requires validation.
     * For instance, nested arrays and objects without any schema do not require validation.
     * Note that this is a readonly attribute, hence it is changed, also not once validated.
     */
    readonly requires_validation: boolean;
    /**
     * The inferred value.
     */
    validated: Entry.Infer<Opts>;
    /** Check if the `type` attribute is a single type, so not an array indicating a union type. */
    readonly is_union_type: IsUnionType<Opts> extends true ? true : false;
    /** Check if the `type` attribute is a single type, so not an array indicating a union type. */
    readonly is_single_type: IsUnionType<Opts> extends true ? false : true;
    /** The type. */
    type?: IsUnionType<Opts> extends true ? Entry.Type.Castable.Base[] : Entry.Type.Castable.Base;
    /** Constructor options. */
    constructor(entry_opts: Opts);
    /**
     * Get the type as a string.
     * Useful for generating type errors.
     */
    type_name(prefix?: string): string;
    /** Is required wrapper. */
    is_required(object: any): boolean;
}
/**
 * A record of entries, a.k.a a schema.
 *
 * For optimal performance, this class should be initialized
 * and re-used as an argument for the `validate()` fuction.
 *
 * @note Keep this under a separate name then the public type util `Entries`.
 */
export declare class ValidatorEntries<const S extends Entries.Opts = Entries.Opts> extends Map<string, ValidatorEntry> {
    /**
     * A map of all aliases from the direct entries.
     * The alias name is used as key, pointing to the original entry.
     */
    aliases: Map<string, ValidatorEntry<Entry.Opts<Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[], any, any[] | Record<string, any>, {}>, {
        type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
        default?: any;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
        value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
        tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: boolean | import("../../types/types.js").Neverify<{
            preserve: true;
            strict?: boolean;
        } | {
            preserve?: boolean;
            strict: true;
        }, "preserve"> | import("../../types/types.js").Neverify<{
            preserve: true;
            strict?: false;
        } | {
            preserve?: false;
            strict: true;
        }, "preserve"> | undefined;
        charset?: RegExp | undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: any;
    } | {
        type?: Function | undefined;
        default?: Function | ((parent: any[] | Record<string, any>) => Function) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, Function | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: Function | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: (Function | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: Function, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: Function, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: Function, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: Function | ((obj: any) => Function) | undefined;
    } | {
        type?: "string" | undefined;
        default?: string | ((parent: any[] | Record<string, any>) => string) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "string" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "string" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("string" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: string, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: string, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: string, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: RegExp | undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: string | ((obj: any) => string) | undefined;
    } | {
        type?: "number" | undefined;
        default?: number | ((parent: any[] | Record<string, any>) => number) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "number" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "number" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("number" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: number, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: number, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: number, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: boolean | import("../../types/types.js").Neverify<{
            preserve: true;
            strict?: boolean;
        } | {
            preserve?: boolean;
            strict: true;
        }, "preserve"> | undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: number | ((obj: any) => number) | undefined;
    } | {
        type?: "bigint" | undefined;
        default?: bigint | ((parent: any[] | Record<string, any>) => bigint) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "bigint" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "bigint" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("bigint" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: bigint, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: bigint, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: bigint, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: bigint | ((obj: any) => bigint) | undefined;
    } | {
        type?: "boolean" | undefined;
        default?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "boolean" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "boolean" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("boolean" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: boolean, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: boolean, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: boolean, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: boolean | import("../../types/types.js").Neverify<{
            preserve: true;
            strict?: false;
        } | {
            preserve?: false;
            strict: true;
        }, "preserve"> | undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: boolean | ((obj: any) => boolean) | undefined;
    } | {
        type?: "undefined" | undefined;
        default?: ((parent: any[] | Record<string, any>) => undefined) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "undefined" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "undefined" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("undefined" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: undefined, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: undefined, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: undefined, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: ((obj: any) => undefined) | undefined;
    } | {
        type?: "object" | undefined;
        default?: Record<string, any> | ((parent: any[] | Record<string, any>) => Record<string, any>) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "object" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "object" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("object" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: Record<string, any>, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: Record<string, any>, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: Record<string, any>, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: Record<string, any> | ((obj: any) => Record<string, any>) | undefined;
    } | {
        type?: "null" | undefined;
        default?: ((parent: any[] | Record<string, any>) => null) | null | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "null" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "null" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("null" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: null, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: null, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: null, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: ((obj: any) => null) | null | undefined;
    } | {
        type?: "any" | undefined;
        default?: any;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "any" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "any" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("any" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: RegExp | undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: any;
    } | {
        type?: "array" | undefined;
        default?: string[] | ((parent: any[] | Record<string, any>) => string[]) | undefined;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, "array" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: "array" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: ("array" | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: string[], parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: string[], parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: string[], parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: string[] | ((obj: any) => string[]) | undefined;
    } | {
        type?: readonly Entry.Type.Castable.Base[] | undefined;
        default?: unknown;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, readonly Entry.Type.Castable.Base[] | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        }> | undefined;
        value_schema?: readonly Entry.Type.Castable.Base[] | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        } | undefined;
        tuple?: (readonly Entry.Type.Castable.Base[] | {
            type?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | undefined;
            default?: any;
            required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
            allow_empty?: boolean;
            min?: number;
            max?: number;
            schema?: Record<string, Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
            value_schema?: Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
            tuple?: (Entry.Type.Castable.Base | readonly Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
            enum?: readonly any[];
            alias?: string | readonly string[];
            verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
                error: string;
                raw?: string;
            }) | undefined;
            preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
            cast?: boolean | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: boolean;
            } | {
                preserve?: boolean;
                strict: true;
            }, "preserve"> | import("../../types/types.js").Neverify<{
                preserve: true;
                strict?: false;
            } | {
                preserve?: false;
                strict: true;
            }, "preserve"> | undefined;
            charset?: RegExp | undefined;
            field_type?: string;
            unknown?: boolean;
            readonly def?: any;
        })[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: unknown, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: unknown, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: unknown, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: undefined;
        charset?: RegExp | undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: unknown;
    }>>;
    /**
     * An attribute with the inferred type of the entries.
     * Note that this value is undefined at runtime.
     * @example
     * ```
     * const validated_data: typeof val_entries.validated ...
     * ```
     */
    validated: Entries.Infer<S>;
    /** Initialize a scheme object. */
    constructor(
    /**
     * The scheme to initialize.
     * Note that we only support inferrable entries here.
     * This is because the entire tree of nested entries will be initialized.
     * Therefore we dont need to accept any validator instances,
     * allowing us to infer the entries type.
     */
    schema: S);
}
export {};
