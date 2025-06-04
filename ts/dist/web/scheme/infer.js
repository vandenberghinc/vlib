/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Infer a scheme item to a type.
 */
export {};
// // -------------------------------------------------------------
// // INTERNAL TESTS
// function test_infer_scheme<
//     const S extends Record<string, EntryObject | Cast.Castable>
// >(s: S, callback: (i: InferScheme<S>) => void) {}
// test_infer_scheme(
//     {
//         my_str: "string",
//         my_nr: "number",
//         my_opt_nr_1: { type: "number", required: false },
//         my_opt_nr_2: { type: "number", required: () => true }, // cant resolve funcs
//         my_opt_nr_3: { type: "number", required: () => false }, // cant resolve funcs
//         my_non_opt_nr_1: { type: "number", def: 0 },
//         my_non_opt_nr_2: { type: "number", def: () => 0 },
//         my_enum_1: { enum: ["a", "b", "c"] },
//         my_tuple_1: { tuple: ["string", "number", "boolean"] },
//         my_array_1: { type: "array", value_scheme: "number" },
//         my_array_2: { value_scheme: "number" },
//         my_val_scheme_1: { value_scheme: "number" },// err
//         my_val_scheme_2: { type: "object", value_scheme: "number" },
//     },
//     (args) => {
//         const my_str: string = args.my_str;
//         const my_nr: number = args.my_nr;
//         // @ts-expect-error
//         const my_opt_nr_1: number = args.my_opt_nr_1;
//         // @ts-expect-error
//         const my_opt_nr_2: number = args.my_opt_nr_2;
//         // @ts-expect-error
//         const my_opt_nr_3: number = args.my_opt_nr_3;
//         const my_non_opt_nr_1: number = args.my_non_opt_nr_1;
//         const my_non_opt_nr_2: number = args.my_non_opt_nr_2;
//         const my_enum_1: "a" | "b" | "c" = args.my_enum_1;
//         const my_tuple_1: [string, number, boolean] = args.my_tuple_1;
//         const my_array_1: number[] = args.my_array_1;
//         const my_array_2: number[] = args.my_array_2;
//         // @ts-expect-error
//         const my_val_scheme_1: Record<string, number> = args.my_val_scheme_1;
//         const my_val_scheme_2: Record<string, number> = args.my_val_scheme_2;
//     }
// );
//# sourceMappingURL=infer.js.map