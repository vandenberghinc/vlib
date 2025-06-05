/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
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
export function filter_output(data, opts) {
    const { include, exclude, visit, drop_undef = false, drop_empty = false } = opts;
    if (include && exclude) {
        throw new Error(`Cannot use both include and exclude options at the same time.`);
    }
    // Is undefined or not an object.
    if (data == null || typeof data !== "object") {
        if (typeof visit === "function") {
            return visit(data);
        }
        return data;
    }
    // Still an object/array but only a visit func defined and no other opts.
    // This can also happen because of the nested filter_output() calls from Array objects.
    if (!exclude && !include && typeof visit === "function") {
        // otherwise we will clone the object while that is 1) not needed and 2) might be specifically only referenced in the visit to not clone the node.
        return visit(data);
    }
    // Handle arrays.
    if (Array.isArray(data)) {
        let out = [];
        for (let i = 0; i < data.length; ++i) {
            // console.log("Processing array item", i, Scheme.value_type(data[i]), Colors.object(data[i], { max_length: 100 }));
            // Add raw if there are no directions left.
            const l_exclude = exclude;
            const l_include = include;
            const l_visit = visit && typeof visit === "object" ? visit : undefined;
            // Filter.
            let res;
            if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
                res = data[i];
            }
            else {
                res = filter_output(data[i], {
                    include: l_include,
                    exclude: l_exclude,
                    visit: l_visit,
                    drop_empty,
                    drop_undef,
                });
            }
            if ((drop_undef && res == null) ||
                (drop_empty && typeof res !== "number" && !res) ||
                (drop_empty && typeof res === "object" && Object.keys(res).length === 0) // also works for arrays.
            ) {
                continue;
            }
            out.push(res);
        }
        if (typeof visit === "function") {
            return visit(out);
        }
        return out;
    }
    // Handle objects.
    const obj = data;
    const add_keys = (exclude ? Object.keys(obj).filter(k => (exclude[k] != null && typeof exclude[k] === "object") || !exclude[k]) :
        include ? Object.keys(include) :
            Object.keys(obj))
        .sort((a, b) => a.localeCompare(b));
    const result = {};
    for (const key of add_keys) {
        // console.log("Processing obj key", key, Scheme.value_type(data[key]), Colors.object(data[key], { max_length: 100 }));
        // Add raw if there are no directions left.
        const l_exclude = !exclude ? undefined : typeof exclude[key] === "boolean" ? undefined : exclude[key];
        const l_include = !include ? undefined : typeof include[key] === "boolean" ? undefined : include[key];
        const l_visit = visit && typeof visit === "object" ? visit[key] : undefined;
        // Filter.
        let res;
        if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
            res = obj[key];
        }
        else {
            res = filter_output(obj[key], {
                exclude: l_exclude,
                include: l_include,
                visit: l_visit,
                drop_empty,
                drop_undef,
            });
        }
        if ((drop_undef && res == null) ||
            (drop_empty && typeof res !== "number" && !res) ||
            (drop_empty && typeof res === "object" && Object.keys(res).length === 0) // also works for arrays.
        ) {
            continue;
        }
        result[key] = res;
    }
    if (typeof visit === "function") {
        return visit(result);
    }
    return result;
}
// =================================================================
// Tests for the `filter_output()` function.
// const data = {
//     key1: "value1",
//     key2: "value2",
//     key3: "",
//     key4: null,
//     key5: {
//         key1: undefined,
//         key2: undefined,
//     },
// };
// logger.debug(0,  "================================================================\nUsing include: ");
// logger.debug(0,  "Result:          ", UnitTests.filter_output(data, {
//     include: {
//         key1: true,
//         key5: { key1: true },
//     },
// }))
// logger.debug(0,  "Expected result: ", { key1: "value1", key5: { key1: undefined } });
// logger.debug(0, "================================================================\nUsing exclude: ");
// logger.debug(0, "Result:          ", UnitTests.filter_output(data, {
//     exclude: {
//         key2: true,
//         key3: true,
//         key4: true,
//         key5: { key2: true },
//     },
// }));
// logger.debug(0, "Expected result: ", { key1: "value1", key5: { key1: undefined } });
// logger.debug(0,  "================================================================\nUsing drop empty: ");
// logger.debug(0,  "Result:          ", UnitTests.filter_output(data, { drop_empty: true }))
// logger.debug(0,  "Expected result: ", {
//     key1: "value1",
//     key2: "value2",
// });
// logger.debug(0,  "================================================================\nUsing drop undef: ");
// logger.debug(0,  "Result:          ", UnitTests.filter_output(data, { drop_undef: true }))
// logger.debug(0,  "Expected result: ", {
//     key1: "value1",
//     key2: "value2",
//     key3: "",
//     key5: {},
// });
// logger.debug(0, "================================================================\nUsing drop undef: ");
// const joined: string[] = []
// UnitTests.filter_output(data, {
//     visit: {
//         key1: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key2: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key3: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key4: (item: any) => { joined.push((item||"<blank>").toString()); },
//         key5: {
//             key1: (item: any) => { joined.push((item||"<blank>").toString()); },
//             key2: (item: any) => { joined.push((item||"<blank>").toString()); },
//         },
//     }
// });
// logger.debug(0, "Result:          ", joined.join("-"));
// logger.debug(0, "Expected result: ", "value1-value2-<blank>-<blank>-<blank>-<blank>");
// Utils.safe_exit();
//# sourceMappingURL=filter.js.map