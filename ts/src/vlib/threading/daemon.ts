/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2026 Daan van den Bergh.
 */

import { fileURLToPath } from 'url';
import { Worker as NodeWorker, isMainThread, workerData } from 'worker_threads';

/**
 * Friendly wrapper around Node.js worker_threads for running a single long-lived daemon
 * in an isolated worker thread.
 *
 * This is intentionally different from {@link Worker}:
 * - No job queue.
 * - No request/response messaging.
 * - The daemon is expected to run indefinitely.
 *
 * The daemon is supervised from the main thread:
 * - If it exits unexpectedly and restart is enabled, it will be restarted with backoff.
 * - The daemon can be shutdown gracefully (best-effort) by terminating the worker thread.
 *
 * NOTE:
 * - Node.js worker threads share the same process; they are not a substitute for
 *   process-level isolation. For strict isolation, run a separate Node process.
 */
export class Daemon {
    private readonly daemon_path: string;
    private readonly name?: string;
    private readonly daemon_data?: unknown;

    private readonly restart: boolean;
    private readonly min_restart_delay_ms: number;
    private readonly max_restart_delay_ms: number;
    private readonly restart_jitter_ratio: number;

    /**
     * If the daemon stays alive for at least this duration, we consider it "healthy"
     * and reset the restart backoff for future crashes.
     *
     * @default 60000
     */
    private readonly backoff_reset_after_ms: number;

    private worker: NodeWorker | null;
    private running: boolean;
    private stopping: boolean;

    private start_time_ms: number | null;
    private last_exit_code: number | null;
    private last_exit_reason: string | null;

    private restart_attempts: number;
    private restart_timer: NodeJS.Timeout | null;

    private expected_exit: boolean;

    /**
     * Create a new Daemon supervisor.
     *
     * @param options Configuration options for the daemon worker thread.
     */
    constructor(options: Daemon.Opts) {
        this.assert_valid_options(options);

        this.daemon_path = options.daemon_path;
        this.name = options.name;
        this.daemon_data = options.daemon_data;

        this.restart = options.restart ?? true;
        this.min_restart_delay_ms = Math.max(0, options.min_restart_delay_ms ?? 250);
        this.max_restart_delay_ms = Math.max(this.min_restart_delay_ms, options.max_restart_delay_ms ?? 30_000);
        this.restart_jitter_ratio = this.clamp_number(options.restart_jitter_ratio ?? 0.2, 0, 1);

        this.backoff_reset_after_ms = Math.max(0, options.backoff_reset_after_ms ?? 60_000);

        this.worker = null;
        this.running = false;
        this.stopping = false;

        this.start_time_ms = null;
        this.last_exit_code = null;
        this.last_exit_reason = null;

        this.restart_attempts = 0;
        this.restart_timer = null;

        this.expected_exit = false;
    }

    /**
     * Start the daemon if it is not already running.
     *
     * This spawns a single worker thread and supervises it.
     *
     * @throws {@link Daemon.Error} if called from within a worker thread.
     * @throws {@link Daemon.Error} if the daemon is already running.
     */
    public start(): void {
        if (!isMainThread) {
            throw new Daemon.Error('Daemon supervisor must be started from the main thread', this.daemon_path);
        }
        if (this.running || this.worker) {
            throw new Daemon.Error('Daemon is already running', this.daemon_path);
        }
        if (this.stopping) {
            throw new Daemon.Error('Daemon is stopping and cannot be started', this.daemon_path);
        }

        // Reset flags to allow restart after a previous shutdown.
        this.expected_exit = false;
        this.running = true;

        this.spawn_worker();
    }

