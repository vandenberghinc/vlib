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
 */
export class Mutex {
    
    /** Queue of waiting lockers' resolve callbacks */
    private _queue: Array<() => void> = [];
    
    /** Whether the mutex is currently held */
    private _locked = false;

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
     */
    public async lock(): Promise<void> {
        if (!this._locked) {
            this._locked = true;
        } else {
            await new Promise<void>(resolve => {
                this._queue.push(resolve);
            });
            this._locked = true;
        }
    }

    /**
     * Release the mutex, allowing the next waiter (if any) to acquire it.
     */
    public unlock(): void {
        if (this._queue.length > 0) {
            const next = this._queue.shift()!;
            next();
        } else {
            this._locked = false;
        }
    }

    /**
     * Execute the callback under exclusive lock, auto-releasing on completion.
     * @param callback Function to run while holding the mutex.
     */
    public async run_exclusive<T>(callback: () => Promise<T> | T): Promise<T> {
        await this.lock();
        try {
            return await callback();
        } finally {
            this.unlock();
        }
    }

    /**
     * Check if the mutex is currently locked.
     */
    public locked(): boolean {
        return this._locked;
    }

    /**
     * Number of queued waiters.
     */
    public waiting(): number {
        return this._queue.length;
    }
}
  
  
// DEPRECATED
// /** @docs
//  *  @chapter: System
//  *  @title: Mutex
//  *  @desc: A mutual exclusion primitive useful for protecting shared data structures from concurrent access
//  */
// export class Mutex {
//     private locked: boolean;
//     private queue: (() => void)[];

//     constructor() {
//         this.locked = false;
//         this.queue = [];
//     }

//     /** @docs
//      *  @title: Lock
//      *  @desc: Acquire the mutex lock. Should be awaited
//      *  @returns 
//      *      @type Promise<void>
//      *      @desc Resolves when the lock is acquired
//      */
//     public async lock(): Promise<void> {
//         if (!this.locked) {
//             this.locked = true;
//         } else {
//             return new Promise<void>((resolve) => {
//                 this.queue.push(resolve);
//             });
//         }
//     }

//     /** @docs
//      *  @title: Unlock
//      *  @desc: Release the mutex lock
//      */
//     public unlock(): void {
//         if (this.queue.length > 0) {
//             const next_resolve = this.queue.shift()!;
//             next_resolve();
//         } else {
//             this.locked = false;
//         }
//     }
// }
