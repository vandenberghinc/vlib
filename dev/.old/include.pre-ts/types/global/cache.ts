/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

interface CacheOptions {
    limit?: number | null;
    ttl?: number | null;  // time to live in msec
    ttl_interval?: number;  // time to live interval check in msec
}

export class Cache<K, V> {

    // Attributes.
    private limit: number | null;
    private ttl: number | null;
    private map: Map<K, V>;
    private last_access_times: Map<K, number>;
    private cleanup_interval_id: NodeJS.Timeout | null;

    // Constructor.
    constructor({
        limit = null,
        ttl = null,
        ttl_interval = 10000,
    }: CacheOptions = {}) {
        this.limit = limit;
        this.ttl = ttl;
        this.map = new Map<K, V>();
        this.last_access_times = new Map<K, number>();
        this.cleanup_interval_id = null;

        if (this.ttl !== null) {
            this._start_cleanup_interval(ttl_interval);
        }
    }

    // ---------------------------------------------------------
    // Private.

    private _start_cleanup_interval(ttl_interval: number): void {
        this.cleanup_interval_id = setInterval(() => {
            const now = Date.now();
            for (const [key, last_access_time] of this.last_access_times) {
                if (now - last_access_time > this.ttl!) {
                    this.delete(key);
                }
            }
        }, ttl_interval);
    }

    private _stop_cleanup_interval(): void {
        if (this.cleanup_interval_id !== null) {
            clearInterval(this.cleanup_interval_id);
            this.cleanup_interval_id = null;
        }
    }

    private _check_and_remove_oldest(): void {
        if (this.limit !== null && this.map.size > this.limit) {
            const oldest_key = this.map.keys().next().value;
            this.delete(oldest_key);
        }
    }

    private _update_last_access_time(key: K): void {
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
    public has(key: K): boolean {
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
    public set(key: K, value: V): this {
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
    public get(key: K): V | undefined {
        if (this.map.has(key)) {
            this._update_last_access_time(key);
            return this.map.get(key);
        }
        return undefined;
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
    public delete(key: K): boolean {
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
    public clear(): this {
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
    public stop(): this {
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
    public keys(): IterableIterator<K> {
        return this.map.keys();
    }

    /** @docs
     *  @title Values
     *  @desc Get an iterator of all cache values
     *  @returns
     *      @type IterableIterator<V>
     *      @desc Returns an iterator of all values in the cache
     */
    public values(): IterableIterator<V> {
        return this.map.values();
    }
}