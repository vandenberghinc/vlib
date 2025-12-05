/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A mutual-exclusion primitive for async operations.
 * Allows callers to `await lock()` to acquire exclusive access,
 * and receive a `release` function to relinquish the lock.
 * Multiple lock requests queue up automatically.
 *
 * @example
 * ```ts
 * const m = new Mutex();
 *
 * async function critical() {
 *   const release = await m.lock();
 *   try {
 *     // ... perform exclusive work ...
 *   } finally {
 *     release();
 *   }
 * }
 * ```
 *
 * @docs
 */
export class Mutex {
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
        }
        else {
            await new Promise(resolve => {
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
        }
        else {
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
        }
        finally {
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
//# sourceMappingURL=mutex.js.map