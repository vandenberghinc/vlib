/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { SourceLoc } from './source_loc.js';
/**
 * A `as const` readonly symbol map so ts correctly infers the directives.
 * Keep this private so `Directive` and `Directive.X` can be used.
 * @private
 */
declare const SymbolMap: {
    readonly log: symbol;
    readonly debug: symbol;
    readonly warn: symbol;
    readonly error: symbol;
    readonly raw: symbol;
    readonly enforce: symbol;
    readonly ignore: symbol;
    readonly not_a_directive: symbol;
};
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
export declare namespace Directive {
    /**
     * The default log mode.
     */
    const log: symbol;
    type log = typeof SymbolMap.log;
    /**
     * The debug mode, when passed the pipe() function will enable debug mode.
     */
    const debug: symbol;
    type debug = typeof SymbolMap.debug;
    /**
     * The warn mode, when passed the pipe() function will enable warn mode.
     */
    const warn: symbol;
    type warn = typeof SymbolMap.warn;
    /**
     * The error mode, when passed the pipe() function will enable error mode.
     */
    const error: symbol;
    type error = typeof SymbolMap.error;
    /**
     * The raw mode, when passed the pipe() function will not show a source location or other prepended data.
     * This mode is always enabled in error and warn modes, however the `Error|Warning` prefix will always be shown.
     */
    const raw: symbol;
    type raw = typeof SymbolMap.raw;
    /**
     * When this directive is added, the logs will always be shown / piped, regardless of log levels.
     */
    const enforce: symbol;
    type enforce = typeof SymbolMap.enforce;
    /**
     * Serves as an identifier to ignore something. However not directly used in the pipe() function, for now only used as a return type of the `Pipe.transform` callback.
     */
    const ignore: symbol;
    type ignore = typeof SymbolMap.ignore;
    /**
     * A dummy directive which is simply ignored.
     * Useful for creating directive flag variables that have either `X` or `not_a_directive` as value.
     */
    const not_a_directive: symbol;
    type not_a_directive = typeof SymbolMap.not_a_directive;
    /** A set with all directives to check if a given symbol is a directive. */
    const set: any;
    /** Check if a given value is a directive. */
    const is: (value: any) => value is Directive;
}
export { Directive as directive };
/**
 * Union of all log modes.
 */
export type LogMode = Directive.warn | Directive.error | Directive.debug;
export declare namespace LogMode {
    const is: (value: any) => value is LogMode;
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
}
/**
 * A wrapper class to manage the active log level, user-facing, not internally.
 * @note This is explicitly used to set the active log level, not the local level of a log message.
 */
export declare class ActiveLogLevel {
    n: number;
    constructor(n: number);
    set(value: number | ActiveLogLevel): void;
    update(value: number | ActiveLogLevel): void;
    get(): number;
    on(log_level: number): boolean;
    toString(): string;
    /**
     * Some operations to compare the current log level with a given level.
     */
    eq(level: number): boolean;
    gt(level: number): boolean;
    gte(level: number): boolean;
    lt(level: number): boolean;
    lte(level: number): boolean;
}
