/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * {System Browser}
 * The system module.
 * @nav System
 * @docs
 */
export declare namespace System {
    /**
     * Format bytes into a converted string with a suffixed B, KB, MB, or GB.
     * @returns Returns the bytes converted into a string suffixed with a B, KB, MB, or GB
     * @param bytes The number of bytes
     * @docs
    */
    function format_bytes(bytes: string | number): string;
}
