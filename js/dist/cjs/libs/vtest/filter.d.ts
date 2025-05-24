/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A scheme format for include/exclude/visit options.
 */
type FilterScheme<T> = {
    [key: string]: T | FilterScheme<T>;
};
/**
 * Filter (output) data based on a simple scheme, then sort object key's by defined scheme order.
 * This can be useful for producing a consistent output format.
 * @param data {Record<string, any> | any[]} The input data.
 * @param include Include only a list of keys, all other keys will be excluded, formatted as an object with boolean values or nested include schemes.
 * @param exclude Exclude a list of keys, all other keys will still be included, formatted as an object with boolean values or nested exclude schemes.
 * @param visit Allows for defining postprocess visit functions for each key, formatted as an object with function values or nested visit schemes.
 * @param opts.drop_empty Drop all empty values from objects and arrays - such as null, undefined, empty strings, empty arrays and empty objects.
 * @param opts.drop_undef Drop all null and undefined values from objects and arrays.
 * @example
 * import * as vtest from "@vandenberghinc/vlib/vts";
 * const data = {
 *    key1: "value1",
 *    key2: "value2",
 *    key3: "",
 *    key4: null,
 *    key5: {
 *       key1: undefined,
 *       key2: undefined,
 *    },
 * };
 *
 * // Using include.
 * vtest.filter_output(data, {
 *    include: {
 *       key1: true,
 *       key5: { key1: true },
 *    },
 * }); // => { key1: "value1", key5: { key1: undefined } }
 *
 * // Using exclude.
 * vtest.filter_output(data, {
 *    exclude: {
 *       key2: true,
 *       key3: true,
 *       key4: true,
 *       key5: { key2: true },
 *    },
 * }); // => { key1: "value1", key5: { key1: undefined } }
 *
 */
export declare function filter_output<T extends any>(data: T, opts: {
    include?: FilterScheme<boolean>;
    exclude?: FilterScheme<boolean>;
    visit?: FilterScheme<(item: any) => any> | ((item: any) => any);
    drop_empty?: boolean;
    drop_undef?: boolean;
}): T;
export {};
