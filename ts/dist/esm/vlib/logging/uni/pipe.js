/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Date } from "../../primitives/date.js";
import { Color, Colors } from "../../generic/colors.js";
import { SourceLoc } from './source_loc.js';
import { ActiveLogLevel, Directive } from './directives.js';
import { Spinners } from "./spinners.js";
import { ObjectUtils } from "../../primitives/object.js";
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
export class Pipe {
    /**
     * The active log level.
     * When defined, specific log level features are enabled in the pipe function(s).
     */
    log_level;
    /**
     * The accumulated piped data.
     */
    data;
    /**
     * The pipe function.
     */
    _out;
    /**
     * The error pipe function.
     */
    _err;
    /**
     * The transform function to apply to pipe input arguments.
     * It should return any type that can be joined by `.join()` as a child of the `msg` array.
     * If the transform function returns `Ignore`, the argument will be ignored.
     */
    _transform;
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
    constructor({ log_level, out, err = out, transform, accumulate }) {
        this.log_level = (log_level == null
            ? undefined
            : log_level instanceof ActiveLogLevel
                ? log_level // use reference, not a copy.
                : new ActiveLogLevel(log_level));
        this._out = out;
        this._err = err;
        this._transform = transform;
        this.data = (accumulate ? [] : undefined);
    }
    /**
     * Ensure the out and err functions are defined.
     * @throws Error when the out or err function is not defined.
     */
    ensure_out_err() {
        if (!this._out) {
            throw new Error("Pipe out function is not defined.");
        }
        if (!this._err) {
            throw new Error("Pipe err function is not defined.");
        }
    }
    /** Wrapper to push an arg to two arrays. */
    push_arg(msg, file_msg, item) {
        if (file_msg !== undefined) {
            file_msg.push(item);
        }
        msg.push(item);
    }
    /** Add args. */
    add_args(msg, file_msg, args, log_mode, level, active_log_level, local_level_arg_index) {
        const start_msg_len = msg.length;
        for (let i = 0; i < args.length; i++) {
            let item = args[i];
            let transformed = false;
            if (Directive.is(item)
                || (local_level_arg_index != null && i === local_level_arg_index)) {
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
                if (log_mode === Directive.warn && add.startsWith("Error: ")) {
                    add = "Warning: " + add.slice(7);
                }
                if (log_mode === Directive.warn) {
                    this.push_arg(msg, file_msg, add.replace(/^Warning: /gm, `${Color.yellow("Warning")}: `));
                }
                else {
                    this.push_arg(msg, file_msg, add.replace(/^Error: /gm, `${Color.red("Error")}: `));
                }
            }
            else {
                // Transform item via custom `toString() str()` if provided.
                if (item && typeof item === "object") {
                    if (typeof item.toString === "function" && item.toString !== Object.prototype.toString) {
                        item = item.toString.call(item);
                    }
                    else if (typeof item.str === "function") {
                        item = item.str.call(item);
                    }
                }
                // Dump objects in color in debug mode.
                if (typeof item === "object" && ObjectUtils.is_plain(item)
                // && (log_mode === Directive.debug || log_mode === Directive.error || log_mode === Directive.warn)
                ) {
                    if (this._transform) {
                        if ((item = this._transform(item)) === Directive.ignore) {
                            continue;
                        }
                        transformed = true;
                    }
                    if (item && typeof item === "object") {
                        // dump objects in color.
                        if (level <= active_log_level) {
                            this.push_arg(msg, file_msg, Color.object(item, { max_depth: 3, max_length: 25000 }));
                        }
                        else {
                            this.push_arg(msg, file_msg, "[object Object]");
                        }
                        return;
                    }
                    // fallthrough to default handling.
                }
                // Default handling.
                if (msg.length === start_msg_len && (log_mode === Directive.error || log_mode === Directive.warn)) {
                    this.push_arg(msg, file_msg, log_mode === Directive.error ? `${Color.red("Error")}: ` : `${Color.yellow("Warning")}: `);
                }
                if (this._transform) {
                    const transformed = this._transform(item);
                    if (transformed === Directive.ignore) {
                        item = transformed;
                    }
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
    parse_directives(args, directives, out = {}) {
        out.local_level ??= 0;
        out.active_log_level ??= this.log_level.n ?? 0;
        out.log_mode ??= Directive.log;
        out.is_raw ??= false;
        out.enforce ??= false;
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            if (item instanceof SourceLoc) {
                out.loc = item;
            }
            else if (item === Directive.error || item === Directive.warn || item === Directive.debug) {
                /** @warning ensure that the last detected mode is used, otherwise it will cause issues with at least `Logger` since it uses a fake `log` directive for non debug mode. */
                out.log_mode = item;
            }
            else if (item === Directive.raw) {
                out.is_raw = true;
            }
            else if (item === Directive.enforce) {
                out.enforce = true;
            }
            else if (item instanceof ActiveLogLevel) {
                /** @warning ensure that the last detected log level is used, otherwise methods that pass a log level override will incorrectly matched */
                out.active_log_level = item.n;
            }
            else if (this.log_level != null && out.local_level_arg_index == null && typeof item === "number") {
                out.local_level_arg_index = index;
                out.local_level = item;
            }
            else if (item !== Directive.not_a_directive) {
                break;
            }
        }
        ;
        if (directives != null) {
            for (const key of Object.keys(directives)) {
                out[key] = directives[key];
            }
        }
        return out;
    }
    /**
     * Trim trailing spaces from the message array.
     */
    trim_trailing_spaces(msg) {
        while (
        // trim trailing spaces.
        msg.length > 0 &&
            (msg[msg.length - 1].length === 0 || msg[msg.length - 1].endsWith(' '))) {
            if (msg[msg.length - 1].length <= 1) {
                msg.length--;
            }
            else {
                msg[msg.length - 1] = msg[msg.length - 1].trimEnd();
            }
        }
    }
    /**
     * Pre-pipe process the message.
     */
    pre_pipe_process(msg) {
        // Remove empty messages.
        if (msg.length === 0) {
            return;
        }
        // Iterate the messages.
        for (let i = 0; i < msg.length; i++) {
            if (typeof msg[i] === "symbol") {
                // convert symbols to strings.
                msg[i] = msg[i].toString();
            }
            else {
                msg[i] = msg[i].toString();
            }
        }
    }
    add(info) {
        if (this.data != null && info != null) {
            this.data.push(info);
        }
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
    pipe(args, directives) {
        // Check directives.
        let { local_level, active_log_level, is_raw, log_mode: mode, loc, local_level_arg_index, enforce, } = this.parse_directives(args, directives);
        // Create message buffers.
        const msg = [];
        // Skip by log level.
        if (!enforce && local_level > active_log_level) {
            return this.add({ ignored: true, log_mode: mode });
        }
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
                    : `${loc.filename}:${loc.line}:${loc.column}:${loc.caller}`;
                msg.push(`[${id}] `);
            }
            // trim trailing spaces.
            this.trim_trailing_spaces(msg);
            if (msg.length > 1) {
                msg.push(": ");
            }
            msg.push(Colors.end);
        }
        // Add args.
        this.add_args(msg, undefined, args, mode, local_level, active_log_level, local_level_arg_index);
        // Response.
        return this.add({ data: msg, log_mode: mode, ignored: false });
    }
    /**
     * Join data and return the result as a string.
     * This ignores the current log level.
     */
    join(...args) {
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
    log(...args) {
        this.ensure_out_err();
        const r = this.pipe(args);
        if (r.ignored || !r.data) {
            return;
        }
        if (this._out === console.log
            && Spinners.has_active()) {
            Spinners.clear_current_line();
        }
        if (r.log_mode === Directive.error || r.log_mode === Directive.warn) {
            this._err(r.data.join(""));
        }
        else {
            this._out(r.data.join(""));
        }
    }
    /**
     * Log a raw message to the console.
     */
    raw(level, ...args) {
        this.log(Directive.raw, new SourceLoc(1), level, ...args);
    }
    /**
     * {Errors}
     *  Log error data to the console and file streams when defined.
     * @param args The data to log.
     */
    error(...errs) {
        this.log(Directive.error, new SourceLoc(1), -1, ...errs);
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
    warn(level, ...errs) {
        this.log(Directive.warn, new SourceLoc(1), level, ...errs);
    }
    warning(level, ...errs) {
        this.log(Directive.warn, new SourceLoc(1), level, ...errs);
    }
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
// ----------------------------------------------------------------------
// // Test if we can mix spinners and logging automatically.
// import { Spinner } from "./spinner.js";
// const interval = 1000;
// const spinner_1 = new Spinner("Spinner 1");
// await new Promise(resolve => setTimeout(resolve, interval));
// pipe.log(0, "Logging data 1 during spinner 1");
// await new Promise(resolve => setTimeout(resolve, interval));
// pipe.log(0, "Logging data 2 during spinner 1");
// const spinner_2 = new Spinner("Spinner 2");
// await new Promise(resolve => setTimeout(resolve, interval));
// pipe.log(0, "Logging data 3 during spinner 2");
// await new Promise(resolve => setTimeout(resolve, interval));
// pipe.log(0, "Logging data 3 during spinner 2");
// await new Promise(resolve => setTimeout(resolve, interval));
// pipe.log(0, "Stopping spinner 2...");
// spinner_2.stop();
// await new Promise(resolve => setTimeout(resolve, interval));
// pipe.log(0, "Stopping spinner 1...");
// spinner_1.stop();
//# sourceMappingURL=pipe.js.map