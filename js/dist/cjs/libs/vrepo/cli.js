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
var vlib = __toESM(require("../../index.js"));
var import_repo = require("./repo.js");
const cli = new vlib.cli.CLI({ name: "vrepo", version: "1.0.2", strict: true });
cli.command({
  id: "--push",
  description: "Push the current project to one or multiple remotes.",
  examples: {
    "Push": "vrepo --push --git origin --ssh myserver,mybackupserver --del --forced"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the package." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
    { id: "--git", type: "string[]", description: "Push to all git or a list of specific git remotes.", def: [] },
    { id: "--ssh", type: "string[]", description: "Push to all ssh or a list of specific ssh remotes.", def: [] },
    { id: ["--forced", "-f"], type: "boolean", description: "Push with git in forced mode." },
    { id: ["--del", "-d"], type: "boolean", description: "Push with ssh in delete mode." },
    { id: ["--ensure-push", "-e"], type: "boolean", description: "Ensure a git push by editing the gitignore safely." },
    { id: ["--log-level", "-l"], type: "number", description: "The log level." }
  ],
  callback: async ({ source = null, sources = null, git = null, ssh = null, forced = false, del = false, ensure_push = false, log_level = 0 }) => {
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false
      });
      await repo.init();
      repo.assert_init();
      let ssh_remotes = [], git_remotes = [];
      if (Array.isArray(git) && git.length > 0) {
        for (const remote of git) {
          const found = repo.config.git.remotes.iterate((item) => {
            if (item.remote === remote) {
              git_remotes.push(item);
              return true;
            }
          });
          if (!found) {
            cli.throw(`Git remote "${remote}" does not exist.`);
          }
        }
      } else if (Array.isArray(git) && git.length === 0) {
        git_remotes = repo.config.git.remotes;
      }
      if (Array.isArray(ssh) && ssh.length > 0) {
        for (const alias of ssh) {
          const found = repo.config.ssh.remotes.iterate((item) => {
            if (item.alias === alias) {
              ssh_remotes.push(item);
              return true;
            }
          });
          if (!found) {
            cli.throw(`SSH remote "${alias}" does not exist.`);
          }
        }
      } else if (Array.isArray(ssh) && ssh.length === 0) {
        ssh_remotes = repo.config.ssh.remotes;
      }
      if (git == null && ssh == null) {
        ssh_remotes = repo.config.ssh.remotes;
        git_remotes = repo.config.git.remotes;
      }
      for (const remote of git_remotes) {
        vlib.logger.marker(`Pushing ${vlib.Color.bold(repo.name)} branch "${remote.branch}" to "${remote.remote} ${remote.destination}" (git).`);
        try {
          const err = await repo.git.push({
            remote: remote.remote,
            dest: remote.destination,
            branch: remote.branch,
            forced,
            ensure_push,
            log_level
          });
          if (err) {
            cli.throw(err);
          }
        } catch (err) {
          cli.throw(err);
        }
      }
      for (const remote of ssh_remotes) {
        vlib.logger.marker(`Pushing ${vlib.Color.bold(repo.name)} to ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`);
        try {
          const err = await repo.ssh.push(remote.alias, remote.destination, del);
          if (err) {
            cli.throw(err);
          }
        } catch (err) {
          cli.throw(err);
        }
      }
    }
  }
});
cli.command({
  id: "--pull",
  description: "Pull the current project from one of the remotes.",
  examples: {
    "Pull": "vrepo --pull --ssh myserver --del"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--git", type: "array", description: "Pull from all git or a list of specific git remotes.", def: [] },
    { id: "--ssh", type: "array", description: "Pull from all ssh or a list of specific ssh remotes.", def: [] },
    { id: ["--forced", "-f"], type: "boolean", description: "Pull with git in forced mode." },
    { id: ["--del", "-d"], type: "boolean", description: "Pull with ssh in delete mode." }
  ],
  callback: async ({ source = null, sources = null, git = null, ssh = null, forced = false, del = false }) => {
    if (git == null && ssh == null || git != null && ssh != null) {
      cli.error(`Define either parameter "git" or "ssh".`);
      cli.docs(exports);
      process.exit(1);
    }
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false
      });
      await repo.init();
      repo.assert_init();
      if (git != null) {
        if (!Array.isArray(git)) {
          cli.throw(`The git parameter must be an array of git remotes.`);
        }
        for (const g of git) {
          const remote = repo.config.git.remotes.find((item) => item.remote === g);
          if (!remote) {
            return cli.throw(`Git remote "${git}" does not exist.`);
          }
          vlib.logger.marker(`Pulling ${vlib.Color.bold(repo.name)} branch "${remote.branch}" from "${remote.remote}" "${remote.destination}" (git).`);
          try {
            const err = await repo.git.pull({ remote: remote.remote, dest: remote.destination, branch: remote.branch, forced });
            if (err) {
              cli.throw(err);
            }
          } catch (err) {
            cli.throw(err);
          }
        }
      } else if (ssh != null) {
        if (!Array.isArray(ssh)) {
          cli.throw(`The ssh parameter must be an array of ssh remotes.`);
        }
        for (const s of ssh) {
          const remote = repo.config.ssh.remotes.find((item) => item.alias === s);
          if (!remote) {
            return cli.throw(`SSH remote "${s}" does not exist.`);
          }
          vlib.logger.marker(`Pulling ${vlib.Color.bold(repo.name)} from ${vlib.Color.bold(remote.alias)}:${remote.destination} (ssh).`);
          try {
            const err = await repo.ssh.pull(remote.alias, remote.destination, del);
            if (err) {
              cli.throw(err);
            }
          } catch (err) {
            cli.throw(err);
          }
        }
      } else {
        cli.error(`Define either parameter "git" or "ssh".`);
        cli.docs(exports);
        process.exit(1);
      }
    }
  }
});
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
      source = "./";
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
        cli.error(`Invalid value for parameter "ssh", the parameter value must be formatted like "<alias>:<destination>".`);
        cli.docs(this);
        process.exit(1);
      }
      const remote2 = {
        alias: split[0],
        destination: split[1],
        enabled: true
      };
      vlib.logger.marker(`Adding ssh remote "${remote2.alias}:${remote2.destination}" to "${repo.name}".`);
      const duplicate = repo.config.ssh.remotes.iterate((item) => {
        if (item.alias === remote2.alias && item.destination === remote2.destination) {
          return true;
        }
      });
      if (duplicate !== true) {
        repo.config.ssh.remotes.push(remote2);
      }
    } else if (git != null) {
      if (destination == null) {
        cli.error(`Define parameter "--destination" (string).`);
        cli.docs(this);
        process.exit(1);
      }
      const item = {
        remote,
        destination,
        branch,
        enabled: true
      };
      vlib.logger.marker(`Adding git remote "${item.remote}:${item.destination}:${item.branch}" to "${repo.name}".`);
      const duplicate = repo.config.git.remotes.iterate((item2) => {
        if (item2.remote === item2.remote && item2.destination === item2.destination && item2.branch === item2.branch) {
          return true;
        }
      });
      if (duplicate !== true) {
        repo.config.git.remotes.push(item);
      }
    } else {
      cli.error(`Define either parameter "git" or "ssh".`);
      cli.docs(this);
      process.exit(1);
    }
    try {
      repo.save();
    } catch (err) {
      cli.throw(err);
    }
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
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false
      });
      await repo.init();
      repo.assert_init();
      vlib.logger.marker(repo.name, ":");
      if (git || git === false && ssh == false) {
        repo.config.git.remotes.iterate((item) => {
          console.log(`    * ${item.branch} ${item.remote}:${item.destination} (git)`);
        });
      }
      if (ssh || git === false && ssh == false) {
        repo.config.ssh.remotes.iterate((item) => {
          console.log(`    * ${item.alias}:${item.destination} (ssh)`);
        });
      }
    }
  }
});
cli.command({
  id: vlib.CLI.and("--npm", "--publish"),
  description: "Publish a npm package.",
  examples: {
    "Publish": "vrepo --npm --publish"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." },
    { id: "--on-commits-only", type: "boolean", description: "Only when local commits have been made." }
  ],
  callback: async ({ source = null, sources = null, on_commits_only = false }) => {
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        git: false,
        ssh: false
      });
      await repo.init();
      repo.assert_init();
      try {
        const { has_changed } = await repo.npm.publish({ only_if_changed: on_commits_only });
        if (has_changed) {
          vlib.logger.marker(`Published npm package ${vlib.Color.bold(repo.npm.config.name + "@" + repo.npm.config.version)}.`);
        } else {
          vlib.logger.marker(`Package ${vlib.Color.bold(repo.npm.config.name + "@" + repo.npm.config.version)} has not changed.`);
        }
      } catch (err) {
        cli.throw(err);
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
  callback: async ({ source = null, sources = null, dependencies = [] }) => {
    if (!dependencies?.length) {
      cli.throw(`The argument --dependencies is required.`);
    }
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const vrepo_src = new vlib.Path(source2 + "/.vrepo");
      if (!vrepo_src.exists()) {
        cli.throw(`The vrepo source path "${source2}" does not exist. Create an empty json file to continue.`);
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
        cli.throw(`Argument --dependencies is required when this command is executed for the first time.`);
      }
      let cmd = "npm --silent link";
      let edits = 0;
      for (const dependency of dependencies) {
        const dep_str = dependency;
        const abs_dependency = vlib.Path.abs(dependency);
        const dependency_path = new vlib.Path(dependency + "/package.json");
        if (!dependency_path.exists()) {
          cli.throw(`The dependency path "${dependency}" does not exist.`);
        }
        const pkg = await dependency_path.load({ type: "object" });
        if (pkg.name == null || pkg.version == null) {
          cli.throw(`The dependency package.json file does not contain a name or version field.`);
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
        await vrepo_src.save(repo.config, { type: "jsonc" });
      }
      vlib.logger.marker(`Linked ${dependencies.length} dependencies to "${vrepo_src.str()}".`);
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
  callback: async ({ source = null, sources = null, install = false }) => {
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    const unlink = async (source2) => {
      const package_json_path = new vlib.Path(source2 + "/package.json");
      if (!package_json_path.exists()) {
        cli.throw(`The package.json file does not exist in the source path "${source2}".`);
      }
      const package_json = await package_json_path.load({ type: "object" });
      if (package_json.name == null || package_json.version == null) {
        cli.throw(`The package.json file does not contain a name or version field.`);
      }
      package_json.vrepo_links ??= {};
      package_json.dependencies ??= {};
      let cmd = "npm --silent unlink";
      let npm_publishes = 0;
      for (const [name, dependency] of Object.entries(package_json.vrepo_links)) {
        const dependency_path = new vlib.Path(dependency + "/.vrepo");
        if (!dependency_path.exists()) {
          cli.throw(`The dependency path "${dependency}" does not exist.`);
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
        try {
          const { has_changed } = await repo.npm.publish({ only_if_changed: true });
          if (has_changed) {
            ++npm_publishes;
            vlib.logger.marker(`Published npm package ${vlib.Color.bold(repo.npm.config.name + "@" + repo.npm.config.version)}.`);
          } else {
            vlib.logger.marker(`Package ${vlib.Color.bold(repo.npm.config.name + "@" + repo.npm.config.version)} has not changed.`);
          }
          package_json.dependencies[repo.npm.config.name] = "^" + repo.npm.config.version;
        } catch (err) {
          cli.throw(err);
        }
      }
      (0, import_node_child_process.execSync)(cmd, { cwd: source2, stdio: "inherit" });
      await package_json_path.save(JSON.stringify(package_json, null, 4));
      vlib.logger.marker(`Unlinked ${Object.keys(package_json.vrepo_links ?? {}).length} libraries from "${package_json.name}@${package_json.version}".`);
      if (npm_publishes && install) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        await poll_npm_install(source2);
      }
    };
    const poll_npm_install = async (cwd, max_elapsed = 5 * 6e4, interval = 2500) => {
      let interval_count = 0;
      const spinner = new vlib.logging.Spinner("Waiting for npm packages to become live...");
      const start = Date.now();
      let last_err = null;
      while (Date.now() - start < max_elapsed) {
        try {
          (0, import_node_child_process.execSync)("npm install", { cwd, stdio: "pipe" });
          spinner.success();
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
          spinner.error();
          throw err;
        }
      }
      spinner.error();
      throw last_err;
    };
    for (const source2 of all_sources) {
      await unlink(source2);
    }
  }
});
cli.command({
  id: vlib.CLI.and("--git", "--remove-history"),
  description: "Remove the commit history.",
  examples: {
    "Remove commit history": "vrepo --git --remote-history"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the source path." },
    { id: "--sources", type: "array", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the source path." }
  ],
  callback: async ({ source = null, sources = null }) => {
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false,
        ssh: false
      });
      await repo.init();
      repo.assert_init();
      let remote;
      const found = repo.config.git.remotes.iterate((item) => {
        if (item.branch != null) {
          remote = item;
          return true;
        }
      });
      vlib.logger.marker(`Removing the git commit history of package ${vlib.Color.bold(repo.name)} branch ${remote.branch}.`);
      if (remote == null) {
        await repo.git.remove_commit_history({ branch: remote.branch });
      }
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
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
    }
    for (const source2 of all_sources) {
      const repo = new import_repo.Repo({
        source: source2,
        npm: false,
        ssh: false
      });
      await repo.init();
      repo.assert_init();
      vlib.logger.marker(`Removing the git cache of package ${vlib.Color.bold(repo.name)}.`);
      repo.git.remove_cache();
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
    const all_sources = [];
    if (typeof source === "string") {
      all_sources.push(source);
    } else if (Array.isArray(sources)) {
      all_sources.push(...sources);
    } else {
      all_sources.push("./");
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
      list.iterate(({ path: path2, size }) => {
        console.log(`    * ${path2}: ${vlib.Utils.format_bytes(size)}.`);
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
  callback: async ({ target: target_dir, exclude = [] }) => {
    if (!new vlib.Path(target_dir).exists()) {
      cli.throw(`The target directory "${target_dir}" does not exist.`);
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
