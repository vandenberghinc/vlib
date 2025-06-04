/**
 * @author Daan van den BerghX
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/** types/ */
export type * as Types from "./types/index.m.js"
export type * as types from "./types/index.m.js"

/** cli/ */
export * as CLI from "./cli/index.m.js"
export * as cli from "./cli/index.m.js"

/** sockets/ */
export * from "./sockets/request.js"
export * from "./sockets/websocket.js"

/** global/ */
export * from "./global/index.uni.js"

/** system/ */
export * from "./system/index.js"

/** debugging/ */
export * as Debugging from "./debugging/index.m.uni.js"
export * as debugging from "./debugging/index.m.uni.js"
export { debug, Debug } from "./debugging/index.m.uni.js"
import { debug } from "./debugging/index.m.uni.js"
export const print = (...args: any[]) => debug(0, ...args);

/** logging/ */
export * as Logging from "./logging/index.m.js"
export * as logging from "./logging/index.m.js"
import { logger } from "./logging/logger.js"
export { logger }
export const { log, warn, error } = logger.loggers();

/** scheme/ */
export * as Scheme from "./scheme/index.m.uni.js"
export * as scheme from "./scheme/index.m.uni.js"

/** jsonc/ */
export * from "./jsonc/jsonc.js"

/** crypto/ */
export * from "./crypto/index.js"

/** search/ */
export * from "./search/index.uni.js"

/** utils.js */
export * from "./utils.js"

/** code/ */
export * as Code from "./code/index.m.uni.js"
export * as code from "./code/index.m.uni.js"

/** clipboard/ */
export * from "./clipboard/index.js"

/**
 * Export the version number.
 * @warning Expect an error since we should not import any of the `vts/types` files.
 *          Otherwise we would declare these attributes globally also on non vts processed files.
 *          @ts-expect-error */
export const version = __version;