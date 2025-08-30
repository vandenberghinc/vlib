/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Color } from "../generic/colors.js";
import { CLIError } from "./error.js";
import { And, and_or_str, Or } from "./query.js";
import * as Scheme from "../schema/index.m.node.js";
import * as Arg from "./arg.js";
// ------------------------------------------------------------------------
/**
 * The base command class of derived command classes.
 * @note For instance when no Variant flag is set then never is used as id etc.
 *       This is fine because we let the derived classes handle the default variant and fixed mode.
 */
export class Base {
    /** The command mode. */
    mode;
    /** The command variant. */
    variant;
    /** The strict mode, when `true` some additional checks are performed. */
    strict;
    /** The id attribute for the `id` variant. */
    id;
    /**
     * The index number for the `index` variant.
     * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
     * @attr
     */
    index;
    /**
     * Description of the command for the CLI help.
     */
    description;
    /**
     * Command examples for the CLI help.
     */
    examples;
    /**
     * Callback function to execute when the command is invoked.
     * The argument types should automatically be inferred from the `args` definitions.
     * The command is bound to the Base instance, so `this` is the command instance.
     * @note That we dont infer the actual args here, this causes issues with converting matching Base types.
     *       Only infer on the user input callback so the user has the correct types.
     */
    callback;
    /**
     * Command arguments.
     * This list of argument is also used to infer the callback argument types.
     */
    args;
    /** The attached CLI. */
    cli;
    /**
     * Initialize a command object.
     * @param variant - The command variant, this can be auto detected or an expected variant type.
     * @param opts - The command options to initialize.
     * @throws An error when the the command input is invalid.
     */
    constructor(opts, 
    // Separate mode to force `id` and `index` attribute checks.
    mode, 
    // Strict mode, so we can auto infer all flags.
    strict) {
        // Also support direct `Command` since this simplifies initialization types for `CLI`.
        if (opts instanceof Base) {
            this.variant = opts.variant;
            this.mode = opts.mode;
            this.strict = opts.strict;
            this.id = opts.id;
            this.index = opts.index;
            this.description = opts.description;
            this.examples = opts.examples;
            this.callback = opts.callback;
            this.args = opts.args;
            return;
        }
        // Attributes.
        this.description = opts.description;
        this.examples = opts.examples ?? [];
        this.callback = opts.callback.bind(this);
        this.mode = mode;
        this.strict = strict;
        // Auto detect variant.
        // Is undefined when mode is never.
        this.variant = Arg.Base.infer_variant(opts, this.mode !== "main");
        // Process index and id attributes.
        if (this.mode === "main") {
            this.index = undefined;
            this.id = undefined;
        }
        else {
            switch (this.variant) {
                case "index":
                    if (typeof opts.index !== "number") {
                        throw new Error(`Command variant "id" requires an "index" attribute to be defined, but got ${Color.object(opts)}.`);
                    }
                    this.index = opts.index;
                    this.id = undefined;
                    break;
                case "id":
                    if (opts.id == null) {
                        throw new Error(`Command variant "id" requires an "index" attribute to be defined, but got ${Color.object(opts)}.`);
                    }
                    this.index = undefined;
                    this.id = (opts.id instanceof And || opts.id instanceof Or
                        ? opts.id
                        : typeof opts.id === "string"
                            ? new Or(opts.id)
                            : new Or(...opts.id));
                    break;
                default:
                    // @ts-expect-error
                    throw new Error(`Invalid command variant "${variant.toString()}". Expected "id", "index".`);
            }
        }
        // Initialize arguments.
        if (opts.args) {
            this.args = (opts.args.map(a => a instanceof Arg.Command
                ? a
                : new Arg.Command(a, this.strict)) ?? []);
        }
        else {
            this.args = [];
        }
    }
    /** Initialize the command and assign the `cli` attribute. */
    init(cli) {
        if (this.cli) {
            throw new Error(`Command "${this.id}" is already initialized with a CLI.`);
        }
        this.cli = cli;
    }
    /**
     * Find a command by a query.
     */
    find(commands, query // `id` based query.
    ) {
        if (typeof query === "number") {
            // Index based query.
            if (query < 0 || query >= commands.length) {
                throw new Error(`Command index ${query} is out of bounds, expected 0-${commands.length - 1}.`);
            }
            return commands[query];
        }
        else if (typeof query === "string") {
            // Name based query.
            const cmd = commands.find(c => c.id === query || c.description === query);
            if (!cmd) {
                throw new Error(`Command with name "${query}" not found.`);
            }
            return cmd;
        }
        else if (query && typeof query === "object" && "id" in query) {
            // Identifier based query.
        }
        else {
            // @ts-expect-error
            throw new Error(`Invalid query type: ${typeof query}. Expected a number, string or an object with an id property, not "${query.toString()}".`);
        }
    }
    /** Utility to check againt index. */
    eq_index(query) {
        if (this.variant !== "id") {
            throw new Error("Cannot use 'eq_index' on a command with id variant, use 'eq_id' instead.");
        }
        return this.index === query;
    }
    /** Check if the id attribute matches a certain query. */
    eq_id(query //: V extends "id" ? string | string[] | And | Or : never,
    ) {
        if (this.variant !== "id") {
            throw new Error("Cannot use `eq_id` on a command with index variant, use `eq_index` instead.");
        }
        return Base.eq_id(this.id, query);
    }
    /** Static helper method to check if the id attribute matches a certain query. */
    static eq_id(id, query) {
        if (id instanceof And) {
            // special case when query is also an `And` operation
            if (query instanceof And) {
                if (id.length !== query.length) {
                    return false;
                }
                return id.every((x, i) => {
                    const y = query[i];
                    if (x instanceof And) {
                        return this.eq_id(x, y);
                    }
                    else if (y instanceof Or || Array.isArray(y)) {
                        return this.eq_id(y, x);
                    }
                    else {
                        return x === y;
                    }
                });
            }
            // normal case.
            return id.every(x => {
                // if (x instanceof And) {
                //     return this.eq_id(x, query);
                // } else 
                if (query instanceof Or || Array.isArray(query)) {
                    return this.eq_id(query, x);
                }
                else {
                    return x === query;
                }
            });
        }
        else if (id instanceof Or || Array.isArray(id)) {
            // special case for when query is an `And` operation.
            if (query instanceof And) {
                return id.some(x => this.eq_id(query, x));
            }
            // special case for when query is an `Or` operation.
            if (query instanceof Or || Array.isArray(query)) {
                return id.some(x => this.eq_id(query, x));
            }
            return id.includes(query);
        }
        else {
            Scheme.throw_invalid_type({
                name: "Command.eq_id.id",
                type: ["And", "Or"],
                throw: true,
                /** @ts-expect-error */
                value: id.toString(),
            });
        }
    }
    /** Convert to a string identifier. */
    identifier() {
        if (this.mode === "main") {
            return "main";
        }
        else if (this.variant === "id") {
            return and_or_str(this.id);
        }
        else if (this.variant === "index") {
            return `arg_${this.index}`;
        }
        else {
            throw new Error(`Invalid command variant "${this.variant}". Expected "id" or "index".`);
        }
    }
    /**
     * Throw an error for this command.
     * Wrapper function for `CLI.error`.
     */
    error(err, opts = {}) {
        if (err instanceof CLIError) {
            return err;
        }
        if (!this.cli) {
            throw new Error(`Command "${this.identifier()}" is not initialized with a CLI, cannot throw an error.`);
        }
        opts.command = this;
        return this.cli.error(err, opts);
    }
}
/**
 * Main command argument, used for the main CLI command.
 * Also ensure a default variant is set.
 */
