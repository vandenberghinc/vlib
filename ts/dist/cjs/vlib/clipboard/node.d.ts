/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ClipboardReadOptions } from './types.js';
/**
 * {Node.js}
 * Native clipboard operations for Node.js environments.
 *
 * @nav Clipboard
 * @docs
 */
export declare namespace Clipboard {
    /**
     * Copy data to the system clipboard (Node.js).
     *
     * @docs
     */
    function set(data: any): Promise<void>;
    /**
     * Read data from the system clipboard (Node.js).
     *
     * @docs
     */
    function get<T = any>(opts?: ClipboardReadOptions): Promise<T>;
}
export { Clipboard as clipboard };
