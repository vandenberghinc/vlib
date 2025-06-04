/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Casting types CLI argument types to their corresponding value types.
 */
/** Cast types. */
export declare namespace Cast {
    /**
     * All supported runtime argument types.
     * Note we construct this from initially a value map.
     * This is so we can perform runtime checks on type names.
     */
    const RuntimeTypes: {
        /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */
        /** Primitive types. */
        string: string;
        number: number;
        boolean: boolean;
        /**
         * Arrays.
         * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
         */
        array: string[];
        "boolean[]": boolean[];
        "number[]": number[];
        "string[]": string[];
        /** Object.s */
        object: Record<string, any>;
        /** Maps. */
        "string:boolean": Record<string, boolean>;
        "string:number": Record<string, number>;
        "string:string": Record<string, string>;
        "string:boolean|number|string": Record<string, boolean | number | string>;
        "string:boolean|number": Record<string, boolean | number>;
        "string:boolean|string": Record<string, boolean | string>;
        "string:number|string": Record<string, number | string>;
        "string:boolean|number|string|array": Record<string, boolean | number | string | string[]>;
        "number:boolean": Map<number, number>;
        "number:number": Map<number, number>;
        "number:string": Map<number, string>;
    };
    /** All supported argument types. */
    type Types = typeof RuntimeTypes;
    /** Argument string types. */
    type Type = keyof Types;
    /** Type types. */
    namespace Type {
        const valid: Set<string>;
        /** Is type utility. */
        const is: (key: string) => key is Type;
        /**
         * Parse utility.
         * @param value The value to parse the typ from.
         * @param none_type The type to return when the value is `undefined`, `null` or `none`.
         * @throws An error when the input type is not parsable.
         */
        function parse(value: any, none_type?: Type): Type | undefined;
    }
    /** The value type of */
    type Value = Types[Type];
    /**
     * The base type of castable type generics.
     * @warning never add `undefined` etc here, do that on specific types only.
     */
    type Castable = Type | Type[];
    /**
     * Cast a type name or type names union to its corresponding value type.
     * Also supports already casted value types as input.
     */
    type Cast<T extends never | undefined | Castable | Value, Def extends any = string, // returned type for undefined | null
    Never extends any = string> = [
        T
    ] extends [never] ? Never : T extends null | undefined ? Def : T extends Type[] ? Types[T[number]] : T extends Type ? Types[T] : never;
    /** Additional initialize options for `Arg.init()`. */
}
