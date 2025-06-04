/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as cp from 'child_process';
export declare class Proc {
    private debug;
    private proc?;
    private promise?;
    err?: string;
    out?: string;
    exit_status?: number;
    constructor({ debug }?: {
        debug?: boolean;
    });
    on_output(data: string): void;
    on_error(data: string): void;
    on_exit(code: number | null): void;
    start({ command, args, working_directory, interactive, detached, env, colors, opts, }: {
        command?: string;
        args?: string[];
        working_directory?: string | undefined;
        interactive?: boolean;
        detached?: boolean;
        env?: NodeJS.ProcessEnv | undefined;
        colors?: boolean;
        opts?: cp.SpawnOptions;
    }): Promise<number>;
    write(data: string | Buffer): this;
    join(): Promise<void>;
    kill(signal?: NodeJS.Signals): this;
}
