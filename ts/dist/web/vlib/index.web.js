/** vts-version */ const __version="1.6.34"; /** vts-version END */
/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Set stacktrace limit.
Error.stackTraceLimit = 25;
/**
 * Version number
 * Inserted by vts after compilation
 * @ts-expect-error */
export const version = __version;
/** global/ */
export * from "./primitives/index.uni.js";
/** scheme/ */
export * as Schema from "./schema/index.m.web.js";
export * as schema from "./schema/index.m.web.js";
/** generic/ */
export * from "./generic/index.web.js";
/** debugging/ */
export * as Debugging from "./logging/index.m.web.js";
export * as debugging from "./logging/index.m.web.js";
export { debug, log, Logger, Debug } from "./logging/index.m.web.js";
import { log } from "./logging/index.m.web.js";
export const print = (...args) => log.raw(0, ...args);
export const error = (...args) => log.error(...args);
export const warn = (arg, ...args) => log.warn(arg, ...args);
export const warning = warn;
/** search/ */
export * from "./search/index.uni.js";
/** code/ */
export * as Code from "./code/index.m.uni.js";
export * as code from "./code/index.m.uni.js";
/** clipboard/ */
export * from "./clipboard/index.web.js";
//# sourceMappingURL=index.web.js.map