/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as crypto from 'crypto';
/**
 * {Hash}
 * Wrapper function to create hashes.
 *
 * @param data - The data to hash, can be a string or a Buffer.
 * @param algo - The hashing algorithm to use, defaults to "sha256".
 * @param format - The output format, can be "hex", "base64", or false to return a Hash object.
 */
export declare function hash(data: string | Buffer, algo?: string, format?: crypto.BinaryToTextEncoding): string;
export declare function hash(data: string | Buffer, algo?: string, format?: false): crypto.Hash;
