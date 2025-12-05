/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as cp from 'child_process';
/**
 * {Process}
 * The process class, used to start a child process.
 * @nav System
 * @docs
 */
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
    /**
     * The on output event, can be overridden when required.
     * @docs
     */
    on_output(data: string): void;
    /**
     * The on error event, can be overridden when required.
     * @docs
     */
    on_error(data: string): void;
    /**
     * The on exit event, can be overridden when required.
     * @docs
     */
    on_exit(code: number | null): void;
    /**
     * Start a command.
     * @param command The command program.
     * @param args The command arguments.
     *     @desc The command arguments.
     * @param working_directory The working directory path.
     * @param interactive Enable interactive mode (experimental).
     * @param detached Enable detached mode.
     * @param env The environment variables.
     * @param colors Enable colors.
     *
     * @docs
    */
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
    /**
     * Write data to the stdin.
     * @docs
     */
    write(data: string | Buffer): this;
    /**
     * Wait till the process if finished.
     * @note This function must be awaited.
     * @docs
     */
    join(): Promise<void>;
    /**
     * Signal the process with a SIGINT signal.
     * @docs
     */
    kill(signal?: NodeJS.Signals): this;
}
