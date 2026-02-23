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
    daemon_path;
    name;
    daemon_data;
    restart;
    min_restart_delay_ms;
    max_restart_delay_ms;
    restart_jitter_ratio;
    /**
     * If the daemon stays alive for at least this duration, we consider it "healthy"
     * and reset the restart backoff for future crashes.
     *
     * @default 60000
     */
    backoff_reset_after_ms;
    worker;
    running;
    stopping;
    start_time_ms;
    last_exit_code;
    last_exit_reason;
    restart_attempts;
    restart_timer;
    expected_exit;
    /**
     * Create a new Daemon supervisor.
     *
     * @param options Configuration options for the daemon worker thread.
     */
    constructor(options) {
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
    start() {
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
    async shutdown(reason = 'Daemon shutdown') {
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
        }
        catch {
            // Best-effort termination; ignore errors.
        }
        finally {
            // Return to a stable "stopped" state that can be started again.
            this.start_time_ms = null;
            this.stopping = false;
            this.expected_exit = false;
        }
    }
    /**
     * Return current daemon statistics for monitoring / introspection.
     */
    get_stats() {
        const now = Date.now();
        const uptime_ms = this.start_time_ms != null && this.running && this.worker
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
    spawn_worker() {
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
        node_worker.on('error', (err) => {
            // Ignore if this worker is no longer current.
            if (this.worker !== node_worker) {
                return;
            }
            if (!this.expected_exit) {
                this.last_exit_reason = `worker_error: ${err.message}`;
            }
        });
        node_worker.once('exit', (code) => {
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
    schedule_restart(exit_code) {
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
    clamp_number(value, min, max) {
        if (!Number.isFinite(value)) {
            return min;
        }
        return Math.min(max, Math.max(min, value));
    }
    assert_valid_options(options) {
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
(function (Daemon) {
    /**
     * Error thrown when daemon start/shutdown operations fail.
     */
    class Error extends globalThis.Error {
        /** Path to the daemon module that failed. */
        daemon_path;
        /**
         * Create a new daemon error.
         *
         * @param message Human-readable error message.
         * @param daemon_path Path to the daemon module.
         */
        constructor(message, daemon_path) {
            super(message);
            this.name = 'DaemonError';
            this.daemon_path = daemon_path;
        }
    }
    Daemon.Error = Error;
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
    function start_daemon_runtime(daemon_main) {
        if (isMainThread) {
            throw new globalThis.Error('start_daemon_runtime must be called from within a worker thread');
        }
        // Guard against accidental double-initialization in the same worker.
        const kDaemonRuntimeStarted = '__volt_daemon_runtime_started__';
        if (globalThis[kDaemonRuntimeStarted]) {
            throw new globalThis.Error('start_daemon_runtime was called more than once in the same worker');
        }
        globalThis[kDaemonRuntimeStarted] = true;
        const hard_exit = (err) => {
            // Best-effort preserve the error for logs/telemetry upstream.
            // Exit is the most reliable way to ensure restart by the supervisor.
            try {
                const any_error = err;
                const message = any_error?.message ?? String(err);
                // eslint-disable-next-line no-console
                console.error('[daemon] fatal:', message, any_error?.stack ?? any_error);
            }
            catch {
                // ignore
            }
            process.exit(1);
        };
        // In a daemon worker, a corrupted async state should crash the worker
        // and let the supervisor restart.
        process.once('unhandledRejection', (reason) => hard_exit(reason));
        process.once('uncaughtException', (err) => hard_exit(err));
        Promise.resolve()
            .then(() => daemon_main(workerData))
            .then(() => {
            // A daemon that returns is treated as a fatal condition.
            hard_exit(new globalThis.Error('Daemon runtime returned unexpectedly'));
        })
            .catch((err) => {
            // Crash the worker with maximal context.
            hard_exit(err);
        });
    }
    Daemon.start_daemon_runtime = start_daemon_runtime;
    /**
     * Resolve a daemon script path in an ESM-friendly way.
     *
     * This mirrors the {@link Worker.resolve_worker_path} helper.
     *
     * @param relative_path Path to the daemon script, relative to the calling module.
     * @param module_url    The `import.meta.url` value of the calling module.
     * @returns A filesystem path string suitable for `daemon_path`.
     */
    function resolve_daemon_path(relative_path, module_url) {
        return fileURLToPath(new URL(relative_path, module_url));
    }
    Daemon.resolve_daemon_path = resolve_daemon_path;
})(Daemon || (Daemon = {}));
//# sourceMappingURL=daemon.js.map