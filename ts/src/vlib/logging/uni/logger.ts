/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Callable } from "../../generic/callable.js";
import { ActiveLogLevel, Directive } from "./directives.js";
import { Args, Pipe } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";;
import { Color } from "../../generic/colors.js";

/**
 * The callable logger class.
 * Used for logging or debugging purposes.
 * Takes a generic input pipe, to support other pipes such as a `FilePipe`.
 * 
 * @template D The debug mode flag, defaults to `false`.
 * @template P The pipe type, defaults to `Pipe<boolean, true>`.
 */
export class Logger<
    D extends boolean = false,
    P extends Pipe<boolean, true> = Pipe<boolean, true>,
> extends Callable<Args, void> {

    /** The active log level. */
    readonly level: ActiveLogLevel;

    /** The pipe instance. */
    pipe: P;

    /**
     * The debug directive.
     * Either `Directive.debug` or a fake `Directive.log` for easy func pass.
     * When debug mode is enabled, trace locations are shown for log messages.
     * Not for errors and warnings, since they often contain their own source locations.
     */
    private _debug_flag: D extends true ? typeof Directive.debug : typeof Directive.log;

    /**
     * @dev_note Dont allow any other options than object, so we can infer D
     *           Otherwise it causes issues for the default value of `debug`.
     *           Because we need to guarantee that the debug flag matches generic `D`.
     */
    /**
     * Construct a new debug instance.
     * 
     * @param opts The options for the debug instance.
     * @param opts.level The log level to set for this debug instance, defaults to 0.
     *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
     * @param opts.debug If `true`, the debug instance show trace locations for log messages, not for errors and warnings.
     */
    constructor(opts: {
        level?: number | ActiveLogLevel,
        debug?: D,
    }) {
        super();
        this._debug_flag = opts.debug ? Directive.debug : Directive.log;
        this.pipe = new Pipe<boolean, true>({
            log_level: 0,
            out: console.log,
            err: console.error,
        }) as P;
        this.pipe.log_level.set(opts.level ?? 0);
        this.level = this.pipe.log_level;
    }

    /**
     * {Log}
     * Log a message to the console. Including a traceback of the source location.
     * @param args
     *        The data to log.
     *        The first number is treated as the local log level.
     *        Any other directives are allowed before the first non-directive / local log level argument.
     * @funcs 2
     */
    call(log_level: number | Args[0], ...args: Args): void {
        this.pipe.log(this.level, this._debug_flag, new SourceLoc(2), log_level, ...args);
    }

    /**
     * Check if the local log level is active.
     * @param local_level The local log level to check against the active log level.
     * @param active_level Optionally provide an active log level to check against.
     * @returns `true` if the local level is active, otherwise `false`.
     */
    on(local_level: number, active_level?: number): boolean {
        return active_level == null ? local_level <= this.level.n : local_level <= active_level;
    }

    /**
     * Log a message in raw mode.
     * @param args Log arguments to pass to the pipe.
     */
    raw(level: number | any, ...args: Args): void {
        this.pipe.raw(this.level, this._debug_flag, Directive.raw, new SourceLoc(1), level, ...args); // do not use console.log here since we join args without a space unlike console.log.
    }
    dump(level: number | any, ...args: Args): void {
        this.pipe.raw(this.level, this._debug_flag, Directive.raw, new SourceLoc(1), level, ...args); // do not use console.log here since we join args without a space unlike console.log.
    }

    /**
     * {Errors}
     * Log error data to the console and file streams when defined.
     * This automatically prepends the `Mode.raw` directive.
     * @param args The data to log.
     */
    error(...args: Args): void {
        this.call(-1, Directive.raw, Directive.error, new SourceLoc(1), ...args);
    }

    /**
     * {Warn}
     * Log a warning to the console and file streams when defined.
     * This automatically prepends the `Mode.raw` directive.
     * @param level The log level or the first argument to log.
     * @param errs The data to log.
     * @funcs 2
     */
    warn(level: number | any, ...args: Args): void {
        this.call(Directive.raw, Directive.warn, new SourceLoc(1), level, ...args);
    }
    warning(level: number | any, ...args: Args): void {
        this.call(Directive.raw, Directive.warn, new SourceLoc(1), level, ...args);
    }

    /**
     * Update the log level of this debug instance.
     * @param value The log level to set for this debug instance.
     * @returns The debug instance itself for chaining.
     */
    set(value: number): this {
        this.level.set(value);
        return this;
    }
    update(value: number): this {
        this.level.update(value);
        return this;
    }

    /**
     * Create a new SourceLoc instance.
     * @param lookback
     *      The number of function calls to go back in the call stack for the creation of the SourceLoc.
     *      By default the source location will be created for the location of where this function is called.
     * @returns A new SourceLoc instance.
     */
    loc(lookback: number = 0): SourceLoc {
        return new SourceLoc(1 + lookback);
    }

    /**
     * Forward the `Pipe.join()` function to the pipe instance.
     * @param args The arguments to pass to the `Pipe.join()` function.
     * @returns The joined string.
     */
    join(...args: Args): string {
        return this.pipe.join(...args);
    }

    /** Create a marker log message. */
    marker(level: number | any, ...args: Args): void {
        if (typeof level === "number") {
            this.call(level, this._debug_flag, new SourceLoc(1), Color.blue(">>> "), ...args);
        } else {
            this.call(this._debug_flag, new SourceLoc(1), Color.blue(">>> "), level, ...args);
        }
    }

}

/**
 * A global log instance.
 */
export const log: Logger = new Logger({ level: 0, debug: false });
