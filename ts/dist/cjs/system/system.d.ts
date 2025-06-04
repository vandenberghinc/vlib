/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
export declare const System: {
    readonly format_bytes: (bytes: number) => string;
    readonly cpu_usage: () => number;
    readonly memory_usage: (format?: boolean) => {
        total: string | number;
        used: string | number;
        free: string | number;
        used_percentage: number;
    };
    readonly network_usage: (format?: boolean) => Promise<{
        sent: string | number;
        received: string | number;
    }>;
};
