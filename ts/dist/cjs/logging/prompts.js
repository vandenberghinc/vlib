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
  confirm: () => confirm,
  prompt: () => prompt
});
module.exports = __toCommonJS(stdin_exports);
var readline = __toESM(require("readline"));
async function prompt(question) {
  return new Promise((resolve, reject) => {
    const int = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    int.on("SIGINT", () => {
      int.close();
      reject(new Error("Interrupted by user [SIGINT]."));
    });
    try {
      int.question(question, (name) => {
        int.close();
        resolve(name);
      });
    } catch (e) {
      reject(e);
    }
  });
}
const yes_set = /* @__PURE__ */ new Set(["y", "yes", "ok"]);
async function confirm(question, yes = yes_set) {
  return yes_set.has((await prompt(question + " (y/n) ")).toLowerCase().trim());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  confirm,
  prompt
});
