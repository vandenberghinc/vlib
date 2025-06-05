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
  Cache: () => Cache
});
module.exports = __toCommonJS(stdin_exports);
class Cache {
  // Attributes.
  limit;
  ttl;
  map;
  last_access_times;
  cleanup_interval_id;
  // Constructor.
  constructor({ limit = null, ttl = null, ttl_interval = 1e4 } = {}) {
    this.limit = limit;
    this.ttl = ttl;
    this.map = /* @__PURE__ */ new Map();
    this.last_access_times = /* @__PURE__ */ new Map();
    this.cleanup_interval_id = null;
    if (this.ttl !== null) {
      this._start_cleanup_interval(ttl_interval);
    }
  }
  // ---------------------------------------------------------
  // Private.
  _start_cleanup_interval(ttl_interval) {
    this.cleanup_interval_id = setInterval(() => {
      const now = Date.now();
      for (const [key, last_access_time] of this.last_access_times) {
        if (now - last_access_time > this.ttl) {
          this.delete(key);
        }
      }
    }, ttl_interval);
  }
  _stop_cleanup_interval() {
    if (this.cleanup_interval_id !== null) {
      clearInterval(this.cleanup_interval_id);
      this.cleanup_interval_id = null;
    }
  }
  _check_and_remove_oldest() {
    if (this.limit !== null && this.map.size > this.limit) {
      const oldest_key = this.map.keys().next().value;
      if (oldest_key) {
        this.delete(oldest_key);
      }
    }
  }
  _update_last_access_time(key) {
    this.last_access_times.set(key, Date.now());
  }
  // ---------------------------------------------------------
  // Public.
  /** @docs
   *  @title Has
   *  @desc Check if a key exists in the cache
   *  @param
   *      @name key
   *      @desc The key to check
   *      @type K
   *  @returns
   *      @type boolean
   *      @desc Returns true if the key exists, false otherwise
   */
  has(key) {
    return this.map.has(key);
  }
  /** @docs
   *  @title Set
   *  @desc Set a value in the cache for a given key
   *  @param
   *      @name key
   *      @desc The key to set
   *      @type K
   *  @param
   *      @name value
   *      @desc The value to store
   *      @type V
   *  @returns
   *      @type this
   *      @desc Returns the cache instance for method chaining
   */
  set(key, value) {
    this.map.set(key, value);
    this._update_last_access_time(key);
    this._check_and_remove_oldest();
    return this;
  }
  /** @docs
   *  @title Get
   *  @desc Retrieve a value from the cache by key
   *  @param
   *      @name key
   *      @desc The key to retrieve
   *      @type K
   *  @returns
   *      @type V | undefined
   *      @desc Returns the stored value or undefined if not found
   */
  get(key) {
    if (this.map.has(key)) {
      this._update_last_access_time(key);
      return this.map.get(key);
    }
    return void 0;
  }
  /** @docs
   *  @title Delete
   *  @desc Remove an item from the cache
   *  @param
   *      @name key
   *      @desc The key to remove
   *      @type K
   *  @returns
   *      @type boolean
   *      @desc Returns true if an element was removed, false otherwise
   */
  delete(key) {
    const deletion_result = this.map.delete(key);
    this.last_access_times.delete(key);
    return deletion_result;
  }
  /** @docs
   *  @title Clear
   *  @desc Remove all items from the cache
   *  @returns
   *      @type this
   *      @desc Returns the cache instance for method chaining
   */
  clear() {
    this.map.clear();
    this.last_access_times.clear();
    return this;
  }
  /** @docs
   *  @title Stop
   *  @desc Stop the cache, clear all items and stop the cleanup interval
   *  @returns
   *      @type this
   *      @desc Returns the cache instance for method chaining
   */
  stop() {
    this.clear();
    this._stop_cleanup_interval();
    return this;
  }
  /** @docs
   *  @title Keys
   *  @desc Get an iterator of all cache keys
   *  @returns
   *      @type IterableIterator<K>
   *      @desc Returns an iterator of all keys in the cache
   */
  keys() {
    return this.map.keys();
  }
  /** @docs
   *  @title Values
   *  @desc Get an iterator of all cache values
   *  @returns
   *      @type IterableIterator<V>
   *      @desc Returns an iterator of all values in the cache
   */
  values() {
    return this.map.values();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Cache
});
