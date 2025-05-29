/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ActiveLogLevel, Directive, ModeType, DirectivesOpts } from './directives.js';
/**
 * Wrapper type for supported pipe arguments.
 * Purely for denoting types that are handled differently such as directives and `Error` instances.
 */
export type Args = (Directive | Error | any)[];
export declare namespace Pipe {
    /**
     * Pipe info class.
     * @attr data - Castable to string by `.join()`.
     */
    type Info = {
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
export declare class Pipe<Accumulated extends boolean = boolean, Logged extends boolean = boolean> {
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
    protected _out?: (msg: string) => void;
    /**
     * The error pipe function.
     */
    protected _err?: (msg: string) => void;
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
    constructor({ log_level, out, err, transform, accumulate }: {
        out?: (msg: string) => void;
        err?: (msg: string) => void;
        transform?: (input: any) => typeof Directive.ignore | any;
    } & (Logged extends true ? {
        log_level: ActiveLogLevel | number;
    } : {
        log_level?: never;
    }) & (Accumulated extends true ? {
        accumulate: true;
    } : {
        accumulate?: never;
    }));
    /**
     * Ensure the out and err functions are defined.
     * @throws Error when the out or err function is not defined.
     */
    protected ensure_out_err(): asserts this is Pipe & {
        _out: NonNullable<Pipe["_out"]>;
        _err: NonNullable<Pipe["_err"]>;
    };
    /** Wrapper to push an arg to two arrays. */
    protected push_arg(msg: any[], file_msg: undefined | any[], item: any): void;
    /** Add args. */
    protected add_args(msg: any[], file_msg: undefined | any[], args: Args, mode: ModeType, level: number, active_log_level: number, local_level_arg_index: number | undefined): void;
    /**
     * Parse the directives and log levels.
     * @param args the args to extract the directives from.
     * @param directives optional directives to override with parse.
     */
    protected parse_directives(args: Args, directives?: Partial<DirectivesOpts>, out?: Partial<DirectivesOpts>): DirectivesOpts;
    /**
     * Trim trailing spaces from the message array.
     */
    protected trim_trailing_spaces(msg: any[]): void;
    /**
     * Pre-pipe process the message.
     */
    protected pre_pipe_process(msg: any[]): void;
    /**
     * Add an info object to the pipe buffer.
     * Wrapper to add when needed and return, so we can use single line ops in `pipe()`.
     */
    protected add(info: undefined): undefined;
    protected add(info: Pipe.Info): Pipe.Info;
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
    pipe(args: (Directive | Error | any)[], directives?: Partial<DirectivesOpts>): Pipe.Info;
    /**
     * Join data and return the result as a string.
     * This ignores the current log level.
     */
    join(...args: (Directive | Error | any)[]): string;
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
    log(...args: (Directive | Error | any)[]): void;
    /**
     * Log a raw message to the console.
     */
    raw(level: number | any, ...args: Args): void;
    /**
     * {Errors}
     *  Log error data to the console and file streams when defined.
     * @param args The data to log.
     */
    error(...errs: Args): void;
    /**
     * {Warn}
     * Log a warning to the console and file streams when defined.
     * @param args
     *        The data to log.
     *        The first number is treated as the local log level.
     *        Any other directives are allowed before the first non-directive / local log level argument.
     * @funcs 2
     */
    warn(level: number | any, ...errs: Args): void;
    warning(level: number | any, ...errs: Args): void;
    /**
     * Initialize a nested debug module with a specific active log level.
     */
    loggers(active_log_level: number): {
        log: (...args: Args) => void;
        raw: (...args: Args) => void;
        error: (...args: Args) => void;
        warn: (...args: Args) => void;
        warning: (...args: Args) => void;
    };
    /** Create a marker log message. */
    marker(level: number | any, ...args: Args): void;
}
export declare const pipe: Pipe<boolean, boolean>;
