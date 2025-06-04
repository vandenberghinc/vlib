/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2024 - 2024 Daan van den Bergh.
 */
import { Path, Scheme, Proc } from "../../index.js";
export declare class SSH {
    source: Path;
    proc: Proc;
    /** Constructor validator. */
    static validator: Scheme.Validator<object, object, "object">;
    constructor({ source, }: {
        source: string;
    });
    push(alias: string, dest: string, del?: boolean): Promise<string | undefined>;
    pull(alias: string, src: string, del?: boolean): Promise<string | undefined>;
}
