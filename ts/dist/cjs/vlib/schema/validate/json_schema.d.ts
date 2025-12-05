/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Note that this file only supports nodejs environments.
 */
import { Path } from "../../generic/path.js";
import { RequiredKeys } from "../../types/types.js";
import { Entries } from "../index.m.web.js";
/**
 * The options for creating a JSON-Schema.
 */
export interface CreateJSONSchemaOpts<S extends Entries.Opts = Entries.Opts> {
    /** The entries schema to convert. */
    schema: S;
    /** Whether unknown object keys are allowed. Defaults to `true`. */
    unknown?: boolean;
    /**
     * Optionally when definedw with a path or path string,
     * write the generates schema to an output file.*/
    output?: string | Path;
    /**
     * The used indent for `JSON.stringify()` when an `output` file is defined.
     * By default no indentation is used. */
    indent?: number;
}
/**
 * Generate a draft-07 JSON-Schema for a validator definition.
 * @param opts.schema The object validator schema to convert, see {@link CreateJSONSchemaOpts} for more info.
 * @throws {InvalidUsageError} When the {@link CreateJSONSchemaOpts.schema} option is missing.
 * @nav Schema
 * @docs
 */
export declare function create_json_schema_sync<const S extends Entries.Opts = Entries.Opts>(opts: CreateJSONSchemaOpts<S>): object;
/**
 * Async version of {@link create_json_schema_sync}.
 * Providing performance benefits when the `opts.output` option is provided.
 * Therefore, for this function the {@link CreateJSONSchemaOpts.output} option is required.
 * @param opts.schema The object validator schema to convert, see {@link CreateJSONSchemaOpts} for more info.
 * @throws {InvalidUsageError} When the {@link CreateJSONSchemaOpts.schema} option is missing.
 * @nav Schema
 * @docs
 */
export declare function create_json_schema<const S extends Entries.Opts = Entries.Opts>(opts: RequiredKeys<CreateJSONSchemaOpts<S>, "output">): Promise<object>;
