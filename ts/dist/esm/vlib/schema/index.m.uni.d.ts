/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @warning This file should be exported as `export * as X` as indicated by the `.m` extension.
 *
 * @note Should support browser and node.js environments.
 *       As indicated by the `.uni` extension.
 */
export { Entry, Entries, ValueEntries, TupleEntries, Opts, Infer, } from "./infer/entry.js";
export * from "./validate/cast.js";
export * from "./validate/throw.js";
export { validate, Validator, InvalidUsageError, ValidateError, ValidateResponse, } from "./validate/validate.js";
