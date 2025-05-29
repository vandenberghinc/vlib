/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
export {};
// // Imports.
// import type { Transform } from "../types/index.m.js";
// import { throw_error } from "./error.js";
// import { Query } from "./query.js";
// /** CLI argument type. */
// export class Arg<
//     T extends "id" | "index" = "id" | "index",
//     V extends Arg.Value = Arg.Value,
// > {
//     /**
//      * The identifier query.
//      */
//     id: T extends "id"
//         ? string | string[]| Query.Or<string>
//         : never;
//     /**
//      * The index of the argument in the command arguments array.
//      * Either the index + name or the identifier must be defined.
//      */
//     index: T extends "index"
//         ? number
//         : never;
//     /**
//      * The name used as for the callback argument.
//      * 
//      * Is automatically derived from the first id of an OR operation, or the entire AND operation so we can construct a nested object tree.
//      */
//     name: string | Query.And;
//     /**
//      * The type of the argument, when defined the value will be casted, and the returned type will have the correct type.
//      */
//     type?: Arg.Type | Arg.Type[];
//     /**
//      * Whether the argument is required or optional, defaults to `true`.
//      */
//     required?: boolean;
//     /**
//      * Default value, makes the argument optional, preceding `required`.
//      */
//     default?: V;
//     /**
//      * Argument description.
//      */
//     description?: string;
//     /**
//      * Ignore this argument.
//      */
//     ignore?: boolean;
//     /**
//      * Initialize.
//      */
//     constructor(arg: Arg.Opts<T, V>, type: T) {
//         this.id = arg.id as Arg<T>["id"];
//         this.index = arg.index as Arg<T>["index"];
//         this.type = arg.type;
//         this.required = arg.required;
//         this.default = arg.default;
//         this.description = arg.description;
//         this.ignore = arg.ignore;
//         this.name = this.resolve_name(arg);
//     }
//     /**
//      * Resolve the argument name.
//      */
//     private resolve_name(arg: Arg.Opts<T, V>): string | Query.And {
//         if (arg.name) { return arg.name; }
//         let arg_name: undefined | string | string[] | Query.Or<string> = arg.name;
//         if (arg.id == null) {
//             throw new Error(`Required argument attribute "id" is not defined for command with index ${arg.index ?? "?"}.`);
//         }
//         else if (arg.id instanceof Query.And) {
//             arg_name = arg.id[arg.id.length - 1]; // use the last child for `AND` operations.
//             if (Array.isArray(arg_name)) {
//                 arg_name = arg_name[0]; // use the first child for `OR` operations.
//             }
//         }
//         else {
//             let child: string | any[] = arg.id
//             while (child && typeof child !== "string") {
//                 if (child instanceof Query.And) {
//                     child = child[child.length - 1]; // use the last child for `AND` operations.
//                 } else if (Array.isArray(child)) {
//                     child = child[0]; // use the first child for `OR` operations.
//                 }
//             }
//             if (typeof child !== "string") {
//                 throw_error(`Invalid argument id "${Query.to_str(arg.id)}", could not resolve an identifier.`);
//             }
//             // console.log(`Resolving argument name from id "${Query.to_str(arg.id)}" to "${child}".`);
//             arg_name = child;
//             let trim_start = 0, c: string | undefined;
//             while ((c = arg_name.charAt(trim_start)) === "-" || c === " " || c === "\t" || c === "\r" || c === "\n") {
//                 ++trim_start;
//             }
//             if (trim_start > 0) {
//                 arg_name = arg_name.slice(trim_start);
//             }
//             arg_name = arg_name.replaceAll("-", "_").trimEnd();
//             if (typeof arg_name !== "string" || !arg_name) {
//                 throw_error(`Invalid argument id "${Query.to_str(arg.id)}", argument ended up empty after trimming.`);
//             }
//         }
//         if (typeof arg_name !== "string" || !arg_name) {
//             throw_error(`Invalid argument id "${Query.to_str(arg.id)}".`);
//         }
//         return arg_name;
//     }
// }
// /** Argument types. */
// export namespace Arg {
//     /**
//      * Argument constructor options.
//      */
//     export type Opts<
//         T extends "id" | "index" = "id" | "index",
//         V extends Arg.Value = Arg.Value
//     > = T extends "id"
//         ? Transform<Arg<T, V>, "id", "type" | "name", "index", never, never>
//         : Transform<Arg<T, V>, "id" | "name", "type", "id", never, never>
//     /** Identifier query type. */
//     export type Query = string | string[]| Query.Or<string> | Query.And<string | Query.Or<string>>;
//     /**
//      * All supported argument types.
//      */
//     export type Types = {
//         /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */
//         /** Primitive types. */
//         string: string;
//         number: number;
//         boolean: boolean;
//         /**
//          * Arrays.
//          * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
//          */
//         array: string[];
//         "boolean[]": boolean[];
//         "number[]": number[];
//         "string[]": string[];
//         /** Object.s */
//         object: Record<string, any>;
//         /** Maps. */
//         "string:boolean": Map<string, boolean>;
//         "string:number": Map<string, number>;
//         "string:string": Map<string, string>;
//         "string:boolean|number|string": Map<string, boolean | number | string>;
//         "string:boolean|number": Map<string, boolean | number>;
//         "string:boolean|string": Map<string, boolean | string>;
//         "string:number|string": Map<string, number | string>;
//         "string:boolean|number|string|array": Map<string, boolean | number | string | string[]>;
//         "number:boolean": Map<number, number>;
//         "number:number": Map<number, number>;
//         "number:string": Map<number, string>;
//     };
//     /**
//      * Argument string types.
//      */
//     export type Type = keyof Types;
//     /**
//      * The value type of
//      */
//     export type Value = Types[Type];
//     /**
//      * The base type of castable type generics.
//      * @warning never add `undefined` etc here, do that on specific types only. 
//      */
//     export type Castable = Arg.Type | Arg.Type[];
//     /**
//      * Cast a type name or type names union to its corresponding value type.
//      * Also supports already casted value types as input.
//      */
//     export type Cast<T extends undefined | Castable | Arg.Value> =
//         [T] extends [never]
//         ? string // default is string
//         : T extends | null | undefined
//             ? string
//             : T extends Arg.Type[]
//                 ? Arg.Types[T[number]]
//                 : T extends Arg.Type
//                     ? Arg.Types[T]
//                     : never;
// }
//# sourceMappingURL=arg.js.map