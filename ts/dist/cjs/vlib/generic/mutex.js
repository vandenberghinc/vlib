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
  Mutex: () => Mutex
});
module.exports = __toCommonJS(stdin_exports);
class Mutex {
  /** Queue of waiting lockers' resolve callbacks */
  _queue = [];
  /** Whether the mutex is currently held */
  _locked = false;
  /**
   * Acquire the mutex. Resolves when the lock is obtained.
   * @example
   * ```ts
   * await mutex.lock();
   * try {
   *   // critical section
   * } finally {
   *   mutex.unlock();
   * }
   * ```
   *
   * @docs
   */
  async lock() {
    if (!this._locked) {
      this._locked = true;
    } else {
      await new Promise((resolve) => {
        this._queue.push(resolve);
      });
      this._locked = true;
    }
  }
  /**
   * Release the mutex, allowing the next waiter (if any) to acquire it.
   *
   * @docs
   */
  unlock() {
    if (this._queue.length > 0) {
      const next = this._queue.shift();
      next();
    } else {
      this._locked = false;
    }
  }
  /**
   * Execute the callback under exclusive lock, auto-releasing on completion.
   * @param callback Function to run while holding the mutex.
   * @docs
   */
  async run_exclusive(callback) {
    await this.lock();
    try {
      return await callback();
    } finally {
      this.unlock();
    }
  }
  /**
   * Check if the mutex is currently locked.
   * @docs
   */
  locked() {
    return this._locked;
  }
  /**
   * Check if the mutex is currently locked.
   * @docs
   */
  is_locked() {
    return this._locked;
  }
  /**
   * Number of queued waiters.
   * @docs
   */
  waiting() {
    return this._queue.length;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Mutex
});