    /**
     * Best-effort shutdown of the daemon.
     *
     * - Cancels any scheduled restart.
     * - Terminates the worker thread (best-effort).
     *
     * This method is idempotent and safe to call multiple times.
     *
     * @param reason Optional shutdown reason used for diagnostics only.
     */
    public async shutdown(reason = 'Daemon shutdown'): Promise<void> {
        // If already stopped and no worker exists, keep it idempotent.
        if (!this.running && !this.worker && !this.restart_timer) {
            this.last_exit_reason = this.last_exit_reason ?? reason;
            return;
        }

        this.stopping = true;
        this.running = false;
        this.expected_exit = true;

        this.last_exit_reason = reason;

        if (this.restart_timer) {
            clearTimeout(this.restart_timer);
            this.restart_timer = null;
        }

        const worker = this.worker;
        this.worker = null;

        if (!worker) {
            // Fully stopped (or already stopped).
            this.start_time_ms = null;
            this.stopping = false;
            return;
        }

        try {
            await worker.terminate();
        } catch {
            // Best-effort termination; ignore errors.
        } finally {
            // Return to a stable "stopped" state that can be started again.
            this.start_time_ms = null;
            this.stopping = false;
            this.expected_exit = false;
        }
    }

    /**
     * Return current daemon statistics for monitoring / introspection.
     */
    public get_stats(): Daemon.Stats {
        const now = Date.now();
        const uptime_ms =
            this.start_time_ms != null && this.running && this.worker
                ? Math.max(0, now - this.start_time_ms)
                : 0;

        return {
            name: this.name,
            daemon_path: this.daemon_path,
            running: this.running && this.worker != null,
            stopping: this.stopping,
            uptime_ms,
            restart_enabled: this.restart,
            restart_attempts: this.restart_attempts,
            last_exit_code: this.last_exit_code,
            last_exit_reason: this.last_exit_reason,
        };
    }

    /**
     * Internal: spawn the worker thread and attach supervision handlers.
     */
    private spawn_worker(): void {
        if (!this.running || this.stopping) {
            return;
        }

        // Ensure no dangling timer from a previous failure.
        if (this.restart_timer) {
            clearTimeout(this.restart_timer);
            this.restart_timer = null;
        }

        this.start_time_ms = Date.now();
        this.last_exit_code = null;
        this.last_exit_reason = null;

        const node_worker = new NodeWorker(this.daemon_path, {
            workerData: this.daemon_data,
        });

        // Publish the worker reference immediately to avoid missing early events.
        this.worker = node_worker;

        node_worker.on('error', (err: Error) => {
            // Ignore if this worker is no longer current.
            if (this.worker !== node_worker) {
                return;
            }
            if (!this.expected_exit) {
                this.last_exit_reason = `worker_error: ${err.message}`;
            }
        });

        node_worker.once('exit', (code: number) => {
            // Only handle exit if this worker is current.
            if (this.worker !== node_worker) {
                return;
            }

            const now = Date.now();
            const started = this.start_time_ms ?? now;
            const uptime = Math.max(0, now - started);

            this.worker = null;
            this.last_exit_code = code;

            // If we ran for long enough, reset backoff to avoid permanently long delays.
            if (uptime >= this.backoff_reset_after_ms) {
                this.restart_attempts = 0;
            }

            // If we're shutting down intentionally, do not restart.
            if (!this.running || this.stopping || this.expected_exit) {
                if (this.last_exit_reason == null) {
                    this.last_exit_reason = `exited_with_code_${code}`;
                }
                return;
            }

            // Unexpected exit; decide whether to restart.
            if (!this.restart) {
                this.running = false;
                this.last_exit_reason = this.last_exit_reason ?? `exited_with_code_${code}`;
                return;
            }

            // Ensure we have an exit reason for observability.
            this.last_exit_reason = this.last_exit_reason ?? `exited_with_code_${code}`;

            this.schedule_restart(code);
        });
    }

