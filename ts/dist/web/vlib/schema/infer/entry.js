/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** Types for the `Entry` namespace. */
export var Entry;
(function (Entry) {
    // ------------------------------------------------------------
    // Generic types.
    const types_set = new Set([
        "any", "undefined", "null", "boolean", "number", "string", "array", "object"
    ]);
    /** Types for the `Type` namespace. */
    let Type;
    (function (Type) {
        let Castable;
        (function (Castable) {
            /** Check if a given input type is a `Castable` */
            Castable.is = (type) => ((typeof type === "string" && types_set.has(type))
                || typeof type === "function"
                || (Array.isArray(type) && type.every(Castable.is)));
            Castable.is_fast = (type) => ((typeof type === "string" && types_set.has(type))
                || typeof type === "function"
                || (Array.isArray(type)));
        })(Castable = Type.Castable || (Type.Castable = {}));
    })(Type = Entry.Type || (Entry.Type = {}));
    // /**
    //  * A type guard to check if a given input is an `Entry` type.
    //  * @note That this expects that at least one Entry attribute is defined.
    //  *       This is to prevent false positives for empty objects.
    //  * @param entry - The input to check.
    //  * @returns `true` if the input is an `Entry` type, otherwise `false`.
    //  */
    // export function is(entry: any): entry is Entry {
    //     if (entry == null || typeof entry !== "object") {
    //         return false; // not an object or null
    //     }
    //     // Ensure all attributes are of the correct type.
    //     if (
    //         (entry.type != null && !Entry.Type.Castable.is_fast(entry.type)) ||
    //         // entry.default skip since that can be anything
    //         (entry.required != null && typeof entry.required !== "boolean" && typeof entry.required !== "function") ||
    //         (entry.allow_empty != null && typeof entry.allow_empty !== "boolean") ||
    //         (entry.min != null && typeof entry.min !== "number") ||
    //         (entry.max != null && typeof entry.max !== "number") ||
    //         (entry.schema != null && typeof entry.schema !== "object") ||
    //         (entry.value_schema != null && !Entry.Type.Castable.is_fast(entry.value_schema) && !Entry.is(entry.value_schema)) ||
    //         (entry.tuple != null && !Array.isArray(entry.tuple)) ||
    //         (entry.enum != null && !Array.isArray(entry.enum)) ||
    //         (entry.alias != null && !Array.isArray(entry.alias) && typeof entry.alias !== "string") ||
    //         // not done...
    //     ) { return false;}
    //     // Check if the entry has at least one attribute defined.
    //     return (
    //         typeof entry.type === "string" ||
    //         typeof entry.default === "function" ||
    //         typeof entry.required === "boolean" ||
    //         typeof entry.allow_empty === "boolean" ||
    //         typeof entry.min === "number" ||
    //         typeof entry.max === "number" ||
    //         Array.isArray(entry.enum) ||
    //         typeof entry.schema === "object" && entry.schema != null ||
    //         typeof entry.value_schema === "string" ||
    //         Array.isArray(entry.tuple) ||
    //         Array.isArray(entry.alias) ||
    //         typeof entry.verify === "function" ||
    //         typeof entry.preprocess === "function" ||
    //         typeof entry.postprocess === "function" ||
    //         typeof entry.cast === "boolean" ||
    //         entry.charset instanceof RegExp ||
    //         typeof entry.field_type === "string"
    //     );
    // }
})(Entry || (Entry = {}));
//# sourceMappingURL=entry.js.map