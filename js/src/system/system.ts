/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as os from 'os';
import * as sysinfo from 'sysinfo';

/*  @docs:
    @chapter: System
    @title: System
    @desc: The system module.
    @parse: false
*/
export const System = {

    /* @docs:
        @title: Format bytes
        @desc: Format bytes into a converted string with a suffixed B, KB, MB, or GB
        @return:
            Returns the bytes converted into a string suffixed with a B, KB, MB, or GB
        @param:
            @name: bytes
            @desc: The number of bytes
            @type: number
    */
    format_bytes(bytes: number): string {
        if (bytes > 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
        }
        else if (bytes > 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
        }
        else if (bytes > 1024) {
            return `${(bytes / 1024).toFixed(2)}KB`;
        }
        return `${(bytes).toFixed(2)}B`;
    },

    /* @docs:
        @title: CPU usage
        @desc: Get the system cpu usage
        @return:
            Returns a number containing the current cpu usage in percentage
    */
    cpu_usage(): number {
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
    },

    /* @docs:
        @title: Memory usage
        @desc: Get the system memory usage
        @return:
            Returns a `{total, used, free, used_percentage}` object with memory usage
        @param:
            @name: format
            @desc: Format the bytes into a converted string with a suffixed B, KB, MB, or GB
    */
    memory_usage(format: boolean = true): {
	    total: string | number;
	    used: string | number;
	    free: string | number;
	    used_percentage: number;
	} {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        return {
            total: format ? System.format_bytes(total) : total,
            used: format ? System.format_bytes(used) : used,
            free: format ? System.format_bytes(free) : free,
            used_percentage: (used / total) * 100,
        };
    },

    /* @docs:
        @title: Network usage
        @desc: Get the system network usage
        @return:
            Returns a `{sent, received}` object with sent and received bytes usage
        @param:
            @name: format
            @desc: Format the bytes into a converted string with a suffixed B, KB, MB, or GB
    */
    async network_usage(format: boolean = true): Promise<{ sent: string | number; received: string | number; }> {
        const stats = await sysinfo.networkStats();
        let sent = 0;
        let received = 0;
        stats.forEach((iface: any) => {
            sent += iface.tx_bytes;
            received += iface.rx_bytes;
        });
        return {
            sent: format ? System.format_bytes(sent) : sent,
            received: format ? System.format_bytes(received) : received,
        };
    }
} as const;

export default System;