    /**
     * Internal: schedule a supervised restart with exponential backoff and jitter.
     */
    private schedule_restart(exit_code: number): void {
        if (!this.running || this.stopping || this.expected_exit) {
            return;
        }

        this.restart_attempts += 1;

        // Exponential backoff with cap.
        const exp = Math.min(this.restart_attempts - 1, 30);
        const base = this.min_restart_delay_ms * Math.pow(2, exp);
        const capped = Math.min(this.max_restart_delay_ms, base);

        // Add jitter to avoid thundering herd if many instances restart at once.
        const jitter = capped * this.restart_jitter_ratio;
        const delay = Math.max(0, Math.floor(capped - jitter + Math.random() * (2 * jitter)));

        // Always record restart scheduling detail for diagnostics.
        this.last_exit_reason = `exited_with_code_${exit_code}_scheduled_restart_in_${delay}ms`;

        this.restart_timer = setTimeout(() => {
            this.restart_timer = null;

            // If we were stopped while waiting, do nothing.
            if (!this.running || this.stopping || this.expected_exit) {
                return;
            }

            // If another worker was started somehow, do nothing.
            if (this.worker) {
                return;
            }

            this.spawn_worker();
        }, delay);
    }

    private clamp_number(value: number, min: number, max: number): number {
        if (!Number.isFinite(value)) {
            return min;
        }
        return Math.min(max, Math.max(min, value));
    }

    private assert_valid_options(options: Daemon.Opts): void {
        if (!options || typeof options !== 'object') {
            throw new Daemon.Error('Daemon options must be an object', '<unknown>');
        }
        if (typeof options.daemon_path !== 'string' || options.daemon_path.trim().length === 0) {
            throw new Daemon.Error('Daemon "daemon_path" must be a non-empty string', '<unknown>');
        }
        if (options.min_restart_delay_ms != null && (!Number.isFinite(options.min_restart_delay_ms) || options.min_restart_delay_ms < 0)) {
            throw new Daemon.Error('Daemon "min_restart_delay_ms" must be a non-negative finite number', options.daemon_path);
        }
        if (options.max_restart_delay_ms != null && (!Number.isFinite(options.max_restart_delay_ms) || options.max_restart_delay_ms < 0)) {
            throw new Daemon.Error('Daemon "max_restart_delay_ms" must be a non-negative finite number', options.daemon_path);
        }
        if (options.backoff_reset_after_ms != null && (!Number.isFinite(options.backoff_reset_after_ms) || options.backoff_reset_after_ms < 0)) {
            throw new Daemon.Error('Daemon "backoff_reset_after_ms" must be a non-negative finite number', options.daemon_path);
        }
        if (options.restart_jitter_ratio != null && (!Number.isFinite(options.restart_jitter_ratio) || options.restart_jitter_ratio < 0 || options.restart_jitter_ratio > 1)) {
            throw new Daemon.Error('Daemon "restart_jitter_ratio" must be a finite number in range [0..1]', options.daemon_path);
        }
    }
}

/**
 * Nested daemon types.
 */
export namespace Daemon {

    /**
     * Options for configuring a Daemon instance.
     */
    export interface Opts {
        /**
         * Absolute or relative path to the daemon module file.
         *
         * This file should import and call {@link start_daemon_runtime}.
         */
        daemon_path: string;

        /**
         * Optional human-readable name for this daemon, used only for debugging
         * and introspection via {@link Daemon.get_stats}.
         */
        name?: string;

        /**
         * Arbitrary data passed as `workerData` when creating the daemon worker thread.
         * This can be used to configure the daemon side.
         */
        daemon_data?: unknown;

        /**
         * Whether to restart the daemon if it exits unexpectedly.
         *
         * @default true
         */
        restart?: boolean;

        /**
         * Minimum restart delay in milliseconds.
         *
         * @default 250
         */
        min_restart_delay_ms?: number;

        /**
         * Maximum restart delay in milliseconds.
         *
         * @default 30000
         */
        max_restart_delay_ms?: number;

        /**
         * Jitter ratio applied to restart delay to prevent synchronized restarts.
         *
         * 0 = no jitter, 1 = full jitter in range [0..2*delay].
         *
         * @default 0.2
         */
        restart_jitter_ratio?: number;

        /**
         * Reset backoff after the daemon has been alive for at least this duration.
         * This prevents permanently long delays after a single crash early on.
         *
         * @default 60000
         */
        backoff_reset_after_ms?: number;
    }

