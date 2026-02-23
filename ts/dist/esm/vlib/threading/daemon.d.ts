/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2026 Daan van den Bergh.
 */
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
export declare class Daemon {
    private readonly daemon_path;
    private readonly name?;
    private readonly daemon_data?;
    private readonly restart;
    private readonly min_restart_delay_ms;
    private readonly max_restart_delay_ms;
    private readonly restart_jitter_ratio;
    /**
     * If the daemon stays alive for at least this duration, we consider it "healthy"
     * and reset the restart backoff for future crashes.
     *
     * @default 60000
     */
    private readonly backoff_reset_after_ms;
    private worker;
    private running;
    private stopping;
    private start_time_ms;
    private last_exit_code;
    private last_exit_reason;
    private restart_attempts;
    private restart_timer;
    private expected_exit;
    /**
     * Create a new Daemon supervisor.
     *
     * @param options Configuration options for the daemon worker thread.
     */
    constructor(options: Daemon.Opts);
    /**
     * Start the daemon if it is not already running.
     *
     * This spawns a single worker thread and supervises it.
     *
     * @throws {@link Daemon.Error} if called from within a worker thread.
     * @throws {@link Daemon.Error} if the daemon is already running.
     */
    start(): void;
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
    shutdown(reason?: string): Promise<void>;
    /**
     * Return current daemon statistics for monitoring / introspection.
     */
    get_stats(): Daemon.Stats;
    /**
     * Internal: spawn the worker thread and attach supervision handlers.
     */
    private spawn_worker;
    /**
     * Internal: schedule a supervised restart with exponential backoff and jitter.
     */
    private schedule_restart;
    private clamp_number;
    private assert_valid_options;
}
/**
 * Nested daemon types.
 */
export declare namespace Daemon {
    /**
     * Options for configuring a Daemon instance.
     */
    interface Opts {
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
    interface Stats {
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
    class Error extends globalThis.Error {
        /** Path to the daemon module that failed. */
        readonly daemon_path: string;
        /**
         * Create a new daemon error.
         *
         * @param message Human-readable error message.
         * @param daemon_path Path to the daemon module.
         */
        constructor(message: string, daemon_path: string);
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
    function start_daemon_runtime(daemon_main: (daemon_data: unknown) => void | Promise<void>): void;
    /**
     * Resolve a daemon script path in an ESM-friendly way.
     *
     * This mirrors the {@link Worker.resolve_worker_path} helper.
     *
     * @param relative_path Path to the daemon script, relative to the calling module.
     * @param module_url    The `import.meta.url` value of the calling module.
     * @returns A filesystem path string suitable for `daemon_path`.
     */
    function resolve_daemon_path(relative_path: string, module_url: string): string;
}
