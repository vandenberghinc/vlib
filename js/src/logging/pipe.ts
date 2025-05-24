/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { VDate } from "../global/date.js";
import { Path } from "../system/path.js";
import { Color, Colors } from "../system/colors.js";
import { SourceLoc } from './source_loc.js';
import Utils from '../utils.js';

// ---------------------------------------------------------
// Logger.

/** Log directives */
const IsError: unique symbol = Symbol('vlib.Logger.IsError');
type IsError = typeof IsError;
const IsWarning: unique symbol = Symbol('vlib.Logger.IsWarning');
type IsWarning = typeof IsWarning;
const IsDebug: unique symbol = Symbol('vlib.Logger.IsDebug');
type IsDebug = typeof IsDebug;
class UseActiveLogLevel extends Number { constructor(value: number) { super(value); } }
const IsRaw: unique symbol = Symbol('vlib.Logger.Raw');
type Raw = typeof IsRaw;

/** Debugger function. */
export type DebuggerFunc = ((log_level: number | any, ...args: (Raw | any)[]) => void) & {
    Raw: Raw,
    raw: Raw,
    level: number,
    on: (log_level: number) => boolean,
}

/** 
 * Log pile utility class.
 */
export class Pipe {

    public log_level: number;

    constructor(
        {
            log_level = 0,
        }: {
            log_level?: number;
        } = {}
    ) {
        // Attributes.
        this.log_level = log_level;
    }

    /** @docs:
     *  @title: Log
     *  @descr: Log data to the console and file streams when defined.
     *  @param:
     *      @name: level
     *      @descr: The log level of the message.
     *      @type: number
     *  @param:
     *      @name: args
     *      @descr:
     *          The data to log.
     *      @type: any[]
     */
    public log(
        level: number | any,
        ...args: (SourceLoc | IsWarning | IsError | IsDebug | UseActiveLogLevel | Error | any)[]
    ): void {

        // Forward level when not a number.
        if (typeof level !== "number") {
            args.unshift(level);
            level = 0;
        }

        // Check directives.
        let active_log_level: number = this.log_level;
        let loc: SourceLoc | undefined;
        let mode;
        let is_raw = false; // works only in debug mode.
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            if (item instanceof SourceLoc) {
                loc = item;
            } else if (item === IsError || item === IsWarning || item === IsDebug) {
                mode = item;
            } else if (item === IsRaw || item === Infinity) {
                // Infinity is used as IsRaw symbol on the debug function as attribute.
                is_raw = true;
            } else if (item instanceof UseActiveLogLevel) {
                active_log_level = item.valueOf();
            } else {
                break;
            }
        };
        // Dont show location by default.
        // if (loc === undefined) {
        //     loc = new SourceLoc(1);
        // }
        
        // Create message buffers.
        const msg: any[] = [Colors.gray];

        // Skip by log level.
        if (level > active_log_level) { return; }

        // Dump buffs wrapper.
        const dump_buffs = () => {
            // if (msg.some(x => typeof x === "symbol")) {
            //     throw new Error("System error, encountered a symbol.")
            // }

            // Log.
            if (msg.length > 0 && level <= active_log_level) {
                console.log(msg.join(''));
            }

            // Empty buffers.
            msg.length = 0;
        }

        // Add date.
        if (mode !== IsDebug) {
            const date = new VDate().format("%d-%m-%y %H:%M:%S");
            msg.push(date, " ");
        }

        // Add log source.
        loc ??= new SourceLoc(1);
        if (!loc.is_unknown() && mode === IsDebug) {
            // only log source location to console for debug messages.
            const id = (loc.caller === "<unknown>" || loc.caller === "<root>")
                ? loc.id
                : loc.filename + ":" + loc.caller;
            msg.push(`[${id}] `);
        }


        // trim trailing spaces.
        while (
            msg.length > 0 &&
            (msg[msg.length - 1].length === 0 || msg[msg.length - 1].endsWith(' '))
        ) {
            if (msg[msg.length - 1].length <= 1) { msg.length--; }
            else { msg[msg.length - 1] = msg[msg.length - 1].trimEnd(); }
        }
        if (msg.length > 1) {
            msg.push(": ");
        }
        msg.push(Colors.end);


        // Add args.
        this.add_args(
            msg,
            args,
            mode,
            level,
            active_log_level,
        );

