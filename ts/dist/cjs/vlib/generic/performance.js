var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Performance: () => Performance
});
module.exports = __toCommonJS(stdin_exports);
class Performance {
  name;
  times;
  now;
  /**
   * Create a new Performance measurement utility.
   * @param name Optional name for this performance tracker.
   * @docs
   */
  constructor(name = "Performance") {
    this.name = name;
    this.times = {};
    this.now = Date.now();
  }
  /**
   * Start a performance measurement
   * @returns Current timestamp in milliseconds
   * @docs
   */
  start() {
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
  end(id, start) {
    if (start == null) {
      start = this.now;
    }
    if (this.times[id] === void 0) {
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
  dump(filter) {
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
  /**
   * Normalize a performance measurement, converting it to `{}ms` format
   * or `{}s` format if greater than 1000ms, etc.
   */
  static normalize(ms_performance) {
    if (ms_performance < 1e3) {
      return `${ms_performance}ms`;
    } else if (ms_performance < 6e4) {
      return `${(ms_performance / 1e3).toFixed(2)}s`;
    } else if (ms_performance < 6e4 * 60) {
      return `${(ms_performance / 6e4).toFixed(2)}min`;
    } else if (ms_performance < 6e4 * 60 * 24) {
      return `${(ms_performance / 36e5).toFixed(2)}h`;
    } else if (ms_performance < 6e4 * 60 * 24 * 7) {
      return `${(ms_performance / 864e5).toFixed(2)}d`;
    } else if (ms_performance < 6e4 * 60 * 24 * 30) {
      return `${(ms_performance / 6048e5).toFixed(2)}w`;
    } else if (ms_performance < 6e4 * 60 * 24 * 365) {
      return `${(ms_performance / 2592e6).toFixed(2)}mo`;
    } else {
      return `${(ms_performance / 31536e6).toFixed(2)}y`;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Performance
});
