/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */

import * as os from "os";

import { Path } from "./path.js";
import { Proc } from "./process.js";

// Get uid.
const is_root = os.userInfo().uid === 0;
	
// Daemon error.
export class DaemonError extends Error {
	constructor(...args: any[]) {
		super(...args);
	}
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
export class Daemon {
    private name: string;
    private user: string;
    private group?: string;
    private command: string;
    private args: string[];
    private cwd?: string;
    private env: Record<string, string>;
    private desc: string;
    private auto_restart: boolean;
    private auto_restart_limit: number;
    private auto_restart_delay: number;
    private logs?: string;
    private errors?: string;
    private path: Path;
    private proc: Proc;

    constructor(
    	{
	        name,
	        user,
	        group = undefined,
	        command,
	        args = [],
	        cwd = undefined,
	        env = {},
	        description,
	        auto_restart = false,
	        auto_restart_limit = -1,
	        auto_restart_delay = -1,
	        logs = undefined,
	        errors = undefined,
	    }: {
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
		}
	) {

        // Check args.
        if (typeof name !== "string") { throw new Error(`Parameter "name" must be a defined value of type "string", not "${typeof name}".`); }
        if (typeof user !== "string") { throw new Error(`Parameter "user" must be a defined value of type "string", not "${typeof user}".`); }
        if (typeof command !== "string") { throw new Error(`Parameter "command" must be a defined value of type "string", not "${typeof command}".`); }
        if (typeof description !== "string") { throw new Error(`Parameter "description" must be a defined value of type "string", not "${typeof description}".`); }

        // Arguments.
        this.name = name;
        this.user = user;
        this.group = group;
        this.command = command;
        this.args = args;
        this.cwd = cwd;
        this.env = env;
        this.desc = description;
        this.auto_restart = auto_restart;
        this.auto_restart_limit = auto_restart_limit;
        this.auto_restart_delay = auto_restart_delay;
        this.logs = logs;
        this.errors = errors;

        // Attributes.
        this.proc = new Proc();

        // Assign path.
        if (process.platform === 'darwin') {
		    this.path = new Path(`/Library/LaunchDaemons/${this.name}.plist`);
		} else if (process.platform === 'linux') {
			this.path = new Path(`/etc/systemd/system/${this.name}.service`);
		} else {
		    throw new Error(`Operating system "${process.platform}" is not yet supported.`);
		}
    }

    // The rest of the implementation remains exactly the same, 
    // just adding return types to the functions.

    private create_h(): string {
        // Macos.
		if (process.platform === 'darwin') {
			
			// Default.
			let data = "";
			data +=
			"<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + "\n" +
			"<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">" + "\n" +
			"<plist version=\"1.0\">" + "\n" +
			"<dict>" + "\n" +
			"    <key>Label</key>" + "\n" +
			"    <string>" + this.name + "</string>" + "\n" +
			"    <key>UserName</key>" + "\n" +
			"    <string>" + this.user + "</string>" + "\n" +
			"";
			
			// Arguments.
			data +=
			"	<key>ProgramArguments</key>" + "\n" +
			"	<array>" + "\n" +
			"		<string>" + this.command + "</string>" + "\n";
			this.args.iterate((i) => {
				data += "		<string>" + i + "</string>" + "\n";
			})
			data +=
			"	</array>" + "\n";

			// Group.
			if (this.group) {
				data +=
				"    <key>GroupName</key>" + "\n" +
				"    <string>" + this.group + "</string>" + "\n" +
				"";
			}

			// Restart.
			if (this.auto_restart) {
				data +=
				"    <key>StartInterval</key>" + "\n" +
				"    <integer>" + (this.auto_restart_delay == -1 ? 3 : this.auto_restart_delay) + "</integer>" + "\n" +
				"";
			}

			// Logs.
			if (this.logs) {
				data +=
				"    <key>StandardOutPath</key>" + "\n" +
				"    <string>" + this.logs + "</string>" + "\n" +
				"";
			}

			// Errors.
			if (this.errors) {
				data +=
				"    <key>StandardErrorPath</key>" + "\n" +
				"    <string>" + this.errors + "</string>" + "\n" +
				"";
			}

			// Working directory.
			if (this.cwd) {
				data += `<key>WorkingDirectory</key>`
				data += `<string>${this.cwd}</string>`
			}
				
			// End.
			data +=
			"</dict>" + "\n" +
			"</plist>" + "\n";
			
			// Handler.
			return data;

		}

		// Linux.
		else if (process.platform === 'linux') {

			// Default.
			let data = "";
			data +=
			"[Unit]" + "\n" +
			"Description=" + this.desc + "\n" +
			"After=network.target" + "\n" +
			"StartLimitIntervalSec=0" + "\n" +
			"" + "\n" +
	        
			"[Service]" + "\n" +
	        "User=" + this.user + "\n" +
			"Type=simple" + "\n" +
			"ExecStart=" + this.command + " ";
			this.args.iterate((i) => {
				data += "\"" + i + "\" ";
			});
	        data += "\n";
	        Object.keys(this.env).iterate((key) => {
	            data += "Environment=\"" + key + "=" + this.env[key] + "\"\n";
	        })
			if (this.cwd) {
				data += `WorkingDirectory=${this.cwd}`
			}

			// Group.
			if (this.group) {
				data +=
				"Group=" + this.group + "\n";
			}

			// Restart.
			if (this.auto_restart) {
				data +=
				"Restart=always" + "\n" +
				"RestartSec=1" + "\n" +
				"";
				if (this.auto_restart_limit != -1) {
					data +=
					"StartLimitBurst=" + this.auto_restart_limit + "\n";
				}
				if (this.auto_restart_delay != -1) {
					data +=
					"StartLimitIntervalSec=" + this.auto_restart_delay + "\n";
				}
			}

			// Additional build.
			data +=
			"" + "\n" +
			"[Install]" + "\n" +
			"WantedBy=multi-user.target" + "\n";
			
			// Handler.
			return data;
		
		} else {
		    throw new Error(`Operating system "${process.platform}" is not yet supported.`);
		}
    }

