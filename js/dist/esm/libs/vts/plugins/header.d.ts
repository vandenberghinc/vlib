/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "../../../index.js";
/**
 * Add/update @author and @copyright to the top of the source file.
 * When already present then replace the content.
 * Ensure we keep the start year
 */
export declare function header_plugin(path: vlib.Path, author: string, start_year?: number): Promise<void>;
