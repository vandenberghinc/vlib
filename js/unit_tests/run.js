/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Import env.
import * as vtest from "../dist/esm/librs/vtest/index.js"

// Import unit tests.
import "../dist/esm/jsonc/unit_tests/unit_tests.js";

// Perform.
await vtest.perform({
    results: import.meta.dirname + "/results"
})
