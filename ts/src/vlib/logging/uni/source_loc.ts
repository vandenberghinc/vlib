/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/**
 * Source location.
 * @note Accessible in the frontend web library as well.
 * @nav Logging
 * @docs
 */
export class SourceLoc {

    /** Attributes. */
    public file: string | "<unknown>" = "<unknown>";
    public filename: string | "<unknown>" = "<unknown>";
    public line: number | "?" = "?";
    public column: number | "?" = "?";
    public caller: string | "<unknown>" | "<root>" | "<anonymous>" = "<unknown>";
    public id: string | "<unknown>:?:?" = "<unknown>:?:?";
    public abs_id: string | "<unknown>:?:?" = "<unknown>:?:?";
    private adjust: number;

    /**
     * Constructor.
     * @docs
     */
    constructor(adjust = 0) {
        this.adjust = adjust;
        if (typeof Error.prepareStackTrace === "function") {
            // Node.
            this._captureWithCallSite();
        } else {
            // Browser.
            this._captureWithStackString();
        }
    }
    
    // ------------------------------------------------------------------------

    /** Helpers. */
    private _captureWithCallSite() {
        // 0) set defaults
        this.file = "<unknown>";
        this.filename = "<unknown>";
        this.line = "?";
        this.column = "?";
        this.caller = "<unknown>";
        this.id = "<unknown>:?:?";
        this.abs_id = "<unknown>:?:?";

        // Save original prepareStackTrace
        const orig_prepare = Error.prepareStackTrace;

        // Install our collector
        Error.prepareStackTrace = (_err, sites) => sites;
        Error.stackTraceLimit = 3 + this.adjust;

        // Capture into holder, skipping this constructor
        const holder: { stack?: NodeJS.CallSite[] } = {};
        Error.captureStackTrace(holder, SourceLoc);
        const sites = holder.stack;

        // Restore original
        Error.prepareStackTrace = orig_prepare;
        if (!sites) {
            return;
        }

        // Pick the frame at index
        const site = sites[this.adjust];
        if (!site) {
            return;
        }

        /**
         * Extract file path.
         * @warning Never use the relative path since we also use the SourceLoc for saving logs ...
         *          That later can be parsed into an array of logs, then when loading the source loc 
         *          the relative path has likely changed.
         */
        let file_path = "<unknown>";
        try {
            // use try for web envs.
            file_path = site.getFileName() || "<unknown>";
        } catch (_) { }
        this.file = file_path;

        // Return unknown on default node filenames.
        if (/^(?:node|module_job|loader):/.test(this.file)) {
            this._as_unknown();
            return;
        }

        // Extract file name.
        const pos = file_path.lastIndexOf('/');
        const win = file_path.lastIndexOf('\\');
        const cut = pos > win ? pos : win;
        this.filename = cut < 0 ? file_path : file_path.slice(cut + 1);


        // Get caller.
        this.caller = site.getFunctionName()
            || site.getMethodName()
            || "<anonymous>";
        // if it really is a method on a class/obj, include the type
        if (!site.getFunctionName()) {
            const t = site.getTypeName();
            const m = site.getMethodName();
            if (t && m) {
                this.caller = `${t}.${m}`;
            }
        }
        if (this.caller === "<anonymous>") {
            // if it's an anonymous function, try to get the name of the caller
            const caller = site.getThis();
            if (caller && typeof caller === "object") {
                this.caller = caller.constructor.name || "<anonymous>";
            }
        }
        // do this last since it seems to match also on non top level code sometimes.
        if (this.caller === "<anonymous>" && site.isToplevel()) {
            this.caller = "<root>";
        }

        // 9) line & column
        this.line = site.getLineNumber() ?? "?";
        this.column = site.getColumnNumber() ?? "?";

        // 10) build id string
        const suffix = `:${this.line}:${this.column}` + (this.caller === "<root>" ? "" : (this.caller ? `:${this.caller}` : ""));
        this.id = `${this.filename}${suffix}`;
        this.abs_id = `${this.file}${suffix}`;

        // console.log("SourceLoc", {
        //     file: this.file,
        //     filename: this.filename,
        //     line: this.line,
        //     column: this.column,
        //     caller: this.caller,
        //     id: this.id
        // });
    }
    private _captureWithStackString() {
    
        // We skip this.constructor’s own line + this.adjust frames
        const stack = (new Error()).stack?.split("\n") ?? [];
        // first line is the “Error” message, so skip 1 + adjust
        const frameLine = stack[1 + this.adjust]?.trim();
        if (!frameLine) return;

        // Chrome/Safari/Firefox stack frame regex:
        //    “at funcName (file://...:line:col)”
        // or “at file://...:line:col”
        const re = /^\s*at\s+(?:(\S+)\s+\()?(.+?):(\d+):(\d+)\)?$/;
        const m = frameLine.match(re);
        if (!m) return;

        const [, fnName, fp, ln, col] = m;
        this.file = fp;
        const cut = Math.max(fp.lastIndexOf("/"), fp.lastIndexOf("\\"));
        this.filename = cut < 0 ? fp : fp.slice(cut + 1);
        this.line = parseInt(ln, 10) || "?";
        this.column = parseInt(col, 10) || "?";

        // normalize the function name
        let fn = fnName || "<anonymous>";
        if (fn === "<anonymous>") fn = stack.length > 2 ? stack[2].trim() : fn;
        this.caller = fn === "" ? "<anonymous>" : fn;

        const suffix = `:${this.line}:${this.column}` +
            (this.caller === "<root>" ? "" : `:${this.caller}`);
        this.id = `${this.filename}${suffix}`;
        this.abs_id = `${this.file}${suffix}`;
    }

    // ------------------------------------------------------------------------

    /**
     * Is unknown.
     * @docs
     */
    is_unknown() {
        return this.file === "<unknown>" && this.filename === "<unknown>";
    }

    /** Assign as unknown. */
    private _as_unknown() {
        this.file = "<unknown>";
        this.filename = "<unknown>";
        this.line = "?";
        this.column = "?";
        this.caller = "<unknown>";
        this.id = "<unknown>:?:?";
        return true;
    }
}
