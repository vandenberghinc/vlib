/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Color } from "../system/colors.js";
import { throw_error } from "./error.js";
import { Query } from "./query.js";
/** Command types. */
export var Command;
(function (Command) {
    /**
     * Initialize a command object.
     * @param variant - The command variant, this can be auto detected or an expected variant type.
     * @param cmd - The command to initialize.
     * @throws An error when the the command input is invalid.
     * @returns The initialized command.
     */
    function init(variant, cmd) {
        let id = undefined;
        if (variant === "id") {
            if (!cmd.id) {
                throw_error(`Command attribute "id" is required for type command type "id".`);
            }
            id = cmd.id instanceof Query.Or || cmd.id instanceof Query.And
                ? cmd.id
                : typeof cmd.id === "string"
                    ? new Query.Or(cmd.id)
                    : new Query.Or(...cmd.id);
        }
        else if (variant === "main") {
            id = new Query.Or("<main>");
        }
        else if (variant === "index") {
            throw_error(`Command variant "index" is not supported, use "id" or "main" instead.`);
        }
        else {
            // @ts-expect-error
            throw_error(`Invalid command variant "${variant.toString()}". Expected "id" or "main".`);
        }
        if (!cmd.args) {
            cmd.args = [];
        }
        return {
            ...cmd,
            variant,
            id: id,
            args: cmd.args.map((a) => init_cmd_arg("auto", a))
        };
    }
    Command.init = init;
    /**
     * Initialize a command argument.
     * @param variant - The command argument variant, this can be auto detected or an expected variant type.
     * @param arg - The command argument to initialize.
     * @throws An error when the the command argument input is invalid.
     * @returns The initialized command argument.
     */
    function init_cmd_arg(variant, arg) {
        // Auto detect variant.
        if (variant === "auto") {
            if (typeof arg.index === "number") {
                variant = "index";
            }
            else if (arg.id != null) {
                variant = "id";
            }
            else {
                throw_error(`Command argument ${Color.object(arg)} is missing both "id" and "index" attributes, cannot determine the variant.`);
            }
        }
        // Process variant.
        let arg_name = arg.name;
        switch (variant) {
            case "main":
                arg_name = "__main__";
                break;
            case "index":
                if (arg.index == null)
                    throw_error(`Required argument attribute "index" is not defined for command argument ${Color.object(arg)}.`);
                if (!arg_name) {
                    arg_name = `arg_${arg.index}`;
                }
                break;
            case "id":
                if (!arg.id)
                    throw_error(`Required argument attribute "id" is not defined for command argument ${Color.object(arg)}.`);
                if (!arg_name) {
                    if (arg.id instanceof Query.And) {
                        arg_name = arg.id[arg.id.length - 1]; // use the last child for `AND` operations.
                        if (Array.isArray(arg_name)) {
                            arg_name = arg_name[0]; // use the first child for `OR` operations.
                        }
                    }
                    else {
                        let child = arg.id;
                        while (child && typeof child !== "string") {
                            if (child instanceof Query.And) {
                                child = child[child.length - 1]; // use the last child for `AND` operations.
                            }
                            else if (Array.isArray(child)) {
                                child = child[0]; // use the first child for `OR` operations.
                            }
                        }
                        if (typeof child !== "string") {
                            throw_error(`Invalid command argument id "${Query.to_str(arg.id)}", could not resolve an identifier.`);
                        }
                        // console.log(`Resolving argument name from id "${Query.to_str(arg.id)}" to "${child}".`);
                        arg_name = child;
                        let trim_start = 0, c;
                        while ((c = arg_name.charAt(trim_start)) === "-" || c === " " || c === "\t" || c === "\r" || c === "\n") {
                            ++trim_start;
                        }
                        if (trim_start > 0) {
                            arg_name = arg_name.slice(trim_start);
                        }
                        arg_name = arg_name.replaceAll("-", "_").trimEnd();
                        if (typeof arg_name !== "string" || !arg_name) {
                            throw_error(`Invalid command argument id "${Query.to_str(arg.id)}", argument ended up empty after trimming.`);
                        }
                    }
                    if (typeof arg_name !== "string" || !arg_name) {
                        throw_error(`Failed to resolve the argument name of command argument ${Color.object(arg)}.`);
                    }
                }
                break;
            default:
                // @ts-expect-error
                throw_error(`Invalid command argument variant "${variant.toString()}". Expected "id", "main" or "index".`);
        }
        return {
            ...arg,
            variant: variant,
            name: arg_name,
            optional: arg.optional ?? (arg.required === false || arg.def !== undefined),
        };
    }
    Command.init_cmd_arg = init_cmd_arg;
})(Command || (Command = {}));
// -------------- TESTS --------------------------
const cmd = {
    id: "--push",
    description: "Push the current project to one or multiple remotes.",
    examples: {
        "Push": "vrepo --push --git origin --ssh myserver,mybackupserver --del --forced",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the package." },
        { id: "--sources", type: "string[]", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
        { id: "--git", type: "string[]", description: "Push to all git or a list of specific git remotes.", def: [] },
        { id: "--ssh", type: "string[]", description: "Push to all ssh or a list of specific ssh remotes.", def: [] },
        { id: ["--forced", "-f"], type: "boolean", description: "Push with git in forced mode." },
        { id: ["--del", "-d"], type: "boolean", description: "Push with ssh in delete mode." },
        { id: ["--ensure-push", "-e"], type: "boolean", description: "Ensure a git push by editing the gitignore safely." },
        { id: ["--log-level", "-l"], type: "number", description: "The log level." },
    ],
    callback: async ({ source = null, sources = null, git = null, ssh = null, forced = false, del = false, ensure_push = false, log_level = 0, }) => {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
    }
};
// @v1 -----------------
// /**
//  * @author Daan van den Bergh
//  * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
//  */
// // Imports.
// import { Transform, Merge } from "../types/index.m.js";
// import { Arg } from "./arg.js";
// import { throw_error } from "./error.js";
// import { Query } from "./query.js";
// import type { CLI } from "./cli.js";
// /**
//  * InferArgs Helper: Define a literal-based ArgDef
//  */
// export interface ArgDef<Name extends string, T extends Arg.Castable> {
//     id: Name;
//     type: T;
// }
// /**
//  * Turn a tuple of ArgDef<Name, Type> into
//  * a mapping from Name to the correctly-casted value.
//  */
// type InferArgs<Arr extends readonly ArgDef<string, Arg.Castable>[]> = {
//     [P in Arr[number]as P["id"]]:
//     // If P["type"] is an array of types, infer U and ensure it's a valid Arg.Type
//     P["type"] extends readonly (infer U)[]
//     ? U extends Arg.Type
//     ? Arg.Cast<U>
//     : never
//     // Otherwise, it's a single CLI.Arg.Type
//     : P["type"] extends Arg.Type
//     ? Arg.Cast<P["type"]>
//     : never
// };
// /** Command base options. */
// export class Command<
//     Type extends "id" | "main" = "id",
//     Args extends ArgDef<string, Arg.Type | Arg.Type[]>[] = ArgDef<string, any>[],
// > {
//     id: Type extends "id" ? Command.Query : never;
//     /**
//      * Description of the command for the CLI help.
//      */
//     description?: string;
//     /**
//      * Command examples for the CLI help.
//      */
//     examples?: string | string[] | { [key: string]: string; };
//     /**
//      * Command arguments.
//      */
//     args: (CLI.Get.Opts & { description: string })[];
//     /**
//      * Callback function to execute when the command is invoked.
//      */
//     callback: (args: InferArgs<Args>) => void | Promise<void>;
//     /**
//      * Initialize.
//      */
//     constructor(
//         arg: Command.Opts<Type, Args>,
//         type: Type,
//     ) {
//         if (type === "id" && !arg.id) {
//             throw_error(`Command attribute "id" is required for type command type "id".`);
//         }
//         this.id = type === "id" ? this.resolve_id(arg.id!) : undefined as never;
//         this.description = arg.description;
//         this.examples = arg.examples;
//         this.args = arg.args ?? [];
//         // this.args = arg.args ? arg.args.map(a => new Arg(a, a.index == null ? "id" : "index")) : [];
//         this.callback = arg.callback;
//     }
//     /** Initialize a query to an id, so cast strings to Or/And. */
//     private resolve_id(q: Query.Public): Command<Type>["id"] {
//         return (q instanceof Query.Or || q instanceof Query.And
//             ? q
//             : typeof q === "string"
//                 ? new Query.Or(q)
//                 : new Query.Or(...q)
//         ) as Command<Type>["id"];
//     }
// }
// /** Command types. */
// export namespace Command {
//     /**
//      * Command options.
//      */
//     export type Opts<
//         Type extends "id" | "main" = "id",
//         Args extends ArgDef<string, Arg.Type | Arg.Type[]>[] = ArgDef<string, any>[],
//     > = Type extends "id"
//         ? Transform<
//             Command<Type, Args>,
//             never, never, never, { args?: CLI.Get.Opts[], id: Query.Public }, never
//         > : Transform<
//             Command<Type, Args>,
//             never, never, "id", { args?: CLI.Get.Opts[] }, never
//         >
//     // export type Opts<
//     //     Type extends "id" | "main" = "id",
//     //     Args extends ArgDef<string, Arg.Type | Arg.Type[]>[] = ArgDef<string, any>[],
//     // > = Type extends "id"
//     //     ? Merge<Command<Type, Args>, { args?: Arg.Opts[], id: Query.Public }>
//     //     : Merge<Command<Type, Args>, { args?: Arg.Opts[], id?: never }>
//     /** Query type. */
//     export type Query = Query.And | Query.Or;
// }
//# sourceMappingURL=command.js.map