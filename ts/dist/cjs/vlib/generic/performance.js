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
    if (this.times[id] === void 0) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Performance
});
