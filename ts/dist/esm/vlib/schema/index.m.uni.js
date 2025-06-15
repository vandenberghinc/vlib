/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @warning This file should be exported as `export * as X` as indicated by the `.m` extension.
 *
 * @note Should support browser and node.js environments.
 *       As indicated by the `.uni` extension.
 */
// infer/
export { Entry, } from "./infer/entry.js";
// no need to export from `./infer.js` that is already embedded unfer `Entry.Infer<>` etc.
// validate/
export * from "./validate/cast.js";
export * from "./validate/throw.js";
export * from "./validate/json_schema.js";
// export {} from "./validator_entries.js" // dont export from this file, let users use `Validator` instead.
export { validate, Validator, InvalidUsageError, ValidateError, } from "./validate/validate.js";
//# sourceMappingURL=index.m.uni.js.map