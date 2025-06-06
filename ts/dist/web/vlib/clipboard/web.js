/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * BrowserClipboard: native clipboard operations for browser environments.
 */
export class Clipboard {
    /**
     * Copy data to the system clipboard (browser).
     */
    static async set(data) {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        if (!navigator.clipboard?.writeText) {
            throw new Error('Clipboard API not supported in this browser');
        }
        await navigator.clipboard.writeText(text);
    }
    /**
     * Read data from the system clipboard (browser).
     */
    static async get(opts) {
        if (!navigator.clipboard?.readText) {
            throw new Error('Clipboard API not supported in this browser');
        }
        const text = await navigator.clipboard.readText();
        if (opts?.json) {
            try {
                return JSON.parse(text);
            }
            catch {
                throw new Error('Failed to parse clipboard content as JSON');
            }
        }
        return text;
    }
}
export { Clipboard as clipboard }; // snake_case compatibility
//# sourceMappingURL=web.js.map