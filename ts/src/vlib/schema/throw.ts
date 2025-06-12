/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 * 
 * @note Web - This file should also be accessable from the frontend / in a web environment.
 * 
 * @todo create an InferType type utility that infers teh object type for an object scheme, similar to how CLI does it.
 */

import { ObjectUtils } from "@vlib/index.web.js";
import { Merge } from "../types/transform.js";

// -------------------------------------------------------
// Utility functions.

/** 
 * Get a value type as string for error reporting.
 * Converts `null` to "null", `undefined` to "undefined",
 * And tries to detect primitive array and object types.
 * @returns The string representation of the value type.
 */
export function value_type(value: any): string {
    if (value === null) { return "null"; }
    else if (value === null) { return "undefined"; }
    else if (typeof value === "object" && Array.isArray(value)) {
        const type = primitive_array_type(value);
        if (type) { return `${type}[]`; }
        return "array";
    } else if (typeof value === "object" && ObjectUtils.is_plain(value)) {
        const key_type = primitive_array_type(Object.keys(value));
        const value_type = primitive_array_type(Object.values(value));
        if (key_type && value_type) { return `{ ${key_type}: ${value_type} }`; }
        return "object";
    }
    else { return typeof value; }
}

/**
 * Detect if an array has a single primitive type.
 * @returns the primitive value type as a "boolean", or `undefined` if the array is empty or has mixed types.
 */
function primitive_array_type(arr: any[]): string | undefined {
    if (!Array.isArray(arr) || arr.length === 0) return;
    const type = typeof arr[0];
    return arr.every(item => typeof item === type) ? type : undefined;
}

// -------------------------------------------------------
// Functions for throwing errors.

/**
 * Base type for `throw_x` functions.
 */
export interface ThrowType {
    name: string;
    value?: any;
    type?: string | Function | (string | Function)[]; // accept all types not just SchemeType castable types.
    throw?: boolean;
}

/** 
* Create a type string from an array
* Wrapper func for `throw_undefined` and `throw_invalid_type` etc.
*/
function throw_type_helper(type: ThrowType["type"] = [], prefix: string = ""): string {
    if (typeof type === "string") {
        return `${prefix}"${type}"`;
    }
    if (Array.isArray(type) && type.length > 0) {
        let str = prefix;
        for (let i = 0; i < type.length; i++) {
            if (typeof type[i] === "function") {
                try {
                    str += `"${(type[i] as unknown as Function).name}"`
                } catch (e) {
                    str += `"${type[i]}"`
                }
            } else {
                str += `"${type[i]}"`
            }
            if (i === type.length - 2) {
                str += " or "
            } else if (i < type.length - 2) {
                str += ", "
            }
        }
        return str;
    }
    return "";
}

/** 
 * Throw an error for undefined arguments
 * @libris
 */
export function throw_undefined(name: string, type?: ThrowType["type"], throw_err?: true): never;
export function throw_undefined(name: string, type: ThrowType["type"], throw_err: false): string;
export function throw_undefined(opts: Merge<ThrowType, { throw?: true }>): never;
export function throw_undefined(opts: Merge<ThrowType, { throw: false }>): string;
export function throw_undefined(): never | string {
    // Support keyword assignment params.
    let opts: ThrowType;
    if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
        opts = arguments[0] as ThrowType;
    } else {
        // dont check types here since errors here are weird.
        opts = {
            name: arguments[0] as string,
            type: arguments[1] as ThrowType["type"] | undefined,
            throw: arguments[2] !== false,
        }
    }
    const err = `Argument "${opts.name as string}" should be a defined value${throw_type_helper(opts.type, " of type ")}.`
    if (opts.throw !== false) {
        throw new Error(err);
    }
    return err;
}

/** 
 * Throw an error for invalid type arguments
 * @libris
 */

export function throw_invalid_type(name: string, value?: any, type?: ThrowType["type"], throw_err?: true): never;
export function throw_invalid_type(name: string, value: any, type: ThrowType["type"], throw_err: false): string;
export function throw_invalid_type(opts: Merge<ThrowType, { throw?: true }>): never;
export function throw_invalid_type(opts: Merge<ThrowType, { throw: false }>): string;
export function throw_invalid_type(): string {
    let opts: ThrowType;
    if (arguments.length === 1 && typeof arguments[0] === "object" && !Array.isArray(arguments[0]) && arguments[0] != null) {
        opts = arguments[0] as ThrowType;
    } else {
        // dont check types here since errors here are weird.
        opts = {
            name: arguments[0] as string,
            value: arguments[1],
            type: arguments[2] as ThrowType["type"] | undefined,
            throw: arguments[3] !== false,
        }
    }
    const err = `Invalid type "${value_type(opts.value)}" for argument "${opts.name as string}"${throw_type_helper(opts.type, ", the valid type is ")}.`
    if (opts.throw) {
        throw new Error(err);
    }
    return err;
}