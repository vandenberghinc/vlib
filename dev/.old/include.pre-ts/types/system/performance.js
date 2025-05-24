/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Performance object.

vlib.Performance = class Performance {
	constructor(name = "Performance") {
		this.name = name;
		this.times = {};
		this.now = Date.now();
	}
	start() {
		this.now = Date.now();
		return this.now;
	}
	end(id, start) {
		if (start == null) {
			start = this.now;
		}
		if (this.times[id] === undefined) {
			this.times[id] = 0;
		}
		this.times[id] += Date.now() - start;
		this.now = Date.now();
		return this.now;
	}
	dump() {
		let results = Object.entries(this.times);
		results.sort((a, b) => b[1] - a[1]);
		results = Object.fromEntries(results);
		console.log(`${this.name}:`);
		Object.keys(results).iterate((id) => {
			console.log(` * ${id}: ${results[id]}`);
		});
	}
}