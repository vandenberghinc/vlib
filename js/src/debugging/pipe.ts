/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Date } from "../global/date.js";
import { Path } from "../system/path.js";
import { Color, Colors } from "../system/colors.js";
import { SourceLoc } from './source_loc.js';
import { Utils } from '../utils.js';
import { ActiveLogLevel, Directive, ModeType, DirectivesOpts } from './directives.js';
import { Transform } from "../types/transform.js";

/**
 * Wrapper type for supported pipe arguments.
 * Purely for denoting types that are handled differently such as directives and `Error` instances.
 */
export type Args = (Directive | Error | any)[];

export namespace Pipe {
    /**
     * Pipe info class.
     * @attr data - Castable to string by `.join()`.
     */
    export type Info = {
        data?: never;
        ignored: true;
        mode: ModeType;
    } | {
        data: any[];
        ignored?: false;
        mode: ModeType;
    };
}
/** 
 * Pipe class.
 * Responsible for logging data to a pipe function, typically `console.log`.
 * Or any other function that accepts a data string as single argument, such as `process.stdout.write`.
 * 
 * @note Unlike the `console` instance, the Pipe class joins arguments without a space.
 *       This is to allow for more control over the output format.
 * 
 * @template Accumulated
 *     Whether to accumulate the piped data in an array.
 * @template Logged
 *     Whether to enable log level features in the pipe function(s).
 *     Is automatically enabled when `log_level` is passed to the constructor.
 * 
 * @dev_note
 *    The `Pipe` class also acts as a base for the `logging.Logger` class.
 *    But since we want the `Debug` class to be exposed in the frontend library.
 *    And `logging.Logger` requires backend libraries. We need to keep the `Pipe` class separate.
 */
export class Pipe<
    Accumulated extends boolean = boolean,
    Logged extends boolean = boolean,
