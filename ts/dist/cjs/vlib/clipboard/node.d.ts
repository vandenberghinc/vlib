/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ClipboardReadOptions } from './types.js';
/**
 * NodeClipboard: native clipboard operations for Node.js environments.
 */
export declare namespace Clipboard {
    /**
     * Copy data to the system clipboard (Node.js).
     */
    function set(data: any): Promise<void>;
    /**
     * Read data from the system clipboard (Node.js).
     */
    function get<T = any>(opts?: ClipboardReadOptions): Promise<T>;
}
export { Clipboard as clipboard };
