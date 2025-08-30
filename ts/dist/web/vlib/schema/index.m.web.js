/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @warning This file should be re-exported as `export * as X` as indicated by the `.m` extension.
 */
// infer/
export { Entry, } from "./infer/entry.js";
// no need to export from `./infer.js` that is already embedded unfer `Entry.Infer<>` etc.
// validate/
export * from "./validate/cast.js";
export * from "./validate/throw.js";
export { validate, Validator, InvalidUsageError, ValidateError, } from "./validate/validate.js";
//# sourceMappingURL=index.m.web.js.map