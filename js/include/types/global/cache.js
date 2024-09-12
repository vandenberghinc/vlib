/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// The cache object.

vlib.Cache = class Cache {
    constructor({
        limit = null,
        ttl = null, // time to live in msec
        ttl_interval = 10000, // time to live interval check in msec
    }) {
        this.limit = limit;
        this.ttl = ttl;
        this.map = new Map();
        this.last_access_times = new Map();
        this.cleanup_interval_id = null;

        if (this.ttl !== null) {
            this._start_cleanup_interval(ttl_interval);
        }
    }

    // ---------------------------------------------------------
    // System.

    // Start the cleanup interval.
    _start_cleanup_interval(ttl_interval) {
        this.cleanup_interval_id = setInterval(() => {
            const now = Date.now();
            for (let [key, last_access_time] of this.last_access_times) {
                if (now - last_access_time > this.ttl) {
                    this.delete(key);
                }
            }
        }, ttl_interval);
    }

    // Stop the cleanup interval.
    _stop_cleanup_interval() {
        if (this.cleanup_interval_id !== null) {
            clearInterval(this.cleanup_interval_id);
            this.cleanup_interval_id = null;
        }
    }

    // Check and remove the oldest item.
    _check_and_remove_oldest() {
        if (this.limit !== null && this.map.size > this.limit) {
            const oldest_key = this.map.keys().next().value;
            this.delete(oldest_key);
        }
    }

    // Update access time.
    _update_last_access_time(key) {
        this.last_access_times.set(key, Date.now());
    }

    // Has key.
    has(key) {
        return this.map.has(key);
    }

    // Set key and value.
    set(key, value) {
        this.map.set(key, value);
        this._update_last_access_time(key);
        this._check_and_remove_oldest();
    }

    // Get value by key.
    get(key) {
        if (this.map.has(key)) {
            this._update_last_access_time(key);
            return this.map.get(key);
        }
        return undefined;
    }

    // Delete key.
    delete(key) {
        const deletion_result = this.map.delete(key);
        this.last_access_times.delete(key);
        return deletion_result;
    }

    // Clear cache.
    clear() {
        this.map.clear();
        this.last_access_times.clear();
    }
    stop() {
        this.clear();   
        this._stop_cleanup_interval();
    }

    // Get keys iterator.
    keys() {
        return this.map.keys();
    }

    // Get values iterator.
    values() {
        return this.map.values();
    }
};
