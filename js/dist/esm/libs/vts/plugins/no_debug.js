/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Comment out all vlib `^\s*debug(...)` statements.
 */
export async function no_debug_plugin(path) {
    const data = await path.load();
    const new_data = data.replace(/^\s*debug\(/gm, "// debug(");
    await path.save(new_data);
}
//# sourceMappingURL=no_debug.js.map