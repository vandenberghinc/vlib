/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Callable } from "../global/callable.js";
import { ActiveLogLevel } from "./directives.js";
import { Args, Pipe } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";
/**
 * The callable debug class.
 */
export declare class Debug extends Callable<Args, void> {
    level: ActiveLogLevel;
    pipe: Pipe;
    /**
     * Construct a new debug instance.
     *
     * @param opts The options for the debug instance.
     *             This can be a number, an ActiveLogLevel instance, or an object.
     * @param opts.level The log level to set for this debug instance.
     *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
     * @param opts.pipe The pipe to use for logging. If not provided, the default pipe will be used.
     */
    constructor(opts: number | ActiveLogLevel | {
        level?: number | ActiveLogLevel;
        pipe?: Pipe;
    });
    /** Call the debug fn. */
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
    raw(...args: Args): void;
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
}
/**
 * A global debug instance with a shared log level that can be set.
 * @dev_note Should be forwarded out of the `debugging` module.
 */
export declare const debug: Debug;
