/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Callable } from "../generic/callable.js";
import { ActiveLogLevel } from "./directives.js";
import { Args, Pipe } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";
/**
 * The callable debug class.
 */
export declare class Debug extends Callable<Args, void> {
    level: ActiveLogLevel;
    pipe: Pipe<false, true>;
    /**
     * Construct a new debug instance.
     *
     * @param opts The options for the debug instance.
     *             This can be a number, an ActiveLogLevel instance, or an object.
     * @param opts.level The log level to set for this debug instance, defaults to 0.
     *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
     * @param opts.pipe The pipe to use for logging. If not provided, the default pipe will be used.
     */
    constructor(opts: number | ActiveLogLevel | {
        level?: number | ActiveLogLevel;
    });
    /**
     * {Log}
     * Log a message to the console. Including a traceback of the source location.
     * @param args
     *        The data to log.
     *        The first number is treated as the local log level.
     *        Any other directives are allowed before the first non-directive / local log level argument.
     * @funcs 2
     */
    call(log_level: number | Args[0], ...args: Args): void;
    /**
     * Check if the local log level is active.
     * @param local_level The local log level to check against the active log level.
     * @param active_level Optionally provide an active log level to check against.
     * @returns `true` if the local level is active, otherwise `false`.
     */
    on(local_level: number, active_level?: number): boolean;
    /**
     * Log a message in raw mode.
     * @param args Log arguments to pass to the pipe.
     */
    raw(level: number | any, ...args: Args): void;
    dump(level: number | any, ...args: Args): void;
    /**
     * {Errors}
     * Log error data to the console and file streams when defined.
     * This automatically prepends the `Mode.raw` directive.
     * @param args The data to log.
     */
    error(...args: Args): void;
    /**
     * {Warn}
     * Log a warning to the console and file streams when defined.
     * This automatically prepends the `Mode.raw` directive.
     * @param level The log level or the first argument to log.
     * @param errs The data to log.
     * @funcs 2
     */
    warn(level: number | any, ...args: Args): void;
    warning(level: number | any, ...args: Args): void;
    /**
     * Update the log level of this debug instance.
     * @param value The log level to set for this debug instance.
     * @returns The debug instance itself for chaining.
     */
    set(value: number): this;
    update(value: number): this;
    /**
     * Create a new SourceLoc instance.
     * @param lookback
     *      The number of function calls to go back in the call stack for the creation of the SourceLoc.
     *      By default the source location will be created for the location of where this function is called.
     * @returns A new SourceLoc instance.
     */
    loc(lookback?: number): SourceLoc;
    /**
     * Forward the `Pipe.join()` function to the pipe instance.
     * @param args The arguments to pass to the `Pipe.join()` function.
     * @returns The joined string.
     */
    join(...args: Args): string;
}
/**
 * A global debug instance with a shared log level.
 * @dev_note Should be forwarded out of the `debugging` module.
 */
export declare const debug: Debug;
