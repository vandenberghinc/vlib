/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { ActiveLogLevel } from "./directives.js";
import { Logger } from "./logger.js";
/**
 * The callable debug class.
 * A wrapper for a logger class with `debug` level set to `true`.
 */
export class Debug extends Logger {
    constructor(opts) {
        let super_opts;
        if (opts instanceof ActiveLogLevel || typeof opts === "number") {
            super_opts = { level: opts, debug: true };
        }
        else if (opts) {
            super_opts = {
                ...opts,
                debug: true,
            };
        }
        else {
            // @ts-expect-error
            throw new TypeError(`Logger constructor expects a number, ActiveLogLevel, or an object with level and debug properties, not "${opts.toString()}".`);
        }
        super(super_opts);
    }
}
/**
 * A global debug instance.
 */
export const debug = new Debug({ level: 0 });
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
//# sourceMappingURL=debug.js.map