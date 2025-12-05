/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import * as os from "os";
import { Path } from "./path.js";
import { Proc } from "./process.js";
// Get uid.
const is_root = os.userInfo().uid === 0;
/**
 * Error thrown for daemon-related failures.
 *
 * @docs
 */
export class DaemonError extends Error {
    constructor(...args) {
        super(...args);
    }
}
/**
 * The system daemon class.
 *
 * @nav System
 * @docs
 */
export class Daemon {
    name;
    user;
    group;
    command;
    args;
    cwd;
    env;
    desc;
    auto_restart;
    auto_restart_limit;
    auto_restart_delay;
    logs;
    errors;
    path;
    proc;
    /**
     * Construct a new daemon instance.
     * @docs
     */
    constructor({ name, user, group = undefined, command, args = [], cwd = undefined, env = {}, description, auto_restart, logs = undefined, errors = undefined, }) {
        // Check args.
        if (typeof name !== "string") {
            throw new Error(`Parameter "name" must be a defined value of type "string", not "${typeof name}".`);
        }
        if (typeof user !== "string") {
            throw new Error(`Parameter "user" must be a defined value of type "string", not "${typeof user}".`);
        }
        if (typeof command !== "string") {
            throw new Error(`Parameter "command" must be a defined value of type "string", not "${typeof command}".`);
        }
        if (typeof description !== "string") {
            throw new Error(`Parameter "description" must be a defined value of type "string", not "${typeof description}".`);
        }
        // Arguments.
        this.name = name;
        this.user = user;
        this.group = group;
        this.command = command;
        this.args = args;
        this.cwd = cwd;
        this.env = env;
        this.desc = description;
        const { enabled: auto_restart_enabled = false, limit: auto_restart_limit = -1, delay: auto_restart_delay = -1 } = auto_restart ?? {
            enabled: false,
            limit: -1,
            delay: -1
        };
        this.auto_restart = auto_restart_enabled;
        this.auto_restart_limit = auto_restart_limit;
        this.auto_restart_delay = auto_restart_delay;
        this.logs = logs;
        this.errors = errors;
        // Attributes.
        this.proc = new Proc();
        // Assign path.
        if (process.platform === 'darwin') {
            this.path = new Path(`/Library/LaunchDaemons/${this.name}.plist`);
        }
        else if (process.platform === 'linux') {
            this.path = new Path(`/etc/systemd/system/${this.name}.service`);
        }
        else {
            throw new Error(`Operating system "${process.platform}" is not yet supported.`);
        }
    }
    // The rest of the implementation remains exactly the same, 
    // just adding return types to the functions.
    /**
     * Build the platform-specific daemon configuration content.
     * On macOS, returns a launchd plist; on Linux, returns a systemd unit file.
     * @returns The serialized configuration content.
     * @private
     */
    create_h() {
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
                " <key>ProgramArguments</key>" + "\n" +
                    " <array>" + "\n" +
                    "   <string>" + this.command + "</string>" + "\n";
            this.args.walk((i) => {
                data += "   <string>" + i + "</string>" + "\n";
            });
            data +=
                " </array>" + "\n";
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
                data += `<key>WorkingDirectory</key>`;
                data += `<string>${this.cwd}</string>`;
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
            this.args.walk((i) => {
                data += "\"" + i + "\" ";
            });
            data += "\n";
            Object.keys(this.env).walk((key) => {
                data += "Environment=\"" + key + "=" + this.env[key] + "\"\n";
            });
            if (this.cwd) {
                data += `WorkingDirectory=${this.cwd}`;
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
        }
        else {
            throw new Error(`Operating system "${process.platform}" is not yet supported.`);
        }
    }
    /**
     * Load the daemon configuration into the OS service manager.
     * On macOS, runs `launchctl load` for the generated plist.
     * @returns Resolves when the configuration has been loaded.
     * @private
     */
    async load_h() {
        if (process.platform === 'darwin') {
            const status = await this.proc.start({ command: `launchctl load ${this.path.str()}` });
            if (status != 0) {
                throw new Error("Failed to reload the daemon.");
            }
        }
        else {
            throw new Error(`Operating system "${process.platform}" is not yet supported.`);
        }
    }
    /**
     * Reload the daemon configuration in the OS service manager.
     * On macOS, unloads and reloads via `launchctl`; on Linux, runs `systemctl daemon-reload`.
     * @returns Resolves when the configuration has been reloaded.
     * @private
     */
    async reload_h() {
        if (process.platform === 'darwin') {
            const status = await this.proc.start({
                command: `launchctl unload ${this.path.str()} && launchctl load ${this.path.str()}`
            });
            if (status != 0) {
                throw new Error("Failed to reload the daemon.");
            }
        }
        else if (process.platform === 'linux') {
            const status = await this.proc.start({
                command: `systemctl daemon-reload`
            });
            if (status != 0) {
                throw new Error("Failed to reload the daemon.");
            }
        }
        else {
            throw new Error(`Operating system "${process.platform}" is not yet supported.`);
        }
    }
    /**
     * Check if the daemon exists.
     * @note Requires root priviliges.
     * @returns Returns a boolean indicating whether the daemon's configuration file exists.
     * @docs
     */
    exists() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        return this.path.exists();
    }
    /**
     * Create the daemon's configuration file.
     * Use `update()` to update an exisiting daemon.
     * @note Requires root priviliges.
     * @docs
     */
    async create() {
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
    /**
     * Update the daemon's configuration file.
     * Use `create()` to create an unexisiting daemon.
     * @note Requires root priviliges.
     * @docs
     */
    async update() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
        }
        this.path.save_sync(this.create_h());
        await this.reload_h();
    }
    /**
     * Remove the daemon's configuration file.
     * Equal to `path().remove()`.
     * @note Requires root priviliges.
     * @docs
     */
    async remove() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        this.path.del_sync();
    }
    /**
     * Start the daemon.
     * @note Requires root priviliges.
     * @docs
     */
    async start() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
        }
        let command = "";
        if (process.platform === 'linux') {
            command = `systemctl start ${this.name}`;
        }
        else if (process.platform === 'darwin') {
            command = `launchctl start ${this.name}`;
        }
        const status = await this.proc.start({ command });
        if (status != 0) {
            throw new Error("Failed to start the daemon.");
        }
    }
    /**
     * Stop the daemon.
     * @note Requires root priviliges.
     * @docs
     */
    async stop() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
        }
        let command = "";
        if (process.platform === 'linux') {
            command = `systemctl stop ${this.name}`;
        }
        else if (process.platform === 'darwin') {
            command = `launchctl stop ${this.name}`;
        }
        const status = await this.proc.start({ command });
        if (status != 0) {
            throw new Error("Failed to stop the daemon.");
        }
    }
    /**
     * Restart the daemon.
     * @note Requires root priviliges.
     * @docs
     */
    async restart() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
        }
        let command = "";
        if (process.platform === 'linux') {
            command = `systemctl restart ${this.name}`;
        }
        else if (process.platform === 'darwin') {
            command = `launchctl stop ${this.name} && launchctl start ${this.name}`;
        }
        const status = await this.proc.start({ command });
        if (status != 0) {
            throw new Error("Failed to restart the daemon.");
        }
    }
    /**
     * Check if the service daemon is running.
     * @note Requires root priviliges.
     * @returns Returns a promise that resolves to a boolean indicating if the daemon is running.
     * @docs
     */
    async is_running() {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        let command;
        if (process.platform === 'darwin') {
            command = `launchctl list | grep ${this.name}`;
        }
        else if (process.platform === 'linux') {
            command = `systemctl is-active ${this.name}`;
        }
        else {
            throw new Error("Failed to restart the daemon.");
        }
        const status = await this.proc.start({ command });
        // On Linux, systemctl returns an error if the service is not active.
        if (status != 0) {
            return false;
        }
        else if (process.platform === 'linux') {
            return true;
        }
        // Check if output is not empty.
        return this.proc?.out?.split("\t")[1] == "0";
    }
    /**
     * Tail the daemon logs.
     * @note Requires root priviliges.
     * @param lines The number of log lines to show. Defaults to 100.
     * @docs
     */
    async tail(lines = 100) {
        if (!is_root) {
            throw new Error("Root privileges required.");
        }
        if (!this.path.exists()) {
            throw new Error(`Daemon "${this.path.str()}" does not exist.`);
        }
        let command = "";
        if (process.platform === 'linux') {
            throw new Error(`Operating system "${process.platform}" is not yet supported.`);
        }
        else if (process.platform === 'darwin') {
            command = `sudo journalctl -u ${this.name}.service --no-pager  -n ${lines}`;
        }
        const status = await this.proc.start({ command });
        if (status != 0) {
            throw new DaemonError("Failed to tail the daemon.");
        }
        return this.proc?.out ?? "";
    }
}
//# sourceMappingURL=daemon.js.map