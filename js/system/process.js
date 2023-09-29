/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

const libproc = require("proc");

// ---------------------------------------------------------
// The process class.

class Proc {

    // Constructor.
    constructor() {
        this.proc = null;
        this.promise = null;
        this.err = null;
        this.out = "";
        this.exit_status = null;
    }

    // On output.
    // Can be overridden when required.
    // Beware that attribute "this.out" will not be assigned when this callback is overridden.
    on_output(data) {
        this.out += data;
    }

    // On error.
    // Can be assigned when required.
    // on_error(data) {
    //     return null;
    // }

    // On exit.
    // Can be assigned when required.
    // on_exit(code, status) {
    //     return null;
    // }

    // Start.
    start({
        command = "",
        args = [],
        working_directory = null,
        interactive = true,
        detached = false,
    }) {
        if (!SETTINGS.electron) {
            console.error("Unsupported");
            return null;
        }

        // Set promise.
        this.promise = new Promise((resolve) => {

            // Spawn.
            this.proc = libproc.spawn(
                command,
                args,
                {
                    cwd: working_directory,
                    stdio: [interactive ? "pipe" : "ignore", "pipe", "pipe"],
                    shell: interactive,
                    detached: detached,
                    env: {
                         ...process.env,
                        "GIT_TERMINAL_PROMPT": "0",
                    },
                },
            );

            // Set handlers.
            let closed = 0;
            this.proc.stdout.on('data', (data) => {
                if (this.on_output !== undefined) {
                    this.on_output(data.toString())
                }
            })
            this.proc.stderr.on('data', (data) => {
                data = data.toString();
                this.err += data;
                if (this.on_error !== undefined) {
                    this.on_error(data);
                }
            });
            this.proc.on('exit', (code, status) => {
                this.exit_status = code;
                if (code != 0 && err == "") {
                    err += `Child process exited with code ${code}.`;
                }
                if (this.on_exit !== undefined) {
                    this.on_exit(code, status);
                }
                ++closed;
                if (closed == 2) {
                    resolve();
                }
            });
            this.proc.on('close', (code, status) => {
                ++closed;
                if (closed == 2) {
                    resolve();
                }
            });

        });
        return this.promise;
    }

    // Write data to the stdin.
    write(data) {
        if (this.proc !== null) {
            this.proc.stdin.write(data);
            // this.proc.stdin.end()
        }
        return this;
    }

    // Wait till the process if finished.
    // @warning: This function must be awaited.
    async join() {
        // return this.promise.
        return new Promise(async (resolve) => {
            await this.promise;
            resolve();
        })
    }

    // Kill the process.
    kill(signal = "SIGINT") {
        if (this.proc == null) { return this; }
        this.proc.kill(signal);
        return this;
    }
}

// ---------------------------------------------------------
// Exports.

module.exports = Proc;
