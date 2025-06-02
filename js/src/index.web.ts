/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/** global/ */
export * from "./global/index.uni.js"

/** scheme/ */
export * as Scheme from "./scheme/index.m.uni.js"
export * as scheme from "./scheme/index.m.uni.js"

/** system/ */
export * from "./system/index.web.js"

/** debugging/ */
export * as Debugging from "./debugging/index.m.uni.js"
export * as debugging from "./debugging/index.m.uni.js"
export { debug, Debug } from "./debugging/index.m.uni.js"
import { debug } from "./debugging/index.m.uni.js"
export const print = (...args: any[]) => debug(0, ...args);

/** search/ */
export * from "./search/index.uni.js"

/** code/ */
export * as Code from "./code/index.m.uni.js"
export * as code from "./code/index.m.uni.js"

/** clipboard/ */
export * from "./clipboard/index.web.js"

/**
 * Version number
 * Inserted by vts after compilation
 * @ts-expect-error */
export const version = __version;