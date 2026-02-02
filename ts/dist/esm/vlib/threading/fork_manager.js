import { format_error } from '../logging/index.m.web.js';
import { fork } from 'child_process';
import { fileURLToPath } from 'node:url';
// @todo when the forked child has an uncaught error, can we then capture this error and add this to the cause of the serialzied error?
/**
 * Friendly wrapper around Node.js child_process.fork for running
 * isolated jobs in separate processes, without blocking the main process.
 *
 * This class supports both:
 * - Ephemeral mode: one worker process per job.
 * - Persistent mode: a pool of long-lived worker processes.
 *
 * Basic idea:
 * - In the "master" (main) process, you create a {@link ForkManager} and call `run(payload)`.
 * - In the "child" process file, you call {@link ForkManager.run_forked_child} with a handler
 *   that receives the payload and returns a result.
 *
 * @typeParam TPayload - The payload type sent to the child process.
 * @typeParam TResult - The result type returned by the child process.
 * @typeParam TType - The worker type, `"ephemeral"` or `"persistent"`.
 *
 * @example
 * {Master Process}
 * Creating a simple ForkManager to run a worker process.
 * ```ts
 * // File: master.ts
 * import * as vlib from "@vandenberghinc/vlib"
 *
 * interface HelloPayload {
 *   name: string;
 * }
 *
 * type HelloResult = string;
 *
 * // Create a worker that runs "./hello-worker.ts" in a separate process.
 * const hello_worker = new vlib.ForkManager<HelloPayload, HelloResult>({
 *   process_path: vlib.ForkManager.resolve_process_path('./hello-worker', import.meta.url),
 *   default_timeout: 5_000,
 *   max_concurrency: 1,
 *   name: 'hello-worker',
 * });
 *
 * async function say_hello(name: string): Promise<string> {
 *   // This will fork a new process, send `{ name }`,
 *   // wait for the result, then kill the process.
 *   const result = await hello_worker.run({ name });
 *   return result; // e.g. "Hello, Ada!"
 * }
 *
 * (async () => {
 *   const greeting = await say_hello('Ada');
 *   console.log(greeting);
 * })();
 * ```
 *
 * @example
 * {Child Process}
 * Creating the worker handler that runs inside the forked child process.
 * ```ts
 * // File: hello-worker.ts
 * import * as vlib from "@vandenberghinc/vlib"
 *
 * interface HelloPayload {
 *   name: string;
 * }
 *
 * type HelloResult = string;
 *
 * // Register the handler that runs inside the child process.
 * // It receives the payload from the master and returns a result.
 * vlib.ForkManager.run_forked_child<HelloPayload, HelloResult>(async (payload) => {
 *   const { name } = payload;
 *   return `Hello, ${name}!`;
 * });
 *
 * // When the handler resolves, the result is sent back to the master process.
 * // The master receives it as the resolved value of `hello_worker.run(...)`.
 * ```
 *
 * @nav Threading
 * @docs
 * @experimental
 */
