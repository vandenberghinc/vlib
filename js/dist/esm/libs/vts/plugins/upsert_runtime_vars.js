/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Path } from "../../../index.js";
// Imports.
import { Plugin } from "./plugin.js";
export var RuntimeVarsOpts;
(function (RuntimeVarsOpts) {
    function is(obj) {
        return (obj != null &&
            Array.isArray(obj.keys) &&
            (typeof obj.vars === "function" || typeof obj.vars === "object"));
    }
    RuntimeVarsOpts.is = is;
})(RuntimeVarsOpts || (RuntimeVarsOpts = {}));
/**
 * Upsert runtime variables into dist files.
 * This only replaces previously inserted variables, it does not check if the variables are already defined.
 */
export class UpsertRuntimeVars extends Plugin {
    /** Set id. */
    static id = new Plugin.Id("vts-upsert-runtime-vars");
    /** Attributes. */
    identifier;
    var_opts;
    code;
    insert_pattern;
    needs_insertion_pattern;
    /** Create a new instance of the plugin. */
    constructor({ identifier, vars, code = {} }) {
        super({
            type: "dist",
        });
        this.identifier = typeof identifier === "string" ? identifier : identifier.id;
        this.var_opts = RuntimeVarsOpts.is(vars)
            ? vars
            : Array.isArray(vars)
                ? { keys: vars[0], vars: vars[1] }
                : { keys: Object.keys(vars), vars: vars };
        this.insert_pattern = new RegExp(`/\\*\\* ${this.identifier} \\*/.*?/\\*\\* ${this.identifier} END \\*/[\r\n]*`, "g");
        this.needs_insertion_pattern = new RegExp(`(${this.var_opts.keys.map(key => key.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})`, "g");
        // Ensure code opts are properly formatted.
        this.code = {
            before: code.before ? (code.before + ";") : "",
            after: code.after ? (code.after + ";") : "",
        };
    }
    /** Process source callback. */
    async callback(source) {
        if (this.debug.on(3))
            this.log(source, "Running plugin...");
        // Check if the file already contains the variables.
        if (!this.needs_insertion_pattern.test(source.data)) {
            if (this.debug.on(2))
                this.log(source, `No need to insert runtime vars, pattern not found in source data.`);
            return;
        }
        // Process vars.
        let vars = {};
        if (typeof this.var_opts.vars === "function") {
            const res = this.var_opts.vars(source);
            if (res instanceof Promise) {
                vars = await res;
            }
            else {
                vars = res;
            }
        }
        else if (typeof this.var_opts.vars === "object" && this.var_opts.vars !== null) {
            vars = this.var_opts.vars;
        }
        else {
            throw new Error("Invalid vars type, expected object or function returning object.");
        }
        const var_entries = Object.entries(vars).map(([key, value]) => [key, value instanceof Path ? value.quote().path : JSON.stringify(value)]);
        // We could check if `(const|let|var) {KEY}` is not defined
        // Create the plugin data, ensure its a one liner since the pattern searches only for single line matches.
        const insert = `/** ${this.identifier} */ ` +
            this.code.before +
            var_entries.map(([name, value]) => `const ${name}=${value};`).join("") +
            this.code.after +
            ` /** ${this.identifier} END */\n`;
        const match = this.insert_pattern.exec(source.data);
        if (this.on(2))
            this.log(source, `Found match: ${match != null}`);
        if (match) {
            if (match[0] === insert) {
                if (this.on(2))
                    this.log(source, `Insert pattern already exists in source data, no changes made.`);
                return;
            }
            if (this.on(1))
                this.log(source, `Replacing existing insert pattern in source data.`);
            source.data = source.data.replace(this.insert_pattern, insert);
        }
        else {
            if (this.on(1))
                this.log(source, `Inserting new insert pattern in source data.`);
            source.data = insert + source.data;
        }
        source.changed = true;
    }
}
//# sourceMappingURL=upsert_runtime_vars.js.map