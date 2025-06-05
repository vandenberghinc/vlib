/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../vlib/index.js";
import { Plugin, Source } from "./plugin.js";
/** Runtime variable options. */
interface RuntimeVars {
    [key: string]: string | number | boolean | Path;
}
/** Runtime vars options. */
interface RuntimeVarsOpts<T extends RuntimeVars = RuntimeVars> {
    keys: (Extract<keyof T, string>)[];
    vars: T | ((source: Source<"loaded">) => T | Promise<T>);
}
export declare namespace RuntimeVarsOpts {
    function is<T extends RuntimeVars = RuntimeVars>(obj: any): obj is RuntimeVarsOpts<T>;
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
    code?: {
        before?: string;
        after?: string;
    };
}
/**
 * Upsert runtime variables into dist files.
 * This only replaces previously inserted variables, it does not check if the variables are already defined.
 */
export declare class UpsertRuntimeVars<Vars extends RuntimeVars = RuntimeVars> extends Plugin {
    /** Set id. */
    static id: Plugin.Id;
    /** Attributes. */
    identifier: string;
    var_opts: RuntimeVarsOpts<Vars>;
    code: {
        before: string;
        after: string;
    };
    insert_pattern: RegExp;
    needs_insertion_pattern: RegExp;
    /** Create a new instance of the plugin. */
    constructor({ identifier, vars, code }: UpsertRuntimeVarsOpts<Vars>);
    /** Process source callback. */
    callback(source: Source<"loaded">): Promise<void>;
}
export {};
