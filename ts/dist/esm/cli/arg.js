/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Color } from "../system/colors.js";
import { Or, And, and_or_str } from "./query.js";
import { Cast } from "./cast.js";
// ------------------------------------------------------------------
// Symbols
/**
 * A symbol to indicate no default value was used,
 * This way we can distinguish between `undefined` and no default value.
 */
export const NoDef = Symbol('vlib/cli/NoDef');
// ------------------------------------------------------------------
// Base argument class.
/**
 * {Arg}
 * Argument options for {@link CLI.get}.
 *
 * @template F The argument flags.
 * @template T Inferred casted inferred type.
 * @template E Inferred typeof of the `enum` attribute, required for `InferArgs`.
 */
export class Base {
    /** The argument mode. */
    mode;
    /** The argument variant. */
    variant;
    /** The strict mode, when `true` some additional checks are performed. */
    strict;
    /** The expected type, returned type will be auto casted to the mapped type. @attr */
    type;
    /** The default value to return when not found. @attr */
    def;
    /** The id attribute for the `id` variant. @attr */
    id;
    /**
     * The index number for the `index` variant.
     * When defined this ignores the `exclude_dash` option, since it is only used for non-index arguments.
     * @attr
     */
    index;
    /** When searching for this argument, exclude args found that start with a `-` prefix, so basically to ignore --arg like values. @attr */
    exclude_dash;
    /** Enumerate. */
    enum;
    /**
     * The name used as for the callback argument. Is auto inferred or optionally passed when flag `index` is present.
     */
    arg_name;
    /** Argument description. */
    description;
    /** Ignore this argument. */
    ignore;
    /**
     * Whether the argument is required or optional, defaults to `true`.
     * This already resolved and has already used `opts.required` and `opts.def` etc to determine the required value.
     */
    required;
    ;
    /** Constructor */
    constructor(opts, 
    // Non inferrable mode since all mode attrs are optional.
    mode, 
    // Strict mode, so we can auto infer all flags.
    strict) {
        // Also support direct `Arg` since this simplifies initialization types for `Command` and `CLI`.
        // if (opts instanceof Base) {
        //     this.variant = opts.variant;
        //     this.mode = opts.mode;
        //     this.strict = opts.strict;
        //     this.type = opts.type;
        //     this.def = opts.def;
        //     this.id = opts.id;
        //     this.index = opts.index;
        //     this.exclude_dash = opts.exclude_dash;
        //     this.enum = opts.enum;
        //     this.arg_name = opts.arg_name;
        //     this.description = opts.description;
        //     this.ignore = opts.ignore;
        //     this.required = opts.required;
        //     return ;
        // }
        // Assign variant, mode & strict.
        this.variant = Base.infer_variant(opts, true);
        this.mode = mode;
        this.strict = strict;
        // default exclude_dash to true:
        this.exclude_dash = opts.exclude_dash ?? true;
        this.type = opts.type;
        this.def = "def" in opts ? opts.def : NoDef;
        // Auto infer type.
        // Since later the types is sometimes used to check things
        // For instance boolean types are handled differently when parsed by `CLI.run_command`.
        // And when the type is inferred by InferArgs then it should match here.
        // note we cant assign `enum` to `this.type`.
        if (this.type == null) {
            if ("def" in opts) {
                const type = Cast.Type.parse(this.def, "string");
                if (type == null) {
                    throw new Error(`Invalid value type "${type}" of argument attribute "def", expected one of ${Array.from(Cast.Type.valid).join(", ")}. Argument: ${Color.object(opts)}}.`);
                }
                this.type = type;
            }
            else {
                this.type = "string";
            }
        }
        // Assign mode based attributes.
        if (this.mode === "command") {
            this.description = opts.description;
            this.ignore = (opts.ignore ?? false);
            opts.required ??= false;
            this.required = (this.def === NoDef && (typeof opts.required === "function"
                ? opts.required()
                : opts.required));
        }
        else {
            this.description = undefined;
            this.ignore = false;
            this.required = undefined;
        }
        // Process variant.
        switch (this.variant) {
            case "index":
                if (opts.index == null)
                    throw new Error(`Required argument attribute "index" is not defined for command argument ${Color.object(opts)}.`);
                if (opts.name) {
                    this.arg_name = opts.name;
                }
                else {
                    this.arg_name = `arg_${opts.index}`;
                }
                this.index = opts.index;
                this.id = undefined;
                break;
            case "id":
                if (!opts.id)
                    throw new Error(`Required argument attribute "id" is not defined for command argument ${Color.object(opts)}.`);
                this.index = undefined;
                // Assign id.
                if (typeof opts.id === "string") {
                    this.id = new Or(opts.id);
                }
                else if (opts.id instanceof Or || opts.id instanceof And) {
                    // is any Or or And.
                    this.id = opts.id;
                }
                else if (Array.isArray(opts.id)) {
                    this.id = new Or(...opts.id);
                }
                else {
                    // @ts-expect-error
                    opts.id.toString();
                    throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", expected string, string[] or Or | And.`);
                }
                // Assign name.
                if (opts.id.length === 0) {
                    throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", empty AND query.`);
                }
                let arg_name = undefined;
                if (opts.id instanceof And) {
                    if (mode === "query") {
                        const last = opts.id[opts.id.length - 1]; // use the last child for `AND` operations.
                        if (Array.isArray(last)) {
                            arg_name = last[0]; // use the first child for `OR` operations.
                        }
                        else {
                            arg_name = last;
                        }
                    }
                    else {
                        const names = opts.id.map(c => Array.isArray(c) ? c[0] : c);
                        arg_name = names.join(" & ");
                    }
                }
                else {
                    let child = opts.id;
                    while (child && typeof child !== "string") {
                        if (child instanceof And) {
                            child = child[child.length - 1]; // use the last child for `AND` operations.
                        }
                        else if (child instanceof Or || Array.isArray(child)) {
                            child = child[0]; // use the first child for `OR` operations.
                        }
                    }
                    if (typeof child !== "string") {
                        throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", could not resolve an identifier.`);
                    }
                    // console.log(`Resolving argument name from id "${and_or_str(arg.id)}" to "${child}".`);
                    let trim_start = 0, c;
                    while ((c = child.charAt(trim_start)) === "-" || c === " " || c === "\t" || c === "\r" || c === "\n") {
                        ++trim_start;
                    }
                    if (trim_start > 0) {
                        child = child.slice(trim_start);
                    }
                    child = child.replaceAll("-", "_").trimEnd();
                    if (typeof child !== "string" || !child) {
                        throw new Error(`Invalid command argument id "${and_or_str(opts.id)}", argument ended up empty after trimming.`);
                    }
                    arg_name = child;
                }
                if (typeof arg_name !== "string" || !arg_name) {
                    throw new Error(`Failed to resolve the argument name of command argument ${Color.object(opts)}.`);
                }
                this.arg_name = arg_name;
                break;
            default:
                // @ts-expect-error
                throw new Error(`Invalid command argument variant "${this.variant.toString()}". Expected "id" or "index".`);
        }
    }
    /** Infer the variant type. */
    static infer_variant(obj, throw_err) {
        if (typeof obj.index === "number") {
            return "index";
        }
        else if (obj.id != null) {
            return "id";
        }
        else if (throw_err) {
            throw new Error(`Invalid argument ${obj instanceof Base ? obj : Color.object(obj)} is missing both "id" and "index" attributes, cannot determine the variant.`);
        }
    }
    /** Get as identifier such as id/name/main based on variant + mode. */
    identifier() {
        if (this.variant === "index") {
            return `arg_${this.index}`;
        }
        else if (this.variant === "id") {
            return and_or_str(this.id);
        }
        else {
            // @ts-expect-error
            throw new Error(`Invalid argument variant "${this.variant.toString()}" for identifier.`);
        }
    }
    /** Create a string representation of the argument identifier. */
    toString() {
        return `Arg(${Color.object({
            variant: this.variant,
            mode: this.mode,
            id: and_or_str(this.id),
            index: this.index,
            type: this.type,
            def: this.def,
            required: this.required,
        })}`;
        return `Arg(${Color.object(this, {
            filter: v => v && "length" in v
                ? v.length
                : typeof v === "function" || typeof v === "boolean"
                    ? false
                    : Boolean(v)
        })}`;
    }
}
const cmd = new Base({ id: "version" }, "command", true);
// ------------------------------------------------------------------
// Create specific argument classes.
// This is so we dont have to define the flags every time we want to construct an argument.
/**
 * An argument of a command.
 * Used in the array of the `CLI.Command.args` attribute.
 */
export class Command extends Base {
    constructor(opts, strict) {
        super(opts, "command", strict);
    }
}
/**
 * The query command.
 * Used as info query for the `CLI.info` and `CLI.get` methods.
 */
export class Query extends Base {
    constructor(opts, strict) {
        super(opts, "query", strict);
    }
}
//# sourceMappingURL=arg.js.map