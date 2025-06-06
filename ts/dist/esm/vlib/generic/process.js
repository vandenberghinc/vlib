/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as cp from 'child_process';
/*  @docs:
    @chapter: System
    @title: Process
    @desc: The process class, used to start a child process.
*/
export class Proc {
    // Attributes.
    debug;
    proc = undefined;
    promise = undefined;
    err = undefined;
    out = undefined;
    exit_status = undefined;
    constructor({ debug = false } = {}) {
        this.debug = debug;
    }
    /*  @docs:
        @title: On output
        @desc: The on output event, can be overridden when required.
    */
    on_output(data) {
    }
    /*  @docs:
        @title: On error
        @desc: The on error event, can be overridden when required.
    */
    on_error(data) {
    }
    /*  @docs:
        @title: On exit
        @desc: The on exit event, can be overridden when required.
    */
    on_exit(code) {
    }
    /*  @docs:
        @title: Start
        @desc: Start a command.
        @param:
            @name: command
            @desc: The command program.
        @param:
            @name: args
            @desc: The command arguments.
        @param:
            @name: working_directory
            @desc: The working directory path.
        @param:
            @name: interactive
            @desc: Enable interactive mode.
            @experimental: true
        @param:
            @name: detached
            @desc: Enable detached mode.
        @param:
            @name: env
            @desc: The environment variables.
            @type: object
        @param:
            @name: colors
            @desc: Enable colors.
    */
    start({ command = "", args = [], working_directory = undefined, interactive = true, detached = false, env = undefined, colors = false, opts = {}, }) {
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
            const options = {
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
            }
            else if (colors) {
                options.env = { ...process.env, FORCE_COLOR: "true" };
            }
            this.proc = cp.spawn(command, args, options);
            // Set handlers.
            let closed = 0;
            if (this.proc.stdout) {
                this.proc.stdout.on('data', (data) => {
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
                this.proc.stderr.on('data', (data) => {
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
            this.proc.on('exit', (code) => {
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
            this.proc.on('close', (code) => {
                if (this.debug && closed === 1) {
                    console.log(`Child process exited with code ${code}.`);
                }
                ++closed;
                if (closed == 2) {
                    resolve(code);
                }
            });
        });
        return this.promise;
    }
    /*  @docs:
        @title: Write
        @desc: Write data to the stdin.
    */
    write(data) {
        if (this.proc != null && this.proc.stdin) {
            this.proc.stdin.write(data);
        }
        return this;
    }
    /*  @docs:
        @title: Join
        @desc: Wait till the process if finished.
        @note: This function must be awaited.
    */
    async join() {
        return new Promise(async (resolve) => {
            await this.promise;
            resolve();
        });
    }
    /*  @docs:
        @title: Kill
        @desc: Signal the process with a SIGINT signal.
    */
    kill(signal = "SIGINT") {
        if (this.proc == null) {
            return this;
        }
        this.proc.kill(signal);
        return this;
    }
}
//# sourceMappingURL=process.js.map