/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Casting types CLI argument types to their corresponding value types.
 */
import { value_type } from "../scheme/throw.js";
/** Cast types. */
export var Cast;
(function (Cast) {
    /**
     * All supported runtime argument types.
     * Note we construct this from initially a value map.
     * This is so we can perform runtime checks on type names.
     */
    Cast.RuntimeTypes = {
        /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */
        /** Primitive types. */
        string: "",
        number: 0,
        boolean: false,
        /**
         * Arrays.
         * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
         */
        array: [], // we only need the keys at runtime
        "boolean[]": [],
        "number[]": [],
        "string[]": [],
        /** Object.s */
        object: {},
        /** Maps. */
        "string:boolean": {},
        "string:number": {},
        "string:string": {},
        "string:boolean|number|string": {},
        "string:boolean|number": {},
        "string:boolean|string": {},
        "string:number|string": {},
        "string:boolean|number|string|array": {},
        "number:boolean": new Map(),
        "number:number": new Map(),
        "number:string": new Map(),
    };
    /** Type types. */
    let Type;
    (function (Type) {
        // A set of valid type keys for runtime checks.
        Type.valid = new Set(Object.keys(Cast.RuntimeTypes));
        /** Is type utility. */
        Type.is = (key) => Type.valid.has(key);
        /**
         * Parse utility.
         * @param value The value to parse the typ from.
         * @param none_type The type to return when the value is `undefined`, `null` or `none`.
         * @throws An error when the input type is not parsable.
         */
        function parse(value, none_type) {
            const type = value_type(value);
            if (Type.is(type)) {
                return type;
            }
            if (none_type != null) {
                switch (type) {
                    case "undefined":
                    case "null":
                    case "none":
                        return none_type;
                }
            }
        }
        Type.parse = parse;
    })(Type = Cast.Type || (Cast.Type = {}));
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
})(Cast || (Cast = {}));
//# sourceMappingURL=cast.js.map