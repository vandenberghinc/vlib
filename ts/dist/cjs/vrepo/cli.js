#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_glob = require("glob");
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_node_child_process = require("node:child_process");
var vlib = __toESM(require("../vlib/index.js"));
var import_repo = require("./repo.js");
const find_config_path = () => vlib.cli.find_config_path({
  name: ["vrepo", ".vrepo"],
  extension: ["", ".json", ".jsonc"],
  up: 1,
  cwd: process.cwd()
})?.path;
const cli = new vlib.cli.CLI({ name: "vrepo", version: "1.0.2", strict: true });
cli.command({
  id: "--add-remote",
  description: "Add a remote.",
  examples: {
    "Add SSH remote 1": "vrepo --add-remote --ssh myalias:./destination",
    "Add SSH remote 2": "vrepo --add-remote --git --remote origin --destination git@github.com:username/project.git --branch main"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--ssh", type: "string", description: "The ssh alias and destination formatted like <alias>:<destination>" },
    { id: "--git", type: "boolean", description: "Add a git remote." },
    { id: "--remote", type: "string", description: 'The git branch, by default "origin".' },
    { id: "--destination", type: "string", description: "The git destination." },
    { id: "--branch", type: "string", description: 'The git branch, by default "main".' }
  ],
  async callback({ source = void 0, ssh = void 0, git = void 0, remote = "origin", destination = void 0, branch = "main" }) {
    if (typeof source !== "string") {
      source = find_config_path() || "./";
    }
    const repo = new import_repo.Repo({
      source,
      npm: false,
      ssh: Boolean(ssh),
      git
    });
    await repo.init();
    repo.assert_init();
    if (ssh != null) {
      const split = ssh.split(":");
      if (split.length < 2) {
        cli.error(`Invalid value for parameter "ssh", the parameter value must be formatted like "<alias>:<destination>".`, { docs: true });
        cli.docs(this);
        process.exit(1);
      }
      const remote2 = {
        alias: split[0],
        destination: split[1],
        enabled: true
      };
      const spinner = new vlib.logging.Spinner({
        message: `Adding ssh remote "${remote2.alias}:${remote2.destination}" to "${repo.name}".`,
        success: `Added ssh remote "${remote2.alias}:${remote2.destination}" to "${repo.name}".`
      });
      const duplicate = repo.config.ssh.remotes.iterate((item) => {
        if (item.alias === remote2.alias && item.destination === remote2.destination) {
          return true;
        }
      });
      if (duplicate !== true) {
        repo.config.ssh.remotes.push(remote2);
      }
      spinner.success();
    } else if (git != null) {
      if (destination == null) {
        throw cli.error(`Define parameter "--destination" (string).`, { docs: true });
      }
      const item = {
        remote,
        destination,
        branch,
        enabled: true
      };
      const spinner = new vlib.logging.Spinner({
        message: `Adding git remote "${item.remote}:${item.destination}:${item.branch}" to "${repo.name}".`,
        success: `Added git remote "${item.remote}:${item.destination}:${item.branch}" to "${repo.name}".`
      });
      const duplicate = repo.config.git.remotes.iterate((item2) => {
        if (item2.remote === item2.remote && item2.destination === item2.destination && item2.branch === item2.branch) {
          return true;
        }
      });
      if (duplicate !== true) {
        repo.config.git.remotes.push(item);
      }
      spinner.success();
    } else {
      throw cli.error(`Define either parameter "git" or "ssh".`, { docs: true });
    }
    repo.save();
  }
});
cli.command({
  id: "--remotes",
  description: "Get the registered remotes.",
  examples: {
    "Get remotes": "vrepo --remotes"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--git", type: "boolean", description: "Only show the git remotes." },
    { id: "--ssh", type: "boolean", description: "Only show the ssh remotes." }
  ],
  async callback({ source = null, sources = null, git = false, ssh = false }) {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false
      });
      await repo.init();
      repo.assert_init();
      vlib.log(repo.name, ":");
      if (git || git === false && ssh == false) {
        repo.config.git.remotes.walk((item) => {
          console.log(`    * ${item.branch} ${item.remote}:${item.destination} (git)`);
        });
      }
      if (ssh || git === false && ssh == false) {
        repo.config.ssh.remotes.walk((item) => {
          console.log(`    * ${item.alias}:${item.destination} (ssh)`);
        });
      }
    }
  }
});
cli.command({
  id: "--increment-version",
  description: "Increment the npm package version.",
  examples: {
    "Patch bump": "vrepo --increment-version --source path/to/project",
    "Minor bump": "vrepo --increment-version --minor",
    "Major bump": "vrepo --increment-version --major --source path/to/project"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--minor", type: "boolean", def: false, description: "Increment the minor version segment." },
    { id: "--major", type: "boolean", def: false, description: "Increment the major version segment." },
    { id: "--dry-run", type: "boolean", def: false, description: "Perform a dry run without saving." }
  ],
  async callback({ source, minor = false, major = false, dry_run = false }) {
    const bump_level = major ? "major" : minor ? "minor" : "patch";
    const src = new vlib.Path(source || "./");
    const spinner = new vlib.logging.Spinner({
      message: `Increment version in "${src}".`
    });
    const bump_version = (old_version) => {
      const segments = old_version.split(".").map((s) => parseInt(s, 10));
      if (segments.some(isNaN)) {
        throw new Error(`Invalid version format "${old_version}".`);
      }
      let target_index;
      if (bump_level === "major") {
        target_index = 0;
      } else if (bump_level === "minor") {
        target_index = segments.length - 2;
      } else {
        target_index = segments.length - 1;
      }
      while (target_index < 0) {
        segments.unshift(0);
        target_index++;
      }
      segments[target_index]++;
      for (let i = target_index + 1; i < segments.length; i++) {
        segments[i] = 0;
      }
      return segments.join(".");
    };
    const incr_version_in_json = async (json_path) => {
      const pkg = await json_path.load({ type: "object" });
      if (!pkg.version) {
        spinner.error();
        throw this.error(`Invalid JSON version file, the object at "${json_path}" does not have a version field.`);
      }
      const old_version = pkg.version;
      let new_version;
      try {
        new_version = bump_version(old_version);
      } catch (err) {
        spinner.error();
        throw this.error(err.message);
      }
      pkg.version = new_version;
      if (dry_run) {
        vlib.log("Dry run: would increment version in ", json_path, " to ", vlib.Color.bold(new_version));
        vlib.log("Dry run: would be file content: ", JSON.stringify(pkg, null, 4));
      } else {
        await json_path.save(JSON.stringify(pkg, null, 4));
      }
      spinner.success(`Incremented the version of "${json_path}" to ${vlib.Color.bold(new_version)}.`);
    };
    const incr_version_in_string_file = async (version_path) => {
      let raw_content;
      try {
        raw_content = await version_path.load({ type: "string" });
      } catch {
        spinner.error();
        throw this.error(`Cannot read file "${version_path}".`);
      }
      const old_version = raw_content.trim();
      let new_version;
      try {
        new_version = bump_version(old_version);
      } catch (err) {
        spinner.error();
        throw this.error(err.message);
      }
      if (dry_run) {
        vlib.log("Dry run: would increment version in ", version_path, " to ", vlib.Color.bold(new_version));
      } else {
        await version_path.save(new_version, { type: "string" });
      }
      spinner.success(`Incremented the version in "${version_path}" to ${vlib.Color.bold(new_version)}.`);
    };
    if (src.is_dir()) {
      let version_json;
      let version_string;
      if ((version_json = src.join("package.json")).exists() || (version_json = src.join("/../package.json")).exists() || (version_json = src.join("version.json")).exists() || (version_json = src.join("/../version.json")).exists()) {
        await incr_version_in_json(version_json);
      } else if ((version_string = src.join("version.txt")).exists() && version_string.is_file() || (version_string = src.join("version")).exists() && version_string.is_file()) {
        await incr_version_in_string_file(version_string);
      } else {
        spinner.error();
        throw this.error(`No package.json or version.json file found in directory "${src}".`);
      }
    } else if (src.is_file()) {
      const ext = src.extension();
      if (ext === ".json") {
        await incr_version_in_json(src);
      } else {
        await incr_version_in_string_file(src);
      }
    } else {
      spinner.error();
      throw this.error(`Invalid source path "${src}". It must be a file or directory.`);
    }
  }
});
cli.command({
  id: vlib.CLI.and("--git", "--push"),
  description: "Push the current project to one or multiple Git remotes.",
  examples: {
    "Git Push": "vrepo --git --push origin --forced"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package; defaults to current working directory." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages; defaults to --source or cwd." },
    { id: "--git", type: "string[]", def: [], description: "Push to a list of specific Git remotes." },
    { id: ["--forced", "-f"], type: "boolean", description: "Push with Git in forced mode." },
    { id: ["--ensure-push", "-e"], type: "boolean", description: "Ensure a Git push by editing the gitignore safely." },
    { id: ["--log-level", "-l"], type: "number", description: "The log level." }
  ],
  async callback({ source = null, sources = null, git = null, forced = false, ensure_push = false, log_level = 0 }) {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const src of all_sources) {
      const repo = new import_repo.Repo({ source: src, npm: false });
      await repo.init();
      repo.assert_init();
      let git_remotes = [];
      if (Array.isArray(git) && git.length > 0) {
        for (const remoteName of git) {
          const found = repo.config.git.remotes.iterate((item) => {
            if (item.remote === remoteName) {
              git_remotes.push(item);
              return true;
            }
          });
          if (!found) {
            throw this.error(`Git remote "${remoteName}" does not exist.`);
          }
        }
      } else {
        git_remotes = repo.config.git.remotes;
      }
      for (const remote of git_remotes) {
        const spinner = new vlib.logging.Spinner({
          message: `Pushing ${vlib.Color.bold(repo.name)} branch "${remote.branch}" to "${remote.remote} ${remote.destination}" (git).`,
          success: `Pushed ${vlib.Color.bold(repo.name)} branch "${remote.branch}" to "${remote.remote} ${remote.destination}" (git).`
        });
        const err = await repo.git.push({
          remote: remote.remote,
          dest: remote.destination,
          branch: remote.branch,
          forced,
          ensure_push,
          log_level
        });
        if (err) {
          spinner.error();
          throw this.error(err);
        }
        spinner.success();
      }
    }
  }
});
cli.command({
  id: vlib.CLI.and("--git", "--pull"),
  description: "Pull the current project from one or multiple Git remotes.",
  examples: {
    "Git Pull": "vrepo --git --pull origin --forced"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package; defaults to current working directory." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages; defaults to --source or cwd." },
    { id: "--git", type: "string[]", def: [], description: "Pull from a list of specific Git remotes." },
    { id: ["--forced", "-f"], type: "boolean", description: "Pull with Git in forced mode." }
  ],
  async callback({ source = null, sources = null, git = null, forced = false }) {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const src of all_sources) {
      const repo = new import_repo.Repo({ source: src, npm: false });
      await repo.init();
      repo.assert_init();
      if (!Array.isArray(git)) {
        throw this.error(`The git parameter must be an array of Git remotes.`, { docs: true });
      }
      for (const remoteName of git) {
        const remote = repo.config.git.remotes.find((item) => item.remote === remoteName);
        if (!remote) {
          throw this.error(`Git remote "${remoteName}" does not exist.`);
        }
        const spinner = new vlib.logging.Spinner({
          message: `Pulling ${vlib.Color.bold(repo.name)} branch "${remote.branch}" from "${remote.remote}" "${remote.destination}" (git).`,
          success: `Pulled ${vlib.Color.bold(repo.name)} branch "${remote.branch}" from "${remote.remote}" "${remote.destination}" (git).`
        });
        console.error(this.error("This feature is disabled  and should be re-activated once tested."));
        vlib.utils.safe_exit();
        const err = await repo.git.pull({ remote: remote.remote, dest: remote.destination, branch: remote.branch, forced });
        if (err) {
          spinner.error();
          throw this.error(err);
        }
        spinner.success();
      }
    }
  }
});
cli.command({
  id: vlib.CLI.and("--ssh", "--push"),
  description: "Push the current project to one or multiple SSH remotes.",
  examples: {
    "SSH Push": "vrepo --ssh --push myserver,mybackup --del"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package; defaults to current working directory." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages; defaults to --source or cwd." },
    { id: "--ssh", type: "string[]", def: [], description: "Push to a list of specific SSH remotes." },
    { id: ["--del", "-d"], type: "boolean", description: "Push with SSH in delete mode." },
    { id: ["--log-level", "-l"], type: "number", description: "The log level." }
  ],
  async callback({ source = null, sources = null, ssh = null, del = false, log_level = 0 }) {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const src of all_sources) {
      const repo = new import_repo.Repo({ source: src, npm: false });
      await repo.init();
      repo.assert_init();
      let ssh_remotes = [];
      if (Array.isArray(ssh) && ssh.length > 0) {
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
      } else {
        ssh_remotes = repo.config.ssh.remotes;
      }
      for (const remote of ssh_remotes) {
        const spinner = new vlib.logging.Spinner({
          message: `Pushing ${vlib.Color.bold(repo.name)} to ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`,
          success: `Pushed ${vlib.Color.bold(repo.name)} to ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`
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
cli.command({
  id: vlib.CLI.and("--ssh", "--pull"),
  description: "Pull the current project from one or multiple SSH remotes.",
  examples: {
    "SSH Pull": "vrepo --ssh --pull myserver --del"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package; defaults to current working directory." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages; defaults to --source or cwd." },
    { id: "--ssh", type: "string[]", def: [], description: "Pull from a list of specific SSH remotes." },
    { id: ["--del", "-d"], type: "boolean", description: "Pull with SSH in delete mode." }
  ],
  async callback({ source = null, sources = null, ssh = null, del = false }) {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const src of all_sources) {
      const repo = new import_repo.Repo({ source: src, npm: false });
      await repo.init();
      repo.assert_init();
      if (!Array.isArray(ssh)) {
        throw this.error(`The ssh parameter must be an array of SSH remotes.`, { docs: true });
      }
      for (const alias of ssh) {
        const remote = repo.config.ssh.remotes.find((item) => item.alias === alias);
        if (!remote) {
          throw this.error(`SSH remote "${alias}" does not exist.`);
        }
        const spinner = new vlib.logging.Spinner({
          message: `Pulling ${vlib.Color.bold(repo.name)} from ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`,
          success: `Pulled ${vlib.Color.bold(repo.name)} from ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`
        });
        console.error(this.error("This feature is disabled  and should be re-activated once tested."));
        vlib.utils.safe_exit();
        const err = await repo.ssh.pull(remote.alias, remote.destination, del);
        if (err) {
          spinner.error();
          throw this.error(err);
        }
        spinner.success();
      }
    }
  }
});
cli.command({
  id: vlib.CLI.and("--npm", "--push"),
  description: "Publish a npm package.",
  examples: {
    "Publish": "vrepo --npm --push"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--on-commits-only", type: "boolean", description: "Only when local commits have been made." }
  ],
  callback: async ({ source = null, sources = null, on_commits_only = false }) => {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        git: false,
        ssh: false
      });
      await repo.init();
      repo.assert_init();
      const spinner = new vlib.logging.Spinner({
        message: `Publishing npm package ${vlib.Color.bold(repo.npm.id)}`
      });
      let has_changed = false;
      try {
        ({ has_changed } = await repo.npm.publish({ only_if_changed: on_commits_only }));
      } catch (err) {
        spinner.error();
        throw err;
      }
      if (has_changed) {
        spinner.success(`Published npm package ${vlib.Color.bold(repo.npm.id)}`);
      } else {
        spinner.stop();
        vlib.log(`Package ${vlib.Color.bold(repo.npm?.id)} has not changed.`);
      }
    }
  }
});
cli.command({
  id: vlib.CLI.and("--npm", "--link"),
  description: "Simply call npm link on target vrepo projects.",
  examples: {
    "npm link": "vrepo --npm --link --source path/to/myproject"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--dependencies", type: "array", required: false, description: "The source path to the local dependencies to add. This parameter becomes optional once it has been executed once with dependencies." }
  ],
  async callback({ source = null, sources = null, dependencies = [] }) {
    if (!dependencies?.length) {
      throw this.error(`The argument --dependencies is required.`, { docs: true });
    }
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const source2 of all_sources) {
      const vrepo_src = new vlib.Path(source2 + "/.vrepo");
      if (!vrepo_src.exists()) {
        throw this.error(`The vrepo source path "${source2}" does not exist. Create an empty json file to continue.`);
      }
      const repo = new import_repo.Repo({
        source: source2,
        git: false,
        ssh: false,
        npm: false
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
        success: `Linked ${dependencies.length} dependencies to "${vrepo_src.str()}".`
      });
      let cmd = "npm --silent link";
      let edits = 0;
      for (const dependency of dependencies) {
        const dep_str = dependency;
        const abs_dependency = vlib.Path.abs(dependency);
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
        } else if (!repo.config.npm.links[pkg.name].some((p) => vlib.Path.abs(p).eq(abs_dependency))) {
          repo.config.npm.links[pkg.name].push(dependency);
          ++edits;
        } else if (typeof repo.config.npm.links[pkg.name] === "string") {
          if (repo.config.npm.links[pkg.name] === dependency) {
            repo.config.npm.links[pkg.name] = [dependency];
            ++edits;
          } else {
            repo.config.npm.links[pkg.name] = [
              repo.config.npm.links[pkg.name],
              dependency
            ];
            ++edits;
          }
        }
      }
      (0, import_node_child_process.execSync)(cmd, { cwd: source2, stdio: "inherit" });
      if (edits) {
        try {
          await vrepo_src.save(repo.config, { type: "jsonc" });
        } catch (err) {
          spinner.error();
          throw err;
        }
      }
      spinner.success();
    }
  }
});
cli.command({
  id: vlib.CLI.and("--npm", "--unlink"),
  description: "Unlink all links, check if there are any changed if so publish to npm and update the dependency versions.",
  examples: {
    "npm unlink": "vrepo --npm --unlink --source path/to/myproject"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: ["--install", "-i"], type: "boolean", description: 'Also install the updated unlinked dependencies using "npm install".' }
  ],
  async callback({ source = null, sources = null, install = false }) {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    const unlink = async (source2) => {
      const package_json_path = new vlib.Path(source2 + "/package.json");
      if (!package_json_path.exists()) {
        throw this.error(`The package.json file does not exist in the source path "${source2}".`);
      }
      const package_json = await package_json_path.load({ type: "object" });
      if (package_json.name == null || package_json.version == null) {
        throw this.error(`The package.json file does not contain a name or version field.`);
      }
      package_json.vrepo_links ??= {};
      package_json.dependencies ??= {};
      const spinner = new vlib.logging.Spinner({
        message: `Unlinking ${Object.keys(package_json.vrepo_links ?? {}).length} libraries from "${package_json.name}@${package_json.version}".`,
        success: `Unlinked ${Object.keys(package_json.vrepo_links ?? {}).length} libraries from "${package_json.name}@${package_json.version}".`
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
          await unlink(dependency);
        }
        cmd += " " + name;
        const repo = new import_repo.Repo({
          source: dependency,
          git: false,
          ssh: false
        });
        await repo.init();
        repo.assert_init();
        const { has_changed } = await repo.npm.publish({ only_if_changed: true });
        if (has_changed) {
          ++npm_publishes;
          vlib.log(`Published npm package ${vlib.Color.bold(repo.npm.id)}.`);
        } else {
          vlib.log(`Package ${vlib.Color.bold(repo.npm.id)} has not changed.`);
        }
        package_json.dependencies[repo.npm.config.name] = "^" + repo.npm.config.version;
      }
      (0, import_node_child_process.execSync)(cmd, { cwd: source2, stdio: "inherit" });
      await package_json_path.save(JSON.stringify(package_json, null, 4));
      if (npm_publishes && install) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        await poll_npm_install(source2);
      }
      spinner.success();
    };
    const poll_npm_install = async (cwd, max_elapsed = 5 * 6e4, interval = 2500) => {
      let interval_count = 0;
      const local_spinner = new vlib.logging.Spinner("Waiting for npm packages to become live...");
      const start = Date.now();
      let last_err = null;
      while (Date.now() - start < max_elapsed) {
        try {
          (0, import_node_child_process.execSync)("npm install", { cwd, stdio: "pipe" });
          local_spinner.success();
          return;
        } catch (err) {
          const out = err.stderr && err.stderr.toString() || err.stdout && err.stdout.toString() || err.message || "";
          if (out.includes("No matching version found for")) {
            last_err = err;
            ++interval_count;
            if (interval === 2500 && interval_count > 5) {
              interval_count = 0;
              interval = 1e4;
            } else if (interval === 1e4 && interval_count > 5) {
              interval_count = 0;
              interval = 3e4;
            } else if (interval === 3e4 && interval_count > 5) {
              interval_count = 0;
              interval = 6e4;
            }
            await new Promise((res) => setTimeout(res, interval));
            continue;
          }
          local_spinner.error();
          throw err;
        }
      }
      local_spinner.error();
      throw cli.error(`Timed out waiting for npm packages to become live after ${max_elapsed / 1e3} seconds.`, { docs: true });
    };
    for (const source2 of all_sources) {
      await unlink(source2);
    }
  }
});
cli.command({
  id: vlib.CLI.and("--git", "--remove-cache"),
  description: "Remove the git cache.",
  examples: {
    "Remove git cache": "vrepo --git --remove-cache"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." }
  ],
  callback: async ({ source = null, sources = null }) => {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false,
        ssh: false
      });
      await repo.init();
      repo.assert_init();
      const spinner = new vlib.logging.Spinner({
        message: `Removing the git cache of package ${vlib.Color.bold(repo.name)}.`,
        success: `Removed the git cache of package ${vlib.Color.bold(repo.name)}.`
      });
      repo.git.remove_cache();
      spinner.success();
    }
  }
});
cli.command({
  id: "--list-large-files",
  description: "List large files optionally with a gitignore filter.",
  examples: {
    "List large files": "vrepo --list-large-files --gitnore"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--exclude", type: "array", description: "Exclude file paths." },
    { id: "--limit", type: "number", description: "The maximum number of files to list." },
    { id: ["--gitignore", "-g"], type: "boolean", description: "Enable the gitignore filter." },
    { id: ["--directories", "-d"], type: "boolean", description: "Also include directories." }
  ],
  callback: async ({ source = null, sources = null, exclude = [], limit = 25, gitignore = false, directories = false }) => {
    let all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push(find_config_path() || "./");
    }
    if (all_sources.some((p) => vlib.GlobPattern.is(p))) {
      all_sources = await vlib.Path.glob(all_sources, { string: true });
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false,
        ssh: false
      });
      await repo.init();
      repo.assert_init();
      vlib.logger.marker(repo.name, ":");
      const list = await repo.git.list_large_files({
        limit,
        exclude,
        gitignore,
        directories
      });
      list.walk(({ path: path2, size }) => {
        vlib.logger.raw(`    * ${path2}: ${vlib.Utils.format_bytes(size)}.`);
      });
    }
  }
});
cli.command({
  id: "--delete-js-dts",
  description: "Delete all unexpected .js and .d.ts files where also a .ts resides under the same name. The user is prompted for confirmation before deletion.",
  examples: {
    "Delete files": "vrepo --delete-js-dts --target path/to/target_dir"
  },
  args: [
    { id: "--target", type: "string", description: "The target path." },
    { id: "--exclude", type: "array", description: "Exclude file paths.", required: false }
  ],
  async callback({ target: target_dir, exclude = [] }) {
    if (!new vlib.Path(target_dir).exists()) {
      throw this.error(`The target directory "${target_dir}" does not exist.`);
    }
    const patterns = ["**/*.js", "**/*.d.ts"];
    const ignore_patterns = ["**/dist/**", "**/node_modules/**", "**/*.old/**", ...exclude];
    const files_set = /* @__PURE__ */ new Set();
    for (const pattern of patterns) {
      const matches = await (0, import_glob.glob)(pattern, {
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
    if (files.length === 0) {
      console.log(`No compiled files (.js or .d.ts) found in "${target_dir}".`);
      return;
    }
    console.log(`Found ${files.length} deletable file${files.length > 1 ? "s" : ""} in "${target_dir}":`);
    files.forEach((file, index) => {
      const rel_path = import_path.default.relative(process.cwd(), file);
      console.log(`  ${index + 1}. ${rel_path}`);
    });
    const answer = await vlib.logging.prompt("Do you want to delete all of these files? (yes/no): ");
    const normalized = answer.trim().toLowerCase();
    if (normalized === "y" || normalized === "yes") {
      console.log("Deleting files...");
      for (const file of files) {
        try {
          await import_fs.default.promises.unlink(file);
          const rel_path = import_path.default.relative(process.cwd(), file);
          console.log(`  Deleted: ${rel_path}`);
        } catch (err) {
          console.error(`  Failed to delete ${file}:`, err);
        }
      }
      console.log("Deletion complete.");
    } else {
      console.log("Operation cancelled. No files were deleted.");
    }
  }
});
cli.start();
