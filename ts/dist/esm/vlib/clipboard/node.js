/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * NodeClipboard: native clipboard operations for Node.js environments.
 */
export var Clipboard;
(function (Clipboard) {
    let node_clipboard = null;
    let exec_fn = null;
    /**
     * Initialize high-performance library or fallback for Node.js.
     */
    async function init() {
        if (node_clipboard !== null || exec_fn !== null)
            return;
        try {
            node_clipboard = (await import('clipboardy')).default;
            return;
        }
        catch {
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
     */
    async function set(data) {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        await init();
        if (node_clipboard) {
            return node_clipboard.write(text);
        }
        if (!exec_fn)
            throw new Error('No clipboard method available');
        const plt = process.platform;
        if (plt === 'darwin')
            await exec_fn('pbcopy', [], text);
        else if (plt === 'win32')
            await exec_fn('powershell', ['-noprofile', '-command', 'Set-Clipboard'], text);
        else {
            try {
                await exec_fn('xclip', ['-selection', 'clipboard'], text);
            }
            catch {
                await exec_fn('xsel', ['--clipboard', '--input'], text);
            }
        }
    }
    Clipboard.set = set;
    /**
     * Read data from the system clipboard (Node.js).
     */
    async function get(opts) {
        await init();
        let text;
        if (node_clipboard) {
            text = await node_clipboard.read();
        }
        else {
            if (!exec_fn)
                throw new Error('No clipboard method available');
            const plt = process.platform;
            if (plt === 'darwin')
                text = (await exec_fn('pbpaste', []));
            else if (plt === 'win32')
                text = (await exec_fn('powershell', ['-noprofile', '-command', 'Get-Clipboard']));
            else {
                try {
                    text = (await exec_fn('xclip', ['-selection', 'clipboard', '-o']));
                }
                catch {
                    text = (await exec_fn('xsel', ['--clipboard', '--output']));
                }
            }
        }
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
    Clipboard.get = get;
})(Clipboard || (Clipboard = {}));
export { Clipboard as clipboard }; // snake_case compatibility
//# sourceMappingURL=node.js.map