export class Main extends Base {
    constructor(opts, strict) {
        super(opts, "main", strict);
    }
}
/**
 * A non main command.
 * Used as CLI commands.
 * Also ensure a default variant is set.
 */
export class Command extends Base {
    constructor(opts, strict) {
        super(opts, "command", strict);
    }
}
// // ————————————————————————————————————————————————————————
// // INTERNAL TESTS
// //
// // Minor BaseArg.Cast checks just to be sure.
// const cast_test_nr: BaseArg.Cast<"number"> = 42; 
// const cast_test_str: BaseArg.Cast<"string"> = "hello";
// const cast_test_bool_arr: BaseArg.Cast<"boolean[]"> = [true]; 
// // @ts-expect-error;
// const cast_test_bool_arr_err: BaseArg.Cast<"boolean[]"> = [undefined];
// // Command uses the InferArgs to define the `callback` type as `callback: (args: InferArgs<A>) => void | Promise<void>`
// const _arg_opts: readonly Command.Arg.Opts[] = [{
//     id: "--some_str",
//     type: "string",
// }]
// const _test_cmd_1 = new Command({
//     id: "test",
//     description: "test",
//     args: [
//         // Name based.
//         { name: "some_def_str" },
//         { name: "some_str", type: "string" },
//         { name: "some_nr", type: "number" },
//         { name: "some_opt_nr", type: "number", required: false },
//         {
//             name: "some_opt_nr_2",
//             type: "number",
//             required: () => {
//                 return true || false;
//             },
//         },
//         { name: "some_list", type: "string[]" },
//         { name: "some_bool_list", type: "boolean[]" },
//         // Name based.
//         { id: "id_some_def_str" },
//         { id: "id_some_str", type: "string" },
//         { id: "id_some_nr", type: "number" },
//         { id: "id_some_opt_nr", type: "number", required: false },
//         {
//             name: "id_some_opt_nr_2",
//             type: "number",
//             required: () => {
//                 return true || false;
//             },
//         },
//         { id: "id_some_list", type: "string[]" },
//         { id: "id_some_bool_list", type: "boolean[]" },
//         // Index based.
//         { index: 0, type: "number" },
//     ],
//     callback: async (args) => {
//         // Name based.
//         const _some_def_str: string = args.some_def_str;
//         const _some_str: string = args.some_str;
//         const _some_nr: number = args.some_nr;
//         // @ts-expect-error – may be undefined
//         const _some_opt_nr: number = args.some_opt_nr;
//         // @ts-expect-error – may be undefined
//         const _some_opt_nr_2: number = args.some_opt_nr_2;
//         const _some_list: string[] = args.some_list;
//         const _some_bool_list: boolean[] = args.some_bool_list;
//         // Id based.
//         const _id_some_def_str: string = args.id_some_def_str;
//         const _id_some_str: string = args.id_some_str;
//         const _id_some_nr: number = args.id_some_nr;
//         // @ts-expect-error – may be undefined
//         const _id_some_opt_nr: number = args.id_some_opt_nr;
//         // @ts-expect-error – may be undefined
//         const _id_some_opt_nr_2: number = args.id_some_opt_nr_2;
//         const _id_some_list: string[] = args.some_list;
//         const _id_some_bool_list: boolean[] = args.id_some_bool_list;
//         // Index based.
//         const _index_some_nr: number = args.arg_0;
//     }
// }, "id");
// const _test_cmd_2 = new Command({
//     id: "test",
//     description: "test",
//     args: [
//         // Name based.
//         { id: "id_some_def_str" },
//     ],
//     callback: async (args) => {
//         const _id_some_def_str: string = args.id_some_def_str;
//     }
// }, "id");
//# sourceMappingURL=command.js.map