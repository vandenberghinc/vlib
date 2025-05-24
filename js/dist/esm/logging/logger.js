/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as fs from 'fs';
// import * as cluster from 'cluster';
import cluster from "cluster";
import { VDate } from "../global/date.js";
import { Path } from "../system/path.js";
import { Colors } from "../system/colors.js";
import { SourceLoc } from './source_loc.js';
import Pipe from './pipe.js';
// ---------------------------------------------------------
// Logger.
/** Log directives */
const IsError = Symbol('vlib.Logger.IsError');
const IsWarning = Symbol('vlib.Logger.IsWarning');
const IsDebug = Symbol('vlib.Logger.IsDebug');
class UseActiveLogLevel extends Number {
    constructor(value) { super(value); }
}
const IsRaw = Symbol('vlib.Logger.Raw');
/** @docs:
 *  @chapter: System
 *  @title: Logger
 *  @descr:
 *      The logger object.
 *  @param:
 *      @name: log_level
 *      @descr: The active log level.
 *      @type: number
 *  @param:
 *      @name: log_path
 *      @descr: The optional log path.
 *      @type: string
 *  @param:
 *      @name: error_path
 *      @descr: The optional error path.
 *      @type: string
 *  @param:
 *      @name: max_mb
 *      @descr: The max mb to keep for the log files, when defined the log files will automatically be truncated.
 *      @type: number
 *  @param:
 *      @name: threading
 *      @descr: Enable threading behaviour, when enabled messages are prefixed with the thread id.
 *      @type: boolean
*/
export class Logger extends Pipe {
    log_path;
    error_path;
    log_stream;
    error_stream;
    max_mb;
    thread;
    debug_filename;
    constructor({ log_level = 0, debug_filename = undefined, log_path = undefined, error_path = undefined, max_mb = undefined, } = {}) {
        // Attributes.
        super({ log_level });
        this.log_path = undefined;
        this.error_path = undefined;
        this.log_stream = undefined;
        this.error_stream = undefined;
        this.max_mb = max_mb;
        this.thread = cluster.worker ? cluster.worker.id.toString() : "master";
        this.debug_filename = debug_filename;
        // Assign paths.
        if (log_path && error_path) {
            this.assign_paths(log_path, error_path);
        }
    }
    // --------------------------------------------------
    // Private.
    _write_count = 0;
    _truncate_interval = 1000; // check every 1000 writes
    /**
     * Truncates the given file by removing lines at the start until its size is under max_bytes.
     * Closes and reopens the associated write stream to ensure subsequent writes go to the truncated file.
     *
     * @param path      The Path instance for the log or error file.
     * @param type Either 'log' or 'error' indicating which stream property to refresh.
     * @param max_bytes Maximum allowed file size in bytes.
     */
    async truncate_log_file(path, type, max_bytes) {
        const file_path = path.str();
        const { size: file_size } = await fs.promises.stat(file_path);
        if (file_size <= max_bytes) {
            return;
        }
        // Calculate tail start and read length
        const start_pos = Math.max(0, file_size - max_bytes);
        const read_length = file_size - start_pos;
        // Read the tail into buffer
        const handle = await fs.promises.open(file_path, 'r');
        let buffer;
        try {
            buffer = Buffer.alloc(read_length);
            await handle.read(buffer, 0, read_length, start_pos);
        }
        finally {
            await handle.close();
        }
        // Align to next newline boundary
        const newline_index = buffer.indexOf('\n');
        const valid_start = newline_index !== -1 ? newline_index + 1 : 0;
        const truncated = buffer.slice(valid_start);
        // Write to temp file and atomically replace
        const temp_path = `${file_path}.tmp_${Date.now()}`;
        await fs.promises.writeFile(temp_path, truncated);
        await fs.promises.rename(temp_path, file_path);
        // Reset and reopen the write stream
        const old_stream = type === 'log' ? this.log_stream : this.error_stream;
        old_stream.close();
        const new_stream = fs.createWriteStream(file_path, { flags: 'a' });
        if (type === 'log') {
            this.log_stream = new_stream;
        }
        else {
            this.error_stream = new_stream;
        }
    }
    // --------------------------------------------------
    // Public.
    /** @docs:
     *  @title: Stop
     *  @descr: Stop the logger and close the file streams.
     */
    stop() {
        if (this.log_stream) {
            console.log("Closing log stream.");
            this.log_stream.close();
        }
        if (this.error_stream) {
            console.log("Closing error stream.");
            this.error_stream.close();
        }
    }
    /** @docs:
     *  @title: Assign Paths
     *  @descr: Assign paths for the logger class.
     *  @param:
     *      @name: log_path
     *      @descr: The optional log path.
     *      @type: string
     *  @param:
     *      @name: error_path
     *      @descr: The optional error path.
     *      @type: string
     */
    assign_paths(log_path, error_path) {
        this.log_path = new Path(log_path);
        this.error_path = new Path(error_path);
        this.log_stream = fs.createWriteStream(this.log_path.str(), { flags: 'a' });
        this.error_stream = fs.createWriteStream(this.error_path.str(), { flags: 'a' });
    }
    /** The log file pattern. */
    static log_file_pattern = /^\(date=(.*?)\)\s*(?:\(loc=(.*?)\))?\s*(?:\(thread=(.*?)\))?\s*(?:\(level=(.*?)\))?\s*(?:\(type=(.*?)\))?:\s*/;
    /**
     * Parse a log file.
     */
    async _parse_log_file(path) {
        if (!path.exists()) {
            throw new Error(`Log file ${path} does not exist.`);
        }
        const logs = [];
        const buff = [];
        await path.read_lines((line) => {
            const match = line.match(Logger.log_file_pattern);
            if (match) {
                console.log("Matched:", match);
                const date = match[1];
                const loc = match[2];
                const thread = match[3];
                const level_int = parseInt(match[4]);
                const level = isNaN(level_int) ? undefined : level_int;
                const type = match[5];
                const message = line.slice(match[0].length) + buff.join('\n');
                buff.length = 0;
                logs.push({
                    date,
                    loc,
                    thread,
                    level,
                    type: type,
                    message,
                });
            }
            else {
                buff.push(line);
                console.log(`Unexpected line format:`, { line });
            }
        });
        if (buff.length > 0) {
            if (logs.length > 0) {
                logs[logs.length - 1].message += "\n" + buff.join('\n');
            }
            else {
                logs.push({
                    date: "unknown",
                    loc: undefined,
                    thread: this.thread,
                    level: 0,
                    type: "log",
                    message: buff.join('\n'),
                });
            }
        }
        return logs;
    }
    // --------------------------------------------------
    // Override the log method to support the file streams.
    /** @docs:
     *  @title: Log
     *  @descr: Log data to the console and file streams when defined.
     *  @param:
     *      @name: level
     *      @descr: The log level of the message.
     *      @type: number
     *  @param:
     *      @name: args
     *      @descr:
     *          The data to log.
     *      @type: any[]
     */
    log(level, ...args) {
        // Forward level when not a number.
        if (typeof level !== "number") {
            args.unshift(level);
            level = 0;
        }
        // Check directives.
        let active_log_level = this.log_level;
        let loc;
        let mode;
        let is_raw = false; // works only in debug mode.
        for (let index = 0; index < args.length; index++) {
            const item = args[index];
            if (item instanceof SourceLoc) {
                loc = item;
            }
            else if (item === IsError || item === IsWarning || item === IsDebug) {
                mode = item;
            }
            else if (item === Infinity) {
                mode = IsRaw;
                args[index] = IsRaw;
            }
            else if (item === IsRaw) {
                is_raw = true;
            }
            else if (item instanceof UseActiveLogLevel) {
                active_log_level = item.valueOf();
            }
            else {
                break;
            }
        }
        ;
        // Dont show location by default.
        // if (loc === undefined) {
        //     loc = new SourceLoc(1);
        // }
        if (mode === IsDebug && this.debug_filename && loc && loc.filename !== this.debug_filename) {
            return;
        }
        ;
        // Create message buffers.
        const msg = [Colors.gray], file_msg = [];
        // Get target log_stream.
        const stream = mode === IsDebug ? undefined : mode === IsError ? this.error_stream : this.log_stream;
        const stream_path = mode === IsDebug ? undefined : mode === IsError ? this.error_path : this.log_path;
        // Skip by log level.
        if (level > active_log_level && !stream) {
            return;
        }
        // Dump buffs wrapper.
        const dump_buffs = () => {
            if (msg.some(x => typeof x === "symbol")) {
                throw new Error("System error, encountered a symbol.");
            }
            // Log.
            if (msg.length > 0 && level <= active_log_level) {
                console.log(msg.join(''));
            }
            // Write to stream.
            if (stream != null && file_msg.length > 0) {
                // In dump_buffs()'s stream.write callback:
                stream.write(file_msg.join('') + "\n", () => {
                    this._write_count++;
                    if (this._write_count >= this._truncate_interval) {
                        this._write_count = 0;
                        this.truncate_log_file(stream_path, // Path instance (this.log_path or this.error_path)
                        stream === this.log_stream ? 'log' : 'error', this.max_mb * 1024 * 1024).catch(console.error);
                    }
                });
            }
            // Empty buffers.
            msg.length = 0;
            file_msg.length = 0;
        };
        /**
         * Add date.
         * @warning Ensure `date` is added 1st to the file_msg buffer.
         */
        if (mode !== IsDebug) {
            const date = new VDate().format("%d-%m-%y %H:%M:%S");
            msg.push(date, " ");
            file_msg.push(`(date=${date}) `);
        }
        /**
         * Add log source.
         * @warning Ensure `loc` is added 2nd to the file_msg buffer.
         */
        loc ??= new SourceLoc(1);
        if (!loc.is_unknown()) { // !is_raw && 
            if (mode === IsDebug) {
                // only log source location to console for debug messages.
                const id = (loc.caller === "<unknown>" || loc.caller === "<root>")
                    ? loc.id
                    : loc.filename + ":" + loc.caller;
                msg.push(`[${id}] `);
            }
            file_msg.push(`(loc=${loc.abs_id}) `);
        }
        // Add minimized.
        msg.push(this.thread !== "master" ? `(t${this.thread})` : "");
        while (
        // trim trailing spaces.
        msg.length > 0 &&
            (msg[msg.length - 1].length === 0 || msg[msg.length - 1].endsWith(' '))) {
            if (msg[msg.length - 1].length <= 1) {
                msg.length--;
            }
            else {
                msg[msg.length - 1] = msg[msg.length - 1].trimEnd();
            }
        }
        if (msg.length > 1) {
            msg.push(": ");
        }
        msg.push(Colors.end);
        // Add detailed
        /**
         * Add log source.
         * @warning Ensure `thread` is added 3rd to the file_msg buffer.
         * @warning Ensure `level` is added 4th to the file_msg buffer.
         * @warning Ensure `type` is added 5th to the file_msg buffer.
         */
        file_msg.push(this.thread ? `(thread=${this.thread}) ` : "", `(level=${level}) `, `(type=${mode === IsError ? 'error' : mode === IsWarning ? 'warning' : 'log'})`, ': ');
        // Add args.
        this.add_args(msg, args, mode, level, active_log_level);
        this.add_args(file_msg, args, mode, level, active_log_level);
        // Dump buffs.
        dump_buffs();
    }
    /** Initialize a debugger / debug func with a predefined active log level */
    debugger(active_log_level) {
        const fn = (log_level, ...args) => {
            if (typeof log_level === "number") {
                this.log(log_level, IsDebug, new SourceLoc(1), new UseActiveLogLevel(active_log_level), ...args);
            }
            else {
                this.log(IsDebug, new SourceLoc(1), new UseActiveLogLevel(active_log_level), log_level, ...args);
            }
        };
        fn.Raw = IsRaw;
        fn.raw = IsRaw;
        fn.level = active_log_level;
        fn.on = (log_level) => {
            return active_log_level >= log_level;
        };
        return fn;
    }
}
export default Logger;
// Default logger instance.
export const logger = new Logger({ log_level: 0 });
//# sourceMappingURL=logger.js.map