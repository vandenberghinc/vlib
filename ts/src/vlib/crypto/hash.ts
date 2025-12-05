/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import * as crypto from 'crypto';

/**
 * {Hash}
 * Wrapper function to create hashes.
 * 
 * @param data - The data to hash, can be a string or a Buffer.
 * @param algo - The hashing algorithm to use, defaults to "sha256".
 * @param format - The output format, can be "hex", "base64", or false to return a Hash object.
 * 
 * @nav Crypto
 * @docs
 */
export function hash(data: string | Buffer, algo?: string, format?: crypto.BinaryToTextEncoding): string
export function hash(data: string | Buffer, algo?: string, format?: false): crypto.Hash
export function hash(data: string | Buffer, algo: string = "sha256", format: crypto.BinaryToTextEncoding | false = "hex"): string | crypto.Hash {
    const hash = crypto.createHash(algo);
    hash.update(data)
    if (format) {
        return hash.digest(format);
    }
    return hash;
}
