/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Error thrown for daemon-related failures.
 *
 * @nav System
 * @docs
 */
export declare class DaemonError extends Error {
    constructor(...args: any[]);
}
/** Nested types for the {@link Daemon} class. */
export declare namespace Daemon {
    /** Constructor options. */
    interface Opts {
        /** The name of the service. */
        name: string;
        /** The executing user of the service. */
        user: string;
        /** The executing group of the service. */
        group?: string;
        /** The start command of the service. */
        command: string;
        /** The arguments for the start command. */
        args?: string[];
        /** The path to the current working directory. */
        cwd?: string;
        /** The environment variables for the service. */
        env?: Record<string, string>;
        /** The description of the service. */
        description: string;
        /** The auto restart options, by default disabled. */
        auto_restart?: {
            /** Enable auto restart to restart the service upon crash */
            enabled: boolean;
            /**
             * The auto restart limit (will be ignored on macos).
             * Define as `-1` or `undefined` to disable.
             * Defaults to `-1`.
             */
            limit?: number;
            /**
             * The auto restart delay.
             * Define as `-1` or `undefined` to disable.
             * Defaults to `-1`.
             */
            delay?: number;
        };
        /** The path to the log file. */
        logs?: string;
        /** The path to the error log file. */
        errors?: string;
    }
}
/**
 * The system daemon class.
 *
 * @nav System
 * @docs
 */
export declare class Daemon {
    private name;
    private user;
    private group?;
    private command;
    private args;
    private cwd?;
    private env;
    private desc;
    private auto_restart;
    private auto_restart_limit;
    private auto_restart_delay;
    private logs?;
    private errors?;
    private path;
    private proc;
    /**
     * Construct a new daemon instance.
     * @docs
     */
    constructor({ name, user, group, command, args, cwd, env, description, auto_restart, logs, errors, }: Daemon.Opts);
    /**
     * Build the platform-specific daemon configuration content.
     * On macOS, returns a launchd plist; on Linux, returns a systemd unit file.
     * @returns The serialized configuration content.
     * @private
     */
    private create_h;
    /**
     * Load the daemon configuration into the OS service manager.
     * On macOS, runs `launchctl load` for the generated plist.
     * @returns Resolves when the configuration has been loaded.
     * @private
     */
    private load_h;
    /**
     * Reload the daemon configuration in the OS service manager.
     * On macOS, unloads and reloads via `launchctl`; on Linux, runs `systemctl daemon-reload`.
     * @returns Resolves when the configuration has been reloaded.
     * @private
     */
    private reload_h;
    /**
     * Check if the daemon exists.
     * @note Requires root priviliges.
     * @returns Returns a boolean indicating whether the daemon's configuration file exists.
     * @docs
     */
    exists(): boolean;
    /**
     * Create the daemon's configuration file.
     * Use `update()` to update an exisiting daemon.
     * @note Requires root priviliges.
     * @docs
     */
    create(): Promise<void>;
    /**
     * Update the daemon's configuration file.
     * Use `create()` to create an unexisiting daemon.
     * @note Requires root priviliges.
     * @docs
     */
    update(): Promise<void>;
    /**
     * Remove the daemon's configuration file.
     * Equal to `path().remove()`.
     * @note Requires root priviliges.
     * @docs
     */
    remove(): Promise<void>;
    /**
     * Start the daemon.
     * @note Requires root priviliges.
     * @docs
     */
    start(): Promise<void>;
    /**
     * Stop the daemon.
     * @note Requires root priviliges.
     * @docs
     */
    stop(): Promise<void>;
    /**
     * Restart the daemon.
     * @note Requires root priviliges.
     * @docs
     */
    restart(): Promise<void>;
    /**
     * Check if the service daemon is running.
     * @note Requires root priviliges.
     * @returns Returns a promise that resolves to a boolean indicating if the daemon is running.
     * @docs
     */
    is_running(): Promise<boolean>;
    /**
     * Tail the daemon logs.
     * @note Requires root priviliges.
     * @param lines The number of log lines to show. Defaults to 100.
     * @docs
     */
    tail(lines?: number): Promise<string>;
}