    /**
     * Statistics about the current state of a Daemon instance.
     */
    export interface Stats {
        /** Optional human-readable name. */
        name?: string;
        /** Daemon module path. */
        daemon_path: string;
        /** Whether the daemon is currently running. */
        running: boolean;
        /** Whether a shutdown has been initiated. */
        stopping: boolean;
        /** Current uptime in milliseconds (0 if not running). */
        uptime_ms: number;
        /** Whether automatic restart is enabled. */
        restart_enabled: boolean;
        /** Number of restart attempts since start. */
        restart_attempts: number;
        /** Last exit code, if the daemon exited. */
        last_exit_code: number | null;
        /** Last exit reason string for diagnostics. */
        last_exit_reason: string | null;
    }

    /**
     * Error thrown when daemon start/shutdown operations fail.
     */
    export class Error extends globalThis.Error {
        /** Path to the daemon module that failed. */
        public readonly daemon_path: string;

        /**
         * Create a new daemon error.
         *
         * @param message Human-readable error message.
         * @param daemon_path Path to the daemon module.
         */
        constructor(message: string, daemon_path: string) {
            super(message);
            this.name = 'DaemonError';
            this.daemon_path = daemon_path;
        }
    }

    /**
     * Start a daemon runtime inside a worker thread.
     *
     * Call this from within your daemon module file (the file whose path you pass
     * as {@link Daemon.Opts.daemon_path} on the main thread).
     *
     * This runtime does not set up any message passing. It simply executes the
     * provided function and expects it to not resolve under normal operation.
     *
     * If the daemon function throws or resolves, the worker will exit (which may
     * trigger a restart in the supervising {@link Daemon}).
     *
     * @param daemon_main An async function that runs the daemon. Should not resolve.
     */
    export function start_daemon_runtime(
        daemon_main: (daemon_data: unknown) => void | Promise<void>,
    ): void {
        if (isMainThread) {
            throw new globalThis.Error('start_daemon_runtime must be called from within a worker thread');
        }

        // Guard against accidental double-initialization in the same worker.
        const kDaemonRuntimeStarted = '__volt_daemon_runtime_started__';
        if ((globalThis as any)[kDaemonRuntimeStarted]) {
            throw new globalThis.Error('start_daemon_runtime was called more than once in the same worker');
        }
        (globalThis as any)[kDaemonRuntimeStarted] = true;

        const hard_exit = (err: unknown): never => {
            // Best-effort preserve the error for logs/telemetry upstream.
            // Exit is the most reliable way to ensure restart by the supervisor.
            try {
                const any_error = err as any;
                const message = any_error?.message ?? String(err);
                // eslint-disable-next-line no-console
                console.error('[daemon] fatal:', message, any_error?.stack ?? any_error);
            } catch {
                // ignore
            }
            process.exit(1);
        };

        // In a daemon worker, a corrupted async state should crash the worker
        // and let the supervisor restart.
        process.once('unhandledRejection', (reason: unknown) => hard_exit(reason));
        process.once('uncaughtException', (err: Error) => hard_exit(err));

        Promise.resolve()
            .then(() => daemon_main(workerData))
            .then(() => {
                // A daemon that returns is treated as a fatal condition.
                hard_exit(new globalThis.Error('Daemon runtime returned unexpectedly'));
            })
            .catch((err: unknown) => {
                // Crash the worker with maximal context.
                hard_exit(err);
            });
    }

    /**
     * Resolve a daemon script path in an ESM-friendly way.
     *
     * This mirrors the {@link Worker.resolve_worker_path} helper.
     *
     * @param relative_path Path to the daemon script, relative to the calling module.
     * @param module_url    The `import.meta.url` value of the calling module.
     * @returns A filesystem path string suitable for `daemon_path`.
     */
    export function resolve_daemon_path(relative_path: string, module_url: string): string {
        return fileURLToPath(new URL(relative_path, module_url));
    }
}
