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
    static validator: Schema.Validator<object, boolean, Record<string, any>, Schema.Entry.Opts<Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[], any, any[] | Record<string, any>, {}>, Schema.Entry.Opts<Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[], any, any[] | Record<string, any>, {}>[]>;
    constructor({ source, }: {
        source: string;
    });
    push(alias: string, dest: string, del?: boolean): Promise<string | undefined>;
    pull(alias: string, src: string, del?: boolean): Promise<string | undefined>;
}
