/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { ClipboardReadOptions } from './types.js';

/**
 * {Browser}
 * Native clipboard operations for browser environments.
 * 
 * @nav System/Clipboard
 * @docs
 */
export class Clipboard {
    /**
     * Copy data to the system clipboard (browser).
     * 
     * @docs
     */
    static async set(data: any): Promise<void> {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        if (!navigator.clipboard?.writeText) {
            throw new Error('Clipboard API not supported in this browser');
        }
        await navigator.clipboard.writeText(text);
    }

    /**
     * Read data from the system clipboard (browser).
     * 
     * @docs
     */
    static async get<T = any>(opts?: ClipboardReadOptions): Promise<T> {
        if (!navigator.clipboard?.readText) {
            throw new Error('Clipboard API not supported in this browser');
        }
        const text = await navigator.clipboard.readText();
        if (opts?.json) {
            try {
                return JSON.parse(text) as T;
            } catch {
                throw new Error('Failed to parse clipboard content as JSON');
            }
        }
        return text as any as T;
    }
}
export { Clipboard as clipboard }; // snake_case compatibility