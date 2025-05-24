/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

// Module.
/*  @docs:
	@chapter: System
    @title: System
    @name: vlib.system
    @desc: The system module.
    @parse: false
*/
vlib.system = {};

// Format bytes.
/* 	@docs:
	@title: Format bytes.
	@desc: Format bytes into a converted string with a suffixed B, KB, MB, or GB.
	@return:
		Returns the bytes converted into a string suffixed with a B, KB, MB, or GB.
	@param:
		@name: bytes
		@desc: The number of bytes.
		@type: number
*/
vlib.system.format_bytes = (bytes) => {
	if (bytes > 1024*1024*1024) {
		return `${(bytes / (1024*1024*1024)).toFixed(2)}GB`;
	}
	else if (bytes > 1024*1024) {
		return `${(bytes / (1024*1024)).toFixed(2)}MB`;
	}
	else if (bytes > 1024) {
		return `${(bytes / 1024).toFixed(2)}KB`;
	}
	return `${(bytes).toFixed(2)}B`;
}

// Get cpu usage.
/* 	@docs:
	@title: CPU usage
	@desc: Get the system cpu usage.
	@return:
		Returns a number containing the current cpu usage in percentage.
*/
vlib.system.cpu_usage = () => {

	// Total CPU Usage across all cores
	const cpus = libos.cpus();
	let total_time = 0;
	let total_used = 0;

	cpus.forEach(cpu => {
	    const cpu_total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
	    const cpu_used = cpu_total - cpu.times.idle;
	    
	    total_time += cpu_total;
	    total_used += cpu_used;
	});

	return (total_used / total_time) * 100;


	/*
	// Source: https://stackoverflow.com/questions/63289933/get-process-cpu-usage-in-percentage

	// Take the first CPU, considering every CPUs have the same specs
	// and every NodeJS process only uses one at a time.
	const cpus = libos.cpus();
	const cpu = cpus[0];

	// Accumulate every CPU times values
	const total = Object.values(cpu.times).reduce(
	    (acc, tv) => acc + tv, 0
	);

	// Normalize the one returned by process.cpuUsage() 
	// (microseconds VS miliseconds)
	const usage = process.cpuUsage();
	const currentCPUUsage = (usage.user + usage.system) * 1000;
	// const currentCPUUsage = (usage.user + usage.system) / 1000;

	// Find out the percentage used for this specific CPU
	const perc = currentCPUUsage / total * 100;

	return perc;
	*/
}

// Memory usage.
/* 	@docs:
	@title: Memory usage
	@desc: Get the system memory usage.
	@return:
		Returns a `{total, used, free, used_percentage}` object with memory usage.
	@param:
		@name: format
		@desc: Format the bytes into a converted string with a suffixed B, KB, MB, or GB.
*/
vlib.system.memory_usage = (format = true) => {
	const total = libos.totalmem();
	const free = libos.freemem();
	const used = total - free;
	return {
		total: format ? vlib.system.format_bytes(total) : total,
		used: format ? vlib.system.format_bytes(used) : used,
		free: format ? vlib.system.format_bytes(free) : free,
		used_percentage: (used / total) * 100,
	}
}

// Network usage.
/* 	@docs:
	@title: Network usage
	@desc: Get the system network usage.
	@return:
		Returns a `{sent, received}` object with sent and received bytes usage.
	@param:
		@name: format
		@desc: Format the bytes into a converted string with a suffixed B, KB, MB, or GB.
*/
vlib.system.network_usage = async (format = true) => {
	const stats = await sysinfo.networkStats();
	let sent = 0;
	let received = 0;

	stats.forEach(iface => {
		sent += iface.tx_bytes;
		received += iface.rx_bytes;
	});
	return {
		sent: format ? vlib.system.format_bytes(sent) : sent,
		received: format ? vlib.system.format_bytes(received) : received,
	};
}