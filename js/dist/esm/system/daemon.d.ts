/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
export declare class DaemonError extends Error {
    constructor(...args: any[]);
}
/** @docs
 *  @chapter: System
 *  @title: Daemon
 *  @description:
 *      Daemon type.
 *  @param:
 *      @name: name
 *      @desc: The name of the service.
 *      @type: string
 *      @required: true
 *  @param:
 *      @name: user
 *      @desc: The executing user of the service.
 *      @type: string
 *      @required: true
 *  @param:
 *      @name: group
 *      @desc: The executing group of the service.
 *      @type: string
 *  @param:
 *      @name: command
 *      @desc: The start command of the service.
 *      @type: string
 *      @required: true
 *  @param:
 *      @name: args
 *      @desc: The arguments for the start command.
 *      @type: array[string]
 *  @param:
 *      @name: cwd
 *      @desc: The path to the current working directory.
 *      @type: string
 *  @param:
 *      @name: env
 *      @desc: The environment variables for the service.
 *      @type: object
 *  @param:
 *      @name: description
 *      @desc: The description of the service.
 *      @type: string
 *      @required: true
 *  @param:
 *      @name: auto_restart
 *      @desc: Enable auto restart to restart the service upon crash.
 *      @type: string
 *  @param:
 *      @name: auto_restart_limit
 *      @desc: The auto restart limit (will be ignored on macos).
 *      @type: number
 *  @param:
 *      @name: auto_restart_delay
 *      @desc: The auto restart delay.
 *      @type: number.
 *  @param:
 *      @name: logs
 *      @desc: The path to the log file.
 *      @type: string
 *  @param:
 *      @name: errors
 *      @desc: The path to the error log file.
 *      @type: string
 */
export declare class Daemon {
    private name;
    private user;
    private group?;
    private command;
    private args;
    private cwd?;
    private env;
    private desc;
    private auto_restart;
    private auto_restart_limit;
    private auto_restart_delay;
    private logs?;
    private errors?;
    private path;
    private proc;
    constructor({ name, user, group, command, args, cwd, env, description, auto_restart, auto_restart_limit, auto_restart_delay, logs, errors, }: {
        name: string;
        user: string;
        group?: string;
        command: string;
        args?: string[];
        cwd?: string;
        env?: Record<string, string>;
        description: string;
        auto_restart?: boolean;
        auto_restart_limit?: number;
        auto_restart_delay?: number;
        logs?: string;
        errors?: string;
    });
    private create_h;
    private load_h;
    private reload_h;
    exists(): boolean;
    create(): Promise<void>;
    update(): Promise<void>;
    remove(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    is_running(): Promise<boolean>;
    tail(lines?: number): Promise<string>;
}
