/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ClipboardReadOptions } from './types.js';
/**
 * BrowserClipboard: native clipboard operations for browser environments.
 */
export declare class Clipboard {
    /**
     * Copy data to the system clipboard (browser).
     */
    static set(data: any): Promise<void>;
    /**
     * Read data from the system clipboard (browser).
     */
    static get<T = any>(opts?: ClipboardReadOptions): Promise<T>;
}
export { Clipboard as clipboard };
