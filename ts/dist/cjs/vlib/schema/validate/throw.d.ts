/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note Web - This file should also be accessable from the frontend / in a web environment.
 *
 * @todo create an InferType type utility that infers teh object type for an object scheme, similar to how CLI does it.
 */
import { Merge } from "../../types/types.js";
/**
 * Get a value type as string for error reporting.
 * Converts `null` to "null", `undefined` to "undefined",
 * And tries to detect primitive array and object types.
 * @returns The string representation of the value type.
 * @nav Schema/Utils
 * @docs
 */
export declare function value_type(value: any): string;
/**
 * Base type for `throw_x` functions.
 */
export interface ThrowType {
    name: string;
    value?: any;
    type?: string | Function | (string | Function)[];
    throw?: boolean;
}
/**
 * Throw an error for undefined arguments
 * @nav Schema/Utils
 * @docs
 */
export declare function throw_undefined(name: string, type?: ThrowType["type"], throw_err?: true): never;
export declare function throw_undefined(name: string, type: ThrowType["type"], throw_err: false): string;
export declare function throw_undefined(opts: Merge<ThrowType, {
    throw?: true;
}>): never;
export declare function throw_undefined(opts: Merge<ThrowType, {
    throw: false;
}>): string;
/**
 * Throw an error for invalid type arguments
 * @nav Schema/Utils
 * @docs
 */
export declare function throw_invalid_type(name: string, value?: any, type?: ThrowType["type"], throw_err?: true): never;
export declare function throw_invalid_type(name: string, value: any, type: ThrowType["type"], throw_err: false): string;
export declare function throw_invalid_type(opts: Merge<ThrowType, {
    throw?: true;
}>): never;
export declare function throw_invalid_type(opts: Merge<ThrowType, {
    throw: false;
}>): string;
