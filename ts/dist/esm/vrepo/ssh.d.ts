/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2024 - 2024 Daan van den Bergh.
 */
import { Path, Schema, Proc } from "../vlib/index.js";
export declare class SSH {
    source: Path;
    proc: Proc;
    /** Constructor validator. */
    static validator: Schema.Validator<any[] | Record<string, any>, true, {
        readonly source: "string";
    }, Schema.ValueEntries.Opts<{}>, (Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | {
        type?: Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | undefined;
        default?: any;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
        value_schema?: Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
        tuple?: (Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => void | null | undefined | string | {
            error: string;
            raw?: string;
        }) | undefined;
        preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: boolean | import("../vlib/types/types.js").Neverify<{
            preserve: true;
            strict?: boolean;
        } | {
            preserve?: boolean;
            strict: true;
        }, "preserve"> | import("../vlib/types/types.js").Neverify<{
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
    })[]>;
    constructor({ source, }: {
        source: string;
    });
    push(alias: string, dest: string, del?: boolean): Promise<string | undefined>;
    pull(alias: string, src: string, del?: boolean): Promise<string | undefined>;
}
