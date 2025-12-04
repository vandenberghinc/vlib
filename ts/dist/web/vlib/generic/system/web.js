/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * The system module.
 * @nav System
 * @docs
 */
export var System;
(function (System) {
    /**
     * Format bytes into a converted string with a suffixed B, KB, MB, or GB.
     * @returns Returns the bytes converted into a string suffixed with a B, KB, MB, or GB
     * @param bytes The number of bytes
     * @docs
    */
    function format_bytes(bytes) {
        if (typeof bytes === "string") {
            bytes = Buffer.byteLength(bytes, "utf-8");
        }
        if (bytes > 1024 * 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
        }
        else if (bytes > 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
        }
        else if (bytes > 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
        }
        else if (bytes > 1024) {
            return `${(bytes / 1024).toFixed(2)}KB`;
        }
        return `${Math.floor(bytes)}B`;
    }
    System.format_bytes = format_bytes;
})(System || (System = {}));
//# sourceMappingURL=web.js.map