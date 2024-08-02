/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Logger.

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
            this.thread = libcluster.worker ? ` [thread-${libcluster.worker.id}]${parseInt(libcluster.worker.id) < 10 ? ":" : ":"}` : " [thread-0]:";
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
            @name: ...args
            @descr: The data to log.
            @type: array
     */
    log(level, ...args) {
        if (level > this.log_level) { return ; }
        let msg = new vlib.Date().format("%d-%m-%y %H:%M:%S");
        msg += `${this.thread} `;
        for (let i = 0; i < args.length; i++) {
            msg += args[i] + " ";
        }
        console.log(msg); 
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
            @name: prefix
            @descr: The error prefix.
            @type: string
            @warning:
                This parameter is only enabled when two parameters are passed. Otherwise parameter 1 will be the `err` parameter.
        @param:
            @name: err
            @descr: The error object or string.
            @type: Error, string
     */
    error(prefix, err) {
        let msg;
        if (err == null) {
            err = prefix;
            prefix = "";
        }
        if (typeof err === "string") {
            msg = `${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} ${prefix}${err}`;
        } else if (err != null) {
            msg = `${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} ${prefix}${err.stack || err.message}`;
        }
        if (msg) {
            console.error(msg); 
            if (this.error_stream) {
                msg += '\n';
                this.error_stream.write(msg);
                if (this.max_mb != null && this._random(1, 100) <= 1) {
                    this._truncate(this.error_path).catch(console.error)
                }
            }
        }
    }

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
};