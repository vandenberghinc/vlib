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
} as const;

/**
 * Union type for all directives.
 * @warning Ensure this does not contain any `Array.isArray => true` types.
 *          This is to distinguish between a single directive and an array of directives.
 *          Such as `directives: Directives | Directives[]`.
 * 
 *          Otherwise `Pipe.parse_directives` needs to be updated
 *          In the section where its overriding the vars from `directives: Directives | Directives[]`.
 */
export type Directive = Directive.warn | Directive.error | Directive.debug | Directive.raw | Directive.enforce | ActiveLogLevel | SourceLoc;

/** The directive namespace. */
export namespace Directive {

    // -----------------------------------------------------------------------------
    // Symbols.

    /**
     * The default log mode.
     */
    export const log = SymbolMap.log;
    export type log = typeof SymbolMap.log;
    /**
     * The debug mode, when passed the pipe() function will enable debug mode.
     */
    export const debug = SymbolMap.debug;
    export type debug = typeof SymbolMap.debug;
    /**
     * The warn mode, when passed the pipe() function will enable warn mode.
     */
    export const warn = SymbolMap.warn;
    export type warn = typeof SymbolMap.warn;
    /**
     * The error mode, when passed the pipe() function will enable error mode.
     */
    export const error = SymbolMap.error;
    export type error = typeof SymbolMap.error;
    /**
     * The raw mode, when passed the pipe() function will not show a source location or other prepended data.
     * This mode is always enabled in error and warn modes, however the `Error|Warning` prefix will always be shown.
     */
    export const raw = SymbolMap.raw;
    export type raw = typeof SymbolMap.raw;
    /**
     * When this directive is added, the logs will always be shown / piped, regardless of log levels.
     */
    export const enforce = SymbolMap.enforce;
    export type enforce = typeof SymbolMap.enforce;
    /**
     * Serves as an identifier to ignore something. However not directly used in the pipe() function, for now only used as a return type of the `Pipe.transform` callback.
     */
    export const ignore = SymbolMap.ignore;
    export type ignore = typeof SymbolMap.ignore;
    /**
     * A dummy directive which is simply ignored.
     * Useful for creating directive flag variables that have either `X` or `not_a_directive` as value.
     */
    export const not_a_directive = SymbolMap.not_a_directive;
    export type not_a_directive = typeof SymbolMap.not_a_directive;

    // -----------------------------------------------------------------------------

    /** A set with all directives to check if a given symbol is a directive. */
    export const set = new Set<Symbol>(Object.values(Directive));

    /** Check if a given value is a directive. */
    export const is = (value: any): value is Directive => (
        value instanceof ActiveLogLevel
        || value instanceof SourceLoc
        || (typeof value === 'symbol' && Directive.set.has(value))
    )
}
export { Directive as directive }; // snake_case compatibility

/**
 * Union of all log modes.
 */
export type LogMode = Directive.warn | Directive.error | Directive.debug;
export namespace LogMode {
    export const is = (value: any): value is LogMode =>
        typeof value === 'symbol' && (value === Directive.warn || value === Directive.error || value === Directive.debug);
}

/**
 * Parsed directives as options, or as direct object directives input.
 */
export interface ParsedDirectives {
    local_level: number;
    local_level_arg_index?: number;
    active_log_level: number;
    log_mode: LogMode;
    enforce: boolean;
    is_raw: boolean;
    loc?: SourceLoc;
};

/**
 * A wrapper class to manage the active log level, user-facing, not internally.
 * @note This is explicitly used to set the active log level, not the local level of a log message.
 */
export class ActiveLogLevel {
    constructor(public n: number) { }
    set(value: number | ActiveLogLevel): void {
        this.n = typeof value === "number" ? value : value.n;
    }
    update(value: number | ActiveLogLevel): void {
        this.n = typeof value === "number" ? value : value.n;
    }
    get(): number { return this.n; } // better to use `.n` directly.
    on(log_level: number) { return this.n >= log_level; }
    toString(): string { return String(this.n); }

    /**
     * Some operations to compare the current log level with a given level.
     */
    eq(level: number): boolean {
        return this.n === level;
    }
    gt(level: number): boolean {
        return this.n > level;
    }
    gte(level: number): boolean {
        return this.n >= level;
    }
    lt(level: number): boolean {
        return this.n < level;
    }
    lte(level: number): boolean {
        return this.n <= level;
    }
}
