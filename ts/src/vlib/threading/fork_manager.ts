/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { format_error, FormatErrorOpts } from '@vlib/logging/index.m.web.js';
import { DeepRequired } from '@vlib/types/types.js';
import { fork, ChildProcess, ForkOptions } from 'child_process';
import { StdioOptions } from 'node:child_process';
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
 *   process_path: vlib.ForkManager.resolve_process_path('./hello-worker, import.meta.url),
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
export class ForkManager<
    TPayload = unknown,
    TResult = unknown,
> {
    readonly process_path: string;
    readonly default_timeout: undefined | number;
    readonly max_concurrency: undefined | number;
    readonly name?: string;
    readonly worker_data?: unknown;
    readonly type: ForkManager.Mode;
    readonly workers_count: number;
    readonly fork_options?: ForkOptions;
    readonly restart_opts: DeepRequired<ForkManager.PersistentRestartOpts>;

    active_jobs: number;
    private job_queue: ForkManager.InternalJob<TPayload, TResult>[];

    private persistent_pool: ChildProcess[];
    private persistent_job_map: Map<ChildProcess, ForkManager.PersistentJobState<TPayload, TResult> | null>;
    private persistent_restart_limits: { count: number; reset_at: number | undefined; };

    /**
     * Create a new ForkManager instance.
     *
     * @param options Configuration options for the process worker pool.
     */
    constructor(options: ForkManager.Opts<ForkManager.Mode>) {
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
        const {
            max_restarts = 10,
            interval = 60_000,
            delay = 0,
        } = options.restart || {};
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
    public run(payload: TPayload, options?: ForkManager.RunOpts<ForkManager.Mode>): Promise<TResult> {
        const job: ForkManager.InternalJob<TPayload, TResult> = {
            payload,
            resolve: () => undefined as never,
            reject: () => undefined as never,
            unref: false,
            timeout: options?.timeout,
            signal: options?.signal,
            fork_options: {},
        };

        // In ephemeral mode, we allow per-job fork options.
        if (this.type === 'ephemeral') {
            const ephemeral_options = options as ForkManager.RunOpts<'ephemeral'> | undefined;

            job.unref = ephemeral_options?.unref ?? false;
            job.fork_options = {
                ...(this.fork_options ?? {}),
                silent: ephemeral_options?.silent,
                stdio: ephemeral_options?.stdio,
                detached: ephemeral_options?.detached,
                env: ephemeral_options?.env,
                ...(ephemeral_options?.fork_options ?? {}),
            };
        } else {
            // In persistent mode, process-level options are configured at construction time only.
            job.unref = false;
            job.fork_options = this.fork_options ?? {};
        }

        const promise = new Promise<TResult>((resolve, reject) => {
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
    public get_stats(): ForkManager.Stats<ForkManager.Mode> {
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
    public drain_queue(reason = 'Process worker queue drained'): void {
        const error = new ForkManager.Error(reason, this.process_path);
        while (this.job_queue.length > 0) {
            const job = this.job_queue.shift()!;
            job.reject(error);
        }
    }

    /**
     * Internal queue processor that ensures we never exceed the configured max_concurrency
     * (in ephemeral mode) or assign more than one job per persistent worker.
     */
    private process_queue(): void {
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

                const job = this.job_queue.shift()!;
                this.assign_job_to_persistent_process(child, job);
            }
        } else {
            while ((this.max_concurrency == null || this.active_jobs < this.max_concurrency) && this.job_queue.length > 0) {
                const job = this.job_queue.shift()!;
                this.spawn_process_for_job(job);
            }
        }
    }

    /**
     * Ensure that the persistent worker pool is fully initialized
     * up to workers_count.
     */
    private ensure_persistent_pool(): void {
        if (this.type !== 'persistent') {
            return;
        }

        while (this.persistent_pool.length < this.workers_count) {
            const env: NodeJS.ProcessEnv = {
                ...(((this.fork_options?.env ?? process.env) || process.env)),
            };
            if (this.worker_data !== undefined) {
                env.PROCESS_WORKER_DATA = JSON.stringify(this.worker_data);
            }

            const child: ChildProcess = fork(this.process_path, {
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
    private attach_persistent_event_handlers(child: ChildProcess): void {
        child.on('message', (raw_message: unknown) => {
            const state = this.persistent_job_map.get(child);
            if (!state || state.settled) {
                return;
            }

            const message = raw_message as ForkManager.ResponseMessage<TResult>;

            if (!message || typeof message !== 'object') {
                const error = new ForkManager.Error(
                    'Process worker returned an invalid message',
                    this.process_path,
                );
                state.job.reject(error);
                this.handle_persistent_process_failure(child, 'invalid-message');
                return;
            }

            if (message.ok) {
                state.job.resolve(message.result as TResult);
                this.handle_persistent_process_completion(child, state);
            } else {
                const worker_error = message.error;
                const error_message =
                    worker_error?.message ?? 'Process worker job failed with an unknown error';
                const error = new ForkManager.Error(
                    error_message,
                    this.process_path,
                    worker_error,
                );
                state.job.reject(error);
                this.handle_persistent_process_completion(child, state);
            }
        });

        child.on('error', (err: Error) => {
            const state = this.persistent_job_map.get(child);
            const details: ForkManager.SerializedError = {
                name: err.name,
                message: err.message,
                stack: err.stack,
            };
            const error = new ForkManager.Error(
                `Process worker process error: ${err.message}`,
                this.process_path,
                details,
            );

            if (state && !state.settled) {
                state.job.reject(error);
            }

            this.handle_persistent_process_failure(child, 'error');
        });

        child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
            if (!this.persistent_pool.includes(child)) {
                return;
            }

            const state = this.persistent_job_map.get(child);
            if (state && !state.settled) {
                const details: ForkManager.SerializedError = {
                    name: 'Exit',
                    message: `Process exited with code ${code} and signal ${signal ?? 'null'}`,
                };
                const error = new ForkManager.Error(
                    `Process worker exited unexpectedly (code=${code}, signal=${signal ?? 'null'})`,
                    this.process_path,
                    details,
                );
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
    private assign_job_to_persistent_process(
        child: ChildProcess,
        job: ForkManager.InternalJob<TPayload, TResult>,
    ): void {
        this.active_jobs += 1;

        const effective_timeout = job.timeout ?? this.default_timeout;

        const state: ForkManager.PersistentJobState<TPayload, TResult> = {
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

                const error = new ForkManager.TimeoutError(
                    `Process worker job timed out after ${effective_timeout}ms`,
                    this.process_path,
                );
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

        const request: ForkManager.RequestMessage<TPayload> = {
            payload: job.payload,
        };

        if (!child.send) {
            const error = new ForkManager.Error(
                'Process worker has no IPC channel (child.send is undefined)',
                this.process_path,
            );
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
    private cleanup_persistent_job_state(
        child: ChildProcess,
        state: ForkManager.PersistentJobState<TPayload, TResult>,
    ): void {
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
    private handle_persistent_process_completion(
        child: ChildProcess,
        state: ForkManager.PersistentJobState<TPayload, TResult>,
    ): void {
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
    private handle_persistent_process_failure(
        child: ChildProcess,
        reason: 'timeout' | 'abort' | 'error' | 'exit' | 'invalid-message',
    ): void {

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
        } catch {
            // Best effort.
        }

        // Restart worker for persistent mode.
        if (this.type !== 'persistent') {
            return;
        }

        // Check if we should reset the restart limits.
        const check_reset_restart_limis = (): void => {
            const now = Date.now();
            if (
                this.restart_opts.interval > 0
                && this.persistent_restart_limits.reset_at != null
                && now >= this.persistent_restart_limits.reset_at
            ) {
                this.persistent_restart_limits.count = 0;
                this.persistent_restart_limits.reset_at = now + (this.restart_opts.interval ?? 0);
            }
        }

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
        } else {
            restart();
        }
    }

    /**
     * Remove a worker from the persistent pool and clear its job mapping.
     *
     * @param child The worker process to remove.
     */
    private remove_persistent_process(child: ChildProcess): void {
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
    private spawn_process_for_job(job: ForkManager.InternalJob<TPayload, TResult>): void {
        this.active_jobs += 1;

        // Create env.
        const env: NodeJS.ProcessEnv = { ...((job.fork_options?.env ?? process.env) || process.env) };
        if (this.worker_data !== undefined) {
            env.PROCESS_WORKER_DATA = JSON.stringify(this.worker_data);
        }

        // Fork process.
        const child: ChildProcess = fork(this.process_path, {
            ...(job.fork_options ?? {}),
            env,
        });
        let settled = false;
        let timeout_handle: NodeJS.Timeout | undefined;
        let abort_listener: (() => void) | undefined;

        /**
         * Internal cleanup helper to avoid double resolution/rejection and
         * ensure the child process is killed and counters updated.
         */
        const cleanup = (): void => {
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
            } catch {
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
                const error = new ForkManager.TimeoutError(
                    `Process worker job timed out after ${effective_timeout}ms`,
                    this.process_path,
                );
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
        child.once('message', (raw_message: unknown) => {
            if (settled) {
                return;
            }

            const message = raw_message as ForkManager.ResponseMessage<TResult>;

            if (!message || typeof message !== 'object') {
                const error = new ForkManager.Error(
                    'Process worker returned an invalid message',
                    this.process_path,
                );
                job.reject(error);
                cleanup();
                return;
            }

            if (message.ok) {
                job.resolve(message.result as TResult);
            } else {
                const worker_error = message.error;
                const error_message =
                    worker_error?.message ?? 'Process worker job failed with an unknown error';
                const error = new ForkManager.Error(error_message, this.process_path, worker_error);
                job.reject(error);
            }

            cleanup();
        });

        // On error callback.
        child.once('error', (err: Error) => {
            if (settled) {
                return;
            }
            const error = new ForkManager.Error(
                `Process worker process error: ${err.message}`,
                this.process_path,
                {
                    name: err.name,
                    message: err.message,
                    stack: err.stack,
                },
            );
            job.reject(error);
            cleanup();
        });

        // On exit callback.
        child.once('exit', (code: number | null, signal: NodeJS.Signals | null) => {
            if (settled) {
                return;
            }
            const details: ForkManager.SerializedError = {
                name: 'Exit',
                message: `Process exited with code ${code} and signal ${signal ?? 'null'}`,
            };
            const error = new ForkManager.Error(
                `Process worker exited unexpectedly (code=${code}, signal=${signal ?? 'null'})`,
                this.process_path,
                details,
            );
            job.reject(error);
            cleanup();
        });

        // Send payload.
        const request: ForkManager.RequestMessage<TPayload> = {
            payload: job.payload,
        };
        if (!child.send) {
            const error = new ForkManager.Error(
                'Process worker has no IPC channel (child.send is undefined)',
                this.process_path,
            );
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
export namespace ForkManager {

    /**
     * The worker mode type.
     * 
     * @docs
     */
    export type Mode = 'persistent' | 'ephemeral';

    /**
     * Statistics about the current state of a ForkManager instance.
     */
    export type Stats<TType extends Mode = Mode> = {
        /** Current number of running jobs. */
        active_jobs: number;
        /** Number of queued jobs waiting for a free worker slot. */
        queued_jobs: number;
        /** Optional human-readable name. */
        name?: string;
    } & (
            TType extends 'persistent'
            ? {
                /** The persistent type. */
                type: 'persistent';
                /** The amount of persistent workers. */
                workers_count: number;
            }
            : {
                /** The ephemeral type. */
                type: 'ephemeral';
                /** Maximum concurrency configured for this worker. */
                max_concurrency: undefined | number;
            }
        );

    /**
     * Restart options for persistent workers.
     * 
     * @docs
     */
    export interface PersistentRestartOpts {
        /**
         * Maximum number of times the manager will attempt to restart crashed
         * worker processes.
         *
         * This counter is tracked per {@link ForkManager} instance, not per
         * individual worker process.
         * 
         * Define as `-1` or `0` to disable restarts.
         *
         * @default 10
         */
        max_restarts?: number;
        /**
         * Optional interval in milliseconds after which the restart count
         * is reset to zero. Therefore we can limit restarts to a certain number
         * within a given time window.
         * 
         * Define as `-1` to never reset.
         * 
         * @default 60_000
         */
        interval?: number;
        /**
         * Optional delay in milliseconds before attempting to restart a crashed
         * worker process.
         *
         * @default 0
         */
        delay?: number;
    }

    /**
     * Common options for configuring a ForkManager instance.
     */
    interface BaseOpts {
        /**
         * Optional human-readable name for this worker pool, used only for logging and debugging.
         */
        name?: string;
        /**
         * Absolute or relative path to the worker module file.
         *
         * This file should import and call {@link ForkManager.run_forked_child}.
         * 
         * The file path can be resolved through {@link ForkManager.resolve_process_path}.
         */
        process_path: string;
        /**
         * Default timeout in milliseconds for each job.
         * Individual jobs can override this via {@link ForkManager.RunOpts.timeout}.
         *
         * @default undefined
         */
        default_timeout?: number;
        /**
         * Arbitrary data passed as an environment variable `PROCESS_WORKER_DATA`
         * (JSON string) when creating each process.
         *
         * You can read and parse this inside the child process, for example:
         * `const data = JSON.parse(process.env.PROCESS_WORKER_DATA ?? "null");`
         */
        worker_data?: unknown;
        /**
         * Global fork options applied when creating processes.
         *
         * In ephemeral mode, these options are merged with per-job options from
         * {@link ForkManager.RunOpts} and can be overridden on a per-job basis.
         *
         * In persistent mode, these options are used to create the long-lived
         * worker processes and cannot be changed per job.
         *
         * @default undefined
         */
        fork_options?: ForkOptions;
        /**
         * Restart configuration used in persistent mode to control how crashed
         * worker processes are restarted.
         *
         * Ignored in ephemeral mode.
         *
         * @default undefined
         */
        restart?: PersistentRestartOpts;
    }

    /**
     * Options for configuring a persistent ForkManager instance.
     */
    interface PersistentOpts extends BaseOpts {
        /**
         * When type is "persistent", the ForkManager class will create a pool of long-lived worker
         * processes that can process multiple jobs over their lifetime.
         *
         * This is usually more efficient when you run many jobs over time, as the
         * worker module only needs to initialize once.
         *
         * When "ephemeral", a new child process is created per job and torn down when
         * the job is finished.
         *
         * @default "ephemeral"
         */
        type: 'persistent';
        /**
         * Number of worker processes to keep in the persistent pool when
         * {@link ForkManager.Opts.type} is `"persistent"`.
         *
         * @default 4
         */
        workers?: number;
        /**
         * Maximum number of jobs that may run concurrently in separate processes.
         * Additional jobs are queued.
         *
         * This value is ignored in persistent mode, where concurrency is determined
         * by {@link ForkManager.Opts.workers}.
         */
        max_concurrency?: never;
    }

    /**
     * Options for configuring an ephemeral ForkManager instance.
     */
    interface EphemeralOpts extends BaseOpts {
        /**
         * When type is "persistent", the ForkManager class will create a pool of long-lived worker
         * processes that can process multiple jobs over their lifetime.
         *
         * This is usually more efficient when you run many jobs over time, as the
         * worker module only needs to initialize once.
         *
         * When "ephemeral", a new child process is created per job and torn down when
         * the job is finished.
         *
         * @default "ephemeral"
         */
        type?: 'ephemeral';
        /**
         * Maximum number of jobs that may run concurrently in separate processes.
         * Additional jobs are queued.
         *
         * This is only used in ephemeral mode (when type is `"ephemeral"`).
         *
         * @default undefined
         */
        max_concurrency?: number;
        /**
         * Number of worker processes to keep in the persistent pool.
         *
         * This value is ignored in ephemeral mode.
         */
        workers?: never;
    }

    /**
     * Options for configuring a ForkManager instance.
     * 
     * @typeParam TType - The worker type, `"ephemeral"` or `"persistent"`.
     * 
     * @docs
     */
    export type Opts<TType extends Mode = 'ephemeral'> =
        TType extends 'persistent' ? PersistentOpts : EphemeralOpts;

    /**
     * The options for the `run()` method (shared base).
     */
    interface RunOptsBase {
        /**
         * Timeout for this specific job, in milliseconds.
         * If not provided, {@link ForkManager.Opts.default_timeout} is used.
         */
        timeout?: number;
        /**
         * Optional AbortSignal. If aborted, the job will be canceled and its underlying process killed.
         */
        signal?: AbortSignal;
    }

    /**
     * The options for the `run()` method in ephemeral mode.
     */
    interface EphemeralRunOpts extends RunOptsBase {
        /**
         * By default, the parent will wait for the detached child to exit. To prevent the
         * parent from waiting for a given `subprocess` to exit, use the `subprocess.unref()` method. Doing so will cause the parent's event loop to not
         * include the child in its reference count, allowing the parent to exit
         * independently of the child, unless there is an established IPC channel between
         * the child and the parent.
         * 
         * @note This only takes effect if `detached` is `true`.
         */
        unref?: boolean;
        /**
         * The environment to run the process in.
         * @note The `PROCESS_WORKER_DATA` environment variable is reserved for the class wide worker data.
         * @default process.env
         */
        env?: NodeJS.ProcessEnv;
        /**
         * Controls how the child process stdio streams are configured by default.
         *
         * If `true`, the child's `stdin`, `stdout`, and `stderr` are all set up as
         * pipes (`'pipe'`), so you can read/write them via the returned `ChildProcess`
         * object.
         *
         * If `false`, the child's stdio streams are inherited from the parent,
         * similar to using `{ stdio: 'inherit' }` in `child_process.spawn()`.
         *
         * When `stdio` is explicitly provided, that configuration takes precedence
         * and this option is ignored.
         *
         * @default false
         */
        silent?: boolean | undefined;
        /**
         * Can be set to 'pipe', 'inherit', 'overlapped', or 'ignore', or an array of these strings.
         * If passed as an array, the first element is used for `stdin`, the second for
         * `stdout`, and the third for `stderr`. A fourth element can be used to
         * specify the `stdio` behavior beyond the standard streams. See
         * {@link ChildProcess.stdio} for more information.
         *
         * @default 'pipe'
         */
        stdio?: StdioOptions | undefined;
        /**
         * Prepare the child process to run independently of its parent process.
         *
         * On Windows:
         *  - When `true`, the child can continue running after the parent exits
         *    and will have its own console window.
         *
         * On non-Windows platforms:
         *  - When `true`, the child becomes the leader of a new process group and
         *    session (similar to `setsid(2)`), allowing it to run independently.
         *
         * In all cases, for a truly independent long-running background process you
         * should:
         *  - Configure `stdio` so the child is not attached to the parent's stdio
         *    (for example, `{ stdio: 'ignore' }` or redirect to files), and
         *  - Call `child.unref()` on the returned `ChildProcess` so the parent's
         *    event loop is not kept alive by the child.
         *
         * @default false
         */
        detached?: boolean | undefined;
        /**
         * Additional node fork options to control env, execArgv, etc.
         * All values defined in this object will override the other default fork options,
         * such as `env`, `silent`, `stdio` and `detached`.
         *
         * Note that env will be merged with a generated `PROCESS_WORKER_DATA` value
         * if {@link ForkManager.Opts.worker_data} is provided.
         */
        fork_options?: undefined | ForkOptions;
    }

    /**
     * The options for the `run()` method in persistent mode.
     *
     * In persistent mode, process-level options such as `env`, `stdio`, `detached`
     * and `fork_options` are configured once via {@link ForkManager.Opts.fork_options}
     * and cannot be changed per job.
     */
    interface PersistentRunOpts extends RunOptsBase {
        unref?: never;
        env?: never;
        silent?: never;
        stdio?: never;
        detached?: never;
        fork_options?: never;
    }

    /**
     * The options for the `run()` method.
     * 
     * @typeParam TType - The worker type, `"ephemeral"` or `"persistent"`.
     */
    export type RunOpts<TType extends Mode = 'ephemeral'> =
        TType extends 'persistent' ? PersistentRunOpts : EphemeralRunOpts;

    /**
     * Internal representation of a queued job.
     */
    export interface InternalJob<TPayload, TResult> {
        payload: TPayload;
        resolve: (value: TResult) => void;
        reject: (reason: unknown) => void;
        unref: boolean;
        timeout: undefined | number;
        signal: undefined | AbortSignal;
        fork_options: ForkOptions;
    }

    /**
     * Per-worker state for a persistent worker processing a single active job.
     */
    export interface PersistentJobState<TPayload, TResult> {
        /** The active job assigned to this worker. */
        job: ForkManager.InternalJob<TPayload, TResult>;
        /** Whether the job has already been settled (resolved or rejected). */
        settled: boolean;
        /** Timeout handle for this job, if any. */
        timeout_handle?: NodeJS.Timeout;
        /** Abort listener attached to the job's signal, if any. */
        abort_listener?: () => void;
    }

    /**
     * Message sent from parent process to child process.
     */
    export interface RequestMessage<TPayload> {
        /** Payload for the process handler. */
        payload: TPayload;
    }

    /**
     * Message sent from child process back to parent process.
     * 
     * @docs
     */
    export interface ResponseMessage<TResult> {
        /** Indicates success or failure of the handler. */
        ok: boolean;
        /** Result value if ok is true. */
        result?: TResult;
        /** Serialized error details if ok is false. */
        error?: ForkManager.SerializedError;
    }


    /**
     * A JSON-serializable representation of an error that occurred in a forked process.
     * 
     * @docs
     */
    export interface SerializedError {
        /** Error name (e.g. "Error", "TypeError"). */
        name: string;
        /** Error message. */
        message: string;
        /** Error stack trace, if available. */
        stack?: string;
        /** The error that caused this error, if any. */
        cause?: Error;
        /** Arbitrary extra details that might be useful for debugging. */
        details?: unknown;
    }

    /**
     * Error thrown when a process worker job fails or times out.
     * 
     * @docs
     */
    export class Error extends globalThis.Error {

        /** Path to the worker module that failed. */
        public readonly process_path: string;

        /** Serialized error information from inside the worker, if available. */
        public readonly worker_error?: ForkManager.SerializedError;

        /**
         * Create a new fork manager error.
         *
         * @param message Human-readable error message.
         * @param process_path Path to the worker module.
         * @param worker_error Serialized error from inside the worker, if any.
         */
        constructor(message: string, process_path: string, worker_error?: ForkManager.SerializedError) {
            super(message);
            this.name = 'ForkManagerError';
            this.process_path = process_path;
            this.worker_error = worker_error;
        }

        /**
         * Format this error.
         */
        format(opts?: FormatErrorOpts): string {
            return format_error(this, opts);
        }
    }

    /**
     * Error thrown when a process worker job fails or times out.
     * 
     * @docs
     */
    export class TimeoutError extends Error {
        /**
         * Create a new fork manager timeout error.
         *
         * @param message Human-readable error message.
         * @param process_path Path to the worker module.
         * @param worker_error Serialized error from inside the worker, if any.
         */
        constructor(message: string, process_path: string, worker_error?: ForkManager.SerializedError) {
            super(message, process_path, worker_error);
            this.name = 'ForkManagerTimeoutError';
        }
    }

    /**
     * A handler function that is executed inside the forked process.
     *
     * Implementations receive a payload from the parent process and must return
     * the computed result. The handler may be synchronous or asynchronous.
     */
    export type ForkedChildHandler<TPayload, TResult> = (payload: TPayload) => TResult | Promise<TResult>;

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
    export function run_forked_child<TPayload = unknown, TResult = unknown>(
        handler: ForkedChildHandler<TPayload, TResult>,
    ): void {
        if (!process.send) {
            throw new globalThis.Error('run_forked_child() must be called from a forked process (child_process.fork)');
        }

        process.on('message', async (raw_message: unknown) => {
            const message = raw_message as ForkManager.RequestMessage<TPayload>;

            try {
                const result = await handler(message.payload);
                const response: ForkManager.ResponseMessage<TResult> = {
                    ok: true,
                    result,
                };
                process.send?.(response);
            } catch (err: unknown) {
                const error = err as Error;
                const serialized: ForkManager.SerializedError = {
                    name: error?.name ?? 'Error',
                    message: error?.message ?? 'Unknown error',
                    stack: error?.stack,
                    cause: error,
                };
                const response: ForkManager.ResponseMessage<TResult> = {
                    ok: false,
                    error: serialized,
                };
                process.send?.(response);
            }
        });
    }

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
    export function resolve_process_path(relative_path: string, module_url: string): string {
        return fileURLToPath(new URL(relative_path, module_url));
    }

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
    export function is_forked_process(): boolean {
        // `process.send` only exists on processes that have an IPC channel to a parent,
        // which is the case for processes created via `child_process.fork()` or cluster workers.
        return typeof process.send === "function";
    }

    /**
     * Detect whether the current code is running in the original (non-forked) process.
     *
     * This is the logical inverse of {@link is_forked_process}.
     *
     * @returns `true` when executing in the main process, `false` when in a forked (child) process.
     *
     * @docs
     */
    export function is_main_process(): boolean {
        return !is_forked_process();
    }

}
