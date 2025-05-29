/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Transform, Merge } from "../types/index.m.js";
import { Color } from "../system/colors.js";
import { Arg as BaseArg } from "./arg.js";
import { throw_error } from "./error.js";
import { Query } from "./query.js";
import type { CLI } from "./cli.js";
import { Scheme } from "../index.web.js";

/** Type alias for And and Or */
type And = Query.And<string | string[] | Query.Or>;
type Or = Query.Or<string>;

// ------------------------------------------------------------------------

export class Command<
    V extends BaseArg.Variant = BaseArg.Variant,
    A extends readonly Command.Arg[] = readonly Command.Arg[],
> {

    /** The id attribute for the `id` variant. @attr */
    id!: V extends "id"
        ? And | Or
        : never;

    /**
     * The index number for the `index` variant.
     * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
     * @attr
     */
    index!: V extends "index" ? number : never;

    /**
     * Description of the command for the CLI help.
     */
    description: string;

    /**
     * Command examples for the CLI help.
     */
    examples?: string | string[] | { [key: string]: string; };

    /**
     * Callback function to execute when the command is invoked.
     * The argument types should automatically be inferred from the `args` definitions.
     */
    callback: (args: ArgsFromDefs<A>) => void | Promise<void>;
 
    /**
     * Command arguments.
     * This list of argument is also used to infer the callback argument types.
     */
    args: Command.Arg[]

    /** The argument variant. */
    variant: V;

    /**
     * Initialize a command object.
     * @param variant - The command variant, this can be auto detected or an expected variant type.
     * @param opts - The command options to initialize.
     * @throws An error when the the command input is invalid.
     */
    constructor(
        opts: {
            description: Command["description"],
            examples?: Command["examples"],
            callback: Command["callback"];
            args?: Command.Arg.Opts[];
        } & (V extends "main"
            /** main/root command of the CLI, so no index nor id. */
            ? { id?: never; index?: never; }
            : V extends "id"
            /** identifier or query */
            ? { id: string | string[] | Or; index?: never; }
            /** positional index */
            : { id?: never; index: number }
        ),
        variant: V | "auto" = "auto",
    ) {

        // Attributes.
        this.description = opts.description;
        this.examples = opts.examples;
        this.callback = opts.callback as any;

        // Auto detect variant.
        if (variant === "auto") {
            if (typeof opts.index === "number") {
                variant = "index" as V;
            } else if (opts.id != null) {
                variant = "id" as V;
            } else {
                throw new Error(`Argument ${Color.object(opts)} is missing both "id" and "index" attributes, cannot determine the variant.`);
            }
        }

        // Process variant.
        switch (variant) {
            case "main":
                break;
            case "index":
                if (typeof opts.index !== "number") {
                    throw new Error(`Command variant "id" requires an "index" attribute to be defined, but got ${Color.object(opts.index)}.`);
                }
                (this as Command<"index">).index = opts.index;
                
                break;
            case "id":
                if (opts.id == null) {
                    throw new Error(`Command variant "id" requires an "index" attribute to be defined, but got ${Color.object(opts.index)}.`);
                }
                (this as Command<"id">).id = opts.id instanceof Query.Or || opts.id instanceof Query.And
                    ? opts.id
                    : typeof opts.id === "string"
                        ? new Query.Or(opts.id)
                        : new Query.Or(...opts.id);
                break;
            default:
                // @ts-expect-error
                throw new Error(`Invalid command variant "${variant.toString()}". Expected "id", "main" or "index".`);
        }
        this.variant = variant;

        // Initialize arguments.
        this.args = opts.args?.map(a => new BaseArg(a, "auto", "command")) ?? [];
    }


    /**
     * Find a command by a query.
     */
    find(
        commands: readonly Command[],
        query:
            // number // index based query.
            // | string // `name` based query.
            | { id: string | string[] | And | Or } // `id` based query.
    ) {
        if (typeof query === "number") {
            // Index based query.
            if (query < 0 || query >= commands.length) {
                throw new Error(`Command index ${query} is out of bounds, expected 0-${commands.length - 1}.`);
            }
            return commands[query];
        } else if (typeof query === "string") {
            // Name based query.
            const cmd = commands.find(c => c.id === query || c.description === query);
            if (!cmd) {
                throw new Error(`Command with name "${query}" not found.`);
            }
            return cmd;
        } else if (query && typeof query === "object" && "id" in query) {
            // Identifier based query.
        } else {
            // @ts-expect-error
            throw new Error(`Invalid query type: ${typeof query}. Expected a number, string or an object with an id property, not "${query.toString()}".`);
        }
    }

    /** Utility to check againt index. */
    eq_index(
        query: V extends "index" ? number : never,
    ) {
        if (this.variant !== "id") { throw new Error("Cannot use 'eq_index' on a command with id variant, use 'eq_id' instead."); }
        return this.index === query;
    }

    /** Check if the id attribute matches a certain query. */
    eq_id(
        query//: V extends "id" ? string | string[] | And | Or : never,
    ) {
        if (this.variant !== "id") { throw new Error("Cannot use `eq_id` on a command with index variant, use `eq_index` instead."); }
        return Command.eq_id(this.id, query);
    }

    /** Static helper method to check if the id attribute matches a certain query. */
    private static eq_id(
        id: And | Or | string[],
        query: string | string[] | And | Or,
    ) {
        if (id instanceof Query.And) {
            // special case when query is also an `And` operation
            if (query instanceof Query.And) {
                if (id.length !== query.length) { return false }
                return id.every((x, i) => {
                    const y = query[i];
                    if (x instanceof Query.And) {
                        return this.eq_id(x, y);
                    } else if (Array.isArray(y)) {
                        return this.eq_id(y, x);
                    } else {
                        return x === y;
                    }
                });
            }
            // normal case.
            return id.every(x => {
                if (x instanceof Query.And) {
                    return this.eq_id(x, query);
                } else if (Array.isArray(query)) {
                    return this.eq_id(query, x);
                } else {
                    return x === query;
                }
            });
        } else if (Array.isArray(id)) {
            // special case for when query is an `And` operation.
            if (query instanceof Query.And) {
                return id.some(x => this.eq_id(query, x))
            }
            // special case for when query is an `Or` operation.
            if (Array.isArray(query)) {
                return id.some(x => this.eq_id(query, x))
            }
            return id.includes(query);
        } else {
            Scheme.throw_invalid_type({
                name: "Command.eq_id_helper.id", type: ["And", "Or"], throw: true,
                /** @ts-expect-error */
                value: id.toString(),
            });
        }
    }

}

