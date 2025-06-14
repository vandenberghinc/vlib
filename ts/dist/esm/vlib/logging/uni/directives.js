/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { SourceLoc } from './source_loc.js';
/**
 * A `as const` readonly symbol map so ts correctly infers the directives.
 * Keep this private so `Directive` and `Directive.X` can be used.
 * @private
 */
const SymbolMap = {
    log: Symbol('vlib/debugging/pipe/Log'),
    debug: Symbol('vlib/debugging/pipe/Debug'),
    warn: Symbol('vlib/debugging/pipe/Warn'),
    error: Symbol('vlib/debugging/pipe/Error'),
    raw: Symbol('vlib/debugging/pipe/Raw'),
    enforce: Symbol('vlib/debugging/pipe/Enforce'),
    ignore: Symbol('vlib/debugging/pipe/Ignore'),
    not_a_directive: Symbol('vlib/debugging/pipe/NotADirective'),
};
/** The directive namespace. */
export var Directive;
(function (Directive) {
    // -----------------------------------------------------------------------------
    // Symbols.
    /**
     * The default log mode.
     */
    Directive.log = SymbolMap.log;
    /**
     * The debug mode, when passed the pipe() function will enable debug mode.
     */
    Directive.debug = SymbolMap.debug;
    /**
     * The warn mode, when passed the pipe() function will enable warn mode.
     */
    Directive.warn = SymbolMap.warn;
    /**
     * The error mode, when passed the pipe() function will enable error mode.
     */
    Directive.error = SymbolMap.error;
    /**
     * The raw mode, when passed the pipe() function will not show a source location or other prepended data.
     * This mode is always enabled in error and warn modes, however the `Error|Warning` prefix will always be shown.
     */
    Directive.raw = SymbolMap.raw;
    /**
     * When this directive is added, the logs will always be shown / piped, regardless of log levels.
     */
    Directive.enforce = SymbolMap.enforce;
    /**
     * Serves as an identifier to ignore something. However not directly used in the pipe() function, for now only used as a return type of the `Pipe.transform` callback.
     */
    Directive.ignore = SymbolMap.ignore;
    /**
     * A dummy directive which is simply ignored.
     * Useful for creating directive flag variables that have either `X` or `not_a_directive` as value.
     */
    Directive.not_a_directive = SymbolMap.not_a_directive;
    // -----------------------------------------------------------------------------
    /** A set with all directives to check if a given symbol is a directive. */
    Directive.set = new Set(Object.values(Directive));
    /** Check if a given value is a directive. */
    Directive.is = (value) => (value instanceof ActiveLogLevel
        || value instanceof SourceLoc
        || (typeof value === 'symbol' && Directive.set.has(value)));
})(Directive || (Directive = {}));
export { Directive as directive }; // snake_case compatibility
export var LogMode;
(function (LogMode) {
    LogMode.is = (value) => typeof value === 'symbol' && (value === Directive.warn || value === Directive.error || value === Directive.debug);
})(LogMode || (LogMode = {}));
;
/**
 * A wrapper class to manage the active log level, user-facing, not internally.
 * @note This is explicitly used to set the active log level, not the local level of a log message.
 */
export class ActiveLogLevel {
    n;
    constructor(n) {
        this.n = n;
    }
    set(value) {
        this.n = typeof value === "number" ? value : value.n;
    }
    update(value) {
        this.n = typeof value === "number" ? value : value.n;
    }
    get() { return this.n; } // better to use `.n` directly.
    on(log_level) { return this.n >= log_level; }
    toString() { return String(this.n); }
    /**
     * Some operations to compare the current log level with a given level.
     */
    eq(level) {
        return this.n === level;
    }
    gt(level) {
        return this.n > level;
    }
    gte(level) {
        return this.n >= level;
    }
    lt(level) {
        return this.n < level;
    }
    lte(level) {
        return this.n <= level;
    }
}
//# sourceMappingURL=directives.js.map