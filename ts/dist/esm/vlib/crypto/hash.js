/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import * as crypto from 'crypto';
export function hash(data, algo = "sha256", format = "hex") {
    const hash = crypto.createHash(algo);
    hash.update(data);
    if (format) {
        return hash.digest(format);
    }
    return hash;
}
//# sourceMappingURL=hash.js.map