/** Command types. */
export namespace Command {

    /** Type alias for a command version argument. */
    export type Arg<
        V extends BaseArg.Variant = BaseArg.Variant,
        T extends BaseArg.Castable = BaseArg.Castable,
    > = BaseArg<V, "command", T>

    /** Types for the `Arg` type alias */
    export namespace Arg {
        /** Constructor options alias. */
        export type Opts<
            V extends BaseArg.Variant = BaseArg.Variant,
            T extends BaseArg.Castable = BaseArg.Castable,
        > = BaseArg.Opts<V, "command", T>;
    }

    /** Command constructor options. */
    export type Opts<
        V extends BaseArg.Variant = BaseArg.Variant,
        A extends readonly Command.Arg[] = readonly Command.Arg[],
    > = ConstructorParameters<typeof Command<V, A>>[0];

    /**
     * Command types.
     * Opts suffix are user input options, without is the initialized type.
     */
    export type Main<A extends readonly Command.Arg[] = readonly Command.Arg[]> = Command<"main", A>;
    export type MainOpts<A extends readonly Command.Arg[] = readonly Command.Arg[]> = Command.Opts<"main", A>;
    export type Id<A extends readonly Command.Arg[] = readonly Command.Arg[]> = Command<"id", A>;
    export type IdOpts<A extends readonly Command.Arg[] = readonly Command.Arg[]> = Command.Opts<"id", A>;
}

// ------------------------------------------------------------------------
// Utility types for inferring callback arguments from argument definitions.

/** Extract argument key. */
type ArgKey<D> =
    D extends { arg_name_str: infer N }
        ? N extends string
            ? N
            : never
        : never;

// value side – string-ification of the `type` setting and a little
//               undefined-friendliness when neither `def` nor
//               an explicit `required: true` was given.
type MaybeOptional<D, V> =
    // if a default is present => never undefined
    D extends { def: any }
    ? V
    // we can’t evaluate runtime callbacks (`required: () => boolean`)
    // at compile time, so we assume it *might* be missing
    : V | undefined;

type ArgValue<D> =
    D extends { type: infer T extends BaseArg.Castable }
    ? MaybeOptional<D, BaseArg.Cast<T>>
    : D extends { def: infer DF }
    ? DF                     // default dictates the type
    : undefined;             // nothing to go on → undefined

export type ArgsFromDefs<
    L extends readonly BaseArg<any, any>[]
> = {
    [D in L[number]as ArgKey<D>]: ArgValue<D>;
};


// -------------- TESTS --------------------------

const _test_cmd_1: Command.IdOpts = {
    id: "--push",
    description: "Push the current project to one or multiple remotes.",
    examples: {
        "Push": "vrepo --push --git origin --ssh myserver,mybackupserver --del --forced",
    },
    args: [
        { id: "--source", type: "string", required: false, description: "The source path to the package, when undefined the current working directory will be used as the package." },
        { id: "--x", type: "number", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
        { id: "--sources", type: "string[]", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
        { id: "--git", type: "string[]", description: "Push to all git or a list of specific git remotes.", def: [] },
        { id: "--ssh", type: "string[]", description: "Push to all ssh or a list of specific ssh remotes.", def: [] },
        { id: ["--forced", "-f"], type: "boolean", description: "Push with git in forced mode." },
        { id: ["--del", "-d"], type: "boolean", description: "Push with ssh in delete mode." },
        { id: ["--ensure-push", "-e"], type: "boolean", description: "Ensure a git push by editing the gitignore safely." },
        { id: ["--log-level", "-l"], type: "number", description: "The log level." },
    ],
    callback: async ({
        source = null,
        sources,
        git = null,
        ssh = null,
        forced = false,
        del = false,
        ensure_push = false,
        log_level = 0,
        x,
    }) => {
        const _x = x;
        const y = sources;

        // Create sources array.
        const all_sources: string[] = [];
        if (typeof source === "string") {
            all_sources.push(source);
        } else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        } else {
            all_sources.push("./");
        }
    }
}
