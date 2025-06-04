/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
interface CacheOptions {
    limit?: number | null;
    ttl?: number | null;
    ttl_interval?: number;
}
export declare class Cache<K = string, V = any> {
    private limit;
    private ttl;
    private map;
    private last_access_times;
    private cleanup_interval_id;
    constructor({ limit, ttl, ttl_interval, }?: CacheOptions);
    private _start_cleanup_interval;
    private _stop_cleanup_interval;
    private _check_and_remove_oldest;
    private _update_last_access_time;
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
    has(key: K): boolean;
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
    set(key: K, value: V): this;
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
    get(key: K): V | undefined;
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
    delete(key: K): boolean;
    /** @docs
     *  @title Clear
     *  @desc Remove all items from the cache
     *  @returns
     *      @type this
     *      @desc Returns the cache instance for method chaining
     */
    clear(): this;
    /** @docs
     *  @title Stop
     *  @desc Stop the cache, clear all items and stop the cleanup interval
     *  @returns
     *      @type this
     *      @desc Returns the cache instance for method chaining
     */
    stop(): this;
    /** @docs
     *  @title Keys
     *  @desc Get an iterator of all cache keys
     *  @returns
     *      @type IterableIterator<K>
     *      @desc Returns an iterator of all keys in the cache
     */
    keys(): IterableIterator<K>;
    /** @docs
     *  @title Values
     *  @desc Get an iterator of all cache values
     *  @returns
     *      @type IterableIterator<V>
     *      @desc Returns an iterator of all values in the cache
     */
    values(): IterableIterator<V>;
}
export {};
