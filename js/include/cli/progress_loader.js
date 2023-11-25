/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Progress loader.

vlib.ProgressLoader = class ProgessLoader {
	constructor({message = "Loading", steps = 100, step = 0, width = 10}) {
		this.message = message.trim();
		this.steps = steps;
		this.step = step;
		this.width = width;
		this.progess = 0;
		this.last_progress = null;
		this.next(false);
	}
	next(increment = true) {
		if (increment) {
			++this.step;
		}
		this.progress = this.step / this.steps;
		const fixed = (this.progress * 100).toFixed(2);
		if (fixed != this.last_progress) {
			this.last_progress = fixed;
			const completed = Math.floor(this.progress * this.width);
		    const remaining = this.width - completed;
			process.stdout.write(`\r${this.message} ${fixed}% [${"=".repeat(completed)}${".".repeat(remaining)}]${this.progress >= 1 ? '\n' : ''}`);
		}
	}
}
