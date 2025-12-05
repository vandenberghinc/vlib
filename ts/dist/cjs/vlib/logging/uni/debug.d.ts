/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { ActiveLogLevel } from "./directives.js";
import { Logger } from "./logger.js";
/**
 * The callable debug class.
 * A wrapper for a logger class with `debug` level set to `true`.
 *
 * @example
 * const debug = new Debug(1);
 * if (debug.on(1)) debug("Hello World!");
 *
 * @nav Logging
 * @docs
 */
export declare class Debug extends Logger<true> {
    constructor(opts: ActiveLogLevel | number | {
        /** The log level. */
        level?: ActiveLogLevel | number;
    });
}
/**
 * A global debug instance.
 *
 * @nav Logging
 * @docs
 */
export declare const debug: Debug;
