/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// External imports.
import * as fs from 'fs';
import cluster from "cluster"

// Imports.
import { Date } from "../global/date.js";
import { Path } from "../system/path.js";
import { Color, Colors } from "../system/colors.js";
import { SourceLoc } from '../debugging/source_loc.js';
import { Utils } from '../utils.js';
import { Directive } from '../debugging/directives.js';
import { Pipe } from '../debugging/pipe.js';

/**
 * Parsed log message.
 */
export interface Log {
    date: string;
    loc?: string;
    thread?: string;
    level: number | undefined;
    type: "error" | "warning" | "log";
    message: string;
}

/** 
 *  The logger object.
 * 
 *  @param {number} log_level The active log level.
 *  @param {string} log_path The optional log path.
 *  @param {string} error_path The optional error path.
 *  @param {number} max_mb The max mb to keep for the log files, when defined the log files will automatically be truncated.
 *  @param {boolean} threading Enable threading behaviour, when enabled messages are prefixed with the thread id.
*/
export class Logger extends Pipe {
    public log_path?: Path;
    public error_path?: Path;
    public log_stream?: fs.WriteStream;
    public error_stream?: fs.WriteStream;
    public max_mb?: number;
    public thread: string;
    private debug_filename?: string;

    /**
     * The inherited `pipe` attribute is never used since this class overrides the `log` method, which is the only place where `pipe` is used.
     * @ts-expect-error */
    _out: never;
    // @ts-expect-error
    _err: never;

    /** Constructor. */
    constructor(
        {
            log_level = 0,
            debug_filename = undefined,
            log_path = undefined,
            error_path = undefined,
            max_mb = undefined,
        }: {
            log_level?: number;
            log_path?: string;
            error_path?: string;
            max_mb?: number;
            /** When defined only debug statements from this filename will be shown */
            debug_filename?: string;
        } = {}
    ) {
        // Attributes.
        super({ log_level, out: d => process.stdout.write(d) });
        this.log_path = undefined;
        this.error_path = undefined;
        this.log_stream = undefined;
        this.error_stream = undefined;
        this.max_mb = max_mb;
        this.thread = cluster.worker ? cluster.worker.id.toString() : "master";
        this.debug_filename = debug_filename

        // Assign paths.
        if (log_path && error_path) {
            this.assign_paths(log_path, error_path);
        }
    }

    // --------------------------------------------------
    // Private.

    private _write_count = 0;
    private readonly _truncate_interval = 1000;  // check every 1000 writes

