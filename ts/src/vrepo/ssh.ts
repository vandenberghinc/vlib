/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2024 - 2024 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

import { Path, Schema, Proc, object } from "@vlib"

// ---------------------------------------------------------
// The ssh class.

export class SSH {

    source: Path;
    proc: Proc;

    /** Constructor validator. */
    static validator = new Schema.Validator({
        throw: true,
        unknown: false,
        schema: {
            source: "string",
        },
    });
    
    // Constructor.
    constructor({
        source,
    }: {
        source: string
    }) {

        // Verify arguments.
        SSH.validator.validate(arguments[0]);

        // Parameters.
        this.source = new Path(source);

        // Attributes.
        this.proc = new Proc();
    }

    // Push through ssh.
    async push(alias: string, dest: string, del = false) {
        return new Promise<string | undefined>(async (resolve) => {
            // Vars.
            let err: string | undefined = "";
            let code = 0;

            // Set handlers.
            this.proc.on_output = (data) => {
            }
            this.proc.on_error = (data) => {
                err += data;
            }
            this.proc.on_exit = (_code) => {
                code = _code ?? -1;
                if (code != 0 && err == "") {
                    err += `Child process exited with code ${code}.`;
                }
            }

            // Trim.
            alias = alias.trim();
            dest = dest.trim();

            // Create args.
            const args = ["-azP", `${this.source.str()}/`, `${alias}:${dest}/`];
            if (del) { args.push("--delete"); }

            // Create a github repo.
            await this.proc.start({
                command: "rsync",
                args: args, // only works in production cause otherwise the terminal where electron was lauched will receive user input prompts.
                // command: `${SETTINGS.app_contents}/lib/non_interactive_exec.sh`,
                // args: ["rsync " + args.join(" ")], // otherwise it will cause weird errors or redirect to process.stdin which cant be fixed.
                working_directory: this.source.str(),
                interactive: false,
            })
            if (code != 0) {
                return resolve("Failed to push the repository over ssh:\n" + err);
            }
            resolve(undefined);
        })
    }

    // Push through ssh.
    async pull(alias: string, src: string, del = false) {
        return new Promise < string | undefined >(async (resolve) => {
            // Vars.
            let err: string | undefined = "";
            let code = 0;

            // Set handlers.
            this.proc.on_output = (data) => {
            }
            this.proc.on_error = (data) => {
                err += data;
            }
            this.proc.on_exit = (_code) => {
                code = _code ?? -1;
                if (code != 0 && err == "") {
                    err += `Child process exited with code ${code}.`;
                }
            }

            // Create args.
            const args = ["-azP", `${alias.trim()}:${src.trim()}/`, `${this.source.str()}/`];
            if (del) { args.push("--delete"); }

            // Create a github repo.
            await this.proc.start({
                command: "rsync",
                args: args, // only works in production cause otherwise the terminal where electron was lauched will receive user input prompts.
                // command: `${SETTINGS.app_contents}/lib/non_interactive_exec.sh`,
                // args: ["rsync " + args.join(" ")], // otherwise it will cause weird errors or redirect to process.stdin which cant be fixed.
                working_directory: this.source.str(),
                interactive: false,
            })
            if (code != 0) {
                return resolve("Failed to push the repository over ssh:\n" + err);
            }
            resolve(undefined);
        })
    }
}