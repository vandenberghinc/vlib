/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
"use strict";

// Imports.
import { Module } from "@vtest";
import { JSONC } from '../jsonc/jsonc.js';

// Unit tests module.
const tests = new Module({ name: "jsonc" });

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
    `.dedent()
));
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
    `.dedent()
));

// ==================================================================================================
// JSONC.insert_into_file() tests.

// Test comments, blank lines, and trailing commas.
tests.add("insert:1", "success", () => JSONC.insert_into_file(
    `
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
    `.dedent(),
    {
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
    }
));

export {};