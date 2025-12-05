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
export declare class Mutex {
    /** Queue of waiting lockers' resolve callbacks */
    private _queue;
    /** Whether the mutex is currently held */
    private _locked;
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
    lock(): Promise<void>;
    /**
     * Release the mutex, allowing the next waiter (if any) to acquire it.
     *
     * @docs
     */
    unlock(): void;
    /**
     * Execute the callback under exclusive lock, auto-releasing on completion.
     * @param callback Function to run while holding the mutex.
     * @docs
     */
    run_exclusive<T>(callback: () => Promise<T> | T): Promise<T>;
    /**
     * Check if the mutex is currently locked.
     * @docs
     */
    locked(): boolean;
    /**
     * Check if the mutex is currently locked.
     * @docs
     */
    is_locked(): boolean;
    /**
     * Number of queued waiters.
     * @docs
     */
    waiting(): number;
}
