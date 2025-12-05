/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { System as WebSystem } from './web.js';
/**
 * {System Node.js}
 * The system module.
 * @nav System
 * @docs
 */
export declare namespace System {
    /**
     * Aliases.
     */
    const format_bytes: typeof WebSystem.format_bytes;
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
