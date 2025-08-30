/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A generic cache implementation with support for TTL (time-to-live) and size limits.
 * Supports both count-based and memory-based size limiting with automatic eviction of oldest entries.
 * @template K - The type of cache keys
 * @template V - The type of cache values
 */
export declare class Cache<K extends string | number | symbol = string, V = any> {
    private max_size;
    private limit;
    private ttl;
    private optimize_memory_checks;
    private map;
    private last_access_times;
    private cleanup_interval_id;
    private cached_memory_size;
    private memory_size_dirty;
    constructor({ max_size, limit, ttl, cleanup_interval, optimize_memory_checks, }?: {
        /** The max entries allowed in the cache, once exceeded items will be popped. */
        max_size?: number;
        /** Time to live for each entry in msec. */
        ttl?: number;
        /**
         * The total memory limit in bytes for the entire cache, once exceeded items will be popped.
         * Note that the memory size is estimated and may not be exact.
         */
        limit?: number;
        /**
         * Optimize memory usage checks by performing the check inside the interval loop
         * instead of inside the {@link set} method.
         */
        optimize_memory_checks?: boolean;
        /** Cleanup interval in msec. */
        cleanup_interval?: number;
    });
    /**
     * Start the cleanup interval for TTL eviction and memory limit enforcement.
     * @param cleanup_interval - The interval in milliseconds to perform cleanup tasks
     */
    private _start_cleanup_interval;
    /**
     * Stop the cleanup interval.
     */
    private _stop_cleanup_interval;
    /**
     * Check size limits and remove oldest entries if exceeded.
     * Only performs lightweight checks when optimize_memory_checks is true.
     */
    private _check_and_remove_oldest;
    /**
     * Enforce memory limit by removing oldest entries until within limit.
     * This is the expensive operation that may be deferred.
     */
    private _enforce_memory_limit;
    /**
     * Update the last access time for a key.
     * @param key - The key to update
     */
    private _update_last_access_time;
    /**
     * Estimate the memory size of a value in bytes.
     * @param value - The value to measure
     * @returns The estimated size in bytes
     */
    private _estimate_size;
    /**
     * Calculate the total memory size of all cached values.
     * @returns The total size in bytes
     */
    private _get_total_memory_size;
    /**
     * Get the current size of the cache.
     * @returns The number of items in the cache
     */
    get size(): number;
    /**
     * Check if a key exists in the cache.
     * @param key - The key to check
     * @returns True if the key exists, false otherwise
     */
    has(key: K): boolean;
    /**
     * Set a value in the cache for a given key.
     * @param key - The key to set
     * @param value - The value to store
     * @returns The cache instance for method chaining
     */
    set(key: K, value: V): this;
    /**
     * Retrieve a value from the cache by key.
     * @param key - The key to retrieve
     * @returns The stored value or undefined if not found
     */
    get(key: K): V | undefined;
    /**
     * Remove an item from the cache.
     * @param key - The key to remove
     * @returns True if an element was removed, false otherwise
     */
    delete(key: K): boolean;
    /**
     * Remove all items from the cache.
     * @returns The cache instance for method chaining
     */
    clear(): this;
    /**
     * Stop the cache, clear all items and stop the cleanup interval.
     * @returns The cache instance for method chaining
     */
    stop(): this;
    /**
     * Get an iterator of all cache keys.
     * @returns An iterator of all keys in the cache
     */
    keys(): IterableIterator<K>;
    /**
     * Get an iterator of all cache values.
     * @returns An iterator of all values in the cache
     */
    values(): IterableIterator<V>;
    /**
     * Get the current estimated memory usage of the cache.
     * When `optimize_memory_checks` is true, this may return a cached value.
     * @returns The memory usage in bytes
     */
    get_memory_usage(): number;
}
