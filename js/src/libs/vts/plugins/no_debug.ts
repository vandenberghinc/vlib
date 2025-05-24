/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import * as vlib from "../../../index.js";

/**
 * Comment out all vlib `^\s*debug(...)` statements.
 */
export async function no_debug_plugin(path: vlib.Path) {
    const data = await path.load();
    const new_data = data.replace(/^\s*debug\(/gm, "// debug(");
    await path.save(new_data);
}