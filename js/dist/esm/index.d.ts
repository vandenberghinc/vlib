/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
export * from "./cli/cli.js";
export * from "./cli/progress_loader.js";
export * from "./sockets/request.js";
export * from "./sockets/websocket.js";
export * from "./global/index.uni.js";
export * from "./system/index.js";
export * from "./logging/index.js";
export * from "./scheme/index.uni.js";
export * from "./jsonc/jsonc.js";
export * from "./utils.js";
export declare const log: (log_level: number | any, ...args: any[]) => void, debug: any, warn: (log_level: number | any, ...args: any[]) => void, error: (...args: any[]) => void;
export declare const info: {
    version: any;
};
