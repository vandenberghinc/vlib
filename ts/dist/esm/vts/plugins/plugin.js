/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
// External imports.
import * as fs from "fs";
import * as vlib from "../../vlib/index.js";
import { Path } from "../../vlib/index.js";
import { compute_diff } from "../utils/compute_diff.js";
/** The last log, used to detect if the last log was from the same source+plugin */
const last_log = [undefined, undefined];
/**
 * Log helper, to log a message for a source file.
 */
export function log_helper(log_path, prefix, ...args) {
    // vlib.debug("Logging ", {
    //     log_path: log_path.data,
    //     prefix,
    //     args,
    // });
    let plugin = undefined;
    for (let i = 0; args.length > i; i++) {
        if (args[i] instanceof Plugin.Id) {
            plugin = args[i].id;
            args[i] = "";
            break; // stop after, otherwise we cant log plugins or ids.
        }
        else if (args[i] instanceof Plugin) {
            plugin = args[i].id.id;
            args[i] = "";
            break; // stop after, otherwise we cant log plugins or ids.
        }
    }
    if (last_log[1] === plugin && last_log[0]?.path === log_path.path) {
        vlib.debug.raw(vlib.logging.directive.enforce, `    ${prefix ?? ""}`, ...args);
    }
    else {
        vlib.debug.raw(vlib.logging.directive.enforce, `${vlib.Color.cyan(log_path.path)}${plugin ? ` ${vlib.Colors.gray}(${plugin})${vlib.Colors.end}` : ""}\n    ${prefix ?? ""}`, ...args);
    }
    last_log[0] = log_path;
    last_log[1] = plugin;
}
/**
 * The Source class represents a source file in the plugin system.
 * The source object acts as a pass-through passed down the plugin chain.
 * Each plugin can modify the source data and mark it as changed.
 */