        // Dump buffs.
        dump_buffs()
    }

    /** Add args. */
    add_args(
        msg: any[],
        args: any[],
        mode: IsError | IsWarning | IsDebug,
        level: number,
        active_log_level: number,
    ) {
        const start_msg_len = msg.length;
        for (let i = 0; i < args.length; i++) {
            const item = args[i];
            if (
                item instanceof SourceLoc
                || item instanceof UseActiveLogLevel
                || item === IsError
                || item === IsWarning
                || item === IsDebug
                || item === IsRaw
                || item === Infinity
            ) {
                // skip before adding colored objects.
                continue;
            }
            else if (item === undefined) {
                // is required otherwise it will not be shown, but converted to "".
                msg.push("undefined");
            }
            else if (item === null) {
                // is required otherwise it will not be shown, but converted to "".
                msg.push("null");
            }
            else if (typeof item === "symbol") {
                // convert symbols to strings.
                msg.push(item.toString());
            }
            else if (item instanceof Error) {
                // convert errors.
                let add = (item.stack ?? item.message);
                if (mode === IsWarning && add.startsWith("Error: ")) {
                    add = "Warning: " + add.slice(7);
                }
                if (mode === IsWarning) {
                    msg.push(add.replace(/^Warning: /gm, `${Color.yellow("Warning")}: `));
                } else {
                    msg.push(add.replace(/^Error: /gm, `${Color.red("Error")}: `));
                }
            }
            else if (mode === IsDebug && item && typeof item === "object") {
                // dump objects in color.
                if (level <= active_log_level) {
                    msg.push(Colors.object(item, { max_depth: 3 }));
                } else {
                    msg.push("[object Object]");
                }
            }
            else {
                if (msg.length === start_msg_len && (mode === IsError || mode === IsWarning)) {
                    msg.push(mode === IsError ? `${Color.red("Error")}: ` : `${Color.yellow("Warning")}: `);
                }
                msg.push(item);
            }
        }
    }

    /** @docs:
     *  @title: Error
     *  @descr:
     *      Log error data to the console and file streams when defined.
     *  @param:
     *      @name: mode
     *      @descr: The error prefix.
     *      @type: LogSource
     *      @warning:
     *          The log source. However, when this is a string type, it will be processed as error message.
     *  @param:
     *      @name: errs
     *      @descr: The error or string objects.
     *      @type: (string | Error)[]
     */
    public error(...errs: any[]): void {
        this.log(-1, IsError, new SourceLoc(1), ...errs);
    }

    /** @docs:
     *  @title: Warn
     *  @descr: Log a warning to the console and file streams when defined.
     *  @param:
     *      @name: level
     *      @descr: The log level of the message.
     *      @type: number
     *  @param:
     *      @name: mode
     *      @descr: The warning prefix.
     *      @type: LogSource
     *      @warning:
     *          The log source. However, when this is a string type, it will be processed as error message.
     *  @param:
     *      @name: args
     *      @descr:
     *          The data to log.
     *          The log source can be defined by passing the first `...args` as a `LogSource` instance.
     *      @type: any[]
     *  @funcs: 2
     */
    public warn(level: number | any, ...errs: any[]): void {
        if (typeof level === "number") {
            this.log(level, IsWarning, new SourceLoc(1), ...errs);
        } else {
            this.log(IsWarning, new SourceLoc(1), level, ...errs);
        }
    }
    public warning(level: number | any, ...errs: any[]): void {
        if (typeof level === "number") {
            this.log(level, IsWarning, new SourceLoc(1), ...errs);
        } else {
            this.log(IsWarning, new SourceLoc(1), level, ...errs);
        }
    }

    /** @docs:
     *  @title: Debug
     *  @descr: Log debug data to the console while not saving it to the file streams.
     *  @note This does not log to the file streams.
     *  @param:
     *      @name: level
     *      @descr: The log level of the message.
     *      @type: number
     *  @param:
     *      @name: args
     *      @descr:
     *          The data to log.
     *          The log source can be defined by passing the first `...args` as a `LogSource` instance.
     *      @type: any[]
     */
    public debug(level: number | any, ...args: any[]): void {
        if (typeof level === "number") {
            this.log(level, IsDebug, new SourceLoc(1), ...args);
        } else {
            this.log(IsDebug, new SourceLoc(1), level, ...args);
        }
    }

    /** Initialize a nested debug module/function */
    public loggers() {
        const debug = (log_level: number, ...args: any[]) => {
            this.log(log_level, IsDebug, new SourceLoc(1), ...args)
        }
        debug.Raw = Infinity;
        debug.raw = Infinity;
        return {
            log: (log_level: number | any, ...args: any[]) => {
                if (typeof log_level === "number") {
                    this.log(log_level, new SourceLoc(1), ...args)
                } else {
                    this.log(new SourceLoc(1), log_level, ...args)
                }
            },
            error: (...args: any[]) => {
                this.log(-1, IsError, new SourceLoc(1), ...args)
            },
            warn: (log_level: number | any, ...args: any[]) => {
                if (typeof log_level === "number") {
                    this.warn(log_level, IsWarning, new SourceLoc(1), ...args)
                } else {
                    this.warn(IsWarning, new SourceLoc(1), log_level, ...args)
                }
            },
            warning: (log_level: number | any, ...args: any[]) => {
                if (typeof log_level === "number") {
                    this.warning(log_level, IsWarning, new SourceLoc(1), ...args)
                } else {
                    this.warning(IsWarning, new SourceLoc(1), log_level, ...args)
                }
            },
            debug: debug as any,
        }
    }

    /** Initialize a debugger / debug func with a predefined active log level */
    public debugger(active_log_level: number): DebuggerFunc {
        const fn = (log_level: number | any, ...args: (Raw | any)[]) => {
            if (typeof log_level === "number") {
                this.log(log_level, IsDebug, new SourceLoc(1), new UseActiveLogLevel(active_log_level), ...args)
            } else {
                this.log(IsDebug, new SourceLoc(1), new UseActiveLogLevel(active_log_level), log_level, ...args)
            }
        }
        fn.Raw = IsRaw;
        fn.raw = IsRaw;
        fn.level = active_log_level;
        fn.on = (log_level: number) => {
            return active_log_level >= log_level;
        }
        return fn as any
    }

    /** Create a marker log message. */
    public marker(level: number | any, ...args: any[]): void {
        if (typeof level === "number") {
            this.log(level, new SourceLoc(1), Color.blue(">>> "), ...args);
        } else {
            this.log(new SourceLoc(1), Color.blue(">>> "), level, ...args);
        }
    }
}

