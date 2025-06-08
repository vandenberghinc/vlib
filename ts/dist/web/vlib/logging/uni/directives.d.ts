/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { SourceLoc } from './source_loc.js';
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
export declare const Directive: {
    readonly log: symbol;
    readonly debug: symbol;
    readonly warn: symbol;
    readonly error: symbol;
    readonly raw: symbol;
    readonly enforce: symbol;
    readonly ignore: symbol;
};
export { Directive as directive };
/**
 * Union of all Mode values (unique symbol literals).
 *
 * Example:
 *   const m: ModeType = Mode.log;
 */
export type ModeType = typeof Directive[keyof typeof Directive];
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
/**
 * Union type for all directives.
 * @warning Ensure this does not contain any `Array.isArray => true` types.
 *          This is to distinguish between a single directive and an array of directives.
 *          Such as `directives: Directives | Directives[]`.
 *
 *          Otherwise `Pipe.parse_directives` needs to be updated
 *          In the section where its overriding the vars from `directives: Directives | Directives[]`.
 */
export type Directive = typeof Directive.warn | typeof Directive.error | typeof Directive.debug | typeof Directive.raw | typeof Directive.enforce | ActiveLogLevel | SourceLoc;
/**
 * Parsed directives as options, or as direct object directives input.
 */
export interface DirectivesOpts {
    local_level: number;
    local_level_arg_index?: number;
    active_log_level: number;
    mode: ModeType;
    enforce: boolean;
    is_raw: boolean;
    loc?: SourceLoc;
}