    private async load_h(): Promise<void> {
        if (process.platform === 'darwin') {
			const status = await this.proc.start({command: `launchctl load ${this.path.str()}`})
	        if (status != 0) {
	            throw new Error("Failed to reload the daemon.");
	        }
	    } else {
		    throw new Error(`Operating system "${process.platform}" is not yet supported.`);
		}
    }

    private async reload_h(): Promise<void> {
        if (process.platform === 'darwin') {
    		const status = await this.proc.start({
    			command: `launchctl unload ${this.path.str()} && launchctl load ${this.path.str()}`
    		})
			if (status != 0) {
	            throw new Error("Failed to reload the daemon.");
			}
		} else if (process.platform === 'linux') {
	        const status = await this.proc.start({
    			command: `systemctl daemon-reload`
    		})
			if (status != 0) {
	            throw new Error("Failed to reload the daemon.");
	        }
		} else {
		    throw new Error(`Operating system "${process.platform}" is not yet supported.`);
		}
    }

    /* @docs
        @title: Exists
        @description:
            Check if the daemon's exists.
        @note: Requires root priviliges.
        @return:
            Returns a boolean indicating whether the daemon's configuration file exists.
    */
    public exists(): boolean {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		return this.path.exists();
    }

    /* @docs
        @title: Create
        @description:
            Create the daemon's configuration file.
            Use `update()` to update an exisiting daemon.
        @note: Requires root priviliges.
    */
    public async create(): Promise<void> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		if (this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" already exists.`);
		}
		this.path.save_sync(this.create_h());
		if (process.platform === 'darwin') {
            await this.load_h();
        }
    }

    /* @docs
        @title: Update
        @description:
            Update the daemon's configuration file.
            Use `create()` to create an unexisiting daemon.
        @note: Requires root priviliges.
    */
    public async update(): Promise<void> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
		}
		this.path.save_sync(this.create_h());
		await this.reload_h();
    }

    /* @docs
        @title: Remove
        @description:
            Remove the daemon's configuration file.
            Equal to `path().remove()`.
        @note: Requires root priviliges.
    */
    public async remove(): Promise<void> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		this.path.del_sync();
    }

    /* @docs
        @title: Start
        @description:
            Start the daemon.
        @note: Requires root priviliges.
    */
    public async start(): Promise<void> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
		}
		let command = "";
		if (process.platform === 'linux') {
			command = `systemctl start ${this.name}`;
		} else if (process.platform === 'darwin') {
			command = `launchctl start ${this.name}`;
		}
		const status = await this.proc.start({command})
		if (status != 0) {
            throw new Error("Failed to start the daemon.");
        }
    }

    /* @docs
        @title: Stop
        @description:
            Stop the daemon.
        @note: Requires root priviliges.
    */
    public async stop(): Promise<void> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
		}
		let command = "";
		if (process.platform === 'linux') {
			command = `systemctl stop ${this.name}`;
		} else if (process.platform === 'darwin') {
			command = `launchctl stop ${this.name}`;
		}
		const status = await this.proc.start({command})
		if (status != 0) {
            throw new Error("Failed to stop the daemon.");
        }
    }

    /* @docs
        @title: Restart
        @description:
            Restart the daemon.
        @note: Requires root priviliges.
    */
    public async restart(): Promise<void> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
		if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
		}
		let command = "";
		if (process.platform === 'linux') {
			command = `systemctl restart ${this.name}`;
		} else if (process.platform === 'darwin') {
			command = `launchctl stop ${this.name} && launchctl start ${this.name}`;
		}
		const status = await this.proc.start({command})
		if (status != 0) {
            throw new Error("Failed to restart the daemon.");
        }
    }

    /* @docs
        @title: Is running
        @description:
            Check if the service daemon is running.
        @note: Requires root priviliges.
        @return:
            @type: Promise<boolean>
    */
    public async is_running(): Promise<boolean> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
	    let command;
		if (process.platform === 'darwin') {
			command = `launchctl list | grep ${this.name}`;
		} else if (process.platform === 'linux') {
			command = `systemctl is-active ${this.name}`;
		} else {
			throw new Error("Failed to restart the daemon.");
		}
		const status = await this.proc.start({command})

	    // On Linux, systemctl returns an error if the service is not active.
		if (status != 0) {
            return false;
        } else if (process.platform === 'linux') {
        	return true;
        }

        // Check if output is not empty.
        return this.proc?.out?.split("\t")[1] == "0";
    }

    /* @docs
        @title: tail
        @description:
            Tail the daemon logs.
        @note: Requires root priviliges.
    */
    public async tail(lines: number = 100): Promise<string> {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
        }
        let command = "";
		if (process.platform === 'linux') {
			throw new Error(`Operating system "${process.platform}" is not yet supported.`);
		} else if (process.platform === 'darwin') {
			command = `sudo journalctl -u ${this.name}.service --no-pager  -n ${lines}`;
		}
		const status = await this.proc.start({command})
		if (status != 0) {
            throw new DaemonError("Failed to tail the daemon.");
        }
        return this.proc?.out ?? "";
    }
}