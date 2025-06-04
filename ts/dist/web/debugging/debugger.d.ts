/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ActiveLogLevel } from "./directives.js";
import { Args } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";
/**
 * A debug instance, function + attributes.
 */
export type Debugger = ((log_level: number | Args[0], ...args: Args) => void) & {
    level: ActiveLogLevel;
    on: (local_level: number, active_level?: number) => boolean;
    raw: (local_level: number | Args[0], ...args: Args) => void;
    set(level: number): Debugger;
    update(level: number): Debugger;
    loc(lookback?: number): SourceLoc;
};
/**
 * Create a debug instance.
 */
declare function _debugger(log_level: number): Debugger;
export { _debugger as debugger };
/**
 * A global debug instance with a shared log level that can be set.
 * @dev_note Should be forwarded out of the `debugging` module.
 */
export declare const debug: Debugger;
