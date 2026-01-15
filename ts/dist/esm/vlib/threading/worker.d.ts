/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * This file is an AI-assisted draft and should be reviewed before public exposure.
 */
/**
 * Friendly wrapper around Node.js worker_threads for running isolated, CPU-heavy jobs
 * without blocking the main event loop.
 *
 * This class supports both:
 * - Ephemeral mode: one worker thread per job.
 * - Persistent mode: a pool of long-lived worker threads.
 *
 * All errors are passed back to the caller as rejected promises with a {@link Worker.Error}.
 *
 * @typeParam TPayload - The payload type sent to the worker.
 * @typeParam TResult - The result type returned by the worker.
 */
export declare class Worker<TPayload = unknown, TResult = unknown> {
    private readonly worker_path;
    private readonly default_timeout;
    private readonly max_concurrency;
    private readonly name?;
    private readonly worker_data?;
    private readonly type;
    private readonly workers_count;
    private active_jobs;
    private job_queue;
    private ephemeral_workers;
    private persistent_pool;
    private persistent_job_map;
    private shutting_down;
    /**
     * Create a new Worker instance.
     *
     * @param options Configuration options for the worker pool.
     */
    constructor(options: Worker.Opts);
    /**
     * Enqueue a new job to be executed in a worker thread.
     *
     * Returns a promise that resolves with the worker result
     * or rejects with a {@link Worker.Error} if the worker fails,
     * exits unexpectedly, times out, or the job is aborted.
     *
     * @param payload Job payload passed to the worker handler.
     * @param options Per-job options, such as timeout and abort signal.
     */
    run(payload: TPayload, options?: Worker.RunOpts): Promise<TResult>;
    /**
     * Retrieve the current statistics for this worker instance.
     *
     * This can be useful for monitoring and instrumentation.
     */
    get_stats(): Worker.Stats;
    /**
     * Clear all queued jobs by rejecting them with a WorkerError.
     *
     * Running jobs are not affected.
     *
     * This is useful if you are shutting down your application and do not want
     * to start new workers for queued jobs.
     *
     * @param reason Optional explanation for why the queue is being drained.
     */
    drain_queue(reason?: string): void;
    /**
     * Gracefully (best-effort) shut down the worker pool.
     *
     * - Queued jobs are rejected immediately.
     * - Active jobs are rejected and their underlying worker threads are terminated.
     *
     * Ephemeral workers are terminated job-by-job; persistent workers are all
     * terminated and the pool is not recreated.
     *
     * @param reason Optional explanation for why the pool is shutting down.
     */
    shutdown(reason?: string): Promise<void>;
    /**
     * Internal queue processor that ensures we never exceed the configured concurrency.
     *
     * In ephemeral mode, this spawns new worker threads until max_concurrency is reached.
     * In persistent mode, this assigns queued jobs to idle workers in the pool.
     */
    private process_queue;
    /**
     * Ensure that the persistent worker pool is fully initialized
     * up to worker_count.
     */
    private ensure_persistent_pool;
    /**
     * Attach event handlers to a persistent worker thread for message,
     * error, and exit events.
     *
     * @param node_worker The worker thread to attach handlers to.
     */
    private attach_persistent_event_handlers;
    /**
     * Assign a job to a specific persistent worker and set up timeout
     * and abort handling for that job.
     *
     * @param node_worker The worker thread that will run the job.
     * @param job The job to execute.
     */
    private assign_job_to_persistent_worker;
    /**
     * Clean up timers and listeners for a completed or failed job
     * running on a persistent worker.
     *
     * @param node_worker The worker that was running the job.
     * @param state The job state associated with this worker.
     */
    private cleanup_persistent_job_state;
    /**
     * Handle a normal job completion on a persistent worker and trigger
     * processing of additional queued jobs.
     *
     * @param node_worker The worker that completed the job.
     * @param state The job state associated with this worker.
     */
    private handle_persistent_worker_completion;
    /**
     * Handle a persistent worker failure (timeout, abort, error, invalid message, exit).
     *
     * This will:
     * - Clean up any active job state.
     * - Remove the worker from the pool.
     * - Terminate the worker (best-effort).
     * - Recreate the worker if the pool is not shutting down.
     *
     * @param node_worker The failed worker thread.
     * @param reason Short reason string for internal categorization.
     */
    private handle_persistent_worker_failure;
    /**
     * Remove a worker from the persistent pool and clear its job mapping.
     *
     * @param node_worker The worker to remove.
     */
    private remove_persistent_worker;
    /**
     * Internal helper to create a new Node worker thread for a single job
     * in ephemeral mode and wire up all lifecycle and timeout handling.
     *
     * @param job Job to execute in the worker thread.
     */
    private spawn_worker_for_job;
}
/**
 * Nested worker types.
 */
