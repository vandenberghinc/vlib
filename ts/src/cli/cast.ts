/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * Casting types CLI argument types to their corresponding value types.
 */

import { value_type } from "../scheme/throw.js";

/** Cast types. */
export namespace Cast {

    /**
     * All supported runtime argument types.
     * Note we construct this from initially a value map.
     * This is so we can perform runtime checks on type names.
     */
    export const RuntimeTypes = {
        /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */

        /** Primitive types. */
        string: "" as string,
        number: 0 as number,
        boolean: false as boolean,

        /**
         * Arrays.
         * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
         */
        array: [] as string[],      // we only need the keys at runtime
        "boolean[]": [] as boolean[],
        "number[]": [] as number[],
        "string[]": [] as string[],

        /** Object.s */
        object: {} as Record<string, any>,

        /** Maps. */
        "string:boolean": {} as Record<string, boolean>,
        "string:number": {} as Record<string, number>,
        "string:string": {} as Record<string, string>,

        "string:boolean|number|string": {} as Record<string, boolean | number | string>,
        "string:boolean|number": {} as Record<string, boolean | number>,
        "string:boolean|string": {} as Record<string, boolean | string>,
        "string:number|string": {} as Record<string, number | string>,

        "string:boolean|number|string|array": {} as Record<string, boolean | number | string | string[]>,

        "number:boolean": new Map<number, number>(),
        "number:number": new Map<number, number>(),
        "number:string": new Map<number, string>(),
    };

    /** All supported argument types. */
    export type Types = typeof RuntimeTypes;
    
    /** Argument string types. */
    export type Type = keyof Types;

    /** Type types. */
    export namespace Type {

        // A set of valid type keys for runtime checks.
        export const valid = new Set(Object.keys(RuntimeTypes));

        /** Is type utility. */
        export const is = (key: string): key is Type => valid.has(key);

        /**
         * Parse utility.
         * @param value The value to parse the typ from.
         * @param none_type The type to return when the value is `undefined`, `null` or `none`.
         * @throws An error when the input type is not parsable.
         */
        export function parse(value: any, none_type?: Type): Type | undefined {
            const type = value_type(value);
            if (is(type)) { return type; }
            if (none_type != null) {
                switch (type) {
                    case "undefined":
                    case "null":
                    case "none":
                        return none_type;
                }
            }
        }
    }

    /** The value type of */
    export type Value = Types[Type];

    /**
     * The base type of castable type generics.
     * @warning never add `undefined` etc here, do that on specific types only. 
     */
    export type Castable = Type | Type[];

    /**
     * Cast a type name or type names union to its corresponding value type.
     * Also supports already casted value types as input.
     */
    export type Cast<
        T extends never | undefined | Castable | Value,
        Def extends any = string, // returned type for undefined | null
        Never extends any = string, // returned type for never
    > =
        [T] extends [never] ? Never :
        T extends | null | undefined ? Def :
        T extends Type[] ? Types[T[number]] :
        T extends Type ? Types[T] :
        never;


    /** Additional initialize options for `Arg.init()`. */
    // export type InitOpts<
    //     Flags extends Flag = Flag,
    //     T extends Cast.Castable = Cast.Castable,
    // > =
    //     | Arg<Flags, T>
    //     | Arg.Opts<Flags, T>
    //     | Query<"and">
    //     | Query<"or"> | string[]
    //     | string;
}