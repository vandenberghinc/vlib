/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Insert `__dirname`, `__filename`, `__ts_dirname` and `__ts_filename` variables into the source code.
 * The `__ts` variables point to the original source file, while `__dirname` and `__filename` point to the compiled file.
 */
export async function dirname_plugin(source_path, dist_path, tsconfig_path, tsconfig_dirname) {
    // Load data.
    const data = await dist_path.load();
    // Check if the file already contains the variables.
    const needs_insertion = /__(?:filename|dirname|ts_filename|ts_dirname|package_json)/.test(data);
    if (!needs_insertion || data.includes("vts-plugin: dirname@1.0.0")) {
        return;
    }
    // Only insert if any definition is refernced in the file
    // @todo need to check if not already added
    await dist_path.save(`// vts-plugin: dirname@1.0.0` +
        `\nimport { fileURLToPath as __fileURLToPath } from "url"; import __path_module from "path";` +
        `const __filename = __fileURLToPath(import.meta.url);` +
        `const __dirname = __path_module.dirname(__filename);` +
        `const __ts_filename = ${JSON.stringify(source_path.str())};` +
        `const __ts_dirname = __path_module.dirname(__ts_filename);` +
        `const __tsconfig = ${tsconfig_path};` +
        `const __tsconfig_dirname = ${tsconfig_dirname};` +
        `\n\n` +
        data);
}
//# sourceMappingURL=dirname.js.map