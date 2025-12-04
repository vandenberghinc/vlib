/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as os from 'os';
import * as sysinfo from 'sysinfo';
import { System as WebSystem } from './web.js';
/**
 * The system module.
 * @chapter System
 * @parse false
 * @docs
 */
export var System;
(function (System) {
    /** Aliases. */
    System.format_bytes = WebSystem.format_bytes;
    /**
     * Get the system CPU usage.
     * @returns Returns a number containing the current cpu usage in percentage
     * @docs
    */
    function cpu_usage() {
        const cpus = os.cpus();
        let total_time = 0;
        let total_used = 0;
        cpus.forEach(cpu => {
            const cpu_total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
            const cpu_used = cpu_total - cpu.times.idle;
            total_time += cpu_total;
            total_used += cpu_used;
        });
        return (total_used / total_time) * 100;
    }
    System.cpu_usage = cpu_usage;
    /**
     * Get the system memory usage.
     * @returns Returns a `{total, used, free, used_percentage}` object with memory usage
     * @param format Format the bytes into a converted string with a suffixed B, KB, MB, or GB
     * @docs
    */
    function memory_usage(format = true) {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        return {
            total: format ? System.format_bytes(total) : total,
            used: format ? System.format_bytes(used) : used,
            free: format ? System.format_bytes(free) : free,
            used_percentage: (used / total) * 100,
        };
    }
    System.memory_usage = memory_usage;
    /**
     * Get the system network usage.
     * @returns Returns a `{sent, received}` object with sent and received bytes usage
     * @param format Format the bytes into a converted string with a suffixed B, KB, MB, or GB
     * @docs
    */
    async function network_usage(format = true) {
        const stats = await sysinfo.networkStats();
        let sent = 0;
        let received = 0;
        stats.forEach((iface) => {
            sent += iface.tx_bytes;
            received += iface.rx_bytes;
        });
        return {
            sent: format ? System.format_bytes(sent) : sent,
            received: format ? System.format_bytes(received) : received,
        };
    }
    System.network_usage = network_usage;
})(System || (System = {}));
//# sourceMappingURL=node.js.map