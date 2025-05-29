/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Path } from "../../../index.js";
import { compute_diff } from "../utils/compute_diff.js";

// Imports.
import { Plugin, Source } from "./plugin.js";

/** Runtime variable options. */
interface RuntimeVars {
    [key: string]: 
        string | number | boolean // primitives.
        | Path // paths will be added as quoted strings
}

/** Runtime vars options. */
interface RuntimeVarsOpts<T extends RuntimeVars = RuntimeVars> {
    keys: (Extract<keyof T, string>)[];
    vars: T | ((source: Source<"loaded">) => T | Promise<T>),
}
export namespace RuntimeVarsOpts {
    export function is<T extends RuntimeVars = RuntimeVars>(obj: any): obj is RuntimeVarsOpts<T> {
        return (
            obj != null &&
            Array.isArray(obj.keys) &&
            (typeof obj.vars === "function" || typeof obj.vars === "object")
        );
    }
}

/**
 * Plugin options for upserting runtime variables.
 * @attr vars
 *      The runtime variables to insert, e.g. { __filename: "path/to/file.ts", __dirname: "path/to/dir" }.
 *      String and Paths are automatically quoted, for others JSON.stringify is used.
 * @attr code Optional code to insert before and/or after the variables.
 */
export interface UpsertRuntimeVarsOpts<Vars extends RuntimeVars = RuntimeVars> {
    identifier: Plugin.Id | string;
    vars: Vars | RuntimeVarsOpts<Vars> | [RuntimeVarsOpts<Vars>["keys"], RuntimeVarsOpts<Vars>["vars"]];
    code?: { before?: string, after?: string };
}

/**
 * Upsert runtime variables into dist files.
 * This only replaces previously inserted variables, it does not check if the variables are already defined.
 */
export class UpsertRuntimeVars<Vars extends RuntimeVars = RuntimeVars> extends Plugin {

    /** Set id. */
    static id = new Plugin.Id("vts-upsert-runtime-vars");

    /** Attributes. */
    identifier: string;
    var_opts: RuntimeVarsOpts<Vars>;
    code: { before: string, after: string };
    insert_pattern: RegExp;
    needs_insertion_pattern: RegExp;

    /** Create a new instance of the plugin. */
    constructor({ identifier, vars, code = {} }: UpsertRuntimeVarsOpts<Vars>) {
        super({
            type: "dist",
        });
        this.identifier = typeof identifier === "string" ? identifier : identifier.id;
        this.var_opts = RuntimeVarsOpts.is<Vars>(vars)
            ? vars
            : Array.isArray(vars)
                ? { keys: vars[0] as any[], vars: vars[1] }
                : { keys: Object.keys(vars), vars: vars }
        this.insert_pattern = new RegExp(
            `/\\*\\* ${this.identifier} \\*/.*?/\\*\\* ${this.identifier} END \\*/[\r\n]*`,
            "g",
                );
        this.needs_insertion_pattern = new RegExp(
            `(${this.var_opts.keys.map(key => key.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})`,
            "g",
        );

        // Ensure code opts are properly formatted.
        this.code = {
            before: code.before ? (code.before + ";") : "",
            after: code.after ? (code.after + ";") : "",
        };
    }

    /** Process source callback. */
    async callback(source: Source<"loaded">) {
        if (this.debug.on(3)) this.log(source, "Running plugin...");

        // Check if the file already contains the variables.
        if (!this.needs_insertion_pattern.test(source.data)) {
            if (this.debug.on(2)) this.log(source, `No need to insert runtime vars, pattern not found in source data.`);
            return;
        }

        // Process vars.
        let vars: Partial<Vars> = {};
        if (typeof this.var_opts.vars === "function") {
            const res = this.var_opts.vars(source);
            if (res instanceof Promise) {
                vars = await res;
            }
            else {
                vars = res;
            }
        } else if (typeof this.var_opts.vars === "object" && this.var_opts.vars !== null) {
            vars = this.var_opts.vars;
        } else {
            throw new Error("Invalid vars type, expected object or function returning object.");
        }
        const var_entries: [string, string][] = Object.entries(vars).map(([key, value]) =>
            [key, value instanceof Path ? value.quote().path : JSON.stringify(value)]
        );

        // We could check if `(const|let|var) {KEY}` is not defined

        // Create the plugin data, ensure its a one liner since the pattern searches only for single line matches.
        const insert = `/** ${this.identifier} */ ` +
            this.code.before +
            var_entries.map(([name, value]) => `const ${name}=${value};`).join("") +
            this.code.after +
            ` /** ${this.identifier} END */\n`;

        const match = this.insert_pattern.exec(source.data);
        if (this.on(2)) this.log(source, `Found match: ${match != null}`);
        if (match) {
            if (match[0] === insert) {
                if (this.on(2)) this.log(source, `Insert pattern already exists in source data, no changes made.`);
                return;
            }
            if (this.on(1)) this.log(source, `Replacing existing insert pattern in source data.`);
            source.data = source.data.replace(this.insert_pattern, insert);
        } else {
            if (this.on(1)) this.log(source, `Inserting new insert pattern in source data.`);
            source.data = insert + source.data;
        }
        source.changed = true;

    }
}
