/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2024 - 2024 Daan van den Bergh.
 */
import { Path, Proc } from "../../index.js";
export declare class SSH {
    source: Path;
    proc: Proc;
    constructor({ source, }: {
        source: string;
    });
    push(alias: string, dest: string, del?: boolean): Promise<string | undefined>;
    pull(alias: string, src: string, del?: boolean): Promise<string | undefined>;
}
