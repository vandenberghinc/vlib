/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Set stacktrace limit.
Error.stackTraceLimit = 25;

/**
 * Export the version number.
 * @warning Expect an error since we should not import any of the `vts/types` files.
 *          Otherwise we would declare these attributes globally also on non vts processed files.
 *          @ts-expect-error */
export const version = __version;

/** types/ */
export type * as Types from "./types/index.m.js"
export type * as types from "./types/index.m.js"

/** cli/ */
export * as CLI from "./cli/index.m.js"
export * as cli from "./cli/index.m.js"

/** sockets/ */
export * from "./sockets/request.js"
export * from "./sockets/websocket.deprecated.js"

/** global/ */
export * from "./primitives/index.uni.js"

/** generic/ */
export * from "./generic/index.js"

/** debugging/ */
export * as Logging from "./logging/index.m.node.js"
export * as logging from "./logging/index.m.node.js"
export { debug, log, Logger, Debug } from "./logging/index.m.node.js"
import { debug, log } from "./logging/index.m.node.js"
export const print = (...args: any[]) => log.raw(0, ...args);
export const error = (...args: any[]) => log.error(...args);
export const warn = (arg: any, ...args: any[]) => log.warn(arg, ...args);
export const warning = warn;

/** scheme/ */
export * as Schema from "./schema/index.m.node.js"
export * as schema from "./schema/index.m.node.js"

/** jsonc/ */
export * from "./jsonc/jsonc.js"

/** crypto/ */
export * as Crypto from "./crypto/index.m.js"
export * as crypto from "./crypto/index.m.js"

/** search/ */
export * from "./search/index.uni.js"

/** utils.js */
export * from "./generic/utils.js"

/** code/ */
export * as Code from "./code/index.m.uni.js"
export * as code from "./code/index.m.uni.js"

/** clipboard/ */
export * from "./clipboard/index.js"

/** zip/ */
export * from "./generic/zip.js"