export class Source {
    ts_src;
    config;
    in_memory;
    /** The path of the source object. */
    path;
    /**
     * The non unique id path used for logging.
     * @note This is not guaranteed to be unique.
     * @warning This should not be used for anything else than logging.
     *          Since this path might be resolved correctly.
     */
    non_unique_id;
    /** The loaded source data. */
    data;
    /** Flag to indicate if the source still requires a load call. */
    requires_load;
    /**
     * Each version of the edited `data` transformation.
     */
    changes = [];
    /** Has been changed by the pipeline callbacks. */
    changed = false;
    /** Type dist for js like files and src for ts like files */
    type;
    is_src;
    is_dist;
    // /** Changed - @debug Only for pure debugging since the plugin is not accessable here. */
    // private _changed: boolean = false;
    // get changed(): boolean { return this._changed; }
    // set changed(value: boolean) {
    //     if (this._changed !== value) {
    //         this._changed = value;
    //         if (this.debug.on(1)) { this.log(this.debug.loc(1).abs_id + ": Marking source as changed."); }
    //     }
    // }
    /** Forwarded Transformer.Config attributes. */
    debug;
    interactive_mutex;
    /** Methods. */
    constructor(path, type, data, 
    /** When the current path is a ts dist file then optionally the source ts file can be stored in this attribute. */
    ts_src, config, in_memory) {
        this.ts_src = ts_src;
        this.config = config;
        this.in_memory = in_memory;
        this.path = path instanceof Path ? path : new Path(path);
        this.type = type;
        this.is_src = this.type === "src";
        this.is_dist = this.type === "dist";
        this.non_unique_id = new Path(this.path.path); /** @warning deep copy since this object might be edited later by the Tranformer. */
        this.data = data; // its required since we wanna be able to load with `await new Args(...).load()`;
        this.requires_load = (typeof this.data === "string" ? undefined : true);
        this.debug = config.debug;
        this.interactive_mutex = config.interactive_mutex;
    }
    /** Safely get the ts_src, ensuring it exists. */
    get safe_ts_src() {
        if (!this.ts_src)
            throw new Error(`Source "${this.path.path}" is not a TypeScript dist file, cannot ensure ts_src.`);
        if (!(this.ts_src instanceof Path))
            throw new Error(`Source "${this.path.path}" ts_src is not a Path instance.`);
        return this.ts_src;
    }
    /**
     * Log functions to log a (process) message for this source.
     *
     * @warning Keep this private since the user should use `Transformer.log` or `Plugin.log` since that has an attached plugin id.
     *
     * @note That we do not use the `debug` instance here.
     *       The plugin should use `if (this.debug.on(1)) source.log()` to log messages.
     */
    log(...args) {
        log_helper(this.non_unique_id, undefined, ...args);
    }
    warn(...args) {
        log_helper(this.non_unique_id, vlib.Color.yellow_bold("warning "), ...args);
    }
    error(...args) {
        log_helper(this.non_unique_id, vlib.Color.red_bold("error "), ...args);
    }
    /**
     * Add a change to the source data.
     * @note This function does not mark the source as changed.
     *       This function should be called when a plugin callback has made a change to the source data.
     *       And the `changes` behaviour is enabled.
     * @param plugin The plugin that made the change.
     * @param old_data The old data of the source file before the change.
     */
    add_change(plugin, old) {
        /**
         * @warning dont check for `this.changed` since
         *          The transformer already checks for local changes between plugin calls.
         *          Because otherwise we would add the same diff multiple times.
         * if (!this.changed) { ... }
         */
        if (!this.data) {
            return this.error(plugin, `Source data is not loaded, cannot check changes.`);
        }
        if (old.data === this.data) {
            return this.warn(plugin, `No changes made in source data, but marked as changed.`);
        }
        this.changes.push(old.data);
        if (
        // only in yes mode otherwise the changes will be shown when prompting write permission.
        this.config.yes
            && this.debug.on(2)) {
            const { status, diff } = compute_diff({
                new: this.data,
                old: old.data,
                prefix: "        ",
            });
            if (status === "identical") {
                return this.warn(plugin, `No changes made in source data, but marked as changed.`);
            }
            else if (status === "diff") {
                this.log(plugin, `Changes made in source data, computing diff... [1]`);
                if (diff) {
                    // Log the diff.
                    this.log(plugin, "    " + diff.trimStart());
                }
            }
            else {
                // @ts-expect-error
                this.error(plugin, `Unknown diff status "${status.toString()}" for source data changes.`);
            }
        }
    }
    /**
     * Load the source data
     * Should be chained like `if (source.requires_load) { await source.load(); source.assert_load(); }`.
     */
    async load() {
        this.data = await fs.promises.readFile(this.path.path, 'utf8');
        this.requires_load = false;
    }
    assert_load() {
        if (typeof this.data !== "string") {
            throw new Error(`Assert failed, source "${this.path.path}" is not loaded.`);
        }
        this.requires_load = false;
    }
    /**
     * Save the source data to the file system.
     * @note This function only saves the data when any changes were made.
     */
    async save({ plugin, yes = false, /** @warning never change to `true` as default, warning docstring inside why. */ }) {
        if (this.data && this.changed) {
            /**
             * Interactive mode, we will show the diff and ask for confirmation.
             *
             * @warning ENSURE we always check for user permission in non yes mode.
             *          This because some plugins like `Header` edit source files.
             *          So we need to ensure the user is aware of the changes.
             */
            if (!yes) {
                // Acquire lock and ensure it's always released
                await this.interactive_mutex.lock();
                try {
                    if (this.changes.length === 0) {
                        this.error(plugin, `No source data changes captured, but marked as changed. This should not happen. Transformer config: ${vlib.Color.object(this.config)}`);
                        return this;
                    }
                    const multiple = this.changes.length > 1;
                    for (let i = 0; i < this.changes.length; i++) {
                        if (multiple)
                            this.log(plugin, `Transformation ${i + 1}`);
                        const { status, diff } = compute_diff({
                            new: this.changes[i + 1] ?? this.data,
                            old: this.changes[i],
                            prefix: multiple ? "            " : "        ",
                            trim_keep: 2,
                        });
                        if (status === "identical") {
                            this.warn(plugin, `No changes made in source data, but marked as changed.`);
                        }
                        else if (status === "diff") {
                            this.log(plugin, `Changes made in source data, computing diff... [2]`);
                            this.log(plugin, multiple ? "" : "    " + diff.trimStart());
                        }
                    }
                    if (!await vlib.logging.confirm(`[${vlib.Color.green_bold("Interactive")}] Do you want to save the changes to "${this.path.path}"?`)) {
                        console.log(vlib.Color.red_bold("Aborted"));
                        process.exit(1);
                    }
                    last_log[0] = undefined; // reset last log due to prompt.
                }
                finally {
                    this.interactive_mutex.unlock();
                }
            }
            // Write changes to disk.
            if (this.debug.on(1))
                this.log(plugin, `Saved source changes [${vlib.utils.format_bytes(Buffer.byteLength(this.data, 'utf8'))}]`);
            await fs.promises.writeFile(this.path.path, this.data, 'utf8');
        }
        return this;
    }
    /**
     * Replaces characters between start and end indices with the given substring.
     * Automatically assigns attribute `changed` to true.
     */
    replace_indices(substr, start, end) {
        if (this.data == null) {
            throw new Error(`Source data is not loaded, cannot replace indices.`);
        }
        this.data = this.data.slice(0, start) + substr + this.data.slice(end);
        this.changed = true;
    }
    /** Cast to string. */
    toString() {
        return `Source(${vlib.Color.object({ path: this.path.path })})`;
    }
}
/**
 * A plugin object.
 * @warning The derived classes of Plugin can not be extended to create new plugins, rather join them.
 * @throws A runtime error when the derived class did not define attribute `static readonly id: Plugin.Id`.
 */
