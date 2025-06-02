/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as vlib from "../../../index.js";
import { Path } from "../../../index.js";
import type { Transformer } from "../transformer/transformer.js";
/**
 * Log helper, to log a message for a source file.
 */
export declare function log_helper(log_path: Path, prefix: undefined | string, ...args: any[]): void;
/**
 * The Source class represents a source file in the plugin system.
 * The source object acts as a pass-through passed down the plugin chain.
 * Each plugin can modify the source data and mark it as changed.
 */
export declare class Source<T extends "loaded" | "empty" = "loaded" | "empty"> {
    /** When the current path is a ts dist file then optionally the source ts file can be stored in this attribute. */
    ts_src: undefined | Path;
    config: Transformer.Config;
    in_memory: boolean;
    /** The path of the source object. */
    path: Path;
    /**
     * The non unique id path used for logging.
     * @note This is not guaranteed to be unique.
     * @warning This should not be used for anything else than logging.
     *          Since this path might be resolved correctly.
     */
    non_unique_id: Path;
    /** The loaded source data. */
    data: T extends "loaded" ? string : undefined | string;
    /** Flag to indicate if the source still requires a load call. */
    requires_load: T extends "loaded" ? undefined : boolean;
    /**
     * Each version of the edited `data` transformation.
     */
    changes: string[];
    static log_level_for_changes: number;
    /** Has been changed by the pipeline callbacks. */
    changed: boolean;
    /** Type dist for js like files and src for ts like files */
    type: "dist" | "src";
    is_src: boolean;
    is_dist: boolean;
    /** Forwarded Transformer.Config attributes. */
    debug: vlib.Debug;
    interactive_mutex: vlib.Mutex;
    /** Methods. */
    constructor(path: string | Path, type: "dist" | "src", data: undefined | string, 
    /** When the current path is a ts dist file then optionally the source ts file can be stored in this attribute. */
    ts_src: undefined | Path, config: Transformer.Config, in_memory: boolean);
    /** Safely get the ts_src, ensuring it exists. */
    get safe_ts_src(): Path;
    /**
     * Log functions to log a (process) message for this source.
     *
     * @warning Keep this private since the user should use `Transformer.log` or `Plugin.log` since that has an attached plugin id.
     *
     * @note That we do not use the `debug` instance here.
     *       The plugin should use `if (this.debug.on(1)) source.log()` to log messages.
     */
    private log;
    private warn;
    private error;
    /**
     * Add a change to the source data.
     * @note This function does not mark the source as changed.
     *       This function should be called when a plugin callback has made a change to the source data.
     *       And the `changes` behaviour is enabled.
     * @param plugin The plugin that made the change.
     * @param old_data The old data of the source file before the change.
     */
    add_change(plugin: Plugin | Plugin.Id, old: {
        data: string;
    }): void;
    /**
     * Load the source data
     * Should be chained like `if (source.requires_load) { await source.load(); source.assert_load(); }`.
     */
    load(): Promise<void>;
    assert_load(): asserts this is Source<"loaded">;
    /**
     * Save the source data to the file system.
     * @note This function only saves the data when any changes were made.
     */
    save({ plugin, yes, /** @warning never change to `true` as default, warning docstring inside why. */ }: {
        plugin: Plugin | Plugin.Id;
        yes?: boolean;
    }): Promise<this>;
    /**
     * Replaces characters between start and end indices with the given substring.
     * Automatically assigns attribute `changed` to true.
     */
    replace_indices(substr: string, start: number, end: number): void;
    /** Cast to string. */
    toString(): string;
}
/**
 * The response object for the plugin initialization.
 */
type InitResponse = void | {
    error: string;
} | Promise<InitResponse>;
/**
 * A plugin object.
 * @warning The derived classes of Plugin can not be extended to create new plugins, rather join them.
 * @throws A runtime error when the derived class did not define attribute `static readonly id: Plugin.Id`.
 */
export declare abstract class Plugin<Type extends Plugin.Type = Plugin.Type> {
    /** Static id, every subclass must override this or a runtime error will be thrown. */
    static readonly id: Plugin.Id;
    /** The id of the plugin, auto derived upon construction from the static attribute */
    readonly id: Plugin.Id;
    /** The plugin type, on which files it will be processed. */
    readonly type: Type;
    /** Has `src` in type */
    has_src: boolean;
    /** Has `dist` in type */
    has_dist: boolean;
    /**
     * The templates & exact templates to insert into the source callback files.
     * Use _prefix names to avoid conflicts for derived plugins.
     */
    readonly _templates?: Record<string, string>;
    readonly _exact_templates?: Record<string, string>;
    /** The debug instance, later added when the plugin is executed. */
    readonly debug: vlib.Debug;
    /**
    * The initialize callback.
    * This can be used to set plugin-specific data or to perform any initialization logic.
    */
    init?(this: Plugin, ...args: any[]): InitResponse;
    /** The callback function that will be called on source files. */
    callback?(this: Plugin, src: Source<"loaded">): void | Promise<void>;
    /**
     * The callback to join this plugin with the same type of plugin
     * For instance when multiple UpsertRuntimeVars plugins are defined they can just as good be joined.
     * This can happen since some plugins use other plugins internally.
     * @todo the current implementation just forwards the callback when using another plugin internally so thats not supported yet.
     */
    /** Constructor. */
    constructor(opts: Plugin.Opts<Type>);
    /**
     * Log functions to log a (process) message for this source.
     * @note That we do not use the `debug` instance here.
     *       The plugin should use `if (this.debug.on(1)) source.log()` to log messages.
     */
    log(source: Source<"loaded" | "empty">, ...message: any[]): void;
    warn(source: Source<"loaded" | "empty">, ...message: any[]): void;
    error(source: Source<"loaded" | "empty">, ...message: any[]): void;
    /**
     * Create a manual `on` function to detect used log levels.
     */
    on(level: number): boolean;
    /** Cast to string. */
    toString(): string;
}
/**
 * Plugin types and static functions.
 */
export declare namespace Plugin {
    /**
     * The base plugin type options, later a union of OR types is also supported.
     * Keep this local, let users use the `Plugin.Type` namespace to access the types.
     */
    type Type = Type.Base | Set<Type.Base>;
    namespace Type {
        type Base = "dist" | "src";
        /**
         * Check if a given plugin type matches a query base type.
         * @param query
         *      The type or types to check against the plugin type.
         *      When the query is an array type then it will perform an OR check.
         */
        const has: (type: undefined | Type, query: Base | Base[]) => boolean;
    }
    /**
     * Plugin constructor options.
     */
    type Opts<Type extends Plugin.Type = Plugin.Type> = {
        type: Type | Plugin.Type.Base[];
        init?: (this: Plugin<Type>, ...args: any[]) => InitResponse;
        callback?: (this: Plugin<Type>, src: Source<"loaded">) => void | Promise<void>;
        templates?: Record<string, string>;
        exact_templates?: Record<string, string>;
    };
    /**
     * A special type for the plugin identifier.
     * Mainly so we can distinguish between different a string and a plugin id inside `log_helper`.
     */
    class Id extends String {
        id: string;
        /**
         * Also define a id attribute so we can do a universal `x.id` on both Plugin.Id and Plugin.
         */
        constructor(id: string);
        /** Get the string value of the plugin id. */
        value(): string;
        toString(): string;
    }
}
export {};
