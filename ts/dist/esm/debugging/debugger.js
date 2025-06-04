/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Callable } from "../global/callable.js";
import { ActiveLogLevel, Mode } from "./directives.js";
import { pipe, pipe as default_pipe } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";
/**
 * The callable debug class.
 */
export class Debug extends Callable {
    level;
    pipe;
    /**
     * Construct a new debug instance.
     *
     * @param opts The options for the debug instance.
     *             This can be a number, an ActiveLogLevel instance, or an object.
     * @param opts.level The log level to set for this debug instance.
     *                   Any provided `ActiveLogLevel` will not be copied but used as a reference instead.
     * @param opts.pipe The pipe to use for logging. If not provided, the default pipe will be used.
     */
    constructor(opts) {
        let level = 0;
        let pipe;
        if (opts instanceof ActiveLogLevel || typeof opts === "number") {
            level = opts;
        }
        else if (opts) {
            if (opts.level instanceof ActiveLogLevel || typeof opts.level === "number") {
                level = opts.level;
            }
            if (opts.pipe) {
                pipe = opts.pipe;
            }
        }
        super();
        this.level = level instanceof ActiveLogLevel ? level : new ActiveLogLevel(level);
        this.pipe = pipe ?? default_pipe;
    }
    /** Call the debug fn. */
    call(log_level, ...args) {
        this.pipe.log(this.level, Mode.debug, new SourceLoc(1), ...args);
    }
    /**
     * Check if the local log level is active.
     * @param local_level The local log level to check against the active log level.
     * @param active_level Optionally provide an active log level to check against.
     * @returns `true` if the local level is active, otherwise `false`.
     */
    on(local_level, active_level) {
        return active_level == null ? local_level <= this.level.n : local_level <= active_level;
    }
    /**
     * Log a message in raw mode.
     * @param args Log arguments to pass to the pipe.
     */
    raw(...args) {
        pipe.raw(this.level, Mode.debug, Mode.raw, new SourceLoc(1), ...args); // do not use console.log here since we join args without a space unlike console.log.
    }
    /**
     * Update the log level of this debug instance.
     * @param value The log level to set for this debug instance.
     * @returns The debug instance itself for chaining.
     */
    set(value) {
        this.level.set(value);
        return this;
    }
    update(value) {
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
    loc(lookback = 0) {
        return new SourceLoc(1 + lookback);
    }
}
/**
 * A global debug instance with a shared log level that can be set.
 * @dev_note Should be forwarded out of the `debugging` module.
 */
export const debug = new Debug({ level: 0 });
// ------------------ Benchmark. ------------------
import { Color } from "../system/colors.js";
import { utils } from "../utils.js";
let now = Date.now();
const count = 100000;
const times = {};
const some_large_object = {
    x: 0, y: 1, z: 2,
    a: 3, b: 4, c: 5, d: 6, e: 7, f: 8, g: 9, h: 10,
    i: 11, j: 12, k: 13, l: 14, m: 15, n: 16, o: 17,
    p: 18, q: 19, r: 20, s: 21, t: 22, u: 23, v: 24,
    w: 25, y2: 27, z2: {
        x: 0, y: 1, z: 2,
        a: 3, b: 4, c: 5, d: 6, e: 7, f: 8, g: 9, h: 10,
        i: 11, j: 12, k: 13, l: 14, m: 15, n: 16, o: 17,
        p: 18, q: 19, r: 20, s: 21, t: 22, u: 23, v: 24,
        w: 25
    }
};
// ---
now = Date.now();
for (let i = 0; i < count; i++) {
    debug(1, Color.object(some_large_object));
}
times["eager"] = Date.now() - now;
// ---
now = Date.now();
for (let i = 0; i < count; i++) {
    debug(1, () => Color.object(some_large_object));
}
times["lazy"] = Date.now() - now;
// ---
now = Date.now();
for (let i = 0; i < count; i++) {
    if (debug.on(1))
        debug(Color.object(some_large_object));
}
times["if+on+debug"] = Date.now() - now;
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     debug.onc(1)(Color.object(some_large_object));
// }
// times["if+onc+debug"] = Date.now() - now;
// // ---
// now = Date.now();
// for (let i = 0; i < count; i++) {
//     debug.onc2(1)?.debug(Color.object(some_large_object));
// }
// times["if+onc2+debug"] = Date.now() - now;
// ---
now = Date.now();
for (let i = 0; i < count; i++) {
    if (debug.level.n >= 1) {
        debug(Color.object(some_large_object));
    }
}
times["if+debug"] = Date.now() - now;
// ---
now = Date.now();
for (let i = 0; i < count; i++) {
    if (debug.level.n >= 1) {
        console.log(Color.object(some_large_object));
    }
}
times["if+console.log"] = Date.now() - now;
// logs.
console.log("Benchmark results for debug():");
for (const [name, time] of Object.entries(times).sort((a, b) => a[1] - b[1])) {
    console.log(" *", name, time, "ms");
}
utils.safe_exit();
//# sourceMappingURL=debugger.js.map