/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/**
 * Performance measurement utility class
 * @docs
 */
export class Performance {
    private name: string;
    private times: Record<string, number>;
    private now: number;

    /**
     * Create a new Performance measurement utility.
     * @param name Optional name for this performance tracker.
     */
    constructor(name: string = "Performance") {
        this.name = name;
        this.times = {};
        this.now = Date.now();
    }

    /**
     * Start a performance measurement
     * @returns Current timestamp in milliseconds
     * @docs
     */
    public start(): number {
        this.now = Date.now();
        return this.now;
    }

    /**
     * End a performance measurement
     * @param id Identifier for the measurement
     * @param start Optional start time, defaults to last recorded time
     * @returns Current timestamp in milliseconds
     * @docs
     */
    public end(id: string, start?: number): number {
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

    /**
     * Print all recorded performance measurements sorted by duration
     * @docs
     */
    public dump(filter?: (ms_performance: number) => boolean): string {
        let results;
        if (filter) {
            results = Object.entries(this.times).filter(([_, time]) => filter(time));
        } else {
            results = Object.entries(this.times);
        }
        results.sort((a, b) => b[1] - a[1]);
        let obj = Object.fromEntries(results);
        const buf = [`${this.name}:`];
        Object.keys(obj).forEach((id) => {
            buf.push(` * ${id}: ${obj[id]}`);
        });
        return buf.join("\n");
    }
}
