/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @todo still execute these tests.
 */
// Imports.
import { ValidatorEntries } from "../schema/validate/validator_entries.js";
import { Module } from "../../vtest/index.js";
import { validate } from "../schema/index.m.node.js";
// Unit tests module.
const tests = new Module({ name: "vlib/schema" });
// -------------------------------------------------------------------------------
// Helper wrapper functions to minimize repetitive code.
// Wrapper to test for error conditions in validate.
// Returns a callback that invokes validate with the given options.
// If an error is thrown, the callback returns the error message.
function create_error_unit_test(opts) {
    return () => {
        try {
            validate(opts.object, opts);
            // If no error is thrown, return a sentinel string.
            return "__NO_ERROR_THROWN__";
        }
        catch (error) {
            return error.message;
        }
    };
}
// Wrapper to test for successful conditions in validate.
// Returns a callback that invokes validate with the given options.
// The callback returns the JSON-stringified result of the verification.
function create_success_unit_test(opts) {
    return () => {
        const result = validate(opts.object, opts);
        return JSON.stringify(result);
    };
}
// -------------------------------------------------------------------------------
// Convert known tests from the old vtest style to the new Module.add style.
// scheme_test:1 - Missing required key "name".
tests.add("scheme_test:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        description: "Hello World!",
    },
    schema: {
        name: "string",
        description: "string",
    },
    // Expected error: missing required key "name"
}));
// scheme_test:2 - Type mismatch for "description" (should be boolean).
tests.add("scheme_test:2", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        description: "Hello World!",
        name: "Hello Universe!",
    },
    schema: {
        name: "string",
        description: "boolean",
    },
    // Expected error: description type mismatch (string vs boolean)
}));
// scheme_test:3 - value_scheme used at root; `name` is not a string.
tests.add("scheme_test:3", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        description: "Hello World!",
        name: false,
    },
    value_schema: {
        type: "string",
    },
    // Expected error: root value type mismatch (false not string)
}));
// scheme_test:4 - Nested object with value_scheme; inner `name` is not a string.
tests.add("scheme_test:4", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        nested: {
            description: "Hello World!",
            name: false,
        },
    },
    schema: {
        nested: {
            type: "object",
            value_schema: {
                type: "string",
            },
        },
    },
    // Expected error: nested.value name type mismatch (false not string)
}));
// scheme_test:5 - Array of objects; inner `description` should be boolean but is a string.
tests.add("scheme_test:5", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        array: [
            {
                description: "Hello World!",
                name: false,
                unknown: "true",
            },
        ],
    },
    schema: {
        array: {
            type: "array",
            value_schema: {
                type: "object",
                schema: {
                    name: "string",
                    description: "boolean",
                },
            },
        },
    },
    // Expected error: array element description type mismatch (string vs boolean)
}));
// scheme_test:6 - Object-of-objects; inner `name` is not a string.
tests.add("scheme_test:6", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        posts: {
            my_post: {
                description: "Hello World!",
                name: false,
                unknown: "true",
            },
        },
    },
    schema: {
        posts: {
            type: "object",
            value_schema: {
                type: "object",
                schema: {
                    name: "string",
                    description: "boolean",
                },
            },
        },
    },
    // Expected error: nested object name type mismatch (false not string)
}));
// scheme_test:7 - Object-of-objects; description is string but schema expects string, yet unknown key still errors due to check_unknown.
tests.add("scheme_test:7", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        posts: {
            my_post: {
                description: "Hello World!",
                name: "Hello Universe!",
                unknown: "true",
            },
        },
    },
    schema: {
        posts: {
            type: "object",
            value_schema: {
                type: "object",
                schema: {
                    name: "string",
                    description: "string",
                },
            },
        },
    },
    // Expected error: unknown key detected under check_unknown
}));
// scheme_test:8 - Complex array-of-objects with conditional requirements and enum; `type` is "jsx" (allowed), but unknown key errors.
tests.add("scheme_test:8", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        documents: [
            {
                data: "Hello World!",
                name: "Hello Universe!",
                type: "jsx",
                unknown: "true",
            },
        ],
    },
    schema: {
        documents: {
            type: "array",
            value_schema: {
                type: "object",
                schema: {
                    name: { type: "string", required: (obj) => obj.data != null },
                    data: { type: "string", required: (obj) => obj.stylesheets == null },
                    language: { type: "string", required: false },
                    stylesheets: { type: "array", required: (obj) => obj.data == null },
                    compile: { type: "boolean", def: false },
                    type: {
                        type: "string",
                        enum: ["js", "jsx", "css", "lmx"],
                    },
                },
            },
        },
    },
    // Expected error: unknown key in documents object
}));
// scheme_test:9 - All fields present but undefined, string expected.
tests.add("scheme_test:9", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        app_id: undefined,
        client_id: undefined,
        client_secret: undefined,
        private_key: undefined,
    },
    schema: {
        app_id: "string",
        client_id: "string",
        client_secret: "string",
        private_key: "string",
    },
    // Expected error: undefined not allowed for string fields
}));
// scheme_test:10 - Default value for "x" should be applied.
tests.add("scheme_test:10", () => {
    let x = undefined;
    const response = validate({
    // x: undefined,
    }, {
        throw: true,
        unknown: false,
        schema: {
            x: { type: "string", default: "Hello World!" },
        },
    });
    ({ x = "" } = response);
    return x;
});
// -------------------------------------------------------------------------------
// Section: aliases getter behavior.
// scheme_aliases_population:1 - Single alias should map correctly.
tests.add("scheme_aliases_population:1", () => {
    const scheme = new ValidatorEntries({
        key: { type: "string", alias: ["alias1", "alias2"] }
    });
    const aliases = scheme.aliases;
    const entryInstance = scheme.get("key");
    return aliases.get("alias1") === entryInstance && aliases.get("alias2") === entryInstance;
    // Expected output: `true`
});
// scheme_aliases_cached:1 - Repeated access returns the same Map reference.
tests.add("scheme_aliases_cached:1", () => {
    const scheme = new ValidatorEntries({
        k: { type: "string", alias: ["aliasA"] }
    });
    const firstMap = scheme.aliases;
    const secondMap = scheme.aliases;
    return firstMap === secondMap;
    // Expected output: `true`
});
// -------------------------------------------------------------------------------
// Section: validate successful scenarios.
// scheme_verify_simple_string:1 - Simple valid object with string type.
tests.add("scheme_verify_simple_string:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        name: "TestName",
    },
    schema: {
        name: "string",
    },
    // Expected success: returns JSON string with name "TestName"
}));
// scheme_verify_simple_boolean:1 - Simple valid object with boolean type.
tests.add("scheme_verify_simple_boolean:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        flag: true,
    },
    schema: {
        flag: "boolean",
    },
    // Expected success: returns JSON string with flag true
}));
// scheme_verify_missing_optional_no_error:1 - Missing optional key should not throw.
tests.add("scheme_verify_missing_optional_no_error:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {},
    schema: {
        optional_field: { type: "string", required: false },
    },
    // Expected success: no error, returns {}
}));
// scheme_verify_default_applied:1 - Default value should be applied when key is missing.
tests.add("scheme_verify_default_applied:1", () => {
    const response = validate({}, {
        throw: true,
        unknown: false,
        schema: {
            a: { type: "string", default: "default_val" },
            b: { type: "boolean", default: true },
        },
    });
    return JSON.stringify(response);
});
// scheme_verify_enum_valid:1 - Enum with allowed value.
tests.add("scheme_verify_enum_valid:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        mode: "jsx",
    },
    schema: {
        mode: {
            type: "string",
            enum: ["js", "jsx", "css"],
        },
    },
    // Expected success: returns JSON string with mode "jsx"
}));
// scheme_verify_nested_object_valid:1 - Nested object matching value_scheme.
tests.add("scheme_verify_nested_object_valid:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        nested: {
            x: "hello",
        },
    },
    schema: {
        nested: {
            type: "object",
            value_schema: {
                type: "string",
            },
        },
    },
    // Expected success: returns JSON string with nested.x "hello"
}));
// scheme_verify_array_of_strings_valid:1 - Array of strings valid.
tests.add("scheme_verify_array_of_strings_valid:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        tags: ["one", "two", "three"],
    },
    schema: {
        tags: {
            type: "array",
            value_schema: {
                type: "string",
            },
        },
    },
    // Expected success: returns JSON string with tags array
}));
// scheme_verify_object_of_objects_valid:1 - Object-of-objects valid scenario.
tests.add("scheme_verify_object_of_objects_valid:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        posts: {
            post1: { title: "Hello", published: false },
            post2: { title: "World", published: true },
        },
    },
    schema: {
        posts: {
            type: "object",
            value_schema: {
                type: "object",
                schema: {
                    title: "string",
                    published: "boolean",
                },
            },
        },
    },
    // Expected success: returns JSON string with posts object
}));
// scheme_verify_conditional_required_met:1 - Conditional required: name required when data is present.
tests.add("scheme_verify_conditional_required_met:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        data: "some data",
        name: "ProvidedName",
    },
    schema: {
        name: { type: "string", required: (obj) => obj.data != null },
        data: { type: "string", required: false },
    },
    // Expected success: returns JSON string when condition met
}));
// scheme_verify_conditional_required_not_met:1 - Conditional required: stylesheets required when data is missing.
tests.add("scheme_verify_conditional_required_not_met:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        stylesheets: ["s1", "s2"],
    },
    schema: {
        name: { type: "string", required: (obj) => obj.data != null },
        data: { type: "string", required: false },
        stylesheets: { type: "array", required: (obj) => obj.data == null },
    },
    // Expected success: returns JSON string when conditional required not triggered
}));
// scheme_verify_default_boolean:1 - Boolean default applied.
tests.add("scheme_verify_default_boolean:1", "error", () => {
    const response = validate({
        // 'enabled' missing
        enabled: undefined,
    }, {
        throw: true,
        unknown: false,
        schema: {
            enabled: { type: "boolean", default: false },
        },
    });
    return response?.enabled;
});
// -------------------------------------------------------------------------------
// Section: validate error scenarios beyond known tests.
// scheme_verify_required_missing:1 - Required field missing should throw.
tests.add("scheme_verify_required_missing:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {},
    schema: {
        must: { type: "string", required: true },
    },
    // Expected error: required field missing
}));
// scheme_verify_type_mismatch_boolean:1 - Boolean expected but number given.
tests.add("scheme_verify_type_mismatch_boolean:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        flag: 123,
    },
    schema: {
        flag: "boolean",
    },
    // Expected error: boolean type mismatch (number given)
}));
// scheme_verify_type_mismatch_array:1 - Array expected but object given.
tests.add("scheme_verify_type_mismatch_array:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        arr: { not: "an array" },
    },
    schema: {
        arr: {
            type: "array",
            value_schema: { type: "string" },
        },
    },
    // Expected error: array expected but got object
}));
// scheme_verify_array_element_type_error:1 - Array contains wrong element type.
tests.add("scheme_verify_array_element_type_error:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        arr: ["good", 42, "also good"],
    },
    schema: {
        arr: {
            type: "array",
            value_schema: { type: "string" },
        },
    },
    // Expected error: array element type mismatch (number in string array)
}));
// scheme_verify_enum_invalid:1 - Enum with disallowed value.
tests.add("scheme_verify_enum_invalid:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        mode: "lmx", // not in ["js","jsx","css"]
    },
    schema: {
        mode: {
            type: "string",
            enum: ["js", "jsx", "css"],
        },
    },
    // Expected error: enum value invalid
}));
// scheme_verify_conditional_required_missing:1 - Conditional required field missing when condition is met.
tests.add("scheme_verify_conditional_required_missing:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        data: "some data",
        // name missing
    },
    schema: {
        name: { type: "string", required: (obj) => obj.data != null },
        data: { type: "string", required: false },
    },
    // Expected error: conditional required field missing (name)
}));
// scheme_verify_unknown_key_no_error:1 - Unknown key allowed when check_unknown is false.
tests.add("scheme_verify_unknown_key_no_error:1", create_success_unit_test({
    throw: true,
    unknown: true,
    object: {
        known: "yes",
        unknown_extra: 123,
    },
    schema: {
        known: "string",
    },
    // Expected success: unknown key ignored
}));
// scheme_verify_unknown_key_error:1 - Unknown key errors when check_unknown is true.
tests.add("scheme_verify_unknown_key_error:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        known: "yes",
        unknown_extra: 123,
    },
    schema: {
        known: "string",
    },
    // Expected error: unknown key detected
}));
// -------------------------------------------------------------------------------
// Section: Edge cases and deep nesting.
// scheme_verify_deeply_nested_valid:1 - Deeply nested object valid.
tests.add("scheme_verify_deeply_nested_valid:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        level1: {
            level2: {
                level3: {
                    value: "deep",
                },
            },
        },
    },
    schema: {
        level1: {
            type: "object",
            value_schema: {
                type: "object",
                value_schema: {
                    type: "object",
                    value_schema: {
                        type: "string",
                    },
                },
            },
        },
    },
    // Expected success: deep nested value accepts
}));
// scheme_verify_deeply_nested_error:1 - Deeply nested type mismatch.
tests.add("scheme_verify_deeply_nested_error:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        level1: {
            level2: {
                level3: {
                    value: "deep",
                },
            },
        },
    },
    schema: {
        level1: {
            type: "object",
            value_schema: {
                type: "object",
                value_schema: {
                    type: "object",
                    value_schema: {
                        type: "number",
                    },
                },
            },
        },
    },
    // Expected error: deep nested value type mismatch (number vs string)
}));
// scheme_verify_array_of_object_of_arrays:1 - Array of objects each containing an array of booleans.
tests.add("scheme_verify_array_of_object_of_arrays:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        items: [
            { flags: [true, false, true] },
            { flags: [false, false] },
        ],
    },
    schema: {
        items: {
            type: "array",
            value_schema: {
                type: "object",
                schema: {
                    flags: {
                        type: "array",
                        value_schema: { type: "boolean" },
                    },
                },
            },
        },
    },
    // Expected success: nested arrays of booleans accepted
}));
// scheme_verify_array_of_object_of_arrays_error:1 - One object has wrong array element type.
tests.add("scheme_verify_array_of_object_of_arrays_error:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        items: [
            { flags: [true, "not boolean", false] },
        ],
    },
    schema: {
        items: {
            type: "array",
            value_schema: {
                type: "object",
                schema: {
                    flags: {
                        type: "array",
                        value_schema: { type: "boolean" },
                    },
                },
            },
        },
    },
    // Expected error: nested array element type mismatch ("not boolean" in boolean array)
}));
// -------------------------------------------------------------------------------
// Aliases
tests.add("aliases:1", create_success_unit_test({
    throw: true,
    unknown: false,
    object: {
        name_alias: "Daan van den Bergh",
    },
    schema: {
        name: {
            type: "string",
            required: true,
            alias: ["name_alias"],
        },
    },
    // Expected error: missing required key "name"
}));
// -------------------------------------------------------------------------------
// Invalid key, check close known matches
tests.add("typo_invalid_attr:1", create_error_unit_test({
    throw: true,
    unknown: false,
    object: {
        option: "X",
    },
    schema: {
        options: {
            type: "string",
            required: true,
        },
    },
    // Expected error msg like: `Invalid key "option", did you mean "options"`
}));
//# sourceMappingURL=schema.js.map