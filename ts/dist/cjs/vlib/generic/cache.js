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
  max_size;
  max_bytes;
  ttl;
  sliding_ttl;
  optimize_memory_checks;
  map;
  last_access_times;
  cleanup_interval_id;
  cached_memory_size;
  memory_size_dirty;
  /**
   * Construct a new cache instance.
   * @docs
   */
  constructor({ max_size = void 0, max_bytes = void 0, ttl = void 0, cleanup_interval = 6e4, optimize_memory_checks = true } = {}) {
    if (max_size !== void 0 && max_size <= 0)
      throw new Error("max_size must be positive");
    if (max_bytes !== void 0 && max_bytes <= 0)
      throw new Error("limit must be positive");
    this.max_size = max_size;
    this.max_bytes = max_bytes;
    this.optimize_memory_checks = optimize_memory_checks;
    this.map = /* @__PURE__ */ new Map();
    this.last_access_times = /* @__PURE__ */ new Map();
    this.cleanup_interval_id = void 0;
    this.cached_memory_size = 0;
    this.memory_size_dirty = false;
    if (typeof ttl === "number") {
      if (ttl <= 0)
        throw new Error("ttl must be positive");
      this.ttl = ttl;
      this.sliding_ttl = true;
    } else if (typeof ttl === "object" && ttl !== null) {
      if (ttl.duration <= 0)
        throw new Error("ttl.duration must be positive");
      this.ttl = ttl.duration;
      this.sliding_ttl = ttl.sliding ?? true;
    } else {
      this.ttl = void 0;
      this.sliding_ttl = true;
    }
    if (this.ttl !== void 0 || this.max_bytes !== void 0 && this.optimize_memory_checks) {
      this._start_cleanup_interval(cleanup_interval);
    }
  }
  // ---------------------------------------------------------------
  // Private
  /**
   * Start the cleanup interval for TTL eviction and memory limit enforcement.
   * @param cleanup_interval - The interval in milliseconds to perform cleanup tasks
   */
  _start_cleanup_interval(cleanup_interval) {
    this.cleanup_interval_id = setInterval(() => {
      if (this.ttl !== void 0) {
        const now = Date.now();
        const keys_to_delete = [];
        for (const [key, last_access_time] of this.last_access_times) {
          if (!this.map.has(key)) {
            this.last_access_times.delete(key);
            continue;
          }
          if (now - last_access_time > this.ttl) {
            keys_to_delete.push(key);
          }
        }
        for (const key of keys_to_delete) {
          this.delete(key);
        }
      }
      if (this.max_bytes !== void 0 && this.optimize_memory_checks && this.memory_size_dirty) {
        this._enforce_memory_limit();
        this.memory_size_dirty = false;
      }
    }, cleanup_interval);
    this.cleanup_interval_id.unref?.();
  }
  /**
   * Stop the cleanup interval.
   */
  _stop_cleanup_interval() {
    if (this.cleanup_interval_id !== void 0) {
      clearInterval(this.cleanup_interval_id);
      this.cleanup_interval_id = void 0;
    }
  }
  /**
   * Check size limits and remove oldest entries if exceeded.
   * Only performs lightweight checks when optimize_memory_checks is true.
   */
  _check_and_remove_oldest() {
    if (this.max_size !== void 0) {
      while (this.map.size > this.max_size) {
        const oldest_key = this.map.keys().next().value;
        if (oldest_key !== void 0) {
          this.delete(oldest_key);
        } else {
          break;
        }
      }
    }
    if (this.max_bytes !== void 0) {
      if (this.optimize_memory_checks) {
        this.memory_size_dirty = true;
      } else {
        this._enforce_memory_limit();
      }
    }
  }
  /**
   * Enforce memory limit by removing oldest entries until within limit.
   * This is the expensive operation that may be deferred.
   */
  _enforce_memory_limit() {
    if (this.max_bytes === void 0)
      return;
    while (this.map.size > 0) {
      const total_size = this._get_total_memory_size();
      this.cached_memory_size = total_size;
      if (total_size <= this.max_bytes) {
        break;
      }
      const oldest_key = this.map.keys().next().value;
      if (oldest_key !== void 0) {
        this.delete(oldest_key);
      } else {
        break;
      }
    }
  }
  /**
   * Estimate the memory size of a value in bytes.
   * @param value - The value to measure
   * @returns The estimated size in bytes
   */
  _estimate_size(value, visited) {
    if (visited.has(value))
      return 0;
    if (typeof value === "object" && value !== null)
      visited.add(value);
    if (value === null || value === void 0)
      return 0;
    switch (typeof value) {
      case "boolean":
        return 4;
      case "number":
        return 8;
      case "string":
        return value.length * 2;
      // UTF-16 encoding
      case "object":
        if (value instanceof Date) {
          return 8;
        } else if (Array.isArray(value)) {
          let size = 8;
          for (const item of value) {
            size += this._estimate_size(item, visited);
          }
          return size;
        } else if (Buffer.isBuffer(value)) {
          return value.length;
        } else {
          let size = 8;
          for (const key in value) {
            if (value.hasOwnProperty(key)) {
              size += this._estimate_size(key, visited) + this._estimate_size(value[key], visited);
            }
          }
          return size;
        }
      default:
        return 8;
    }
  }
  /**
   * Calculate the total memory size of all cached values.
   * @returns The total size in bytes
   */
  _get_total_memory_size() {
    let total_size = 0;
    const visited = /* @__PURE__ */ new WeakSet();
    for (const [key, value] of this.map) {
      total_size += this._estimate_size(key, visited) + this._estimate_size(value, visited);
    }
    return total_size;
  }
  // ---------------------------------------------------------------
  // Public
  /**
   * Get the current size of the cache.
   * @returns The number of items in the cache
   * @docs
   */
  get size() {
    return this.map.size;
  }
  /**
   * Check if a key exists in the cache.
   * @param key - The key to check
   * @returns True if the key exists, false otherwise
   * @docs
   */
  has(key) {
    return this.map.has(key);
  }
  /**
   * Set a value in the cache for a given key.
   * @param key - The key to set
   * @param value - The value to store
   * @returns The cache instance for method chaining
   * @docs
   */
  set(key, value) {
    this.map.set(key, value);
    if (this.ttl !== void 0 && (this.sliding_ttl || !this.last_access_times.has(key))) {
      this.last_access_times.set(key, Date.now());
    }
    this._check_and_remove_oldest();
    return this;
  }
  /**
   * Retrieve a value from the cache by key.
   * @param key - The key to retrieve
   * @returns The stored value or undefined if not found
   * @docs
   */
  get(key) {
    if (this.map.has(key)) {
      if (this.ttl !== void 0 && (this.sliding_ttl || !this.last_access_times.has(key))) {
        this.last_access_times.set(key, Date.now());
      }
      return this.map.get(key);
    }
    return void 0;
  }
  /**
   * Remove an item from the cache.
   * @param key - The key to remove
   * @returns True if an element was removed, false otherwise
   * @docs
   */
  delete(key) {
    const deletion_result = this.map.delete(key);
    this.last_access_times.delete(key);
    if (deletion_result) {
      this.memory_size_dirty = true;
    }
    return deletion_result;
  }
  /**
   * Remove all items from the cache.
   * @returns The cache instance for method chaining
   * @docs
   */
  clear() {
    this.map.clear();
    this.last_access_times.clear();
    this.cached_memory_size = 0;
    this.memory_size_dirty = false;
    return this;
  }
  /**
   * Stop the cache, clear all items and stop the cleanup interval.
   * @returns The cache instance for method chaining
   * @docs
   */
  stop() {
    this.clear();
    this._stop_cleanup_interval();
    return this;
  }
  /**
   * Get an iterator of all cache keys.
   * @returns An iterator of all keys in the cache
   * @docs
   */
  keys() {
    return this.map.keys();
  }
  /**
   * Get an iterator of all cache values.
   * @returns An iterator of all values in the cache
   * @docs
   */
  values() {
    return this.map.values();
  }
  /**
   * Get the current estimated memory usage of the cache.
   * When `optimize_memory_checks` is true, this may return a cached value.
   * @returns The memory usage in bytes
   * @docs
   */
  get_memory_usage() {
    if (this.optimize_memory_checks && !this.memory_size_dirty) {
      return this.cached_memory_size;
    }
    return this._get_total_memory_size();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Cache
});