export default Pipe;

// Default pipe instance.
export const pipe = new Pipe({ log_level: 0 });


// // Tests.

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



// // Benchmark.
// const debug = pipe.debugger(0);
// let now = Date.now();
// const count = 100000;
// const times: any = {};
// const some_large_object = { x: 0, y: 1, z: 2, 
//     a: 3, b: 4, c: 5, d: 6, e: 7, f: 8, g: 9, h: 10,
//     i: 11, j: 12, k: 13, l: 14, m: 15, n: 16, o: 17,
//     p: 18, q: 19, r: 20, s: 21, t: 22, u: 23, v: 24,
//     w: 25, y2: 27, z2: {
//         x: 0, y: 1, z: 2, 
//         a: 3, b: 4, c: 5, d: 6, e: 7, f: 8, g: 9, h: 10,
//         i: 11, j: 12, k: 13, l: 14, m: 15, n: 16, o: 17,
//         p: 18, q: 19, r: 20, s: 21, t: 22, u: 23, v: 24,
//         w: 25
//     }
//  };
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     debug(1, Color.object(some_large_object));
// }
// times["eager"] = Date.now() - now;
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     debug(1, () => Color.object(some_large_object));
// }
// times["lazy"] = Date.now() - now;
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     if (debug.on(1)) debug(Color.object(some_large_object));
// }
// times["if+on+debug"] = Date.now() - now;
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     if (debug.level >= 1) {
//         debug(Color.object(some_large_object));
//     }
// }
// times["if+debug"] = Date.now() - now;
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     if (debug.level >= 1) {
//         console.log(Color.object(some_large_object));
//     }
// }
// times["if+console.log"] = Date.now() - now;
// console.log("Eager string build took", times["eager"], "ms");
// console.log("Lazy string build took", times["lazy"], "ms");
// console.log("If+on+debug string build took", times["if+on+debug"], "ms"); 
// console.log("If+debug string build took", times["if+debug"], "ms");
// console.log("If+console string build took", times["if+console.log"], "ms");
// process.exit(1)