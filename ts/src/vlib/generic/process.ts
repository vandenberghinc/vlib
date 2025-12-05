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
export class Proc {

    // Attributes.
    private debug: boolean;
    private proc?: cp.ChildProcess = undefined;
    private promise?: Promise<number | null> = undefined;
    public err?: string = undefined;
    public out?: string = undefined;
    public exit_status?: number = undefined;

    constructor(
        { debug = false }:
        { debug?: boolean; } = {}
    ) {
        this.debug = debug;
    }

    /**
     * The on output event, can be overridden when required.
     * @docs
     */
    on_output(data: string): void {
    }

    /**
     * The on error event, can be overridden when required.
     * @docs
     */
    on_error(data: string): void {
    }

    /**
     * The on exit event, can be overridden when required.
     * @docs
     */
    on_exit(code: number | null): void {
    }

    // @todo add @experimental to interactive parameter
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
    start(
        {
            command = "",
            args = [],
            working_directory = undefined,
            interactive = true,
            detached = false,
            env = undefined,
            colors = false,
            opts = {},
        }: {
            command?: string;
            args?: string[];
            working_directory?: string | undefined;
            interactive?: boolean;
            detached?: boolean;
            env?: NodeJS.ProcessEnv | undefined;
            colors?: boolean;
            opts?: cp.SpawnOptions;
        }
    ): Promise<number> {
        
        // Reset.
        this.out = undefined;
        this.err = undefined;
        this.exit_status = undefined;

        // Set promise.
        this.promise = new Promise((resolve) => {
            // Spawn.
            if (this.debug) {
                console.log(`Start: ${command} ${args.join(" ")}`);
            }
            const options: cp.SpawnOptions = {
                cwd: working_directory,
                stdio: [interactive ? "pipe" : "ignore", "pipe", "pipe"],
                shell: interactive,
                detached: detached,
                ...opts,
            };
            if (env != null) {
                options.env = env;
                if (colors) {
                    options.env.FORCE_COLOR = "true";
                }
            } else if (colors) {
                options.env = { ...process.env, FORCE_COLOR: "true" };
            }
            this.proc = cp.spawn(command, args, options);

            // Set handlers.
            let closed = 0;
            if (this.proc.stdout) {
                this.proc.stdout.on('data', (data: Buffer) => {
                    const str_data = data.toString();
                    if (this.debug) {
                        console.log("OUT:", str_data);
                    }
                    if (this.out === undefined) {
                        this.out = "";
                    }
                    this.out += str_data;
                    if (this.on_output !== undefined) {
                        this.on_output(str_data);
                    }
                });
            }
            if (this.proc.stderr) {
                this.proc.stderr.on('data', (data: Buffer) => {
                    const str_data = data.toString();
                    if (this.debug) {
                        console.log("ERR:", str_data);
                    }
                    if (this.err === undefined) {
                        this.err = "";
                    }
                    this.err += str_data;
                    if (this.on_error !== undefined) {
                        this.on_error(str_data);
                    }
                });
            }
            this.proc.on('exit', (code: number) => {
                if (this.debug && closed === 1) {
                    console.log(`Child process exited with code ${code}.`);
                }
                this.exit_status = code;
                if (code !== 0 && (this.err == null || this.err.length === 0)) {
                    this.err = `Child process exited with code ${code}.`;
                }
                if (this.on_exit !== undefined) {
                    this.on_exit(code);
                }
                ++closed;
                if (closed == 2) {
                    resolve(code);
                }
            });
            this.proc.on('close', (code: number | null) => {
                if (this.debug && closed === 1) {
                    console.log(`Child process exited with code ${code}.`);
                }
                ++closed;
                if (closed == 2) {
                    resolve(code);
                }
            });
        });
        return this.promise as Promise<number>;
    }

    /**
     * Write data to the stdin.
     * @docs
     */
    write(data: string | Buffer): this {
        if (this.proc != null && this.proc.stdin) {
            this.proc.stdin.write(data);
        }
        return this;
    }

    /**
     * Wait till the process if finished.
     * @note This function must be awaited.
     * @docs
     */
    async join(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            await this.promise;
            resolve();
        });
    }

    /**
     * Signal the process with a SIGINT signal.
     * @docs
     */
    kill(signal: NodeJS.Signals = "SIGINT"): this {
        if (this.proc == null) { return this; }
        this.proc.kill(signal);
        return this;
    }
}