/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, Schema } from "../vlib/index.js";
export declare class NPM {
    source: Path;
    pkg_path: Path;
    pkg_base: Path;
    pkg: Record<string, any>;
    version_path?: string;
    id: string;
    /** Constructor validator. */
    static validator: Schema.Validator<any[] | Record<string, any>, true, {
        readonly source: "string";
        readonly pkg_path: {
            readonly type: "string";
            readonly required: false;
        };
        readonly version_path: {
            readonly type: "string";
            readonly required: false;
        };
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
        verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => string | void | null | undefined) | undefined;
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
    /**
     * Create a new NPM instance.
     * @param source The source directory of the NPM package.
     * @param pkg_path The absolute path to the `package.json` file, defaults to `./package.json` in the source directory.
     */
    constructor({ source, pkg_path, version_path, }: {
        source: string;
        pkg_path?: string;
        version_path?: string;
    });
    logged_in(): Promise<boolean>;
    login(): Promise<void>;
    save(): void;
    increment_version({ save }?: {
        save?: boolean | undefined;
    }): Promise<any>;
    publish({ only_if_changed, }: {
        only_if_changed?: boolean | undefined;
    }): Promise<{
        has_changed: boolean;
        live_version: string;
    }>;
    has_commits(log_level?: number, tmp_dir?: string): Promise<boolean>;
}
