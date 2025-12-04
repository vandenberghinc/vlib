/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2024 - 2024 Daan van den Bergh.
 */
import { Path, Schema, Proc } from "../vlib/index.js";
import { Ignore } from 'ignore';
export declare class Git {
    source: Path;
    username: string;
    email: string;
    gitignore: Ignore;
    proc: Proc;
    /** Constructor validator. */
    static validator: Schema.Validator<any[] | Record<string, any>, true, {
        readonly source: "string";
        readonly username: "string";
        readonly email: "string";
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
    constructor({ source, username, email, version_path, }: {
        source: string;
        username: string;
        email: string;
        version_path?: string;
    });
    _git_prepare(remote: string, dest: string, branch: string): Promise<string | undefined>;
    push({ remote, dest, branch, forced, ensure_push, log_level, }: {
        remote: string;
        dest: string;
        branch: string;
        forced?: boolean;
        ensure_push?: boolean;
        log_level?: number;
    }): Promise<string | undefined>;
    pull({ remote, dest, branch, forced }: {
        remote: string;
        dest: string;
        branch: string;
        forced?: boolean;
    }): Promise<string | undefined>;
    remove_commit_history({ branch }: {
        branch: string;
    }): Promise<string | undefined>;
    remove_cache(): Promise<string | undefined>;
    is_ignored(path: Path | string, _is_relative?: boolean): boolean;
    list_large_files({ exclude, limit, gitignore, directories }: {
        exclude?: string[];
        limit?: number;
        gitignore?: boolean;
        directories?: boolean;
    }): Promise<{
        path: Path;
        size: number;
    }[]>;
}