export class ForkManager {
    process_path;
    default_timeout;
    max_concurrency;
    name;
    worker_data;
    type;
    workers_count;
    fork_options;
    restart_opts;
    active_jobs;
    job_queue;
    persistent_pool;
    persistent_job_map;
    persistent_restart_limits;
    /**
     * Create a new ForkManager instance.
     *
     * @param options Configuration options for the process worker pool.
     */
    constructor(options) {
        const type = options.type ?? 'ephemeral';
        this.process_path = options.process_path;
        this.default_timeout = options.default_timeout;
        this.type = type;
        this.max_concurrency = type === 'ephemeral'
            ? (options.max_concurrency == null ? undefined : Math.max(1, options.max_concurrency))
            : undefined;
        this.workers_count = type === 'persistent'
            ? Math.max(1, options.workers ?? 4)
            : 0;
        this.fork_options = options.fork_options;
        const { max_restarts = 10, interval = 60_000, delay = 0, } = options.restart || {};
        this.restart_opts = { max_restarts, interval, delay };
        this.name = options.name;
        this.worker_data = options.worker_data;
        this.active_jobs = 0;
        this.job_queue = [];
        this.persistent_pool = [];
        this.persistent_job_map = new Map();
        this.persistent_restart_limits = {
            count: 0,
            reset_at: this.restart_opts.interval > 0 ? Date.now() + this.restart_opts.interval : undefined
        };
    }
    /**
     * Enqueue a new job to be executed in a forked process.
     *
     * Returns a promise that resolves when the process completes
     * or rejects if the process fails, exits unexpectedly, or times out.
     *
     * @param payload Job payload passed to the child process handler.
     * @param options Per-job options, such as timeout and abort signal.
     */
    run(payload, options) {
        const job = {
            payload,
            resolve: () => undefined,
            reject: () => undefined,
            unref: false,
            timeout: options?.timeout,
            signal: options?.signal,
            fork_options: {},
        };
        // In ephemeral mode, we allow per-job fork options.
        if (this.type === 'ephemeral') {
            const ephemeral_options = options;
            job.unref = ephemeral_options?.unref ?? false;
            job.fork_options = { ...(this.fork_options ?? {}), };
            if (ephemeral_options?.silent !== undefined) {
                job.fork_options.silent = ephemeral_options?.silent;
            }
            if (ephemeral_options?.stdio !== undefined) {
                job.fork_options.stdio = ephemeral_options?.stdio;
            }
            if (ephemeral_options?.detached !== undefined) {
                job.fork_options.detached = ephemeral_options?.detached;
            }
            if (ephemeral_options?.env !== undefined) {
                job.fork_options.env = ephemeral_options?.env;
            }
            if (ephemeral_options?.fork_options !== undefined) {
                job.fork_options = { ...job.fork_options, ...ephemeral_options.fork_options };
            }
        }
        else {
            // In persistent mode, process-level options are configured at construction time only.
            job.unref = false;
            job.fork_options = this.fork_options ?? {};
        }
        const promise = new Promise((resolve, reject) => {
            job.resolve = resolve;
            job.reject = reject;
        });
        this.job_queue.push(job);
        this.process_queue();
        return promise;
    }
    /**
     * Retrieve the current statistics for this ForkManager instance.
     *
     * This can be useful for monitoring and instrumentation.
     */
    get_stats() {
        if (this.type === 'persistent') {
            return {
                type: 'persistent',
                active_jobs: this.active_jobs,
                queued_jobs: this.job_queue.length,
                workers_count: this.workers_count,
                name: this.name,
            };
        }
        return {
            type: 'ephemeral',
            active_jobs: this.active_jobs,
            queued_jobs: this.job_queue.length,
            max_concurrency: this.max_concurrency,
            name: this.name,
        };
    }
    /**
     * Clear all queued jobs by rejecting them with a ForkManagerError.
     *
     * Running jobs are not affected.
     *
     * This is useful if you are shutting down your application and do not want
     * to start new processes.
     *
     * @param reason Optional reason message used in the error.
     */
    drain_queue(reason = 'Process worker queue drained') {
        const error = new ForkManager.Error(reason, this.process_path);
        while (this.job_queue.length > 0) {
            const job = this.job_queue.shift();
            job.reject(error);
        }
    }
    /**
     * Internal queue processor that ensures we never exceed the configured max_concurrency
     * (in ephemeral mode) or assign more than one job per persistent worker.
     */
    process_queue() {
        if (this.type === 'persistent') {
            this.ensure_persistent_pool();
            for (const child of this.persistent_pool) {
                if (this.job_queue.length === 0) {
                    break;
                }
                const state = this.persistent_job_map.get(child);
                if (state && !state.settled) {
                    continue;
                }
                const job = this.job_queue.shift();
                this.assign_job_to_persistent_process(child, job);
            }
        }
        else {
            while ((this.max_concurrency == null || this.active_jobs < this.max_concurrency) && this.job_queue.length > 0) {
                const job = this.job_queue.shift();
                this.spawn_process_for_job(job);
            }
        }
    }
    /**
     * Ensure that the persistent worker pool is fully initialized
     * up to workers_count.
     */
    ensure_persistent_pool() {
        if (this.type !== 'persistent') {
            return;
        }
        while (this.persistent_pool.length < this.workers_count) {
            const env = {
                ...(((this.fork_options?.env ?? process.env) || process.env)),
            };
            if (this.worker_data !== undefined) {
                env.PROCESS_WORKER_DATA = JSON.stringify(this.worker_data);
            }
            const child = fork(this.process_path, {
                ...(this.fork_options ?? {}),
                env,
            });
            this.persistent_pool.push(child);
            this.persistent_job_map.set(child, null);
            this.attach_persistent_event_handlers(child);
        }
    }
    /**
     * Attach event handlers to a persistent worker process for message,
     * error, and exit events.
     *
     * @param child The child process to attach handlers to.
     */
    attach_persistent_event_handlers(child) {
        child.on('message', (raw_message) => {
            const state = this.persistent_job_map.get(child);
            if (!state || state.settled) {
                return;
            }
            const message = raw_message;
            if (!message || typeof message !== 'object') {
                const error = new ForkManager.Error('Process worker returned an invalid message', this.process_path);
                state.job.reject(error);
                this.handle_persistent_process_failure(child, 'invalid-message');
                return;
            }
            if (message.ok) {
                state.job.resolve(message.result);
                this.handle_persistent_process_completion(child, state);
            }
            else {
                const worker_error = message.error;
                const error_message = worker_error?.message ?? 'Process worker job failed with an unknown error';
                const error = new ForkManager.Error(error_message, this.process_path, worker_error);
                state.job.reject(error);
                this.handle_persistent_process_completion(child, state);
            }
        });
        child.on('error', (err) => {
            const state = this.persistent_job_map.get(child);
            const details = {
                name: err.name,
                message: err.message,
                stack: err.stack,
            };
            const error = new ForkManager.Error(`Process worker process error: ${err.message}`, this.process_path, details);
            if (state && !state.settled) {
                state.job.reject(error);
            }
            this.handle_persistent_process_failure(child, 'error');
        });
        child.on('exit', (code, signal) => {
            if (!this.persistent_pool.includes(child)) {
                return;
            }
            const state = this.persistent_job_map.get(child);
            if (state && !state.settled) {
                const details = {
                    name: 'Exit',
                    message: `Process exited with code ${code} and signal ${signal ?? 'null'}`,
                };
                const error = new ForkManager.Error(`Process worker exited unexpectedly (code=${code}, signal=${signal ?? 'null'})`, this.process_path, details);
                state.job.reject(error);
            }
            this.handle_persistent_process_failure(child, 'exit');
        });
    }
    /**
     * Assign a job to a specific persistent worker process and set up timeout
     * and abort handling for that job.
     *
     * @param child The child process that will run the job.
     * @param job The job to execute.
     */
    assign_job_to_persistent_process(child, job) {
        this.active_jobs += 1;
        const effective_timeout = job.timeout ?? this.default_timeout;
        const state = {
            job,
            settled: false,
            timeout_handle: undefined,
            abort_listener: undefined,
        };
        if (effective_timeout != null && effective_timeout > 0) {
            state.timeout_handle = setTimeout(() => {
                if (state.settled) {
                    return;
                }
                state.settled = true;
                const error = new ForkManager.TimeoutError(`Process worker job timed out after ${effective_timeout}ms`, this.process_path);
                state.job.reject(error);
                this.handle_persistent_process_failure(child, 'timeout');
            }, effective_timeout);
        }
        if (job.signal) {
            if (job.signal.aborted) {
                if (state.timeout_handle) {
                    clearTimeout(state.timeout_handle);
                    state.timeout_handle = undefined;
                }
                const error = new ForkManager.Error('Process worker job aborted', this.process_path);
                job.reject(error);
                this.active_jobs -= 1;
                this.process_queue();
                return;
            }
            const abort_listener = () => {
                if (state.settled) {
                    return;
                }
                state.settled = true;
                const error = new ForkManager.Error('Process worker job aborted', this.process_path);
                state.job.reject(error);
                this.handle_persistent_process_failure(child, 'abort');
            };
            job.signal.addEventListener('abort', abort_listener);
            state.abort_listener = abort_listener;
        }
        this.persistent_job_map.set(child, state);
        const request = {
            payload: job.payload,
        };
        if (!child.send) {
            const error = new ForkManager.Error('Process worker has no IPC channel (child.send is undefined)', this.process_path);
            state.job.reject(error);
            this.handle_persistent_process_failure(child, 'invalid-message');
            return;
        }
        child.send(request);
    }
    /**
     * Clean up timers and listeners for a completed or failed job
     * running on a persistent worker.
     *
     * @param child The worker process that was running the job.
     * @param state The job state associated with this worker.
     */
    cleanup_persistent_job_state(child, state) {
        if (state.timeout_handle) {
            clearTimeout(state.timeout_handle);
            state.timeout_handle = undefined;
        }
        if (state.abort_listener && state.job.signal) {
            state.job.signal.removeEventListener('abort', state.abort_listener);
            state.abort_listener = undefined;
        }
        state.settled = true;
        this.persistent_job_map.set(child, null);
        this.active_jobs -= 1;
    }
    /**
     * Handle a normal job completion on a persistent worker and trigger
     * processing of additional queued jobs.
     *
     * @param child The worker process that completed the job.
     * @param state The job state associated with this worker.
     */
    handle_persistent_process_completion(child, state) {
        if (state.settled) {
            return;
        }
        this.cleanup_persistent_job_state(child, state);
        this.process_queue();
    }
    /**
     * Handle a persistent worker failure (timeout, abort, error, invalid message, exit).
     *
     * This will:
     * - Clean up any active job state.
     * - Remove the worker from the pool.
     * - Terminate the worker process (best-effort).
     * - Optionally restart the worker based on {@link ForkManager.PersistentRestartOpts}.
     *
     * @param child The failed worker process.
     * @param reason Short reason string for internal categorization.
     */
    handle_persistent_process_failure(child, reason) {
        // Cleanup.
        const state = this.persistent_job_map.get(child);
        if (state && !state.settled) {
            this.cleanup_persistent_job_state(child, state);
        }
        // Remove child process.
        this.remove_persistent_process(child);
        // Kill the child process (best-effort).
        try {
            if (!child.killed) {
                child.kill();
            }
        }
        catch {
            // Best effort.
        }
        // Restart worker for persistent mode.
        if (this.type !== 'persistent') {
            return;
        }
        // Check if we should reset the restart limits.
        const check_reset_restart_limis = () => {
            const now = Date.now();
            if (this.restart_opts.interval > 0
                && this.persistent_restart_limits.reset_at != null
                && now >= this.persistent_restart_limits.reset_at) {
                this.persistent_restart_limits.count = 0;
                this.persistent_restart_limits.reset_at = now + (this.restart_opts.interval ?? 0);
            }
        };
        // Check if we should restart the worker.
        check_reset_restart_limis();
        const max_restarts = this.restart_opts.max_restarts;
        const delay_ms = this.restart_opts.delay;
        if (max_restarts >= 0 && this.persistent_restart_limits.count >= max_restarts) {
            return;
        }
        // Restart the worker.
        const restart = () => {
            check_reset_restart_limis();
            this.persistent_restart_limits.count += 1;
            this.ensure_persistent_pool();
            this.process_queue();
        };
        if (delay_ms > 0) {
            setTimeout(restart, delay_ms);
        }
        else {
            restart();
        }
    }
    /**
     * Remove a worker from the persistent pool and clear its job mapping.
     *
     * @param child The worker process to remove.
     */
    remove_persistent_process(child) {
        const index = this.persistent_pool.indexOf(child);
        if (index >= 0) {
            this.persistent_pool.splice(index, 1);
        }
        this.persistent_job_map.delete(child);
    }
    /**
     * Internal helper to create a new forked process for a single job
     * and wire up all lifecycle and timeout handling.
     *
     * This is used in ephemeral mode (type = "ephemeral").
     *
     * @param job Job to execute in the child process.
     */
    spawn_process_for_job(job) {
        this.active_jobs += 1;
        // Create env.
        const env = { ...((job.fork_options?.env ?? process.env) || process.env) };
        if (this.worker_data !== undefined) {
            env.PROCESS_WORKER_DATA = JSON.stringify(this.worker_data);
        }
        // Fork process.
        const child = fork(this.process_path, {
            ...(job.fork_options ?? {}),
            env,
        });
        let settled = false;
        let timeout_handle;
        let abort_listener;
        /**
         * Internal cleanup helper to avoid double resolution/rejection and
         * ensure the child process is killed and counters updated.
         */
        const cleanup = () => {
            if (settled) {
                return;
            }
            settled = true;
            if (timeout_handle) {
                clearTimeout(timeout_handle);
                timeout_handle = undefined;
            }
            if (job.signal && abort_listener) {
                job.signal.removeEventListener('abort', abort_listener);
                abort_listener = undefined;
            }
            // Ensure the child process is terminated. Ignore kill errors.
            try {
                if (!child.killed) {
                    child.kill();
                }
            }
            catch {
                // Best effort.
            }
            this.active_jobs -= 1;
            this.process_queue();
        };
        // Unreference the child.
        if (job.unref) {
            child.unref();
        }
        // Add timeout.
        const effective_timeout = job.timeout ?? this.default_timeout;
        if (effective_timeout != null && effective_timeout > 0) {
            timeout_handle = setTimeout(() => {
                if (settled) {
                    return;
                }
                const error = new ForkManager.TimeoutError(`Process worker job timed out after ${effective_timeout}ms`, this.process_path);
                job.reject(error);
                cleanup();
            }, effective_timeout);
        }
        // Handling job signals.
        if (job.signal) {
            // Execute start signal instantly.
            if (job.signal.aborted) {
                const error = new ForkManager.Error('Process worker job aborted', this.process_path);
                job.reject(error);
                cleanup();
                return;
            }
            // Add abort listener.
            abort_listener = () => {
                if (settled) {
                    return;
                }
                const error = new ForkManager.Error('Process worker job aborted', this.process_path);
                job.reject(error);
                cleanup();
            };
            job.signal.addEventListener('abort', abort_listener);
        }
        // On message callback.
        child.once('message', (raw_message) => {
            if (settled) {
                return;
            }
            const message = raw_message;
            if (!message || typeof message !== 'object') {
                const error = new ForkManager.Error('Process worker returned an invalid message', this.process_path);
                job.reject(error);
                cleanup();
                return;
            }
            if (message.ok) {
                job.resolve(message.result);
            }
            else {
                const worker_error = message.error;
                const error_message = worker_error?.message ?? 'Process worker job failed with an unknown error';
                const error = new ForkManager.Error(error_message, this.process_path, worker_error);
                job.reject(error);
            }
            cleanup();
        });
        // On error callback.
        child.once('error', (err) => {
            if (settled) {
                return;
            }
            const error = new ForkManager.Error(`Process worker process error: ${err.message}`, this.process_path, {
                name: err.name,
                message: err.message,
                stack: err.stack,
            });
            job.reject(error);
            cleanup();
        });
        // On exit callback.
        child.once('exit', (code, signal) => {
            if (settled) {
                return;
            }
            const details = {
                name: 'Exit',
                message: `Process exited with code ${code} and signal ${signal ?? 'null'}`,
            };
            const error = new ForkManager.Error(`Process worker exited unexpectedly (code=${code}, signal=${signal ?? 'null'})`, this.process_path, details);
            job.reject(error);
            cleanup();
        });
        // Send payload.
        const request = {
            payload: job.payload,
        };
        if (!child.send) {
            const error = new ForkManager.Error('Process worker has no IPC channel (child.send is undefined)', this.process_path);
            job.reject(error);
            cleanup();
            return;
        }
        child.send(request);
    }
}
/**
 * Nested types and static functions for the {@link ForkManager} class.
 */
