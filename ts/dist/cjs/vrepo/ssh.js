var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  SSH: () => SSH
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../vlib/index.js");
class SSH {
  source;
  proc;
  /** Constructor validator. */
  static validator = new import_vlib.Schema.Validator({
    throw: true,
    unknown: false,
    schema: {
      source: "string"
    }
  });
  // Constructor.
  constructor({ source }) {
    SSH.validator.validate(arguments[0]);
    this.source = new import_vlib.Path(source);
    this.proc = new import_vlib.Proc();
  }
  // Push through ssh.
  async push(alias, dest, del = false) {
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
      alias = alias.trim();
      dest = dest.trim();
      const args = ["-azP", `${this.source.str()}/`, `${alias}:${dest}/`];
      if (del) {
        args.push("--delete");
      }
      await this.proc.start({
        command: "rsync",
        args,
        // only works in production cause otherwise the terminal where electron was lauched will receive user input prompts.
        // command: `${SETTINGS.app_contents}/lib/non_interactive_exec.sh`,
        // args: ["rsync " + args.join(" ")], // otherwise it will cause weird errors or redirect to process.stdin which cant be fixed.
        working_directory: this.source.str(),
        interactive: false
      });
      if (code != 0) {
        return resolve("Failed to push the repository over ssh:\n" + err);
      }
      resolve(void 0);
    });
  }
  // Push through ssh.
  async pull(alias, src, del = false) {
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
      const args = ["-azP", `${alias.trim()}:${src.trim()}/`, `${this.source.str()}/`];
      if (del) {
        args.push("--delete");
      }
      await this.proc.start({
        command: "rsync",
        args,
        // only works in production cause otherwise the terminal where electron was lauched will receive user input prompts.
        // command: `${SETTINGS.app_contents}/lib/non_interactive_exec.sh`,
        // args: ["rsync " + args.join(" ")], // otherwise it will cause weird errors or redirect to process.stdin which cant be fixed.
        working_directory: this.source.str(),
        interactive: false
      });
      if (code != 0) {
        return resolve("Failed to push the repository over ssh:\n" + err);
      }
      resolve(void 0);
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SSH
});
