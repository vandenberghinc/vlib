/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { SourceLoc } from './source_loc.js';
/** Log directives */
declare const IsError: unique symbol;
type IsError = typeof IsError;
declare const IsWarning: unique symbol;
type IsWarning = typeof IsWarning;
declare const IsDebug: unique symbol;
type IsDebug = typeof IsDebug;
declare class UseActiveLogLevel extends Number {
    constructor(value: number);
}
declare const IsRaw: unique symbol;
type Raw = typeof IsRaw;
/** Debugger function. */
export type DebuggerFunc = ((log_level: number | any, ...args: (Raw | any)[]) => void) & {
    Raw: Raw;
    raw: Raw;
    level: number;
    on: (log_level: number) => boolean;
};
/**
 * Log pile utility class.
 */
export declare class Pipe {
    log_level: number;
    constructor({ log_level, }?: {
        log_level?: number;
    });
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
    log(level: number | any, ...args: (SourceLoc | IsWarning | IsError | IsDebug | UseActiveLogLevel | Error | any)[]): void;
    /** Add args. */
    add_args(msg: any[], args: any[], mode: IsError | IsWarning | IsDebug, level: number, active_log_level: number): void;
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
    error(...errs: any[]): void;
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
    warn(level: number | any, ...errs: any[]): void;
    warning(level: number | any, ...errs: any[]): void;
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
    debug(level: number | any, ...args: any[]): void;
    /** Initialize a nested debug module/function */
    loggers(): {
        log: (log_level: number | any, ...args: any[]) => void;
        error: (...args: any[]) => void;
        warn: (log_level: number | any, ...args: any[]) => void;
        warning: (log_level: number | any, ...args: any[]) => void;
        debug: any;
    };
    /** Initialize a debugger / debug func with a predefined active log level */
    debugger(active_log_level: number): DebuggerFunc;
    /** Create a marker log message. */
    marker(level: number | any, ...args: any[]): void;
}
export default Pipe;
export declare const pipe: Pipe;
