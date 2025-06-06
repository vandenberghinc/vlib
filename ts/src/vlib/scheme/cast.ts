/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/**
 * Cast a type name or type names union to its corresponding value type.
 * Also supports already casted value types as input.
 */
export type Cast<
    T extends never | undefined | Cast.Castable | Cast.Value,
    Def extends any = string, // returned type for undefined | null
    Never extends any = string, // returned type for never
> =
    [T] extends [never] ? Never :
    T extends | null | undefined ? Def :
    T extends Function ? T : // since we support funcs / class types
    T extends Cast.Type[] ? Cast.Types[T[number]] :
    T extends Cast.Type ? Cast.Types[T] :
    never;

/** Cast types. */
export namespace Cast {

    /**
     * All supported argument types.
     * @note that we only need primitive types since we dont use it at runtime to cast to values.
     *       This is merely a map to perform casts.
     *       And the keys will be used as allowed types for validation.
     */
    export type Types = {
        any: any;
        undefined: undefined;
        null: null;
        boolean: boolean;
        number: number;
        string: string;
        array: string[];
        object: Record<string, any>;
    };

    /** Argument string types. */
    export type Type = keyof Types;

    /** The value type of type */
    export type Value = Types[Type];

    /** The base type of castable type generics. */
    export type Castable = Castable.Base | Castable.Base[];
    export namespace Castable {
        /** The castable non array type.  */
        export type Base = Type | Function;
    }

    /**
     * Cast a boolean string to a boolean value.
     * So all `true True TRUE 1` strings will be cast to true and likewise for false.
     * 
     * @param str - The string to parse.
     * 
     * @param opts.preserve - When true a failed parse will return the original string.
     * @note opts.preserve The` opts.preserve` option is useful when applying value casts inside a scheme preprocessor, since this will return the original string in case of a failed parsing. Which might result in a type error instead of an undefined ignored value.
     * @note opts.preserve Note that `opts.preserve` and `opts.strict` can not be combined.
     * 
     * @param opts.strict - When true, undefined will be returned when the string is not a valid boolean. Default is false.
     * @note opts.strict Note that `opts.preserve` and `opts.strict` can not be combined.
     * 
     * @returns the parsed boolean or undefined when the string is not a valid boolean.
     * 
     * @libris
     */
    export function boolean(str: string, opts: boolean.Opts<"strict">): boolean;
    export function boolean(str: string, opts: boolean.Opts<"preserve">): string | boolean;
    export function boolean(str: string, opts?: boolean.Opts<"default">): boolean | undefined;
    export function boolean(str: string, opts?: boolean.Opts): boolean | string | undefined {
        switch (str) {
            case "true":
            case "True":
            case "TRUE":
            case "1":
                return true;
            case "false":
            case "False":
            case "FALSE":
            case "0":
                return false;
            default:
                if (opts?.preserve) {
                    return str;
                }
                if (opts?.strict) {
                    return undefined;
                }
                return false;
        }
    }
    export namespace boolean {
        export type Opts<M extends "preserve" | "strict" | "default" = "preserve" | "strict" | "default"> =
            M extends "preserve"
            ? { preserve: true, strict?: false }
            : M extends "strict"
                ? { preserve?: false, strict: false }
                : { preserve?: false, strict?: boolean }; // default.
    }

    /**
     * Try to parse a number from a string, optionally strict with a regex check.
     * @param str - The string to parse.
     * @param opts.strict - When true a regex check will be performed to check if the string is a valid number. Default is false.
     * @param opts.preserve - When true a failed parse will return the original string.
     * @note The opts.preserve option is useful when applying value casts inside a scheme preprocessor, since this will return the original string in case of a failed parsing. Which might result in a type error instead of an undefined ignored value.
     * @returns the parsed number or undefined when the string is not a valid number.
     * @libris
     */
    export function number(str: string, opts: number.Opts<"preserve">): string | number;
    export function number(str: string, opts?: number.Opts<"no_preserve">): number | undefined;
    export function number(str: string, opts?: number.Opts): string | number | undefined {
        if (opts?.strict) {
            const regex = /^[+-]?\d+(\.\d+)?$/;
            if (!regex.test(str)) {
                if (opts?.preserve) {
                    return str;
                }
                return undefined;
            }
        }
        const num = Number(str);
        if (isNaN(num)) {
            if (opts?.preserve) {
                return str;
            }
            return undefined;
        }
        return num;
    }
    export namespace number {
        export type Opts<M extends "preserve" | "no_preserve" = "preserve" | "no_preserve"> =
            M extends "preserve"
            ? { preserve: true, strict?: boolean }
            : { preserve?: false, strict?: boolean };
    }

}
export { Cast as cast }; // snake_case compatibility.