export declare namespace Worker {
    /**
 * A JSON-serializable representation of an error that occurred in a worker.
 */
    interface SerializedError {
        /** Error name (e.g. "Error", "TypeError"). */
        name: string;
        /** Error message. */
        message: string;
        /** Error stack trace, if available. */
        stack?: string;
        /** Arbitrary extra details that might be useful for debugging. */
        details?: unknown;
    }
    /**
     * Options for configuring a Worker instance.
     */
    type Opts = Opts.Persistent | Opts.Ephemeral;
    /** Nested types for the Opts type. */
    namespace Opts {
        /**
         * Base options for configuring a Worker instance.
         */
        interface Base {
            /**
             * Absolute or relative path to the worker module file.
             *
             * This file should import and call {@link start_worker_runtime}.
             */
            worker_path: string;
            /**
             * Optional human-readable name for this worker pool, used only for debugging
             * and introspection via {@link Worker.Stats}.
             */
            name?: string;
            /**
             * Default timeout in milliseconds for each job.
             * Individual jobs can override this via {@link Worker.RunOpts.timeout}.
             *
             * Set to 0 or a negative number to disable timeouts by default.
             *
             * @default 60000
             */
            default_timeout?: number;
            /**
             * Arbitrary data passed as `workerData` when creating each worker thread.
             * This can be used to configure the worker side.
             */
            worker_data?: unknown;
        }
        /**
         * Options for configuring a persistent Worker instance.
         */
        export interface Persistent extends Base {
            /**
             * When type is "persistent", the Worker class will create a pool of long-lived worker
             * threads that can process multiple jobs over their lifetime.
             *
             * This is usually more efficient when you run many jobs over time, as the
             * worker module only needs to initialize once.
             *
             * When "ephemeral", a new worker thread is created per job and torn down when
             * the job is finished.
             *
             * @default "persistent"
             */
            type?: "persistent";
            /**
             * Number of worker threads to keep in the persistent pool when
             * persistent_workers is true.
             */
            workers: number;
        }
        /**
         * Options for configuring a persistent Worker instance.
         */
        export interface Ephemeral extends Base {
            /**
             * When type is "persistent", the Worker class will create a pool of long-lived worker
             * threads that can process multiple jobs over their lifetime.
             *
             * This is usually more efficient when you run many jobs over time, as the
             * worker module only needs to initialize once.
             *
             * When "ephemeral", a new worker thread is created per job and torn down when
             * the job is finished.
             *
             * @default "persistent"
             */
            type: "ephemeral";
            /**
             * Maximum number of jobs that may run concurrently.
             *
             * In ephemeral mode (persistent_workers = false), this is the maximum number
             * of worker threads that may run at the same time.
             *
             * In persistent mode (persistent_workers = true), this is used as the
             * default worker_count if worker_count is not provided.
             *
             * @default 4
             */
            max_concurrency?: number;
        }
        export {};
    }
    /**
     * Options for running a single job on a worker.
     */
    interface RunOpts {
        /**
         * Timeout for this specific job, in milliseconds.
         * If not provided, {@link Worker.Opts.default_timeout} is used.
         *
         * Set to 0 or a negative number to disable the timeout for this job.
         */
        timeout?: number;
        /**
         * Optional AbortSignal. If aborted, the job will be canceled and its
         * underlying worker terminated (in ephemeral mode) or reset (in persistent mode).
         */
        signal?: AbortSignal;
    }
    /**
     * Statistics about the current state of a Worker instance.
     */
    type Stats = {
        /** Current number of running jobs. */
        active_jobs: number;
        /** Number of queued jobs waiting for a free worker slot. */
        queued_jobs: number;
        /** Optional human-readable name. */
        name?: string;
    } & ({
        /** The ephemeral type. */
        type: "ephemeral";
        /** Maximum concurrency configured for this worker. */
        max_concurrency: number;
    } | {
        /** The persistent type. */
        type: "persistent";
        /** The amount of persistent workers.. */
        workers_count: number;
    });
    /**
     * Internal representation of a queued job.
     */
    interface InternalWorkerJob<TPayload, TResult> {
        /** Payload to send to the worker. */
        payload: TPayload;
        /** Resolve function for the job's promise. */
        resolve: (value: TResult) => void;
        /** Reject function for the job's promise. */
        reject: (reason: unknown) => void;
        /** Optional custom timeout for this job. */
        timeout?: number;
        /** Optional abort signal for canceling the job. */
        signal?: AbortSignal;
    }
    /**
     * Per-worker state for a persistent worker processing a single active job.
     */
    interface PersistentJobState<TPayload, TResult> {
        /** The active job assigned to this worker. */
        job: Worker.InternalWorkerJob<TPayload, TResult>;
        /** Whether the job has already been settled (resolved or rejected). */
        settled: boolean;
        /** Timeout handle for this job, if any. */
        timeout_handle?: NodeJS.Timeout;
        /** Abort listener attached to the job's signal, if any. */
        abort_listener?: () => void;
    }
    /**
     * Message sent from main thread to worker thread.
     */
    interface RequestMessage<TPayload> {
        /** Payload for the worker handler. */
        payload: TPayload;
    }
    /**
     * Message sent from worker thread back to main thread.
     */
    interface ResponseMessage<TResult> {
        /** Indicates success or failure of the worker handler. */
        ok: boolean;
        /** Result value if ok is true. */
        result?: TResult;
        /** Serialized error details if ok is false. */
        error?: Worker.SerializedError;
    }
    /**
     * Error thrown when a worker job fails, times out, or the worker crashes.
     */
    class Error extends globalThis.Error {
        /** Path to the worker module that failed. */
        readonly worker_path: string;
        /** Serialized error information from inside the worker, if available. */
        readonly worker_error?: Worker.SerializedError;
        /**
         * Create a new worker error.
         *
         * @param message Human-readable error message.
         * @param worker_path Path to the worker module.
         * @param worker_error Serialized error from inside the worker, if any.
         */
        constructor(message: string, worker_path: string, worker_error?: Worker.SerializedError);
    }
    /**
     * Error thrown when a worker job fails, times out, or the worker crashes.
     */
    class TimeoutError extends Worker.Error {
        /**
         * Create a new worker timeout error.
         *
         * @param message Human-readable error message.
         * @param worker_path Path to the worker module.
         * @param worker_error Serialized error from inside the worker, if any.
         */
        constructor(message: string, worker_path: string, worker_error?: Worker.SerializedError);
    }
    /**
     * Start a worker runtime inside a worker thread.
     *
     * Call this from within your worker module file (the file whose path you pass
     * as {@link Worker.Opts.worker_path} on the main thread).
     *
     * Example:
     *
     * ```ts
     * // parse-worker.ts
     * import { start_worker_runtime } from './worker-wrapper';
     *
     * type MyPayload = { input: string };
     * type MyResult = { output: string };
     *
     * start_worker_runtime<MyPayload, MyResult>(async (payload) => {
     *   // Heavy CPU / blocking work
     *   return { output: payload.input.toUpperCase() };
     * });
     * ```
     *
     * @param handler Function that receives the payload and returns a result.
     */
    function start_worker_runtime<TPayload = unknown, TResult = unknown>(handler: (payload: TPayload) => TResult | Promise<TResult>): void;
    /**
     * Resolve a worker script path in an ESM-friendly way.
     *
     * This is a small helper around `new URL(..., import.meta.url)` +
     * `fileURLToPath`, which replaces the old `require.resolve` pattern
     * used in CommonJS.
     *
     * @param relative_path Path to the worker script, relative to the calling module.
     *                      For example: "./hello-worker.mjs" or "./hello-worker.js".
     * @param module_url    The `import.meta.url` value of the calling module.
     * @returns A filesystem path string suitable for `worker_path`.
     *
     * @example
     * const worker_path = Worker.resolve_worker_path('./hello-worker.mjs', import.meta.url);
     * });
     *
     * @docs
     */
    function resolve_worker_path(relative_path: string, module_url: string): string;
    /**
     * Detect whether the current code is running inside a worker (child) thread.
     *
     * In the main (master) thread, `worker_threads.parentPort` is `null`.
     * In a worker (child) thread, it is a MessagePort instance.
     *
     * @returns `true` when executing in a worker (child) thread, `false` when in the main (master) thread.
     *
     * @docs
     */
    function is_worker_thread(): boolean;
    /**
     * Detect whether the current code is running in the main (master) thread.
     *
     * This is the logical inverse of {@link Worker.is_worker_thread}.
     *
     * @returns `true` when executing in the main (master) thread, `false` when in a worker (child) thread.
     *
     * @docs
     */
    function is_main_thread(): boolean;
}
