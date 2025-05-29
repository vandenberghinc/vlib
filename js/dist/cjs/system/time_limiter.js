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
  TimeLimiter: () => TimeLimiter
});
module.exports = __toCommonJS(stdin_exports);
class TimeLimiter {
  _duration;
  _limit;
  _counts;
  _expiration;
  constructor({ duration = 60 * 1e3, limit = 10 } = {}) {
    this._duration = duration;
    this._limit = limit;
    this._counts = 0;
    this._expiration = Date.now() + this._duration;
  }
  /*  @docs:
      @title: Limit
      @desc: Check if the current process is within the limit of the specified time frame.
      @returns:
          @type: boolean
          @desc: Returns true if the process is within limits, false otherwise
  */
  limit() {
    const now = Date.now();
    if (now > this._expiration) {
      this._expiration = now + this._duration;
      this._counts = 0;
    }
    ++this._counts;
    return this._counts < this._limit;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TimeLimiter
});
