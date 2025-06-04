#!/usr/bin/env node
/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import { execSync } from "node:child_process";
import * as vlib from "../../index.js";
// Imports.
import { Repo } from "./repo.js";
// CLI.
const cli = new vlib.cli.CLI({ name: "vrepo", version: "1.0.2", strict: true });
// ---------------------------------------------------------------
// Remote commands.
// Push.
cli.command({
    id: "--push",
    description: "Push the current project to one or multiple remotes.",
    examples: {
        "Push": "vrepo --push --git origin --ssh myserver,mybackupserver --del --forced",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the package." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
        { id: "--git", type: "string[]", def: [], description: "Push to all git or a list of specific git remotes." },
        { id: "--ssh", type: "string[]", def: [], description: "Push to all ssh or a list of specific ssh remotes." },
        { id: ["--forced", "-f"], type: "boolean", description: "Push with git in forced mode." },
        { id: ["--del", "-d"], type: "boolean", description: "Push with ssh in delete mode." },
        { id: ["--ensure-push", "-e"], type: "boolean", description: "Ensure a git push by editing the gitignore safely." },
        { id: ["--log-level", "-l"], type: "number", description: "The log level." },
    ],
    async callback({ source = null, sources = null, git = null, ssh = null, forced = false, del = false, ensure_push = false, log_level = 0, }) {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const repo = new Repo({
                source,
                npm: false,
            });
            await repo.init();
            repo.assert_init();
            // Build the selected git and ssh remotes.
            let ssh_remotes = [], git_remotes = [];
            // Build git remotes.
            if (cli.has("--git")) {
                if (Array.isArray(git) && git.length > 0) {
                    // Add specified git remotes.
                    for (const remote of git) {
                        const found = repo.config.git.remotes.iterate((item) => {
                            if (item.remote === remote) {
                                git_remotes.push(item);
                                return true;
                            }
                        });
                        if (!found) {
                            throw this.error(`Git remote "${remote}" does not exist.`);
                        }
                    }
                }
                else if (Array.isArray(git) && git.length === 0) {
                    // Add all git remotes.
                    git_remotes = repo.config.git.remotes;
                }
            }
            // Build ssh remotes.
            if (cli.has("--ssh")) {
                if (Array.isArray(ssh) && ssh.length > 0) {
                    // Add specified ssh remotes.
                    for (const alias of ssh) {
                        const found = repo.config.ssh.remotes.iterate((item) => {
                            if (item.alias === alias) {
                                ssh_remotes.push(item);
                                return true;
                            }
                        });
                        if (!found) {
                            throw this.error(`SSH remote "${alias}" does not exist.`);
                        }
                    }
                }
                else if (Array.isArray(ssh) && ssh.length === 0) {
                    // Add all ssh remotes.
                    ssh_remotes = repo.config.ssh.remotes;
                }
            }
            // Add all remotes when no specific remotes are defined.
            if (!cli.has("--git") && !cli.has("--ssh")) {
                ssh_remotes = repo.config.ssh.remotes;
                git_remotes = repo.config.git.remotes;
            }
            // Push all remotes.
            for (const remote of git_remotes) {
                const spinner = new vlib.logging.Spinner({
                    message: `Pushing ${vlib.Color.bold(repo.name)} branch "${remote.branch}" to "${remote.remote} ${remote.destination}" (git).`,
                    success: `Pushed ${vlib.Color.bold(repo.name)} branch "${remote.branch}" to "${remote.remote} ${remote.destination}" (git).`,
                });
                const err = await repo.git.push({
                    remote: remote.remote,
                    dest: remote.destination,
                    branch: remote.branch,
                    forced,
                    ensure_push,
                    log_level,
                });
                if (err) {
                    spinner.error();
                    throw this.error(err);
                }
                spinner.success();
            }
            for (const remote of ssh_remotes) {
                const spinner = new vlib.logging.Spinner({
                    message: `Pushing ${vlib.Color.bold(repo.name)} to ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`,
                    success: `Pushed ${vlib.Color.bold(repo.name)} to ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`,
                });
                const err = await repo.ssh.push(remote.alias, remote.destination, del);
                if (err) {
                    spinner.error();
                    throw this.error(err);
                }
                spinner.success();
            }
        }
    }
});
// Pull.
cli.command({
    id: "--pull",
    description: "Pull the current project from one of the remotes.",
    examples: {
        "Pull": "vrepo --pull --ssh myserver --del",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
        { id: "--git", type: "array", required: false, description: "Pull from all git or a list of specific git remotes." },
        { id: "--ssh", type: "array", required: false, description: "Pull from all ssh or a list of specific ssh remotes." },
        { id: ["--forced", "-f"], type: "boolean", description: "Pull with git in forced mode." },
        { id: ["--del", "-d"], type: "boolean", description: "Pull with ssh in delete mode." },
    ],
    async callback({ source = null, sources = null, git = null, ssh = null, forced = false, del = false, }) {
        // Check args.
        if (git == null && ssh == null || (git != null && ssh != null)) {
            cli.error(`Define either parameter "git" or "ssh".`, { docs: true });
            cli.docs(this);
            process.exit(1);
        }
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const repo = new Repo({
                source,
                npm: false,
            });
            await repo.init();
            repo.assert_init();
            // Pull through git.
            if (git != null) {
                if (!Array.isArray(git)) {
                    throw this.error(`The git parameter must be an array of git remotes.`, { docs: true });
                }
                for (const g of git) {
                    const remote = repo.config.git.remotes.find(item => item.remote === g);
                    if (!remote) {
                        throw this.error(`Git remote "${git}" does not exist.`);
                    }
                    const spinner = new vlib.logging.Spinner({
                        message: `Pulling ${vlib.Color.bold(repo.name)} branch "${remote.branch}" from "${remote.remote}" "${remote.destination}" (git).`,
                        success: `Pulled ${vlib.Color.bold(repo.name)} branch "${remote.branch}" from "${remote.remote}" "${remote.destination}" (git).`,
                    });
                    const err = await repo.git.pull({ remote: remote.remote, dest: remote.destination, branch: remote.branch, forced });
                    if (err) {
                        spinner.error();
                        throw this.error(err);
                    }
                    spinner.success();
                }
            }
            // Pull through ssh.
            else if (ssh != null) {
                if (!Array.isArray(ssh)) {
                    throw this.error(`The ssh parameter must be an array of ssh remotes.`, { docs: true });
                }
                for (const s of ssh) {
                    const remote = repo.config.ssh.remotes.find(item => item.alias === s);
                    if (!remote) {
                        throw this.error(`SSH remote "${s}" does not exist.`);
                    }
                    const spinner = new vlib.logging.Spinner({
                        message: `Pulling ${vlib.Color.bold(repo.name)} from ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`,
                        success: `Pulled ${vlib.Color.bold(repo.name)} from ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`,
                    });
                    const err = await repo.ssh.pull(remote.alias, remote.destination, del);
                    if (err) {
                        spinner.error();
                        throw this.error(err);
                    }
                    spinner.success();
                }
            }
            else {
                throw this.error(`Define either parameter "git" or "ssh".`, { docs: true });
            }
        }
    }
});
// Add remote.
cli.command({
    id: "--add-remote",
    description: "Add a remote.",
    examples: {
        "Add SSH remote 1": "vrepo --add-remote --ssh myalias:./destination",
        "Add SSH remote 2": "vrepo --add-remote --git --remote origin --destination git@github.com:username/project.git --branch main",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--ssh", type: "string", description: "The ssh alias and destination formatted like <alias>:<destination>" },
        { id: "--git", type: "boolean", description: "Add a git remote." },
        { id: "--remote", type: "string", description: "The git branch, by default \"origin\"." },
        { id: "--destination", type: "string", description: "The git destination." },
        { id: "--branch", type: "string", description: "The git branch, by default \"main\"." },
    ],
    async callback({ source = undefined, ssh = undefined, git = undefined, remote = "origin", destination = undefined, branch = "main", }) {
        // Create sources array.
        if (typeof source !== "string") {
            source = "./";
        }
        // Init repo.
        const repo = new Repo({
            source,
            npm: false,
            ssh: Boolean(ssh),
            git: git,
        });
        await repo.init();
        repo.assert_init();
        // Add ssh remote.
        if (ssh != null) {
            const split = ssh.split(":");
            if (split.length < 2) {
                cli.error(`Invalid value for parameter "ssh", the parameter value must be formatted like "<alias>:<destination>".`, { docs: true });
                cli.docs(this);
                process.exit(1);
            }
            const remote = {
                alias: split[0],
                destination: split[1],
                enabled: true,
            };
            const spinner = new vlib.logging.Spinner({
                message: `Adding ssh remote "${remote.alias}:${remote.destination}" to "${repo.name}".`,
                success: `Added ssh remote "${remote.alias}:${remote.destination}" to "${repo.name}".`,
            });
            const duplicate = repo.config.ssh.remotes.iterate((item) => {
                if (item.alias === remote.alias && item.destination === remote.destination) {
                    return true;
                }
            });
            if (duplicate !== true) {
                repo.config.ssh.remotes.push(remote);
            }
            spinner.success();
        }
        // Add git remote.
        else if (git != null) {
            // Check args.
            if (destination == null) {
                throw cli.error(`Define parameter "--destination" (string).`, { docs: true });
            }
            // Create remote.
            const item = {
                remote: remote,
                destination: destination,
                branch: branch,
                enabled: true,
            };
            const spinner = new vlib.logging.Spinner({
                message: `Adding git remote "${item.remote}:${item.destination}:${item.branch}" to "${repo.name}".`,
                success: `Added git remote "${item.remote}:${item.destination}:${item.branch}" to "${repo.name}".`,
            });
            const duplicate = repo.config.git.remotes.iterate((item) => {
                if (item.remote === item.remote && item.destination === item.destination && item.branch === item.branch) {
                    return true;
                }
            });
            if (duplicate !== true) {
                repo.config.git.remotes.push(item);
            }
            spinner.success();
        }
        // Invalid args.
        else {
            throw cli.error(`Define either parameter "git" or "ssh".`, { docs: true });
        }
        // Save.
        repo.save();
    }
});
// Get remotes.
cli.command({
    id: "--remotes",
    description: "Get the registered remotes.",
    examples: {
        "Get remotes": "vrepo --remotes",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
        { id: "--git", type: "boolean", description: "Only show the git remotes." },
        { id: "--ssh", type: "boolean", description: "Only show the ssh remotes." },
    ],
    async callback({ source = null, sources = null, git = false, ssh = false, }) {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const repo = new Repo({
                source,
                npm: false,
            });
            await repo.init();
            repo.assert_init();
            vlib.log(repo.name, ":");
            if (git || (git === false && ssh == false)) {
                repo.config.git.remotes.walk((item) => {
                    console.log(`    * ${item.branch} ${item.remote}:${item.destination} (git)`);
                });
            }
            if (ssh || (git === false && ssh == false)) {
                repo.config.ssh.remotes.walk((item) => {
                    console.log(`    * ${item.alias}:${item.destination} (ssh)`);
                });
            }
        }
    }
});
// ---------------------------------------------------------------
// Version
// Increment version.
// Can be for npm or other json file with version attr.
cli.command({
    id: "--increment-version",
    description: "Increment the npm package version.",
    examples: {
        "Patch bump": "vrepo --increment-version --source path/to/project",
        "Minor bump": "vrepo --increment-version --minor",
        "Major bump": "vrepo --increment-version --major --source path/to/project",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--minor", type: "boolean", def: false, description: "Increment the minor version segment." },
        { id: "--major", type: "boolean", def: false, description: "Increment the major version segment." },
        { id: "--dry-run", type: "boolean", def: false, description: "Perform a dry run without saving." },
    ],
    async callback({ source, minor = false, major = false, dry_run = false }) {
        // Determine bump level: default = patch (last segment)
        const bump_level = major ? "major" : minor ? "minor" : "patch";
        const src = new vlib.Path(source || "./");
        const spinner = new vlib.logging.Spinner({
            message: `Increment version in "${src}".`,
        });
        // Helper: parse and bump a version string array, returning new version string
        const bump_version = (old_version) => {
            const segments = old_version.split(".").map(s => parseInt(s, 10));
            if (segments.some(isNaN)) {
                throw new Error(`Invalid version format "${old_version}".`);
            }
            let target_index;
            if (bump_level === "major") {
                target_index = 0;
            }
            else if (bump_level === "minor") {
                target_index = segments.length - 2;
            }
            else {
                // patch
                target_index = segments.length - 1;
            }
            // Pad with zeros if necessary
            while (target_index < 0) {
                segments.unshift(0);
                target_index++;
            }
            // Increment target segment
            segments[target_index]++;
            // Zero out segments to the right
            for (let i = target_index + 1; i < segments.length; i++) {
                segments[i] = 0;
            }
            return segments.join(".");
        };
        // Helper to increment version in a json file.
        const incr_version_in_json = async (json_path) => {
            // Handle package.json
            const pkg = await json_path.load({ type: "object" });
            if (!pkg.version) {
                spinner.error();
                throw this.error(`Invalid JSON version file, the object at "${json_path}" does not have a version field.`);
            }
            const old_version = pkg.version;
            let new_version;
            try {
                new_version = bump_version(old_version);
            }
            catch (err) {
                spinner.error();
                throw this.error(err.message);
            }
            pkg.version = new_version;
            if (dry_run) {
                vlib.log("Dry run: would increment version in ", json_path, " to ", vlib.Color.bold(new_version));
                vlib.log("Dry run: would be file content: ", JSON.stringify(pkg, null, 4));
            }
            else {
                await json_path.save(JSON.stringify(pkg, null, 4));
            }
            spinner.success(`Incremented the version of "${json_path}" to ${vlib.Color.bold(new_version)}.`);
        };
        // Helper to increment version in a raw string version file.
        const incr_version_in_string_file = async (version_path) => {
            let raw_content;
            try {
                raw_content = await version_path.load({ type: "string" });
            }
            catch {
                spinner.error();
                throw this.error(`Cannot read file "${version_path}".`);
            }
            const old_version = raw_content.trim();
            let new_version;
            try {
                new_version = bump_version(old_version);
            }
            catch (err) {
                spinner.error();
                throw this.error(err.message);
            }
            if (dry_run) {
                vlib.log("Dry run: would increment version in ", version_path, " to ", vlib.Color.bold(new_version));
            }
            else {
                await version_path.save(new_version, { type: "string" });
            }
            spinner.success(`Incremented the version in "${version_path}" to ${vlib.Color.bold(new_version)}.`);
        };
        // Directory: look for package.json or version.json
        if (src.is_dir()) {
            let version_json;
            let version_string;
            if ((version_json = src.join("package.json")).exists()
                || (version_json = src.join("/../package.json")).exists()
                || (version_json = src.join("version.json")).exists()
                || (version_json = src.join("/../version.json")).exists()) {
                await incr_version_in_json(version_json);
            }
            else if (((version_string = src.join("version.txt")).exists() && version_string.is_file())
                || ((version_string = src.join("version")).exists() && version_string.is_file())) {
                await incr_version_in_string_file(version_string);
            }
            else {
                spinner.error();
                throw this.error(`No package.json or version.json file found in directory "${src}".`);
            }
        }
        // Not a directory: treat as file
        else if (src.is_file()) {
            // JSON file: load as object with version field
            const ext = src.extension();
            if (ext === ".json") {
                await incr_version_in_json(src);
            }
            // Raw version file: read text, bump, write back
            else {
                await incr_version_in_string_file(src);
            }
        }
        // Invalid path: neither file nor directory
        else {
            spinner.error();
            throw this.error(`Invalid source path "${src}". It must be a file or directory.`);
        }
    }
});
// ---------------------------------------------------------------
// NPM commands.
// Push / publish but use --push so it doesnt clash.
cli.command({
    id: vlib.CLI.and("--npm", "--push"),
    description: "Publish a npm package.",
    examples: {
        "Publish": "vrepo --npm --push",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." }, { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
        { id: "--on-commits-only", type: "boolean", description: "Only when local commits have been made." },
    ],
    callback: async ({ source = null, sources = null, on_commits_only = false, }) => {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const repo = new Repo({
                source,
                git: false,
                ssh: false,
            });
            await repo.init();
            repo.assert_init();
            const spinner = new vlib.logging.Spinner({
                message: `Publishing npm package ${vlib.Color.bold(repo.npm.id)}`,
            });
            let has_changed = false;
            try {
                ({ has_changed } = await repo.npm.publish({ only_if_changed: on_commits_only }));
            }
            catch (err) {
                spinner.error();
                throw err;
            }
            if (has_changed) {
                spinner.success(`Published npm package ${vlib.Color.bold(repo.npm.id)}`);
            }
            else {
                spinner.stop();
                vlib.log(`Package ${vlib.Color.bold(repo.npm?.id)} has not changed.`);
            }
        }
    }
});
// Link - Simply call link on target vrepo projects.
cli.command({
    id: vlib.CLI.and("--npm", "--link"),
    description: "Simply call npm link on target vrepo projects.",
    examples: {
        "npm link": "vrepo --npm --link --source path/to/myproject",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
        { id: "--dependencies", type: "array", required: false, description: "The source path to the local dependencies to add. This parameter becomes optional once it has been executed once with dependencies." },
    ],
    async callback({ source = null, sources = null, dependencies = [], }) {
        if (!dependencies?.length) {
            throw this.error(`The argument --dependencies is required.`, { docs: true });
        }
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const vrepo_src = new vlib.Path(source + "/.vrepo");
            if (!vrepo_src.exists()) {
                throw this.error(`The vrepo source path "${source}" does not exist. Create an empty json file to continue.`);
                // vrepo_src.save_sync("{}");
            }
            const repo = new Repo({
                source,
                git: false,
                ssh: false,
                npm: false,
            });
            await repo.init();
            repo.assert_init();
            repo.config.npm ??= {};
            repo.config.npm.links ??= {};
            if (!Object.keys(repo.config.npm.links).length && !dependencies.length) {
                throw this.error(`Argument --dependencies is required when this command is executed for the first time.`, { docs: true });
            }
            const spinner = new vlib.logging.Spinner({
                message: `Linking ${dependencies.length} dependencies to "${vrepo_src.str()}".`,
                success: `Linked ${dependencies.length} dependencies to "${vrepo_src.str()}".`,
            });
            let cmd = "npm --silent link";
            let edits = 0;
            for (const dependency of dependencies) {
                const dep_str = dependency;
                const abs_dependency = vlib.Path.abs(dependency); // use relative path mainly.
                const dependency_path = new vlib.Path(dependency + "/package.json");
                if (!dependency_path.exists()) {
                    spinner.error();
                    throw this.error(`The dependency path "${dependency}" does not exist.`);
                }
                const pkg = await dependency_path.load({ type: "object" });
                if (pkg.name == null || pkg.version == null) {
                    spinner.error();
                    throw this.error(`The dependency package.json file does not contain a name or version field.`);
                }
                cmd += " " + pkg.name;
                if (repo.config.npm.links[pkg.name] == null) {
                    repo.config.npm.links[pkg.name] = [dependency];
                    ++edits;
                }
                else if (!repo.config.npm.links[pkg.name].some(p => vlib.Path.abs(p).eq(abs_dependency))) {
                    repo.config.npm.links[pkg.name].push(dependency);
                    ++edits;
                }
                else if (typeof repo.config.npm.links[pkg.name] === "string") {
                    // legacy support for string.
                    if (repo.config.npm.links[pkg.name] === dependency) {
                        repo.config.npm.links[pkg.name] = [dependency];
                        ++edits;
                    }
                    else {
                        repo.config.npm.links[pkg.name] = [
                            repo.config.npm.links[pkg.name],
                            dependency,
                        ];
                        ++edits;
                    }
                }
            }
            execSync(cmd, { cwd: source, stdio: "inherit" });
            // Save.
            if (edits) {
                try {
                    await vrepo_src.save(repo.config, { type: "jsonc" });
                }
                catch (err) {
                    spinner.error();
                    throw err;
                }
            }
            spinner.success();
        }
    }
});
// Unlink - Unlink all links, check if there are any changed if so publish to npm and update the dependency versions.
// Do this recursively for all (nested) links.
cli.command({
    id: vlib.CLI.and("--npm", "--unlink"),
    description: "Unlink all links, check if there are any changed if so publish to npm and update the dependency versions.",
    examples: {
        "npm unlink": "vrepo --npm --unlink --source path/to/myproject",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
        { id: ["--install", "-i"], type: "boolean", description: "Also install the updated unlinked dependencies using \"npm install\"." },
    ],
    async callback({ source = null, sources = null, install = false, }) {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Unlink wrapper.
        const unlink = async (source) => {
            const package_json_path = new vlib.Path(source + "/package.json");
            if (!package_json_path.exists()) {
                throw this.error(`The package.json file does not exist in the source path "${source}".`);
            }
            // Load package.json.
            const package_json = await package_json_path.load({ type: "object" });
            if (package_json.name == null || package_json.version == null) {
                throw this.error(`The package.json file does not contain a name or version field.`);
            }
            package_json.vrepo_links ??= {};
            package_json.dependencies ??= {};
            const spinner = new vlib.logging.Spinner({
                message: `Unlinking ${Object.keys(package_json.vrepo_links ?? {}).length} libraries from "${package_json.name}@${package_json.version}".`,
                success: `Unlinked ${Object.keys(package_json.vrepo_links ?? {}).length} libraries from "${package_json.name}@${package_json.version}".`,
            });
            let cmd = "npm --silent unlink";
            let npm_publishes = 0;
            for (const [name, dependency] of Object.entries(package_json.vrepo_links)) {
                const dependency_path = new vlib.Path(dependency + "/.vrepo");
                if (!dependency_path.exists()) {
                    spinner.error();
                    throw this.error(`The dependency path "${dependency}" does not exist.`);
                }
                const config = await dependency_path.load({ type: "object" });
                if (config.vrepo_links?.length) {
                    // Recursively unlink.
                    await unlink(dependency);
                }
                cmd += " " + name;
                // Publish to npm when changed.
                const repo = new Repo({
                    source: dependency,
                    git: false,
                    ssh: false,
                });
                await repo.init();
                repo.assert_init();
                const { has_changed } = await repo.npm.publish({ only_if_changed: true });
                if (has_changed) {
                    ++npm_publishes;
                    vlib.log(`Published npm package ${vlib.Color.bold(repo.npm.id)}.`);
                }
                else {
                    vlib.log(`Package ${vlib.Color.bold(repo.npm.id)} has not changed.`);
                }
                package_json.dependencies[repo.npm.config.name] = "^" + repo.npm.config.version;
            }
            execSync(cmd, { cwd: source, stdio: "inherit" });
            // Save.
            await package_json_path.save(JSON.stringify(package_json, null, 4));
            // Wait till the published libraries are live.
            if (npm_publishes && install) {
                await new Promise(resolve => setTimeout(resolve, 2_500));
                await poll_npm_install(source);
            }
            // Success.
            spinner.success();
        };
        /**
         * Poll the npm install untill the updated libraries are live.
         * @note In some cases this can take several minutes.
         *
         * @param cwd The current working directory.
         * @param max_elapsed The maximum elapsed time in ms.
         * @param interval The interval in ms to poll the npm install, is gradually increased.
         */
        const poll_npm_install = async (cwd, max_elapsed = 5 * 60_000, interval = 2_500) => {
            let interval_count = 0;
            const local_spinner = new vlib.logging.Spinner("Waiting for npm packages to become live...");
            const start = Date.now();
            let last_err = null;
            while (Date.now() - start < max_elapsed) {
                try {
                    execSync('npm install', { cwd, stdio: 'pipe' });
                    local_spinner.success();
                    return; // success
                }
                catch (err) {
                    const out = ((err.stderr && err.stderr.toString()) ||
                        (err.stdout && err.stdout.toString()) ||
                        err.message ||
                        '');
                    // console.log({out})
                    // only retry on the exact “No matching version found for” case
                    if (out.includes('No matching version found for')) {
                        last_err = err;
                        // wait a bit before retrying
                        ++interval_count;
                        if (interval === 2_500 && interval_count > 5) {
                            interval_count = 0;
                            interval = 10_000;
                        }
                        else if (interval === 10_000 && interval_count > 5) {
                            interval_count = 0;
                            interval = 30_000;
                        }
                        else if (interval === 30_000 && interval_count > 5) {
                            interval_count = 0;
                            interval = 60_000;
                        }
                        await new Promise(res => setTimeout(res, interval));
                        continue;
                    }
                    // any other npm error should immediately bubble
                    local_spinner.error();
                    throw err;
                }
            }
            // timed out: re-throw the last “no matching version” error
            local_spinner.error();
            throw cli.error(`Timed out waiting for npm packages to become live after ${max_elapsed / 1000} seconds.`, { docs: true });
        };
        // Iterate sources array.
        for (const source of all_sources) {
            await unlink(source);
        }
    }
});
// ---------------------------------------------------------------
// Git commands.
// // Remove commit history.
// cli.command({
//     id: vlib.CLI.and("--git", "--remove-history"),
//     description: "Remove the commit history.",
//     examples: {
//         "Remove commit history": "vrepo --git --remote-history",
//     },
//     args: [
//         { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
//         { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
//     ],
//     callback: async ({
//         source = null,
//         sources = null,
//     }) => {
//         let spinner: vlib.logging.Spinner | undefined;
//         try {
//             // Create sources array.
//             const all_sources: string[] = [];
//             if (typeof source === "string") {
//                 all_sources.push(source);
//             } else if (Array.isArray(sources)) {
//                 all_sources.push(...sources);
//             } else {
//                 all_sources.push("./");
//             }
//             // Iterate sources array.
//             for (const source of all_sources) {
//                 const repo: Repo = new Repo({
//                     source,
//                     npm: false,
//                     ssh: false,
//                 });
//                 await repo.init(); repo.assert_init();
//                 spinner = new vlib.logging.Spinner(`Removing the git commit history of package ${vlib.Color.bold(repo.name)} branch ${remote.branch}.`, {
//                     timestamps: true,
//                     auto_start: true,
//                 });
//                 let remote;
//                 const found = repo.config.git.remotes.find((item) => {
//                     if (item.branch != null) {
//                         remote = item;
//                         return true;
//                     }
//                 })
//                 if (remote != null) {
//                     await repo.git!.remove_commit_history({ branch: remote.branch })
//                 }
//                 spinner.success();
//             }
//         } finally {
//             if ()
//         }
//     }
// });
// Remove git cache.
cli.command({
    id: vlib.CLI.and("--git", "--remove-cache"),
    description: "Remove the git cache.",
    examples: {
        "Remove git cache": "vrepo --git --remove-cache",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    ],
    callback: async ({ source = null, sources = null, }) => {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const repo = new Repo({
                source,
                npm: false,
                ssh: false,
            });
            await repo.init();
            repo.assert_init();
            const spinner = new vlib.logging.Spinner({
                message: `Removing the git cache of package ${vlib.Color.bold(repo.name)}.`,
                success: `Removed the git cache of package ${vlib.Color.bold(repo.name)}.`,
            });
            repo.git.remove_cache();
            spinner.success();
        }
    }
});
// ----------------------------------------------------------------
// Generic commands.
// List large files.
cli.command({
    id: "--list-large-files",
    description: "List large files optionally with a gitignore filter.",
    examples: {
        "List large files": "vrepo --list-large-files --gitnore",
    },
    args: [
        { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
        { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
        { id: "--exclude", type: "array", description: "Exclude file paths." },
        { id: "--limit", type: "number", description: "The maximum number of files to list." },
        { id: ["--gitignore", "-g"], type: "boolean", description: "Enable the gitignore filter." },
        { id: ["--directories", "-d"], type: "boolean", description: "Also include directories." },
    ],
    callback: async ({ source = null, sources = null, exclude = [], limit = 25, gitignore = false, directories = false, }) => {
        // Create sources array.
        const all_sources = [];
        if (typeof source === "string") {
            all_sources.push(source);
        }
        else if (Array.isArray(sources)) {
            all_sources.push(...sources);
        }
        else {
            all_sources.push("./");
        }
        // Iterate sources array.
        for (const source of all_sources) {
            const repo = new Repo({
                source,
                npm: false,
                ssh: false,
            });
            await repo.init();
            repo.assert_init();
            vlib.logger.marker(repo.name, ":");
            const list = await repo.git.list_large_files({
                limit,
                exclude,
                gitignore,
                directories,
            });
            list.walk(({ path, size }) => {
                vlib.logger.raw(`    * ${path}: ${vlib.Utils.format_bytes(size)}.`);
            });
        }
    }
});
/**
 * Recursively finds all `.js` and `.d.ts` files under `target_dir`,
 * lists them, and asks the user whether to delete them.
 */
cli.command({
    id: "--delete-js-dts",
    description: "Delete all unexpected .js and .d.ts files where also a .ts resides under the same name. The user is prompted for confirmation before deletion.",
    examples: {
        "Delete files": "vrepo --delete-js-dts --target path/to/target_dir",
    },
    args: [
        { id: "--target", type: "string", description: "The target path." },
        { id: "--exclude", type: "array", description: "Exclude file paths.", required: false },
    ],
    async callback({ target: target_dir, exclude = [], }) {
        if (!new vlib.Path(target_dir).exists()) {
            throw this.error(`The target directory "${target_dir}" does not exist.`);
        }
        // 1) Find all .js and .d.ts files
        const patterns = ['**/*.js', '**/*.d.ts'];
        const ignore_patterns = ['**/dist/**', '**/node_modules/**', '**/*.old/**', ...exclude];
        const files_set = new Set();
        for (const pattern of patterns) {
            // const matches = await glob(pattern, { cwd: target_dir, absolute: true });
            const matches = await glob(pattern, {
                cwd: target_dir,
                absolute: true,
                ignore: ignore_patterns
            });
            for (const file of matches) {
                const p = new vlib.Path((file.endsWith(".js") ? file.slice(0, -3) : file.slice(0, -5)) + ".ts");
                if (p.exists()) {
                    files_set.add(file);
                }
            }
        }
        const files = Array.from(files_set).sort();
        // 2) Nothing to delete?
        if (files.length === 0) {
            console.log(`No compiled files (.js or .d.ts) found in "${target_dir}".`);
            return;
        }
        // 3) List the files
        console.log(`Found ${files.length} deletable file${files.length > 1 ? 's' : ''} in "${target_dir}":`);
        files.forEach((file, index) => {
            const rel_path = path.relative(process.cwd(), file);
            console.log(`  ${index + 1}. ${rel_path}`);
        });
        // 4) Confirm deletion
        const answer = await vlib.logging.prompt('Do you want to delete all of these files? (yes/no): ');
        const normalized = answer.trim().toLowerCase();
        if (normalized === 'y' || normalized === 'yes') {
            console.log('Deleting files...');
            // 5) Delete each file
            for (const file of files) {
                try {
                    await fs.promises.unlink(file);
                    const rel_path = path.relative(process.cwd(), file);
                    console.log(`  Deleted: ${rel_path}`);
                }
                catch (err) {
                    console.error(`  Failed to delete ${file}:`, err);
                }
            }
            console.log('Deletion complete.');
        }
        else {
            console.log('Operation cancelled. No files were deleted.');
        }
    }
});
// Start.
cli.start();
//# sourceMappingURL=cli.js.map