/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** @docs
 *  @chapter: System
 *  @title: Performance
 *  @desc: Performance measurement utility class
 */
export class Performance {
    name;
    times;
    now;
    constructor(name = "Performance") {
        this.name = name;
        this.times = {};
        this.now = Date.now();
    }
    /** @docs
     *  @title: Start
     *  @desc: Start a performance measurement
     *  @returns
     *      @type number
     *      @desc Current timestamp in milliseconds
     */
    start() {
        this.now = Date.now();
        return this.now;
    }
    /** @docs
     *  @title: End
     *  @desc: End a performance measurement
     *  @param
     *      @name id
     *      @desc Identifier for the measurement
     *      @type string
     *  @param
     *      @name start
     *      @desc Optional start time, defaults to last recorded time
     *      @type number
     *  @returns
     *      @type number
     *      @desc Current timestamp in milliseconds
     */
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
    /** @docs
     *  @title: Dump
     *  @desc: Print all recorded performance measurements sorted by duration
     */
    dump(filter) {
        let results;
        if (filter) {
            results = Object.entries(this.times).filter(([_, time]) => filter(time));
        }
        else {
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
//# sourceMappingURL=performance.js.map