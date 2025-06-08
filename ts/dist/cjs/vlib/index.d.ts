/**
 * @author Daan van den BerghX
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** types/ */
export type * as Types from "./types/index.m.js";
export type * as types from "./types/index.m.js";
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
export declare const print: (...args: any[]) => void;
export declare const error: (...args: any[]) => void;
export declare const warn: (arg: any, ...args: any[]) => void;
export declare const warning: (arg: any, ...args: any[]) => void;
/** scheme/ */
export * as Scheme from "./scheme/index.m.uni.js";
export * as scheme from "./scheme/index.m.uni.js";
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
export declare const version: any;
