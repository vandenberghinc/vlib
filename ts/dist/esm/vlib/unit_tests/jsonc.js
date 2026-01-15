/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
"use strict";
// Imports.
import { Module } from "../../vtest/index.js";
import { JSONC } from '../jsonc/jsonc.js';
// Unit tests module.
const tests = new Module({ name: "vlib/jsonc" });
// ==================================================================================================
tests.add("parse:1", "success", () => JSONC.parse(`
    {
        "key": "value",
        // This is a comment
        "key2": {
            /* This is a multi-line comment */
            "key3": "value3",
            "key4": {
                /* This is a multi-line comment */
                "key5": {
                    "key6": "value6.NEW"
                }
            }
        }
    }
    `.dedent()));
tests.add("parse:2", "success", () => JSONC.parse(`
    {
        "key": "value",
        // This is a comment
        "key2": {
            /* This is a multi-line comment */
            "key3": "value3",
            "key4": {
                /* This is a multi-line comment */
                "key5": {
                    "key6": "value6"
                }
            }
        }
    }
    `.dedent()));
// ==================================================================================================
// JSONC.insert_into_file() tests.
// Deletes root-level keys missing from input (canonical sync).
tests.add("insert:2_delete_root_keys", "success", () => JSONC.insert_into_file(`
    {
        "keep": 1,
        "delete_me": 2
    }
    `.dedent(), {
    "keep": 1
}, { update: false }));
// Deletes nested keys recursively (canonical sync), while keeping sibling structure.
tests.add("insert:3_delete_nested_keys_recursive", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "b": {
                "keep": 1,
                "remove": 2
            },
            "remove2": 3
        }
    }
    `.dedent(), {
    "a": {
        "b": {
            "keep": 1
        }
    }
}, { update: false }));
// Replaces a primitive when type changes (object -> primitive).
tests.add("insert:4_type_change_object_to_primitive", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "b": 1
        }
    }
    `.dedent(), {
    "a": 0
}, { update: false }));
// Replaces a container when type changes (array -> object).
tests.add("insert:5_type_change_array_to_object", "success", () => JSONC.insert_into_file(`
    {
        "a": [1, 2, 3]
    }
    `.dedent(), {
    "a": { "x": 1 }
}, { update: false }));
// Replaces a null with an object (null -> object).
tests.add("insert:6_null_to_object", "success", () => JSONC.insert_into_file(`
    {
        "a": null
    }
    `.dedent(), {
    "a": { "x": true }
}, { update: false }));
// Deletes keys even when there are comments around them (comment preservation sanity check).
tests.add("insert:7_delete_key_with_adjacent_comments", "success", () => JSONC.insert_into_file(`
    {
        // keep this comment
        "keep": 1,
        // delete this block
        "remove": 2
    }
    `.dedent(), {
    "keep": 1
}, { update: false }));
// Deletes trailing array items (root array canonical sync).
tests.add("insert:8_root_array_delete_trailing_items", "success", () => JSONC.insert_into_file(`
    [
        1,
        2,
        3,
        4
    ]
    `.dedent(), [1, 2], { update: false }));
// Deletes trailing array items (root array canonical sync).
tests.add("insert:8_1_root_array_delete_trailing_items", "success", () => JSONC.insert_into_file(`
    [
        1,
        2,
        3,
        4
    ]
    `.dedent(), [1, 2, 5], { update: true }));
// Deletes trailing items from a nested array (canonical sync).
tests.add("insert:9_nested_array_delete_trailing_items", "success", () => JSONC.insert_into_file(`
    {
        "arr": [1, 2, 3]
    }
    `.dedent(), {
    "arr": [1]
}, { update: false }));
// Updates an element inside an array-of-objects without replacing the entire object (deep merge in array element).
tests.add("insert:10_array_of_objects_deep_merge_element", "success", () => JSONC.insert_into_file(`
    {
        "arr": [
            { "id": 1, "name": "a", "extra": true },
            { "id": 2, "name": "b", "extra": true }
        ]
    }
    `.dedent(), {
    "arr": [
        { "id": 1, "name": "A" }, // should delete "extra" inside element 0 (canonical)
        { "id": 2, "name": "b", "extra": true } // unchanged element 1
    ]
}, { update: false }));
// Ensures canonical sync on array element objects deletes keys not present (within element).
tests.add("insert:11_array_element_object_deletes_missing_keys", "success", () => JSONC.insert_into_file(`
    [
        { "k1": 1, "k2": 2 }
    ]
    `.dedent(), [
    { "k1": 1 }
], { update: false }));
// Root replacement when existing root is not array/object (e.g. number -> object).
tests.add("insert:12_root_type_mismatch_replaces_entire_doc", "success", () => JSONC.insert_into_file(`
    123
    `.dedent(), { "a": 1 }, { update: false }));
