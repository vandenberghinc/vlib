/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// // export type InferEntries<S extends Entries.Opts> = {
// export type InferEntries<S extends Record<string, CastableType | Entry.Plain>> = {
//     [K in keyof S]:
//     S[K] extends Entry.Plain ? MaybeOptional<S[K], InferEntry<S[K]>> :
//     // [S[K]] extends [Entry] ? MaybeOptional<S[K], InferEntry<S[K]>> :
//     S[K] extends CastableType ? MaybeOptional<S[K], Entry.Type.Cast<S[K]>> :
//     unknown
// // S[K] extends Entry.Opts
// //         ? MaybeOptional<Sd[K], InferEntry<S[K]>>
// //         : MaybeOptional<S[K], Entry.Type.Cast<S[K]>>
//     };
// -------------------------------------------------------------
// INTERNAL TESTS
function test_infer_scheme(s, callback) { }
test_infer_scheme({
    my_str: "string",
    my_nr: "number",
    my_opt_nr_1: { type: "number", required: false },
    my_opt_nr_2: { type: "number", required: () => true }, // cant resolve funcs
    my_opt_nr_3: { type: "number", required: () => false }, // cant resolve funcs
    my_non_opt_nr_1: { type: "number", def: 0 },
    my_non_opt_nr_2: { type: "number", def: () => 0 },
    my_enum_1: { enum: ["a", "b", "c"] },
    // my_tuple_1: { tuple: ["string", "number", "boolean"] },
    my_array_1: { type: "array", value_schema: "number" },
    my_array_2: { value_schema: "number" },
    my_val_scheme_1: { value_schema: "number" }, // ERR - should be have type `object` otherwise it will be an array.
    my_val_scheme_2: { type: "object", value_schema: "number" },
    my_union_1: { type: ["string", "number", "boolean"] },
}, (args) => {
    const my_str = args.my_str;
    const my_nr = args.my_nr;
    // @ts-expect-error
    const my_opt_nr_1 = args.my_opt_nr_1;
    // @ts-expect-error
    const my_opt_nr_2 = args.my_opt_nr_2;
    // @ts-expect-error
    const my_opt_nr_3 = args.my_opt_nr_3;
    const my_non_opt_nr_1 = args.my_non_opt_nr_1;
    const my_non_opt_nr_2 = args.my_non_opt_nr_2;
    const my_enum_1 = args.my_enum_1;
    // const my_tuple_1: [string, number, boolean] = args.my_tuple_1;
    const my_array_1 = args.my_array_1;
    const my_array_2 = args.my_array_2;
    // @ts-expect-error
    const my_val_scheme_1 = args.my_val_scheme_1;
    const my_val_scheme_2 = args.my_val_scheme_2;
    const my_union_1 = args.my_union_1;
    // const my_union_3: string | number | boolean = {} as InferEntry<["string", "number", "boolean"]>;
    const X = undefined;
    const _x = X; // should be a tuple type
});
export {};
//# sourceMappingURL=entry.js.map