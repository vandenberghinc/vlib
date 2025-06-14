/**
 * @author Daan van den BerghX
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// Set stacktrace limit.
Error.stackTraceLimit = 25;
/** cli/ */
export * as CLI from "./cli/index.m.js";
export * as cli from "./cli/index.m.js";
/** sockets/ */
export * from "./sockets/request.js";
export * from "./sockets/websocket.js";
/** global/ */
export * from "./primitives/index.uni.js";
/** generic/ */
export * from "./generic/index.js";
/** debugging/ */
export * as Logging from "./logging/index.m.node.js";
export * as logging from "./logging/index.m.node.js";
export { debug, log, Logger, Debug } from "./logging/index.m.node.js";
import { log } from "./logging/index.m.node.js";
export const print = (...args) => log.raw(0, ...args);
export const error = (...args) => log.error(...args);
export const warn = (arg, ...args) => log.warn(arg, ...args);
export const warning = warn;
/** scheme/ */
export * as Schema from "./schema/index.m.uni.js";
export * as schema from "./schema/index.m.uni.js";
/** jsonc/ */
export * from "./jsonc/jsonc.js";
/** crypto/ */
export * as Crypto from "./crypto/index.m.js";
export * as crypto from "./crypto/index.m.js";
/** search/ */
export * from "./search/index.uni.js";
/** utils.js */
export * from "./generic/utils.js";
/** code/ */
export * as Code from "./code/index.m.uni.js";
export * as code from "./code/index.m.uni.js";
/** clipboard/ */
export * from "./clipboard/index.js";
/**
 * Export the version number.
 * @warning Expect an error since we should not import any of the `vts/types` files.
 *          Otherwise we would declare these attributes globally also on non vts processed files.
 *          @ts-expect-error */
export const version = '1.6.21';
//# sourceMappingURL=index.js.map