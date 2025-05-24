/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "../../../index.js";
/**
 * Insert `__dirname`, `__filename`, `__ts_dirname` and `__ts_filename` variables into the source code.
 * The `__ts` variables point to the original source file, while `__dirname` and `__filename` point to the compiled file.
 */
export declare function dirname_plugin(source_path: vlib.Path, dist_path: vlib.Path, tsconfig_path: string, tsconfig_dirname: string): Promise<void>;