//
// Partial (update:true) tests - no deletion, only upsert.
//
// Partial update does not delete root-level keys missing from input.
tests.add("insert:13_partial_no_delete_root_keys", "success", () => JSONC.insert_into_file(`
    {
        "keep": 1,
        "also_keep": 2
    }
    `.dedent(), {
    "keep": 10
}, { update: true }));
// Partial update does not delete nested keys missing from input.
tests.add("insert:14_partial_no_delete_nested_keys", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "b": {
                "keep": 1,
                "also_keep": 2
            }
        }
    }
    `.dedent(), {
    "a": {
        "b": {
            "keep": 10
        }
    }
}, { update: true }));
// Partial update adds a brand-new nested key without touching unrelated siblings.
tests.add("insert:15_partial_add_new_nested_key", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "b": 1
        }
    }
    `.dedent(), {
    "a": {
        "c": 2
    }
}, { update: true }));
// Partial update on arrays: updates existing index, keeps trailing items.
tests.add("insert:16_partial_array_updates_index_keeps_trailing", "success", () => JSONC.insert_into_file(`
    [ "a", "b", "c" ]
    `.dedent(), ["A"], { update: true }));
// Partial update on nested array: updates a single index deep in the tree.
tests.add("insert:17_partial_nested_array_update_single_index", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "arr": [0, 1, 2]
        }
    }
    `.dedent(), {
    "a": {
        "arr": [0, 10]
    }
}, { update: true }));
// Partial update inside an array element object: updates leaf key, keeps other keys in that element.
tests.add("insert:18_partial_array_element_object_keeps_keys", "success", () => JSONC.insert_into_file(`
    [
        { "id": 1, "name": "a", "keep": true }
    ]
    `.dedent(), [
    { "id": 1, "name": "A" }
], { update: true }));
//
// Formatting/options behavior tests.
//
// Uses custom indentation (tabSize) and keeps spaces indentation (insertSpaces=true).
tests.add("insert:19_formatting_custom_indent_size", "success", () => JSONC.insert_into_file(`
    {
      "a": 1
    }
    `.dedent(), {
    "a": 1,
    "b": { "c": 2 }
}, { update: false, indent: 4, indent_using_spaces: true }));
// Uses tabs for indentation (insertSpaces=false).
tests.add("insert:20_formatting_tabs", "success", () => JSONC.insert_into_file(`
    {
        "a": 1
    }
    `.dedent(), {
    "a": 1,
    "b": 2
}, { update: false, indent_using_spaces: false, indent: 1 }));
// Inserts final EOL when requested.
tests.add("insert:21_formatting_insert_final_eol", "success", () => JSONC.insert_into_file(`{ "a": 1 }`.dedent(), { "a": 2 }, { update: false, insert_final_eol: true }));
// Keeps line positions when keep_lines is enabled (useful for minimal movement).
tests.add("insert:22_formatting_keep_lines", "success", () => JSONC.insert_into_file(`
    {
        "a": 1,

        "b": 2
    }
    `.dedent(), { "a": 10, "b": 2 }, { update: false, keep_lines: true }));
//
// Edge-case behavior tests.
//
// Empty content: normalises to "null\n" then replaces with provided object.
tests.add("insert:23_empty_file_content_replaced", "success", () => JSONC.insert_into_file(``.dedent(), { "a": 1 }, { update: false }));
// Root array into empty content: should create array root.
tests.add("insert:24_empty_file_content_root_array", "success", () => JSONC.insert_into_file(``.dedent(), [{ "a": 1 }, { "b": 2 }], { update: false }));
// Updates deeply nested mixed containers (object -> array -> object -> array -> primitive).
tests.add("insert:25_deep_mixed_container_update", "success", () => JSONC.insert_into_file(`
    {
        "a": [
            {
                "b": [
                    { "c": 1, "d": 2 }
                ]
            }
        ]
    }
    `.dedent(), {
    "a": [
        {
            "b": [
                { "c": 10 } // canonical: should delete "d"
            ]
        }
    ]
}, { update: false }));
// Ensures canonical sync deletes an entire nested object key when missing (not just leaf keys).
tests.add("insert:26_delete_entire_nested_object_property", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "keep": { "x": 1 },
            "remove": { "y": 2 }
        }
    }
    `.dedent(), {
    "a": {
        "keep": { "x": 1 }
    }
}, { update: false }));
// Ensures partial update preserves an entire nested object property when missing.
tests.add("insert:27_partial_preserve_entire_nested_object_property", "success", () => JSONC.insert_into_file(`
    {
        "a": {
            "keep": { "x": 1 },
            "preserve": { "y": 2 }
        }
    }
    `.dedent(), {
    "a": {
        "keep": { "x": 10 }
    }
}, { update: true }));
//
// Root-array tests: editing object properties inside the root array.
//
// Canonical: update a property inside the 2nd object, and delete a missing key in that object.
tests.add("insert:28_root_array_object_property_update_and_delete", "success", () => JSONC.insert_into_file(`
    [
        { "id": 1, "name": "a", "keep": true },
        { "id": 2, "name": "b", "remove": 123 },
        { "id": 3, "name": "c" }
    ]
    `.dedent(), [
    { "id": 1, "name": "a", "keep": true },
    { "id": 2, "name": "B" }, // canonical: should delete "remove"
    { "id": 3, "name": "c" }
], { update: false }));
// Canonical: update a nested object property inside an element (deep merge + recursive delete).
tests.add("insert:29_root_array_nested_object_deep_merge_and_delete", "success", () => JSONC.insert_into_file(`
    [
        {
            "id": 1,
            "cfg": {
                "enabled": true,
                "limits": { "min": 1, "max": 10, "extra": "x" }
            }
        }
    ]
    `.dedent(), [
    {
        "id": 1,
        "cfg": {
            "enabled": false,
            "limits": { "min": 2, "max": 9 } // canonical: should delete "extra"
        }
    }
], { update: false }));
// Partial: update a single leaf property inside an element, preserving other keys in that element.
tests.add("insert:30_root_array_partial_update_preserves_element_keys", "success", () => JSONC.insert_into_file(`
    [
        { "id": 1, "name": "a", "meta": { "x": 1, "y": 2 } }
    ]
    `.dedent(), [
    { "id": 1, "meta": { "x": 10 } } // partial: should keep name and meta.y
], { update: true }));
// Partial: update an element's nested array item while preserving trailing items.
tests.add("insert:31_root_array_partial_nested_array_update", "success", () => JSONC.insert_into_file(`
    [
        { "id": 1, "tags": ["a", "b", "c"] }
    ]
    `.dedent(), [
    { "id": 1, "tags": ["A"] } // partial: should update index 0 only, keep "b","c"
], { update: true }));
// Canonical: shrink a nested array inside a root element (trailing items removed).
tests.add("insert:32_root_array_canonical_nested_array_shrink", "success", () => JSONC.insert_into_file(`
    [
        { "id": 1, "tags": ["a", "b", "c"] }
    ]
    `.dedent(), [
    { "id": 1, "tags": ["a"] } // canonical: should remove "b","c"
], { update: false }));
// Canonical: replace an element's property type (object -> array) within root array.
tests.add("insert:33_root_array_property_type_change", "success", () => JSONC.insert_into_file(`
    [
        { "id": 1, "cfg": { "a": 1 } }
    ]
    `.dedent(), [
    { "id": 1, "cfg": [1, 2, 3] }
], { update: false }));
// Test comments, blank lines, and trailing commas.
tests.add("insert:1", "success", () => JSONC.insert_into_file(`
    {
        "key": "value",
        // This is a comment
        "key2": {

            /* This is a multi-line comment */
            "key3": "value3",

            "key4": {
                
                /* This is a multi-line comment
                * With some extra lines
                */
                "key5": {
                    "key6": "value6"
                },

                /* This is a multi-line comment
                * With some extra lines
                * And some extra lines
                */
                "key7": {
                    "key8": "value6"
                },

                /* This is a multi-line comment
                * With some extra lines
                * And some extra lines
                */
                "key9": true
            },

            // This is a comment
            "key10": {
                "key11": 0,
            },

            "key12": [],
        }
    }
    `.dedent(), {
    "key": "NEW value",
    "key2": {
        "key3": "NEW value3",
        "key4": {
            "key5": {
                "key6": "NEW value6"
            },
            "key7": {
                "key8": "NEW value8"
            },
            "key9": false
        },
        "key10": {
            "key11": 1,
        },
        "key12": [0],
    }
}));
//# sourceMappingURL=jsonc.js.map