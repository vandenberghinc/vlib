/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ClipboardReadOptions } from './types.js';
/**
 * {Browser}
 * Native clipboard operations for browser environments.
 *
 * @nav System/Clipboard
 * @docs
 */
export declare class Clipboard {
    /**
     * Copy data to the system clipboard (browser).
     *
     * @docs
     */
    static set(data: any): Promise<void>;
    /**
     * Read data from the system clipboard (browser).
     *
     * @docs
     */
    static get<T = any>(opts?: ClipboardReadOptions): Promise<T>;
}
export { Clipboard as clipboard };
