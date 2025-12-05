/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A generic cache implementation with support for TTL (time-to-live) and size limits.
 * Supports both count-based and memory-based size limiting with automatic eviction of oldest entries.
 * @template K - The type of cache keys
 * @template V - The type of cache values
 *
 * @docs
 */
export class Cache {
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
    constructor({ max_size = undefined, max_bytes = undefined, ttl = undefined, cleanup_interval = 60_000, optimize_memory_checks = true, } = {}) {
        // Checks.
        if (max_size !== undefined && max_size <= 0)
            throw new Error("max_size must be positive");
        if (max_bytes !== undefined && max_bytes <= 0)
            throw new Error("limit must be positive");
        // Attributes.
        this.max_size = max_size;
        this.max_bytes = max_bytes;
        this.optimize_memory_checks = optimize_memory_checks;
        this.map = new Map();
        this.last_access_times = new Map();
        this.cleanup_interval_id = undefined;
        this.cached_memory_size = 0;
        this.memory_size_dirty = false;
        // Set TTL.
        if (typeof ttl === 'number') {
            if (ttl <= 0)
                throw new Error("ttl must be positive");
            this.ttl = ttl;
            this.sliding_ttl = true;
        }
        else if (typeof ttl === 'object' && ttl !== null) {
            if (ttl.duration <= 0)
                throw new Error("ttl.duration must be positive");
            this.ttl = ttl.duration;
            this.sliding_ttl = ttl.sliding ?? true;
        }
        else {
            this.ttl = undefined;
            this.sliding_ttl = true;
        }
        // Start cleanup interval if we have TTL or memory limit with optimization
        if (this.ttl !== undefined || (this.max_bytes !== undefined && this.optimize_memory_checks)) {
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
            // Handle TTL eviction
            if (this.ttl !== undefined) {
                const now = Date.now();
                const keys_to_delete = [];
                // Collect expired keys first to avoid iterator invalidation
                for (const [key, last_access_time] of this.last_access_times) {
                    if (!this.map.has(key)) {
                        this.last_access_times.delete(key);
                        continue;
                    }
                    if (now - last_access_time > this.ttl) {
                        keys_to_delete.push(key);
                    }
                }
                // Delete expired keys
                for (const key of keys_to_delete) {
                    this.delete(key);
                }
            }
            // Handle memory limit enforcement
            if (this.max_bytes !== undefined && this.optimize_memory_checks && this.memory_size_dirty) {
                this._enforce_memory_limit();
                this.memory_size_dirty = false;
            }
        }, cleanup_interval);
        this.cleanup_interval_id.unref?.(); // tell nodejs not to block process exit if this is still running.
    }
    /**
     * Stop the cleanup interval.
     */
    _stop_cleanup_interval() {
        if (this.cleanup_interval_id !== undefined) {
            clearInterval(this.cleanup_interval_id);
            this.cleanup_interval_id = undefined;
        }
    }
    /**
     * Check size limits and remove oldest entries if exceeded.
     * Only performs lightweight checks when optimize_memory_checks is true.
     */
    _check_and_remove_oldest() {
        // Always check count-based limit (lightweight O(1) check)
        if (this.max_size !== undefined) {
            while (this.map.size > this.max_size) {
                const oldest_key = this.map.keys().next().value;
                if (oldest_key !== undefined) {
                    this.delete(oldest_key);
                }
                else {
                    break;
                }
            }
        }
        // Check memory-based limit
        if (this.max_bytes !== undefined) {
            if (this.optimize_memory_checks) {
                // Just mark as dirty for deferred checking
                this.memory_size_dirty = true;
            }
            else {
                // Immediate enforcement (expensive)
                this._enforce_memory_limit();
            }
        }
    }
    /**
     * Enforce memory limit by removing oldest entries until within limit.
     * This is the expensive operation that may be deferred.
     */
    _enforce_memory_limit() {
        if (this.max_bytes === undefined)
            return;
        while (this.map.size > 0) {
            const total_size = this._get_total_memory_size();
            this.cached_memory_size = total_size;
            if (total_size <= this.max_bytes) {
                break;
            }
            const oldest_key = this.map.keys().next().value;
            if (oldest_key !== undefined) {
                this.delete(oldest_key);
            }
            else {
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
        // Circular reference guard.
        if (visited.has(value))
            return 0; // Circular reference
        if (typeof value === 'object' && value !== null)
            visited.add(value);
        // Null.
        if (value === null || value === undefined)
            return 0;
        // Primitive types.
        switch (typeof value) {
            case 'boolean':
                return 4;
            case 'number':
                return 8;
            case 'string':
                return value.length * 2; // UTF-16 encoding
            case 'object':
                if (value instanceof Date) {
                    return 8;
                }
                else if (Array.isArray(value)) {
                    let size = 8; // Array overhead
                    for (const item of value) {
                        size += this._estimate_size(item, visited);
                    }
                    return size;
                }
                else if (Buffer.isBuffer(value)) {
                    return value.length;
                }
                else {
                    // Regular object
                    let size = 8; // Object overhead
                    for (const key in value) {
                        if (value.hasOwnProperty(key)) {
                            size += this._estimate_size(key, visited) + this._estimate_size(value[key], visited);
                        }
                    }
                    return size;
                }
            default:
                return 8; // Default size for unknown types
        }
    }
    /**
     * Calculate the total memory size of all cached values.
     * @returns The total size in bytes
     */
    _get_total_memory_size() {
        let total_size = 0;
        const visited = new WeakSet();
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
        if (this.ttl !== undefined && (this.sliding_ttl || !this.last_access_times.has(key))) {
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
            if (this.ttl !== undefined && (this.sliding_ttl || !this.last_access_times.has(key))) {
                this.last_access_times.set(key, Date.now());
            }
            return this.map.get(key);
        }
        return undefined;
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
//# sourceMappingURL=cache.js.map