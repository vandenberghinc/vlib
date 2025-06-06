/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Log modes as unique symbol values without separate declarations.
 * Runtime values are unique Symbols; type is a union of those literal symbols.
 *
 * @note That we cant use an `enum` here since this would clash with the directive detection in combination with the local log level.
 *       Since number would clash with the local log level, and string etc would clash with the actual log args.
 *
 * @attr log The default log mode.
 * @attr debug The debug mode, when passed the pipe() function will enable debug mode.
 * @attr warn The warn mode, when passed the pipe() function will enable warn mode.
 * @attr error The error mode, when passed the pipe() function will enable error mode.
 * @attr raw The raw mode, when passed the pipe() function will not show a source location or other prepended data.
 *           This mode is always enabled in error and warn modes, however the `Error|Warning` prefix will always be shown.
 * @attr enforce When this directive is added, the logs will always be shown / piped, regardless of log levels.
 * @attr ignore Serves as an identifier to ignore something. However not directly used in the pipe() function, for now only used as a return type of the `Pipe.transform` callback.
 */
export const Directive = {
    log: Symbol('vlib/debugging/pipe/Log'),
    debug: Symbol('vlib/debugging/pipe/Debug'),
    warn: Symbol('vlib/debugging/pipe/Warn'),
    error: Symbol('vlib/debugging/pipe/Error'),
    raw: Symbol('vlib/debugging/pipe/Raw'),
    enforce: Symbol('vlib/debugging/pipe/Enforce'),
    ignore: Symbol('vlib/debugging/pipe/Ignore'),
};
export { Directive as directive }; // snake_case compatibility
/**
 * A wrapper class to manage the active log level, user-facing, not internally.
 * @note This is explicitly used to set the active log level, not the local level of a log message.
 */
export class ActiveLogLevel {
    n;
    constructor(n) {
        this.n = n;
    }
    set(value) { this.n = value; }
    update(value) { this.n = value; }
    get() { return this.n; } // better to use `.n` directly.
    on(log_level) { return this.n >= log_level; }
    toString() { return String(this.n); }
}
;
//# sourceMappingURL=directives.js.map