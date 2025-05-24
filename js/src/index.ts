/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

export * from "./cli/cli.js"
export * from "./cli/progress_loader.js"

export * from "./sockets/request.js"
export * from "./sockets/websocket.js"

export * from "./global/index.uni.js"

export * from "./system/index.js"

export * from "./logging/index.js"

export * from "./scheme/index.uni.js"

export * from "./jsonc/jsonc.js"

export * from "./utils.js"

// Export default log funcs.
import { logger } from "./logging/logger.js"
export const { log, debug, warn, error } = logger.loggers();

// Export info.
export const info = {
	// @ts-expect-error
	version: __version,
}