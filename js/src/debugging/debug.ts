/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { Callable } from "../global/callable.js";
import { ActiveLogLevel, Directive } from "./directives.js";
import { Args, Pipe, pipe, pipe as default_pipe } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";

/**
 * The callable debug class.
 */
export class Debug extends Callable<Args, void> {
    level: ActiveLogLevel;
    pipe: Pipe<false, true>;

    /**
     * Construct a new debug instance.
     * 
     * @param opts The options for the debug instance.
     *             This can be a number, an ActiveLogLevel instance, or an object.
     * @param opts.level The log level to set for this debug instance, defaults to 0.
     *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
     * @param opts.pipe The pipe to use for logging. If not provided, the default pipe will be used.
     */
    constructor(opts: number | ActiveLogLevel | {
        level?: number | ActiveLogLevel,
        pipe?: Pipe<false, true>,
    }) {
        let level: ActiveLogLevel | number = 0;
        let pipe: Pipe | undefined = undefined;
        if (opts instanceof ActiveLogLevel || typeof opts === "number") {
            level = opts;
        } else if (opts) {
            if (opts.level instanceof ActiveLogLevel || typeof opts.level === "number") {
                level = opts.level;
            }
            if (opts.pipe) {
                pipe = opts.pipe;
            }
        }
        super();
        this.pipe = pipe ?? default_pipe;
        this.pipe.log_level.set(level instanceof ActiveLogLevel ? level.n : level);
        this.level = this.pipe.log_level;
    }

    /**
     * {Log}
     * Log a message to the console. Including a traceback of the source location.
     * @param args
     *        The data to log.
     *        The first number is treated as the local log level.
     *        Any other directives are allowed before the first non-directive / local log level argument.
     * @funcs 2
     */
    call(log_level: number | Args[0], ...args: Args): void {
        this.pipe.log(this.level, Directive.debug, new SourceLoc(1), log_level, ...args);
    }

    /**
     * Check if the local log level is active.
     * @param local_level The local log level to check against the active log level.
     * @param active_level Optionally provide an active log level to check against.
     * @returns `true` if the local level is active, otherwise `false`.
     */
    on(local_level: number, active_level?: number): boolean {
        return active_level == null ? local_level <= this.level.n : local_level <= active_level;
    }

    /**
     * Log a message in raw mode.
     * @param args Log arguments to pass to the pipe.
     */
    raw(level: number | any, ...args: Args): void {
        pipe.raw(this.level, Directive.debug, Directive.raw, new SourceLoc(1), level, ...args); // do not use console.log here since we join args without a space unlike console.log.
    }
    dump(level: number | any, ...args: Args): void {
        pipe.raw(this.level, Directive.debug, Directive.raw, new SourceLoc(1), level, ...args); // do not use console.log here since we join args without a space unlike console.log.
    }

    /**
     * {Errors}
     * Log error data to the console and file streams when defined.
     * This automatically prepends the `Mode.raw` directive.
     * @param args The data to log.
     */
    error(...args: Args): void {
        this.call(-1, Directive.raw, Directive.error, new SourceLoc(1), ...args);
    }

    /**
     * {Warn}
     * Log a warning to the console and file streams when defined.
     * This automatically prepends the `Mode.raw` directive.
     * @param level The log level or the first argument to log.
     * @param errs The data to log.
     * @funcs 2
     */
    warn(level: number | any, ...args: Args): void {
        this.call(Directive.raw, Directive.warn, new SourceLoc(1), level, ...args);
    }
    warning(level: number | any, ...args: Args): void {
        this.call(Directive.raw, Directive.warn, new SourceLoc(1), level, ...args);
    }

    /**
     * Update the log level of this debug instance.
     * @param value The log level to set for this debug instance.
     * @returns The debug instance itself for chaining.
     */
    set(value: number): this {
        this.level.set(value);
        return this;
    }
    update(value: number): this {
        this.level.update(value);
        return this;
    }

    /**
     * Create a new SourceLoc instance.
     * @param lookback
     *      The number of function calls to go back in the call stack for the creation of the SourceLoc.
     *      By default the source location will be created for the location of where this function is called.
     * @returns A new SourceLoc instance.
     */
    loc(lookback: number = 0): SourceLoc {
        return new SourceLoc(1 + lookback);
    }

    /**
     * Forward the `Pipe.join()` function to the pipe instance.
     * @param args The arguments to pass to the `Pipe.join()` function.
     * @returns The joined string.
     */
    join(...args: Args): string {
        return this.pipe.join(...args);
    }
}

/**
 * A global debug instance with a shared log level.
 * @dev_note Should be forwarded out of the `debugging` module.
 */
export const debug: Debug = new Debug({ level: 0 });

// ------------------ Benchmark. ------------------
// import { Color } from "../system/colors.js";
// import { utils } from "../utils.js";
// let now = Date.now();
// const count = 10000;
// const times: Record<string, number> = {};
// const some_large_object = {
//     x: 0, y: 1, z: 2,
//     a: 3, b: 4, c: 5, d: 6, e: 7, f: 8, g: 9, h: 10,
//     i: 11, j: 12, k: 13, l: 14, m: 15, n: 16, o: 17,
//     p: 18, q: 19, r: 20, s: 21, t: 22, u: 23, v: 24,
//     w: 25, y2: 27, z2: {
//         x: 0, y: 1, z: 2,
//         a: 3, b: 4, c: 5, d: 6, e: 7, f: 8, g: 9, h: 10,
//         i: 11, j: 12, k: 13, l: 14, m: 15, n: 16, o: 17,
//         p: 18, q: 19, r: 20, s: 21, t: 22, u: 23, v: 24,
//         w: 25
//     }
// };
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     debug(1, Color.object(some_large_object));
// }
// times["eager"] = Date.now() - now;
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     debug(1, () => Color.object(some_large_object));
// }
// times["lazy"] = Date.now() - now;
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     if (debug.on(1)) debug(Color.object(some_large_object));
// }
// times["if+on+debug"] = Date.now() - now;
// // // ---
// // now = Date.now();
// // for (let i = 0; i < count; i++) {
// //     debug.onc(1)(Color.object(some_large_object));
// // }
// // times["if+onc+debug"] = Date.now() - now;
// // // ---
// // now = Date.now();
// // for (let i = 0; i < count; i++) {
// //     debug.onc2(1)?.debug(Color.object(some_large_object));
// // }
// // times["if+onc2+debug"] = Date.now() - now;
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     if (debug.level.n >= 1) {
//         debug(Color.object(some_large_object));
//     }
// }
// times["if+debug"] = Date.now() - now;
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     if (debug.level.n >= 1) {
//         console.log(Color.object(some_large_object));
//     }
// }
// times["if+console.log"] = Date.now() - now;
// // logs.
// console.log("Benchmark results for debug():");
// for (const [name, time] of Object.entries(times).sort((a, b) => a[1] - b[1])) {
//     console.log(" *", name, time, "ms");
// }
// utils.safe_exit();