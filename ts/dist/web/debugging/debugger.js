/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { ActiveLogLevel, Mode } from "./directives.js";
import { pipe } from "./pipe.js";
import { SourceLoc } from "./source_loc.js";
/**
 * Create a debug instance.
 */
function _debugger(log_level) {
    const level = new ActiveLogLevel(log_level);
    const fn = (...args) => pipe.log(level, Mode.debug, new SourceLoc(1), ...args);
    fn.level = level;
    fn.on = (local_level, active_level) => active_level == null ? local_level <= level.n : local_level <= active_level;
    // tested in benchmark but much slower.
    // fn.onc = (local_level: number) => local_level <= level.n ? fn as (...args: Args) => void : () => undefined;
    // fn.onc2 = (local_level: number) => ({ debug: local_level <= level.n ? fn as (...args: Args) => void : () => undefined });
    // do not use console.log here since we join args without a space unlike console.log.
    fn.raw = (...args) => pipe.raw(level, Mode.debug, Mode.raw, new SourceLoc(1), ...args);
    fn.set = (value) => { level.set(value); return fn; };
    fn.update = (value) => { level.update(value); return fn; };
    fn.loc = (lookback = 0) => new SourceLoc(1 + lookback);
    return fn;
}
export { _debugger as debugger };
/**
 * A global debug instance with a shared log level that can be set.
 * @dev_note Should be forwarded out of the `debugging` module.
 */
export const debug = _debugger(0);
// // ------------------ Benchmark. ------------------
// import { Color } from "../system/colors.js";
// import { utils } from "../utils.js";
// let now = Date.now();
// const count = 100000;
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
//# sourceMappingURL=debugger.js.map