export class Plugin {
    /** Static id, every subclass must override this or a runtime error will be thrown. */
    static id;
    /** The id of the plugin, auto derived upon construction from the static attribute */
    id;
    /** The plugin type, on which files it will be processed. */
    type;
    /** Has `src` in type */
    has_src = false;
    /** Has `dist` in type */
    has_dist = false;
    /**
     * The templates & exact templates to insert into the source callback files.
     * Use _prefix names to avoid conflicts for derived plugins.
     */
    _templates;
    _exact_templates;
    /** The debug instance, later added when the plugin is executed. */
    debug = vlib.log;
    /**
     * A list of linked plugins what will also be initialized when this plugin is initialized.
     * Useful for when derived plugins use internal plugins.
     */
    plugins = [];
    /**
     * Initialize the plugin
     * This must be called before using the plugin.
     */
    async build(opts) {
        if (opts?.debug) {
            this.debug = opts.debug;
        }
        if (this.plugins.length > 0) {
            for (const plugin of this.plugins) {
                await plugin.build(opts);
            }
        }
        if (this.init) {
            const value = await this.init(opts);
            if (typeof value === "object" && value.error) {
                throw new Error(`Plugin "${this.id.id}" initialization failed: ${value.error}`);
            }
        }
        // do not load source here, only on demand.
    }
    /**
     * The callback to join this plugin with the same type of plugin
     * For instance when multiple UpsertRuntimeVars plugins are defined they can just as good be joined.
     * This can happen since some plugins use other plugins internally.
     * @todo the current implementation just forwards the callback when using another plugin internally so thats not supported yet.
     */
    /** Constructor. */
    constructor(opts) {
        this.type = Array.isArray(opts.type) ? new Set(opts.type) : opts.type;
        if (opts.callback)
            this.callback = opts.callback.bind(this);
        if (opts.init)
            this.init = opts.init.bind(this);
        this._templates = opts.templates;
        this._exact_templates = opts.exact_templates;
        this.has_src = Plugin.Type.has(this.type, "src");
        this.has_dist = Plugin.Type.has(this.type, "dist");
        // Init id - pull the static id off the *actual* subclass
        const ctor = this.constructor;
        if (!("id" in ctor) || !(ctor.id instanceof Plugin.Id)) {
            throw new Error(`Plugin "${ctor.name}" did not define static attribute "static readonly id: Plugin.Id". Ensure this attribute is defined in the derived plugin class.`);
        }
        this.id = ctor.id;
    }
    /**
     * Log functions to log a (process) message for this source.
     * @note That we do not use the `debug` instance here.
     *       The plugin should use `if (this.debug.on(1)) source.log()` to log messages.
     */
    log(source, ...message) {
        log_helper(source.non_unique_id, undefined, this.id, ...message);
    }
    warn(source, ...message) {
        log_helper(source.non_unique_id, vlib.Color.yellow_bold("warning "), this.id, ...message);
    }
    error(source, ...message) {
        log_helper(source.non_unique_id, vlib.Color.red_bold("error "), this.id, ...message);
    }
    /**
     * Create a manual `on` function to detect used log levels.
     */
    on(level) {
        return level <= this.debug.level.n;
    }
    /** Cast to string. */
    toString() {
        return `${vlib.Color.cyan("vts")}${vlib.Color.gray('.')}${vlib.Color.cyan("Plugin")} ${vlib.Color.object({
            id: this.id.id,
            type: Array.isArray(this.type) ? Array.from(this.type).join(", ") : this.type,
            ...(this._templates ? { templates: Object.keys(this._templates).join(", ") } : {}),
            ...(this._exact_templates ? { exact_templates: Object.keys(this._exact_templates).join(", ") } : {}),
        })}`;
    }
}
/**
 * Plugin types and static functions.
 */
(function (Plugin) {
    let Type;
    (function (Type) {
        /**
         * Check if a given plugin type matches a query base type.
         * @param query
         *      The type or types to check against the plugin type.
         *      When the query is an array type then it will perform an OR check.
         */
        Type.has = (type, query) => Array.isArray(query)
            ? query.some(q => Type.has(type, q))
            : type instanceof Set
                ? type.has(query)
                : type === query;
    })(Type = Plugin.Type || (Plugin.Type = {}));
    /**
     * A special type for the plugin identifier.
     * Mainly so we can distinguish between different a string and a plugin id inside `log_helper`.
     */
    class Id extends String {
        id;
        /**
         * Also define a id attribute so we can do a universal `x.id` on both Plugin.Id and Plugin.
         */
        constructor(id) {
            if (!id) {
                throw new Error(`Plugin id cannot be empty.`);
            }
            else if (!/^[\w-_]+$/.test(id)) {
                throw new Error(`Plugin id "${id}" is invalid, must only contain alphanumeric characters, underscores and dashes.`);
            }
            super(id);
            this.id = id;
        }
        /** Get the string value of the plugin id. */
        value() { return this.id; }
        toString() { return this.id; }
    }
    Plugin.Id = Id;
})(Plugin || (Plugin = {}));
//# sourceMappingURL=plugin.js.map