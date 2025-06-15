/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../generic/path.js";
import { InvalidUsageError } from "../index.m.uni.js";
import { NoValue, ValidatorEntries } from "./validator_entries.js";
// ---------------------------------------------------------------
// Internal helpers.
/**
 * Convert a {@link ValidatorEntry} to its JSON-Schema representation.
 *
 * @param entry  The validator entry to convert.
 * @param state  Recursion-local state (currently only the `unknown` flag).
 * @returns      A draft-07 JSON-Schema fragment.
 */
const entry_to_json_schema = (entry, state) => {
    const json = {};
    // -----------------------------------------------------------
    // "type" keyword.
    const map_type = (t) => {
        if (typeof t === "string") {
            return (t === "string" ||
                t === "number" ||
                t === "boolean" ||
                t === "object" ||
                t === "array" ||
                t === "null")
                ? t
                : undefined;
        }
        if (typeof t === "function")
            return "object";
        return undefined;
    };
    const type_kw = Array.isArray(entry.type)
        ? entry.type.map(map_type).filter(Boolean)
        : map_type(entry.type);
    if (type_kw && (!Array.isArray(type_kw) || type_kw.length)) {
        json.type = type_kw;
    }
    const has_type = (t) => Array.isArray(json.type) ? json.type.includes(t) : json.type === t;
    // -----------------------------------------------------------
    // Basic keywords.
    if (entry.enum)
        json.enum = entry.enum;
    if (entry.default !== NoValue)
        json.default = entry.default;
    if (typeof entry.min === "number") {
        if (has_type("string"))
            json.minLength = entry.min;
        else if (has_type("array"))
            json.minItems = entry.min;
        else if (has_type("number"))
            json.minimum = entry.min;
    }
    if (typeof entry.max === "number") {
        if (has_type("string"))
            json.maxLength = entry.max;
        else if (has_type("array"))
            json.maxItems = entry.max;
        else if (has_type("number"))
            json.maximum = entry.max;
    }
    // -----------------------------------------------------------
    // Nested object schema.
    if (entry.schema) {
        const props = {};
        const req = [];
        for (const [k, v] of entry.schema.entries()) {
            props[k] = entry_to_json_schema(v, v.unknown !== NoValue ? { unknown: v.unknown } : state);
            if ((typeof v.required === "function" || v.required === true)
                && v.default === NoValue) {
                req.push(k);
            }
        }
        json.type = "object";
        json.properties = props;
        if (req.length)
            json.required = req;
        if (entry.value_schema) {
            json.additionalProperties = entry_to_json_schema(entry.value_schema, entry.value_schema.unknown !== NoValue
                ? { unknown: entry.value_schema.unknown }
                : state);
        }
        else if (entry.unknown === NoValue ? !state.unknown : !entry.unknown) {
            json.additionalProperties = false;
        }
        return json;
    }
    // -----------------------------------------------------------
    // Tuple / fixed-length array schema (draft-07 syntax).
    if (entry.tuple_schema) {
        json.type = "array";
        json.items = entry.tuple_schema.map(v => entry_to_json_schema(v, v.unknown !== NoValue ? { unknown: v.unknown } : state));
        if (entry.value_schema) {
            // Schema for additional (rest) items.
            json.additionalItems = entry_to_json_schema(entry.value_schema, entry.value_schema.unknown !== NoValue
                ? { unknown: entry.value_schema.unknown }
                : state);
        }
        else {
            // Disallow items beyond the tuple.
            json.additionalItems = false;
        }
        if (typeof entry.min === "number")
            json.minItems = entry.min;
        if (typeof entry.max === "number")
            json.maxItems = entry.max;
        return json;
    }
    // -----------------------------------------------------------
    // Homogeneous array items.
    if (entry.value_schema && has_type("array")) {
        json.items = entry_to_json_schema(entry.value_schema, entry.value_schema.unknown !== NoValue
            ? { unknown: entry.value_schema.unknown }
            : state);
    }
    return json;
};
/**
 * Generate a draft-07 JSON-Schema for a validator definition.
 * @param opts.schema The object validator schema to convert, see {@link CreateJSONSchemaOpts} for more info.
 * @throws {InvalidUsageError} When the {@link CreateJSONSchemaOpts.schema} option is missing.
 */
export function create_json_schema_sync(opts) {
    // Check schema, just to be sure, since Validator also calls this, which has an optional `schema` field.
    if (!opts?.schema) {
        throw new InvalidUsageError("Validator.create_json_schema() requires the `schema` option.");
    }
    // Create the entries object.
    const entries = new ValidatorEntries(opts.schema);
    // Collect properties and required fields.
    const properties = {
        "$schema": { type: "string" },
    };
    const required = [];
    for (const [key, entry] of entries) {
        properties[key] = entry_to_json_schema(entry, {
            unknown: opts.unknown ?? true,
        });
        if ((typeof entry.required === "function" || entry.required === true)
            && entry.default === NoValue) {
            required.push(key);
        }
    }
    // Create the JSON-Schema object.
    const schema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties,
    };
    if (required.length)
        schema.required = required;
    if (opts.unknown === false)
        schema.additionalProperties = false;
    // Write the schema to a file if requested.
    if (opts?.output) {
        const path = typeof opts?.output === "string"
            ? new Path(opts.output)
            : opts?.output;
        path.save_sync(JSON.stringify(schema, null, opts.indent));
    }
    // Response.
    return schema;
}
/**
 * Async version of {@link create_json_schema_sync}.
 * Providing performance benefits when the `opts.output` option is provided.
 * Therefore, for this function the {@link CreateJSONSchemaOpts.output} option is required.
 * @param opts.schema The object validator schema to convert, see {@link CreateJSONSchemaOpts} for more info.
 * @throws {InvalidUsageError} When the {@link CreateJSONSchemaOpts.schema} option is missing.
 */
export async function create_json_schema(opts) {
    // Create the schema.
    const schema = create_json_schema_sync({
        schema: opts.schema,
        unknown: opts.unknown,
        output: undefined, // ensure its not saved in sync.
    });
    // Write the output.
    const path = typeof opts.output === "string"
        ? new Path(opts.output)
        : opts.output;
    await path.save(JSON.stringify(schema, null, opts.indent));
    // Response.
    return schema;
}
//# sourceMappingURL=json_schema.js.map