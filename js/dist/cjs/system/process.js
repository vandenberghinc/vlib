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
  Proc: () => Proc,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var cp = __toESM(require("child_process"));
class Proc {
  // Attributes.
  debug;
  proc = void 0;
  promise = void 0;
  err = void 0;
  out = void 0;
  exit_status = void 0;
  constructor({ debug = false } = {}) {
    this.debug = debug;
  }
  /*  @docs:
      @title: On output
      @desc: The on output event, can be overridden when required.
  */
  on_output(data) {
  }
  /*  @docs:
      @title: On error
      @desc: The on error event, can be overridden when required.
  */
  on_error(data) {
  }
  /*  @docs:
      @title: On exit
      @desc: The on exit event, can be overridden when required.
  */
  on_exit(code) {
  }
  /*  @docs:
      @title: Start
      @desc: Start a command.
      @param:
          @name: command
          @desc: The command program.
      @param:
          @name: args
          @desc: The command arguments.
      @param:
          @name: working_directory
          @desc: The working directory path.
      @param:
          @name: interactive
          @desc: Enable interactive mode.
          @experimental: true
      @param:
          @name: detached
          @desc: Enable detached mode.
      @param:
          @name: env
          @desc: The environment variables.
          @type: object
      @param:
          @name: colors
          @desc: Enable colors.
  */
  start({ command = "", args = [], working_directory = void 0, interactive = true, detached = false, env = void 0, colors = false, opts = {} }) {
    this.out = void 0;
    this.err = void 0;
    this.exit_status = void 0;
    this.promise = new Promise((resolve) => {
      if (this.debug) {
        console.log(`Start: ${command} ${args.join(" ")}`);
      }
      const options = {
        cwd: working_directory,
        stdio: [interactive ? "pipe" : "ignore", "pipe", "pipe"],
        shell: interactive,
        detached,
        ...opts
      };
      if (env != null) {
        options.env = env;
        if (colors) {
          options.env.FORCE_COLOR = "true";
        }
      } else if (colors) {
        options.env = { ...process.env, FORCE_COLOR: "true" };
      }
      this.proc = cp.spawn(command, args, options);
      let closed = 0;
      if (this.proc.stdout) {
        this.proc.stdout.on("data", (data) => {
          const str_data = data.toString();
          if (this.debug) {
            console.log("OUT:", str_data);
          }
          if (this.out === void 0) {
            this.out = "";
          }
          this.out += str_data;
          if (this.on_output !== void 0) {
            this.on_output(str_data);
          }
        });
      }
      if (this.proc.stderr) {
        this.proc.stderr.on("data", (data) => {
          const str_data = data.toString();
          if (this.debug) {
            console.log("ERR:", str_data);
          }
          if (this.err === void 0) {
            this.err = "";
          }
          this.err += str_data;
          if (this.on_error !== void 0) {
            this.on_error(str_data);
          }
        });
      }
      this.proc.on("exit", (code) => {
        if (this.debug && closed === 1) {
          console.log(`Child process exited with code ${code}.`);
        }
        this.exit_status = code;
        if (code !== 0 && (this.err == null || this.err.length === 0)) {
          this.err = `Child process exited with code ${code}.`;
        }
        if (this.on_exit !== void 0) {
          this.on_exit(code);
        }
        ++closed;
        if (closed == 2) {
          resolve(code);
        }
      });
      this.proc.on("close", (code) => {
        if (this.debug && closed === 1) {
          console.log(`Child process exited with code ${code}.`);
        }
        ++closed;
        if (closed == 2) {
          resolve(code);
        }
      });
    });
    return this.promise;
  }
  /*  @docs:
      @title: Write
      @desc: Write data to the stdin.
  */
  write(data) {
    if (this.proc != null && this.proc.stdin) {
      this.proc.stdin.write(data);
    }
    return this;
  }
  /*  @docs:
      @title: Join
      @desc: Wait till the process if finished.
      @note: This function must be awaited.
  */
  async join() {
    return new Promise(async (resolve) => {
      await this.promise;
      resolve();
    });
  }
  /*  @docs:
      @title: Kill
      @desc: Signal the process with a SIGINT signal.
  */
  kill(signal = "SIGINT") {
    if (this.proc == null) {
      return this;
    }
    this.proc.kill(signal);
    return this;
  }
}
var stdin_default = Proc;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Proc
});
