/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// The process class.
/*  @docs:
    @chapter: System
    @title: Process
    @desc: The process class, used to start a child process.
*/
vlib.Proc = class Proc {

    // Constructor.
    constructor({debug = false} = {}) {
        this.debug = debug;
        this.proc = null;
        this.promise = null;
        this.err = null;
        this.out = null;
        this.exit_status = null;
    }

    // On output.
    /*  @docs:
        @title: On output
        @desc: The on output event, can be overridden when required.
    */
    on_output(data) {
    }

    // On error.
    /*  @docs:
        @title: On error
        @desc: The on error event, can be overridden when required.
    */
    on_error(data) {
        return null;
    }

    // On exit.
    /*  @docs:
        @title: On exit
        @desc: The on exit event, can be overridden when required.
    */
    on_exit(code) {
        return null;
    }

    // Start.
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
    start({
        command = "",
        args = [],
        working_directory = null,
        interactive = true,
        detached = false,
        env = null,
        colors = false,
        opts = {},
    }) {

        // Reset.
        this.out = null;
        this.err = null;
        this.exit_status = null;

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
            }
            if (env != null) {
                options.env = env;
                if (colors) {
                    options.env.FORCE_COLOR = true;
                }
            } else if (colors) {
                options.env = { ...process.env, FORCE_COLOR: true };
            }
            this.proc = libproc.spawn(
                command,
                args,
                options,
            );
            // if (!interactive) {
            //     console.log(this.proc.stdin);
            //     this.proc.stdin.end();
            // }

            // Set handlers.
            let closed = 0;
            if (this.proc.stdout) {
                this.proc.stdout.on('data', (data) => {
                    data = data.toString();
                    if (this.debug) {
                        console.log("OUT:",data);
                    }
                    if (this.out === null) {
                        this.out = "";
                    }
                    this.out += data;
                    if (this.on_output !== undefined) {
                        this.on_output(data)
                    }
                })
            }
            if (this.proc.stderr) {
                this.proc.stderr.on('data', (data) => {
                    data = data.toString();
                    if (this.debug) {
                        console.log("ERR:",data);
                    }
                    if (this.err === null) {
                        this.err = "";
                    }
                    this.err += data;
                    if (this.on_error !== undefined) {
                        this.on_error(data);
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
                    resolve(this.exit_status);
                }
            });
            this.proc.on('close', (code) => {
                if (this.debug && closed === 1) {
                    console.log(`Child process exited with code ${code}.`);
                }
                ++closed;
                if (closed == 2) {
                    resolve(this.exit_status);
                }
            });

        });
        return this.promise;
    }

    // Write data to the stdin.
    /*  @docs:
        @title: Write
        @desc: Write data to the stdin.
    */
    write(data) {
        if (this.proc !== null) {
            this.proc.stdin.write(data);
            // this.proc.stdin.end()
        }
        return this;
    }

    // Wait till the process if finished.
    /*  @docs:
        @title: Join
        @desc: Wait till the process if finished.
        @note: This function must be awaited.
    */
    async join() {
        // return this.promise.
        return new Promise(async (resolve) => {
            await this.promise;
            resolve();
        })
    }

    // Kill the process.
    /*  @docs:
        @title: Kill
        @desc: Signal the process with a SIGINT signal.
    */
    kill(signal = "SIGINT") {
        if (this.proc == null) { return this; }
        this.proc.kill(signal);
        return this;
    }
}