> {

    /**
     * The active log level.
     * When defined, specific log level features are enabled in the pipe function(s).
     */
    log_level: Logged extends true ? ActiveLogLevel : never;

    /**
     * The accumulated piped data.
     */
    data: Accumulated extends true ? Pipe.Info[] : never;

    /**
     * The pipe function.
     */
    protected _out?: (msg: string) => void

    /**
     * The error pipe function.
     */
    protected _err?: (msg: string) => void

    /**
     * The transform function to apply to pipe input arguments.
     * It should return any type that can be joined by `.join()` as a child of the `msg` array.
     * If the transform function returns `Ignore`, the argument will be ignored.
     */
    protected _transform?: (input: any) => typeof Directive.ignore | any;

    /**
     * Constructor
     * @param log_level
     *     The active log level for this pipe instance.
     *     When defined, specific log level features are enabled in the pipe function(s).
     *     See {@link Pipe.pipe} for more information.
     * @param out
     *     The output function to use for logging data.
     *     Note that in order to use any of the related `log()` methods, this parameter must be defined.
     * @param err
     *     The error output function to use for logging error data.
     *     Defaults to the `out` function.
     * @param transform
     *     A transform function to apply to pipe input arguments.
     *     It should return any type that can be joined by `.join()` as a child of the `msg` array.
     *     If the transform function returns `Ignore`, the argument will be ignored.
     *     For the following types the transform function is NOT called:
     *     - `undefined | null | symbol | Error`
     * @param accumulate
     *     Whether to accumulate the piped data in an array.
     *     If `true`, the `buff` property will be an array that can be used to store the piped data.
     */
    constructor({ log_level, out, err = out, transform, accumulate }:
        {
            out?: (msg: string) => void,
            err?: (msg: string) => void,
            transform?: (input: any) => typeof Directive.ignore | any;
        }
        & (Logged extends true ? { log_level: ActiveLogLevel | number } : { log_level?: never })
        & (Accumulated extends true ? { accumulate: true } : { accumulate?: never })
    ) {
        this.log_level = (log_level == null
            ? undefined
            : log_level instanceof ActiveLogLevel 
                ? log_level // use reference, not a copy.
                : new ActiveLogLevel(log_level)
        ) as Logged extends true ? ActiveLogLevel : never;
        this._out = out;
        this._err = err;
        this._transform = transform;
        this.data = (accumulate ? [] : undefined) as unknown as Accumulated extends true ? any[] : never;
    }

    /**
     * Ensure the out and err functions are defined.
     * @throws Error when the out or err function is not defined.
     */
    protected ensure_out_err(): asserts this is Pipe & { _out: NonNullable<Pipe["_out"]>, _err: NonNullable<Pipe["_err"]> } {
        if (!this._out) { throw new Error("Pipe out function is not defined."); }
        if (!this._err) { throw new Error("Pipe err function is not defined."); }
    }
    
    /** Wrapper to push an arg to two arrays. */
    protected push_arg(
        msg: any[],
        file_msg: undefined | any[],
        item: any,
    ) {
        if (file_msg !== undefined) {
            file_msg.push(item);
        }
        msg.push(item);
    }

    /** Add args. */
    protected add_args(
        msg: any[],
        file_msg: undefined | any[],
        args: Args,
        mode: ModeType,
        level: number,
        active_log_level: number,
        local_level_arg_index: number | undefined,
    ) {
        const start_msg_len = msg.length;
        for (let i = 0; i < args.length; i++) {
            let item = args[i];
            let transformed = false;
            if (
                item instanceof SourceLoc
                || item instanceof ActiveLogLevel
                || item === Directive.log
                || item === Directive.debug
                || item === Directive.warn
                || item === Directive.error
                || item === Directive.raw
                || item === Directive.enforce
                || item === Directive.ignore
                || (local_level_arg_index != null && i === local_level_arg_index)
            ) {
                // skip before adding colored objects.
                continue;
            }
            else if (item === undefined) {
                // is required otherwise it will not be shown, but converted to "".
                this.push_arg(msg, file_msg, "undefined");
            }
            else if (item === null) {
                // is required otherwise it will not be shown, but converted to "".
                this.push_arg(msg, file_msg, "null");
            }
            else if (typeof item === "symbol") {
                // convert symbols to strings.
                this.push_arg(msg, file_msg, item.toString());
            }
            else if (item instanceof Error) {
                // convert errors.
                let add = (item.stack ?? item.message);
                if (mode === Directive.warn && add.startsWith("Error: ")) {
                    add = "Warning: " + add.slice(7);
                }
                if (mode === Directive.warn) {
                    this.push_arg(msg, file_msg, add.replace(/^Warning: /gm, `${Color.yellow("Warning")}: `));
                } else {
                    this.push_arg(msg, file_msg, add.replace(/^Error: /gm, `${Color.red("Error")}: `));
                }
            }
            else {

                // Transform item via custom `toString() str()` if provided.
                if (item && typeof item === "object") {
                    if (typeof item.toString === "function" && item.toString !== Object.prototype.toString) {
                        item = item.toString.call(item);
                    } else if (typeof item.str === "function") {
                        item = item.str.call(item);
                    }
                }

                // Dump objects in color in debug mode.
                if (mode === Directive.debug && typeof item === "object") {
                    if (this._transform) {
                        if ((item = this._transform(item)) === Directive.ignore) { continue; }
                        transformed = true;
                    }
                    if (typeof item === "object") {
                        // dump objects in color.
                        if (level <= active_log_level) {
                            this.push_arg(msg, file_msg, Color.object(item, { max_depth: 3 }));
                        } else {
                            this.push_arg(msg, file_msg, "[object Object]");
                        }
                        return ;
                    }
                    // fallthrough to default handling.
                }
                
                // Default handling.
                if (msg.length === start_msg_len && (mode === Directive.error || mode === Directive.warn)) {
                    this.push_arg(msg, file_msg, mode === Directive.error ? `${Color.red("Error")}: ` : `${Color.yellow("Warning")}: `);
                }
                if (this._transform) {
                    const transformed = this._transform(item);
                    if (transformed === Directive.ignore) { item = transformed; }
                }
                this.push_arg(msg, file_msg, item);
            }
        }
    }

    /**
     * Parse the directives and log levels.
     * @param args the args to extract the directives from.
     * @param directives optional directives to override with parse.
     */
    protected parse_directives(
        args: Args,
        directives?: Partial<DirectivesOpts>,
        out: Partial<DirectivesOpts> = {}
    ): DirectivesOpts {
        out.local_level ??= 0;
        out.active_log_level ??= this.log_level.n ?? 0;
        out.mode ??= Directive.log;
        out.is_raw ??= false;
        out.enforce ??= false;
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            if (item instanceof SourceLoc) {
                out.loc = item;
            } else if (item === Directive.error || item === Directive.warn || item === Directive.debug) {
                out.mode = item;
            } else if (item === Directive.raw) {
                out.is_raw = true;
            } else if (item === Directive.enforce) {
                out.enforce = true;
            } else if (item instanceof ActiveLogLevel) {
                out.active_log_level = item.n;
            } else if (this.log_level != null && out.local_level_arg_index == null && typeof item === "number") {
                out.local_level_arg_index = index;
                out.local_level = item;
            } else {
                break;
            }
        };
        if (directives != null) {
            for (const key of Object.keys(directives)) {
                out[key] = directives[key];
            }
        }
        return out as DirectivesOpts;
    }

    /**
     * Trim trailing spaces from the message array.
     */
    protected trim_trailing_spaces(msg: any[]) {
        while (
            // trim trailing spaces.
            msg.length > 0 &&
            (msg[msg.length - 1].length === 0 || msg[msg.length - 1].endsWith(' '))
        ) {
            if (msg[msg.length - 1].length <= 1) { msg.length--; }
            else { msg[msg.length - 1] = msg[msg.length - 1].trimEnd(); }
        }
    }

    /**
     * Pre-pipe process the message.
     */
    protected pre_pipe_process(msg: any[]) {
        // Remove empty messages.
        if (msg.length === 0) { return; }
        // Iterate the messages.
        for (let i = 0; i < msg.length; i++) {
            if (typeof msg[i] === "symbol") {
                // convert symbols to strings.
                msg[i] = msg[i].toString();
            } else {
                msg[i] = msg[i].toString();
            }
        }
    }

    /**
     * Add an info object to the pipe buffer.
     * Wrapper to add when needed and return, so we can use single line ops in `pipe()`.
     */
    protected add(info: undefined): undefined;
    protected add(info: Pipe.Info): Pipe.Info
    protected add(info: Pipe.Info | undefined): Pipe.Info | undefined {
        if (this.data != null && info != null) { this.data.push(info); }
        return info;
    }

    /**
     * Join data and return the result information object.
     * 
     * This only processes the data args when the local log level is active.
     * 
     * Directives
     *   The directive search stops when any non directive / first primitive number is detected.
     *   Any directive must be passed before the other real args.
     *   The local log level can be mixed between directives.
     *   This method supports the following directives:
     *     1) SourceLoc - The source location of the log message.
     *     2) IsWarning - Enable warning mode.
     *     3) IsError - Enable error mode.
     *     4) IsDebug - Enable debug mode.
     *     5) ActiveLogLevel - Set the active log level for this log message.
     *     6) IsRaw - Enable raw mode, which will not add any additional information to the log message.
     * 
     * Active log level.
     *   The active log level can be set by passing an instance of `ActiveLogLevel` as the first argument.
     * 
     * Local log level.
     *   The local log level can be set by passing a number as the first argument.
     *   However, the number may also be passed in between directives.
     *   Note that logging a real true number as the first argument is not supported.
     * 
     * @param args
     *      The data to pipe together.
     *      The first number is treated as the local log level. However, only when the `log_level` was defined upon Pipe construction.
     *      Any other directives are allowed before the first non-directive / local log level argument.
     */
    pipe(args: (Directive | Error | any)[], directives?: Partial<DirectivesOpts>): Pipe.Info {

        // Check directives.
        let {
            local_level, active_log_level,
            is_raw, mode, loc, local_level_arg_index,
            enforce,
        } = this.parse_directives(args, directives);

        // Create message buffers.
        const msg: any[] = [];

        // Skip by log level.
        if (!enforce && local_level > active_log_level) { return this.add({ ignored: true, mode }); }

        // On raw mode we only add args.
        if (!is_raw) {
            msg.push(Colors.gray);

            // Add date.
            if (mode !== Directive.debug) {
                const date = new Date().format("%d-%m-%y %H:%M:%S");
                msg.push(date, " ");
            }

            // Add log source.
            loc ??= new SourceLoc(1);
            if (!loc.is_unknown() && mode === Directive.debug) {
                // only log source location to console for debug messages.
                const id = (loc.caller === "<unknown>" || loc.caller === "<root>")
                    ? loc.id
                    : loc.filename + ":" + loc.caller;
                msg.push(`[${id}] `);
            }


            // trim trailing spaces.
            this.trim_trailing_spaces(msg);
            if (msg.length > 1) { msg.push(": "); }
            msg.push(Colors.end);
        }

        // Add args.
        this.add_args(
            msg,
            undefined,
            args,
            mode,
            local_level,
            active_log_level,
            local_level_arg_index,
        );

        // Response.
        return this.add({ data: msg, mode, ignored: false });
    }
    
    /**
     * Join data and return the result as a string.
     * This ignores the current log level.
     */
    join(...args: (Directive | Error | any)[]): string {
        return this.pipe(args, { enforce: true }).data?.join("") ?? "";
    }
 
    /**
     * Log data to the console and file streams when defined.
     * 
     * Directives
     *   The directive search stops when any non directive / first primitive number is detected.
     *   Any directive must be passed before the other real args.
     *   The local log level can be mixed between directives.
     *   This method supports the following directives:
     *     1) SourceLoc - The source location of the log message.
     *     2) IsWarning - Enable warning mode.
     *     3) IsError - Enable error mode.
     *     4) IsDebug - Enable debug mode.
     *     5) ActiveLogLevel - Set the active log level for this log message.
     *     6) IsRaw - Enable raw mode, which will not add any additional information to the log message.
     * 
     * Active log level.
     *   The active log level can be set by passing an instance of `ActiveLogLevel` as the first argument.
     * 
     * Local log level.
     *   The local log level can be set by passing a number as the first argument.
     *   However, the number may also be passed in between directives.
     *   @note That logging a real true number as the first argument is not supported.
     * 
     * @param args
     *      The data to log.
     *      The first number is treated as the local log level.
     *      Any other directives are allowed before the first non-directive / local log level argument.
     */
    log(...args: (Directive | Error | any)[]): void {
        this.ensure_out_err();
        const r = this.pipe(args);
        if (r.ignored || !r.data) { return; }
        if (r.mode === Directive.error || r.mode === Directive.warn) { this._err(r.data.join("")) }
        else { this._out(r.data.join("")) }
    }

    /**
     * Log a raw message to the console.
     */
    raw(level: number | any, ...args: Args): void {
        this.log(Directive.raw, new SourceLoc(1), level, ...args);
    }

    /**
     * {Errors}
     *  Log error data to the console and file streams when defined.
     * @param args The data to log.
     */
    error(...errs: Args): void {
        this.log(-1, Directive.error, new SourceLoc(1), ...errs);
    }

    /**
     * {Warn}
     * Log a warning to the console and file streams when defined.
     * @param args
     *        The data to log.
     *        The first number is treated as the local log level.
     *        Any other directives are allowed before the first non-directive / local log level argument.
     * @funcs 2
     */
    warn(level: number | any, ...errs: Args): void {
        this.log(Directive.warn, new SourceLoc(1), level, ...errs);
    }
    warning(level: number | any, ...errs: Args): void {
        this.log(Directive.warn, new SourceLoc(1), level, ...errs);
    }

    /**
     * Initialize a nested debug module with a specific active log level.
     */
    loggers(active_log_level: number) {
        const active_log = new ActiveLogLevel(active_log_level);
        return {
            log: (...args: Args) => {
                this.log(active_log, new SourceLoc(1), ...args)
            },
            raw: (...args: Args) => {
                this.raw(active_log, Directive.raw, new SourceLoc(1), ...args)
            },
            error: (...args: Args) => {
                this.log(active_log, -1, Directive.error, new SourceLoc(1), ...args)
            },
            warn: (...args: Args) => {
                this.warn(active_log, new SourceLoc(1), ...args)
            },
            warning: (...args: Args) => {
                this.warning(active_log, Directive.warn, new SourceLoc(1), ...args)
            },
            // debug: (...args: Args) => {
            //     this.log(active_log, Mode.debug, new SourceLoc(1), ...args)
            // }
        }
    }

    /** Create a marker log message. */
    marker(level: number | any, ...args: Args): void {
        if (typeof level === "number") {
            this.log(level, new SourceLoc(1), Color.blue(">>> "), ...args);
        } else {
            this.log(new SourceLoc(1), Color.blue(">>> "), level, ...args);
        }
    }


    // /**
    //  * {Debug}
    //  * Log debug data to the console while not saving it to the file streams.
    //  * @param args
    //  *        The data to log.
    //  *        The first number is treated as the local log level.
    //  *        Any other directives are allowed before the first non-directive / local log level argument.
    //  * @dead
    //  */
    // debug(level: number | any, ...args: Args): void {
    //     this.log(Mode.debug, new SourceLoc(1), level, ...args);
    // }
}

