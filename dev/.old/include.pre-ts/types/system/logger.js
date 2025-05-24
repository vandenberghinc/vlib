/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Logger.

vlib.LogSource = class extends String {
    constructor(name) {
        super(name)
    }
}

/*  @docs:
    @chapter: System
    @title: Logger
    @descr:
        The logger object.
    @param:
        @name: log_level
        @descr: The active log level.
        @type: number
    @param:
        @name: log_path
        @descr: The optional log path.
        @type: string
    @param:
        @name: error_path
        @descr: The optional error path.
        @type: string
    @param:
        @name: max_mb
        @descr: The max mb to keep for the log files, when defined the log files will automatically be truncated.
        @type: number
    @param:
        @name: threading
        @descr: Enable threading behaviour, when enabled messages are prefixed with the thread id.
        @type: boolean
 */
vlib.Logger = class Logger {
    constructor({
        log_level = 0,
        log_path = null,
        error_path = null,
        threading = false,
        max_mb = null,
    }) {

        // Attributes.
        this.log_level = log_level;
        this.log_path = log_path;
        this.error_path = error_path;
        this.log_stream = undefined;
        this.error_stream = undefined;
        this.threading = threading;
        this.max_mb = max_mb;
        this.thread = ":";
        if (this.threading) {
            this.thread = libcluster.worker ? ` (thread-${libcluster.worker.id}):` : " (thread-0):";
        }

        // Assign paths.
        if (this.log_path && this.error_path) {
            this.assign_paths(this.log_path, this.error_path);
        }
    }

    // Initialize log streams
    /*  @docs:
        @title: Assign Paths
        @descr: Assign paths for the logger class.
        @param:
            @name: log_path
            @descr: The optional log path.
            @type: string
        @param:
            @name: error_path
            @descr: The optional error path.
            @type: string
     */
    assign_paths(log_path, error_path) {
        this.log_path = new vlib.Path(log_path);
        this.error_path = new vlib.Path(error_path);
        this.log_stream = libfs.createWriteStream(this.log_path.str(), { flags: 'a' });
        this.error_stream = libfs.createWriteStream(this.error_path.str(), { flags: 'a' });
    }

    // Log
    /*  @docs:
        @title: Log
        @descr: Log data to the console and file streams when defined.
        @param:
            @name: level
            @descr: The log level of the message.
            @type: number
        @param:
            @name: args
            @descr:
                The data to log.
                The log source can be defined by passing the first `...args` as a `vlib.LogSource` instance.
            @type: any[]
     */
    log(level, ...args) {
        if (level > this.log_level) { return ; }
        let msg = "";
        let index = 0;
        if (args[0] instanceof vlib.LogSource) {
            index = 1;
            msg += `[${args[0]}] `; // keep at start of line, this way modes can also be filtered when reading logs.
        }
        msg += new vlib.Date().format("%d-%m-%y %H:%M:%S");
        msg += `${this.thread} `;
        const slice_length = msg.length;
        for (; index < args.length; index++) {
            msg += args[index];
        }
        console.log(vlib.colors.gray + msg.slice(0, slice_length) + vlib.colors.end + msg.slice(slice_length)); 
        if (this.log_stream) {
            msg += '\n';
            this.log_stream.write(msg);
            if (this.max_mb != null && this._random(1, 100) <= 1) {
                this._truncate(this.log_path).catch(console.error)
            }
        }
    }

    // Log error
    /*  @docs:
        @title: Error
        @descr:
            Log error data to the console and file streams when defined.
        @param:
            @name: mode
            @descr: The error prefix.
            @type: vlib.LogSource
            @warning:
                The log source. However, when this is a string type, it will be processed as error message.
        @param:
            @name: errs
            @descr: The error or string objects.
            @type: (string | error)[]
     */
    error(mode, ...errs) {
        let msg;
        let err = undefined;
        if (mode instanceof vlib.LogSource) {
            mode = `[${mode}] `
        } else {
            err = mode;
            mode = "";
        }
        msg = `${mode}${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} `;
        let is_first = true;
        if (err !== undefined) {
            if (typeof err === "string") {
                msg += "Error: ";
                msg += err;
            } else if (err != null) {
                msg += err.stack ?? err.message;
            }
            is_first = false;
        }
        for (let index = 0; index < errs.length; index++) {
            const err = errs[index];
            if (typeof err === "string") {
                if (is_first) {
                    msg += "Error: ";
                }
                msg += err;
            } else if (err != null) {
                msg += err.stack ?? err.message;
            }
            is_first = false;
        }
        if (msg) {
            console.error(vlib.colors.gray + msg.replace(": Error:", ": " + vlib.colors.red + "Error" + vlib.colors.end + ":"));
            if (this.error_stream) {
                msg += '\n';
                this.error_stream.write(msg);
                if (this.max_mb != null && this._random(1, 100) <= 1) {
                    this._truncate(this.error_path).catch(console.error)
                }
            }
        }
    }

    // Warn.
    warn(level, mode, ...errs) {
        if (level > this.log_level) { return ; }

        let msg;
        let err = undefined;
        if (mode instanceof vlib.LogSource) {
            mode = `[${mode}] `
        } else {
            err = mode;
            mode = "";
        }

        msg = `${mode}${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} `;

        let is_first = true;
        if (err !== undefined) {
            if (typeof err === "string") {
                msg += "Warning: ";
                msg += err;
            } else if (err != null) {
                let add = (err.stack ?? err.message);
                if (add.startsWith("Error: ")) {
                    add = "Warning: " + add.slice(7);
                }
                msg += add;
            }
            is_first = false;
        }

        for (let index = 0; index < errs.length; index++) {
            const err = errs[index];
            if (typeof err === "string") {
                if (is_first) {
                    msg += "Warning: ";
                }
                msg += err;
            } else if (err != null) {
                let add = (err.stack ?? err.message);
                if (add.startsWith("Error: ")) {
                    add = "Warning: " + add.slice(7);
                }
                msg += add;
            }
            is_first = false;
        }
        if (msg) {
            console.error(vlib.colors.gray + msg.replace(": Warning:", ": " + vlib.colors.yellow + "Warning" + vlib.colors.end + ":"));
            if (this.error_stream) {
                msg += '\n';
                this.error_stream.write(msg);
                if (this.max_mb != null && this._random(1, 100) <= 1) {
                    this._truncate(this.error_path).catch(console.error)
                }
            }
        }
    }
    warning(...args) { return this.warn(...args); }

    // Truncate.
    async _truncate(path) {
        return new Promise(async (resolve, reject) => {
            try {
                path.reset(); // reset stat.
                if (path.stat.size / 1024 / 1024 < this.max_mb) {
                    return resolve();
                }
                const max_kb = this.max_mb * 1024;
                const keep_mb = 100 > max_kb ? parseInt(max_kb * 0.05) : 100;
                await path.truncate(Math.max(0, path.stat.size - keep_mb));
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    // Random number.
    _random(min = 1, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Initialize a log source, can be used to indicate the log program / script.
    LogSource(name) {
        return new vlib.LogSource(name);
    }
};