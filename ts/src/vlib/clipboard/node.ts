/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { ClipboardReadOptions } from './types.js';

/**
 * {Node.js}
 * Native clipboard operations for Node.js environments.
 * 
 * @nav Clipboard
 * @docs
 */
export namespace Clipboard {
    let node_clipboard: typeof import('clipboardy').default | null = null;
    let exec_fn: ((cmd: string, args: string[], input?: string) => Promise<string | void>) | null = null;

    /**
     * Initialize high-performance library or fallback for Node.js.
     * 
     * @internal
     */
    async function init(): Promise<void> {
        if (node_clipboard !== null || exec_fn !== null) return;
        try {
            node_clipboard = (await import('clipboardy')).default;
            return;
        } catch {
            // no clipboardy, fallback
        }
        const { spawn } = await import('child_process');
        exec_fn = (cmd, args, input) => new Promise((resolve, reject) => {
            const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'ignore'] });
            let out = '';
            if (input !== undefined) {
                child.stdin.write(input);
                child.stdin.end();
            }
            child.stdout.on('data', chunk => out += chunk.toString());
            child.on('error', reject);
            child.on('close', code => code === 0 ? resolve(out || undefined) : reject(new Error(`Command failed: ${cmd}`)));
        });
    }

    /**
     * Copy data to the system clipboard (Node.js).
     * 
     * @docs
     */
    export async function set(data: any): Promise<void> {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        await init();
        if (node_clipboard) {
            return node_clipboard.write(text);
        }
        if (!exec_fn) throw new Error('No clipboard method available');
        const plt = process.platform;
        if (plt === 'darwin') await exec_fn('pbcopy', [], text);
        else if (plt === 'win32') await exec_fn('powershell', ['-noprofile', '-command', 'Set-Clipboard'], text);
        else {
            try { await exec_fn('xclip', ['-selection', 'clipboard'], text); }
            catch { await exec_fn('xsel', ['--clipboard', '--input'], text); }
        }
    }

    /**
     * Read data from the system clipboard (Node.js).
     * 
     * @docs
     */
    export async function get<T = any>(opts?: ClipboardReadOptions): Promise<T> {
        await init();
        let text: string;
        if (node_clipboard) {
            text = await node_clipboard.read();
        } else {
            if (!exec_fn) throw new Error('No clipboard method available');
            const plt = process.platform;
            if (plt === 'darwin') text = (await exec_fn('pbpaste', [])) as string;
            else if (plt === 'win32') text = (await exec_fn('powershell', ['-noprofile', '-command', 'Get-Clipboard'])) as string;
            else {
                try { text = (await exec_fn('xclip', ['-selection', 'clipboard', '-o'])) as string; }
                catch { text = (await exec_fn('xsel', ['--clipboard', '--output'])) as string; }
            }
        }
        if (opts?.json) {
            try { return JSON.parse(text) as T; }
            catch { throw new Error('Failed to parse clipboard content as JSON'); }
        }
        return text as any as T;
    }
}
export { Clipboard as clipboard }; // snake_case compatibility