    /**
     * Truncates the given file by removing lines at the start until its size is under max_bytes.
     * Closes and reopens the associated write stream to ensure subsequent writes go to the truncated file.
     *
     * @param path      The Path instance for the log or error file.
     * @param type Either 'log' or 'error' indicating which stream property to refresh.
     * @param max_bytes Maximum allowed file size in bytes.
     */
    private async truncate_log_file(
        path: Path,
        type: 'log' | 'error',
        max_bytes: number
    ): Promise<void> {
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
        let buffer: Buffer;
        try {
            buffer = Buffer.alloc(read_length);
            await handle.read(buffer, 0, read_length, start_pos);
        } finally {
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
        const old_stream = type === 'log' ? this.log_stream! : this.error_stream!;
        old_stream.close();
        const new_stream = fs.createWriteStream(file_path, { flags: 'a' });
        if (type === 'log') {
            this.log_stream = new_stream;
        } else {
            this.error_stream = new_stream;
        }
    }

    // --------------------------------------------------
    // Public.

    /**
     * Stop the logger and close the file streams.
     */
    public stop(): void {
        if (this.log_stream) {
            console.log("Closing log stream.");
            this.log_stream.close();
        }
        if (this.error_stream) {
            console.log("Closing error stream.");
            this.error_stream.close();
        }
    }

    /** 
     * Assign paths for the logger class.
     * @param log_path The optional log path.
     * @param error_path The optional error path.
     */
    public assign_paths(log_path: string, error_path: string): void {
        this.log_path = new Path(log_path);
        this.error_path = new Path(error_path);
        this.log_stream = fs.createWriteStream(this.log_path.str(), { flags: 'a' });
        this.error_stream = fs.createWriteStream(this.error_path.str(), { flags: 'a' });
    }

    /** The log file pattern. */
    private static readonly log_file_pattern = /^\(date=(.*?)\)\s*(?:\(loc=(.*?)\))?\s*(?:\(thread=(.*?)\))?\s*(?:\(level=(.*?)\))?\s*(?:\(type=(.*?)\))?:\s*/;

    /**
     * Parse a log file.
     */
    async _parse_log_file(path: Path): Promise<Log[]> {
        if (!path.exists()) {
            throw new Error(`Log file ${path} does not exist.`);
        }
        const logs: Log[] = [];
        const buff: string[] = [];
        await path.read_lines((line: string) => {
            const match = line.match(Logger.log_file_pattern);
            if (match) {
                // console.log("Matched:", match);
                const date = match[1];
                const loc = match[2];
                const thread = match[3];
                const level_int = parseInt(match[4])
                const level = isNaN(level_int) ? undefined : level_int;
                const type = match[5];
                const message = line.slice(match[0].length) + buff.join('\n');
                buff.length = 0;
                logs.push({
                    date,
                    loc,
                    thread,
                    level,
                    type: type as any,
                    message,
                });
            } else {
                buff.push(line);
                // console.log(`Unexpected line format:`, {line});
            }
        });
        if (buff.length > 0) {
            if (logs.length > 0) {
                logs[logs.length - 1].message += "\n" + buff.join('\n');
            } else {
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
     * Log data to the console and file streams when defined.
     * See {@link Pipe.log} for more details.
     * 
     * @param args
     *      The data to log.
     *      The first number is treated as the local log level.
     *      Any other directives are allowed before the first non-directive / local log level argument.
     */
    public log(...args: (Directive | Error | any)[]): void {
        let {
            local_level, active_log_level,
            is_raw, mode, loc, local_level_arg_index
        } = this.parse_directives(args);

        // Dont show location by default.
        // if (loc === undefined) {
        //     loc = new SourceLoc(1);
        // }
        if (mode === Directive.debug && this.debug_filename && loc && (loc as SourceLoc).filename !== this.debug_filename) {
            return;
        };

        // Create message buffers.
        const msg: any[] = [Colors.gray], file_msg: any[] = [];

        // Get target log_stream.
        const stream = mode === Directive.debug ? undefined : mode === Directive.error ? this.error_stream : this.log_stream;
        const stream_path = mode === Directive.debug ? undefined : mode === Directive.error ? this.error_path : this.log_path;

        // Skip by log level.
        if (local_level > active_log_level && !stream) { return; }
            
        /**
         * Add date.
         * @warning Ensure `date` is added 1st to the file_msg buffer.
         */
        if (mode !== Directive.debug) {
            const date = new Date().format("%d-%m-%y %H:%M:%S");
            file_msg.push(`(date=${date}) `);
            if (!is_raw) { msg.push(date, " "); }
        }

        /**
         * Add log source.
         * @warning Ensure `loc` is added 2nd to the file_msg buffer.
         */
        loc ??= new SourceLoc(1);
        if (!loc.is_unknown()) { // !is_raw && 
            if (mode === Directive.debug && !is_raw) {
                // only log source location to console for debug messages.
                const id = (loc.caller === "<unknown>" || loc.caller === "<root>")
                    ? loc.id
                    : loc.filename + ":" + loc.caller;
                msg.push(`[${id}] `);
            }
            file_msg.push(`(loc=${loc.abs_id}) `);
        }

        // Add minimized.
        if (!is_raw) {
            msg.push(this.thread !== "master" ? `(t${this.thread})` : "");
            this.trim_trailing_spaces(msg);
            if (msg.length > 1) { msg.push(": "); }
        }

        // Add end.
        msg.push(Colors.end);

        /**
         * Add log source.
         * @warning Ensure `thread` is added 3rd to the file_msg buffer.
         * @warning Ensure `level` is added 4th to the file_msg buffer.
         * @warning Ensure `type` is added 5th to the file_msg buffer.
         */
        file_msg.push(
            this.thread ? `(thread=${this.thread}) ` : "",
            `(level=${local_level}) `,
            `(type=${mode === Directive.error ? 'error' : mode === Directive.warn ? 'warning' : 'log'})`,
            ': ');

        // Add args.
        this.add_args(
            msg,
            file_msg,
            args,
            mode,
            local_level,
            active_log_level,
            local_level_arg_index,
        );

        /** Dump buffs */
        if (msg.length > 0 && local_level <= active_log_level) {
            if (this.needs_linebreak_from_spinners()) {
                console.log();
            }
            this.pre_pipe_process(msg);
            if (mode === Directive.error || mode === Directive.warn) {
                console.error(msg.join(''));
            } else {
                console.log(msg.join(''));
            }
        }
        if (stream != null && file_msg.length > 0) {
            // write to stream.
            this.pre_pipe_process(file_msg);
            stream.write(file_msg.join('') + "\n", () => {
                this._write_count++;
                if (this._write_count >= this._truncate_interval) {
                    this._write_count = 0;
                    this.truncate_log_file(
                        stream_path!,      // Path instance (this.log_path or this.error_path)
                        stream === this.log_stream ? 'log' : 'error',
                        this.max_mb! * 1024 * 1024
                    ).catch(console.error);
                }
            });
        }
    }
}

// Default logger instance.
export const logger = new Logger({ log_level: 0 });