var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Git: () => Git
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../vlib/index.js");
var import_ignore = __toESM(require("ignore"));
class Git {
  source;
  username;
  email;
  gitignore;
  proc = new import_vlib.Proc();
  /** Constructor validator. */
  static validator = new import_vlib.Scheme.Validator("object", {
    unknown: false,
    throw: true,
    scheme: {
      source: "string",
      username: "string",
      email: "string",
      version_path: { type: "string", required: false }
    }
  });
  constructor({ source, username, email, version_path = void 0 }) {
    Git.validator.validate(arguments[0]);
    this.source = new import_vlib.Path(source).abs();
    this.username = username;
    this.email = email;
    this.gitignore = (0, import_ignore.default)();
    const gitignore_path = this.source.join(".gitignore");
    if (gitignore_path.exists()) {
      let filtered = "";
      const data = gitignore_path.load_sync();
      for (let line of data.split("\n")) {
        line = line.trim();
        if (line.length > 0) {
          while (line.length > 0 && line.last() === "/") {
            line = line.substr(0, line.length - 1);
          }
          filtered += line + "\n";
        }
      }
      this.gitignore.add(filtered);
    }
  }
  // Git preperation.
  async _git_prepare(remote, dest, branch) {
    return new Promise(async (resolve) => {
      let err = "";
      let code = 0;
      this.proc.on_output = (data) => {
      };
      this.proc.on_error = (data) => {
        err += data;
      };
      this.proc.on_exit = (_code) => {
        code = _code ?? -1;
        if (code != 0 && err == "") {
          err += `Child process exited with code ${code}.`;
        }
      };
      remote = remote.trim();
      dest = dest.trim();
      branch = branch.trim();
      if (this.username == null) {
        return resolve("There is no git username defined.");
      } else if (this.email == null) {
        return resolve("There is no git email defined.");
      }
      const git = this.source.join(`/.git`);
      if (!git.exists()) {
        await this.proc.start({
          command: "git",
          args: ["init"],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (err.length > 0) {
          return resolve("Failed to create a git repository:\n" + err);
        }
      }
      await this.proc.start({
        command: "bash",
        args: ["-c", `git config --global user.email "${this.email}" && git config --global user.name "${this.username}"`],
        working_directory: this.source.str(),
        interactive: false,
        env: {
          ...process.env,
          "GIT_TERMINAL_PROMPT": "0"
        }
      });
      if (err.length > 0) {
        return resolve("Failed to set the git username and email:\n" + err);
      }
      await this.proc.start({
        command: "git",
        args: ["remote", "set-url", remote, dest],
        working_directory: this.source.str(),
        interactive: false,
        env: {
          ...process.env,
          "GIT_TERMINAL_PROMPT": "0"
        }
      });
      if (err.indexOf("error: No such remote ") !== -1) {
        err = "";
        await this.proc.start({
          command: "git",
          args: ["remote", "add", remote, dest],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
      }
      if (err.length > 0) {
        return resolve("Failed to set the git origin:\n" + err);
      }
      await this.proc.start({
        command: "git",
        args: ["checkout", branch],
        working_directory: this.source.str(),
        interactive: false,
        env: {
          ...process.env,
          "GIT_TERMINAL_PROMPT": "0"
        }
      });
      if (err.indexOf(`Already on '${branch}'`) !== -1) {
        err = "";
      } else if (err.indexOf(`error: pathspec '${branch}'`) !== -1) {
        err = "";
        await this.proc.start({
          command: "git",
          args: ["checkout", "-b", branch],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (err.indexOf(`Switched to a new branch '${branch}'`) !== -1) {
          err = "";
        }
      }
      if (err.length > 0) {
        return resolve("Failed to set the git branch:\n" + err);
      }
      resolve(void 0);
    });
  }
  // Push through git.
  async push({ remote, dest, branch, forced = false, ensure_push = false, log_level = 0 }) {
    return new Promise(async (resolve, reject) => {
      let restore_readme;
      try {
        let err = "";
        let code = 0;
        err = await this._git_prepare(remote, dest, branch);
        if (err) {
          return resolve(err);
        }
        err = "";
        this.proc.on_output = (data) => {
          if (log_level >= 1) {
            console.log(data);
          }
        };
        this.proc.on_error = (data) => {
          if (log_level >= 1) {
            console.log(data);
          }
          err += data;
        };
        this.proc.on_exit = (_code) => {
          code = _code ?? -1;
          if (code != 0 && err == "") {
            err += `Child process exited with code ${code}.`;
          }
        };
        let version;
        if (this.source.join(`package.json`).exists()) {
          const data = JSON.parse(this.source.join(`package.json`).load_sync());
          version = data.version;
        }
        if (version) {
          const readme = this.source.join(`README.md`);
          if (readme.exists()) {
            restore_readme = await readme.load();
            await readme.save(restore_readme.replaceAll("{{VERSION}}", version));
          }
        }
        if (ensure_push) {
          const gitignore_path = this.source.join(".gitignore");
          if (gitignore_path.exists()) {
            let data = gitignore_path.load_sync();
            if (data.last() === " ") {
              data = data.substr(0, data.length - 1);
            } else {
              data += " ";
            }
            gitignore_path.save_sync(data);
          } else {
            gitignore_path.save_sync("");
          }
        }
        if (log_level >= 1) {
          console.log(`Executing ($ git add).`);
        }
        await this.proc.start({
          command: "git",
          args: ["add", "-A"],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (log_level >= 1) {
          console.log(`Command ($ git add) exited with code ${code}.`);
        }
        if (err.length > 0) {
          if (restore_readme) {
            await this.source.join(`README.md`).save(restore_readme);
          }
          return resolve("Failed to add files to the git repository:\n" + err);
        }
        if (log_level >= 1) {
          console.log(`Executing ($ git commit).`);
        }
        this.proc.on_exit = (_code) => {
          code = _code ?? -1;
          if (code > 1 && err == "") {
            err += `Child process exited with code ${code}.`;
          }
        };
        await this.proc.start({
          command: "git",
          args: ["commit", "-m", "Automatic updates"],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (log_level >= 1) {
          console.log(`Command ($ git commit) exited with code ${code}.`);
        }
        if (err.length > 0) {
          if (restore_readme) {
            await this.source.join(`README.md`).save(restore_readme);
          }
          return resolve("Failed to commit to the git repository:\n" + err);
        }
        if (log_level >= 1) {
          console.log(`Executing ($ git push).`);
        }
        err = "";
        this.proc.on_exit = (_code) => {
          code = _code ?? -1;
          if (code > 0) {
            err += `Child process exited with code ${code}.`;
          }
        };
        const args = ["push", "-u", remote, branch];
        if (forced) {
          args.push("-f");
        }
        await this.proc.start({
          command: "git",
          args,
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (log_level >= 1) {
          console.log(`Command ($ git push) exited with code ${code}.`);
        }
        if (code > 0) {
          if (restore_readme) {
            await this.source.join(`README.md`).save(restore_readme);
          }
          return resolve("Failed to push the git repository:\n" + err);
        }
        if (restore_readme) {
          await this.source.join(`README.md`).save(restore_readme);
        }
        resolve(void 0);
      } catch (e) {
        if (restore_readme) {
          await this.source.join(`README.md`).save(restore_readme);
        }
        reject(e);
      }
    });
  }
  // Pull through git.
  async pull({ remote, dest, branch, forced = false }) {
    return new Promise(async (resolve) => {
      let err = "";
      let code = 0;
      err = await this._git_prepare(remote, dest, branch);
      if (err) {
        return resolve(err);
      }
      err = "";
      this.proc.on_output = (data) => {
      };
      this.proc.on_error = (data) => {
        err += data;
      };
      this.proc.on_exit = (_code) => {
        code = _code ?? -1;
        if (code != 0 && err == "") {
          err += `Child process exited with code ${code}.`;
        }
      };
      this.proc.on_exit = (_code) => {
        code = _code ?? -1;
        if (code > 0 && err == "") {
          err += `Child process exited with code ${code}.`;
        }
      };
      const args = ["pull", remote, branch];
      if (forced) {
        args.push("-f");
      }
      await this.proc.start({
        command: "git",
        args,
        working_directory: this.source.str(),
        interactive: false,
        env: {
          ...process.env,
          "GIT_TERMINAL_PROMPT": "0"
        }
      });
      if (err.length > 0 || code != 0) {
        return resolve("Failed to pull the git repository:\n" + err);
      }
      resolve(void 0);
    });
  }
  // Remove commit history.
  async remove_commit_history({ branch }) {
    return new Promise(async (resolve) => {
      let err = "";
      let code = 0;
      const commands = [
        ["checkout", "--orphan", "tmp-branch", "-q"],
        ["add", "-A"],
        ["commit", "-am", "Initial Commit", "-q"],
        ["branch", "-D", branch, "-q"],
        ["branch", "-m", branch]
        // ["push", "-f", "origin", branch]
      ];
      this.proc.on_output = (data) => {
      };
      this.proc.on_error = (data) => {
        err += data;
      };
      this.proc.on_exit = (_code) => {
        code = _code ?? -1;
        if (code != 0 && err == "") {
          err += `Child process exited with code ${code}.`;
        }
      };
      for (let i = 0; i < commands.length; i++) {
        await this.proc.start({
          command: "git",
          args: commands[i],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (err.length > 0 || code != 0) {
          return resolve("Failed to remove the commit history:\n" + err);
        }
      }
      resolve(void 0);
    });
  }
  // Remove cache.
  async remove_cache() {
    return new Promise(async (resolve) => {
      let err = "";
      let code = 0;
      const commands = [
        ["rm", "-r", "--cached", "."]
      ];
      this.proc.on_output = (data) => {
      };
      this.proc.on_error = (data) => {
        err += data;
      };
      this.proc.on_exit = (_code) => {
        code = _code ?? -1;
        if (code != 0 && err == "") {
          err += `Child process exited with code ${code}.`;
        }
      };
      for (let i = 0; i < commands.length; i++) {
        await this.proc.start({
          command: "git",
          args: commands[i],
          working_directory: this.source.str(),
          interactive: false,
          env: {
            ...process.env,
            "GIT_TERMINAL_PROMPT": "0"
          }
        });
        if (err.length > 0 || code != 0) {
          return resolve("Failed to remove the commit history:\n" + err);
        }
      }
      resolve(void 0);
    });
  }
  // Is ignored by gitignore.
  is_ignored(path, _is_relative = false) {
    if (path instanceof import_vlib.Path) {
      path = path.str();
    }
    return this.gitignore.ignores(_is_relative ? path : new import_vlib.Path(path).abs().str().substr(this.source.str().length + 1));
  }
  // List large files.
  async list_large_files({ exclude = [], limit = 25, gitignore = true, directories = false }) {
    const sizes = [];
    const paths = await this.source.paths({ recursive: true, absolute: true, exclude });
    for (const path of paths) {
      if ((directories || !path.is_dir()) && !exclude.includes(path.str())) {
        sizes.append([path.size, path]);
      }
    }
    sizes.sort((a, b) => b[0] - a[0]);
    const list = [];
    let listed = 0;
    for (const [size, path] of sizes) {
      if (!gitignore || !this.is_ignored(path)) {
        list.append({ path, size });
        ++listed;
        if (listed >= limit) {
          break;
        }
      }
    }
    return list;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Git
});
