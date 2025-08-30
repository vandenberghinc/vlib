/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * The system module.
 * @chapter System
 * @parse false
 * @docs
 */
export declare namespace System {
    /**
     * Format bytes into a converted string with a suffixed B, KB, MB, or GB.
     * @returns Returns the bytes converted into a string suffixed with a B, KB, MB, or GB
     * @param bytes The number of bytes
     * @docs
    */
    function format_bytes(bytes: number): string;
    /**
     * Get the system CPU usage.
     * @returns Returns a number containing the current cpu usage in percentage
     * @docs
    */
    function cpu_usage(): number;
    /**
     * Get the system memory usage.
     * @returns Returns a `{total, used, free, used_percentage}` object with memory usage
     * @param format Format the bytes into a converted string with a suffixed B, KB, MB, or GB
     * @docs
    */
    function memory_usage(format?: boolean): {
        total: string | number;
        used: string | number;
        free: string | number;
        used_percentage: number;
    };
    /**
     * Get the system network usage.
     * @returns Returns a `{sent, received}` object with sent and received bytes usage
     * @param format Format the bytes into a converted string with a suffixed B, KB, MB, or GB
     * @docs
    */
    function network_usage(format?: boolean): Promise<{
        sent: string | number;
        received: string | number;
    }>;
}
