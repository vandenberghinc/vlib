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
  Clipboard: () => Clipboard,
  clipboard: () => Clipboard
});
module.exports = __toCommonJS(stdin_exports);
var Clipboard;
(function(Clipboard2) {
  let node_clipboard = null;
  let exec_fn = null;
  async function init() {
    if (node_clipboard !== null || exec_fn !== null)
      return;
    try {
      node_clipboard = (await import("clipboardy")).default;
      return;
    } catch {
    }
    const { spawn } = await import("child_process");
    exec_fn = (cmd, args, input) => new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "ignore"] });
      let out = "";
      if (input !== void 0) {
        child.stdin.write(input);
        child.stdin.end();
      }
      child.stdout.on("data", (chunk) => out += chunk.toString());
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve(out || void 0) : reject(new Error(`Command failed: ${cmd}`)));
    });
  }
  async function set(data) {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    await init();
    if (node_clipboard) {
      return node_clipboard.write(text);
    }
    if (!exec_fn)
      throw new Error("No clipboard method available");
    const plt = process.platform;
    if (plt === "darwin")
      await exec_fn("pbcopy", [], text);
    else if (plt === "win32")
      await exec_fn("powershell", ["-noprofile", "-command", "Set-Clipboard"], text);
    else {
      try {
        await exec_fn("xclip", ["-selection", "clipboard"], text);
      } catch {
        await exec_fn("xsel", ["--clipboard", "--input"], text);
      }
    }
  }
  Clipboard2.set = set;
  async function get(opts) {
    await init();
    let text;
    if (node_clipboard) {
      text = await node_clipboard.read();
    } else {
      if (!exec_fn)
        throw new Error("No clipboard method available");
      const plt = process.platform;
      if (plt === "darwin")
        text = await exec_fn("pbpaste", []);
      else if (plt === "win32")
        text = await exec_fn("powershell", ["-noprofile", "-command", "Get-Clipboard"]);
      else {
        try {
          text = await exec_fn("xclip", ["-selection", "clipboard", "-o"]);
        } catch {
          text = await exec_fn("xsel", ["--clipboard", "--output"]);
        }
      }
    }
    if (opts?.json) {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Failed to parse clipboard content as JSON");
      }
    }
    return text;
  }
  Clipboard2.get = get;
})(Clipboard || (Clipboard = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Clipboard,
  clipboard
});