// Default pipe instance.
export const pipe = new Pipe({
    log_level: 0,
    out: console.log,
    err: console.error,
});

// Tests.
// pipe.log(0, "Im shown");
// pipe.log(1, "Im not shown");
// process.exit(1)

// pipe.log("from pipe.log: Log", " statement", " with", " some", " text");
// pipe.debug("from pipe.debug: Debug", " statement", " with", " some", " text");
// pipe.warn("from pipe.warn: Warning", " statement", " with", " some", " text");
// pipe.error("from pipe.error: Error", " statement", " with", " some", " text");
// const loggers = pipe.loggers();
// loggers.log("from loggers.log: Log", " statement", " with", " some", " tex");
// loggers.debug("from loggers.debug: Debug", " statement", " with", " some", " text");
// loggers.warn("from loggers.warn: Warning", " statement", " with", " some", " text");
// loggers.error("from loggers.error: Error", " statement", " with", " some", " text");


// console.log("\n------------------------------\nTesting from pipe.ts");
// // const pipe = new Logger({
// //     log_level: 0,
// // });
// pipe.log(0, "from pipe.log: Log", " statement", " with", " some", " text");
// pipe.debug(0, "from pipe.debug: Debug", " statement", " with", " some", " text");
// pipe.warn(0, "from pipe.warn: Warning", " statement", " with", " some", " text");
// pipe.error("from pipe.error: Error", " statement", " with", " some", " text");
// // const loggers = pipe.loggers();
// loggers.log(0, "from loggers.log: Log", " statement", " with", " some", " tex");
// loggers.debug(0, "from loggers.debug: Debug", " statement", " with", " some", " text");
// loggers.warn(0, "from loggers.warn: Warning", " statement", " with", " some", " text");
// loggers.error("from loggers.error: Error", " statement", " with", " some", " text");

// const debug = pipe.debugger(0);
// debug(0, "from pipe.debugger: Debug statement");

// console.log("\n------------------------------\nTesting from debug_me().")
// function debug_me() {
//     const pipe = new Pipe({
//         log_level: 0,
//     });
//     pipe.log(0, "from pipe.log: Log statement");
//     pipe.debug(0, "from pipe.debug: Debug statement");
//     pipe.warn(0, "from pipe.warn: Warning statement");
//     pipe.error("from pipe.error: Error statement");
//     const loggers = pipe.loggers();
//     loggers.log(0, "from loggers.log: Log statement");
//     loggers.debug(0, "from loggers.debug: Debug statement");
//     loggers.warn(0, "from loggers.warn: Warning statement");
//     loggers.error("from loggers.error: Error statement");

//     const debug = pipe.debugger(0);
//     debug(0, "from pipe.debugger: Debug statement");
// }
// debug_me();
// Utils.safe_exit();