(function (ForkManager) {
    /**
     * Error thrown when a process worker job fails or times out.
     *
     * @docs
     */
    class Error extends globalThis.Error {
        /** Path to the worker module that failed. */
        process_path;
        /** Serialized error information from inside the worker, if available. */
        worker_error;
        /**
         * Create a new fork manager error.
         *
         * @param message Human-readable error message.
         * @param process_path Path to the worker module.
         * @param worker_error Serialized error from inside the worker, if any.
         */
        constructor(message, process_path, worker_error) {
            super(message);
            this.name = 'ForkManagerError';
            this.process_path = process_path;
            this.worker_error = worker_error;
        }
        /**
         * Format this error.
         */
        format(opts) {
            return format_error(this, opts);
        }
    }
    ForkManager.Error = Error;
    /**
     * Error thrown when a process worker job fails or times out.
     *
     * @docs
     */
    class TimeoutError extends Error {
        /**
         * Create a new fork manager timeout error.
         *
         * @param message Human-readable error message.
         * @param process_path Path to the worker module.
         * @param worker_error Serialized error from inside the worker, if any.
         */
        constructor(message, process_path, worker_error) {
            super(message, process_path, worker_error);
            this.name = 'ForkManagerTimeoutError';
        }
    }
    ForkManager.TimeoutError = TimeoutError;
    /**
     * Start a worker runtime inside a forked process.
     *
     * Call this from within your process worker module file (the file whose path
     * you pass as {@link ForkManager.Opts.process_path} in the parent).
     *
     * @param handler Function that receives the payload and returns a result.
     *
     * @example
     * // File: hello-worker.ts
     * import * as vlib from "@vandenberghinc/vlib"
     *
     * interface HelloPayload {
     *   name: string;
     * }
     *
     * type HelloResult = string;
     *
     * // Register the handler that runs inside the child process.
     * // It receives the payload from the master and returns a result.
     * vlib.ForkManager.run_forked_child<HelloPayload, HelloResult>(async (payload) => {
     *   const { name } = payload;
     *   return `Hello, ${name}!`;
     * });
     *
     * @docs
     */
    function run_forked_child(handler) {
        if (!process.send) {
            throw new globalThis.Error('run_forked_child() must be called from a forked process (child_process.fork)');
        }
        process.on('message', async (raw_message) => {
            const message = raw_message;
            try {
                const result = await handler(message.payload);
                const response = {
                    ok: true,
                    result,
                };
                process.send?.(response);
            }
            catch (err) {
                const error = err;
                const serialized = {
                    name: error?.name ?? 'Error',
                    message: error?.message ?? 'Unknown error',
                    stack: error?.stack,
                    cause: error,
                };
                const response = {
                    ok: false,
                    error: serialized,
                };
                process.send?.(response);
            }
        });
    }
    ForkManager.run_forked_child = run_forked_child;
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
     * @returns A filesystem path string suitable for `process_path`.
     *
     * @example
     * ...
     * const hello_worker = new ProcessWorker<HelloPayload, HelloResult>({
     *   process_path: ProcessWorker.resolve_process_path('./hello-worker.mjs', import.meta.url),
     *   ...
     * });
     *
     * @docs
     */
    function resolve_process_path(relative_path, module_url) {
        return fileURLToPath(new URL(relative_path, module_url));
    }
    ForkManager.resolve_process_path = resolve_process_path;
    /**
     * Detect whether the current Node.js instance is a forked (child) process.
     *
     * In a process started via `child_process.fork()` (or a cluster worker),
     * `process.send` is defined as a function that can be used to send messages
     * to the parent process. In the original (main) process it is `undefined`.
     *
     * @returns `true` when executing in a forked (child) process, `false` when in the main process.
     *
     * @docs
     */
    function is_forked_process() {
        // `process.send` only exists on processes that have an IPC channel to a parent,
        // which is the case for processes created via `child_process.fork()` or cluster workers.
        return typeof process.send === "function";
    }
    ForkManager.is_forked_process = is_forked_process;
    /**
     * Detect whether the current code is running in the original (non-forked) process.
     *
     * This is the logical inverse of {@link is_forked_process}.
     *
     * @returns `true` when executing in the main process, `false` when in a forked (child) process.
     *
     * @docs
     */
    function is_main_process() {
        return !is_forked_process();
    }
    ForkManager.is_main_process = is_main_process;
})(ForkManager || (ForkManager = {}));
//# sourceMappingURL=fork_manager.js.map