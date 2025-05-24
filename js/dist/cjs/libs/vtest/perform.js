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
  perform: () => perform
});
module.exports = __toCommonJS(stdin_exports);
var import_js_beautify = __toESM(require("js-beautify"));
var import__ = require("../../index.js");
var import_module = require("./module.js");
const { js: beautify } = import_js_beautify.default;
async function perform({ results, module: module2 = import__.cli.get({ id: "--module", def: void 0 }), target = import__.cli.get({ id: "--target" }), stop_on_failure = import__.cli.present("--stop-on-failure"), stop_after = import__.cli.get({ id: "--stop-after", def: void 0 }), debug = import__.cli.get({ id: "--debug", def: 0, type: "number" }), interactive = import__.cli.present("--interactive"), all_yes = import__.cli.present(["--yes", "-y"]), repeat = import__.cli.get({ id: "--repeat", def: 0, type: "number" }), list_modules = import__.cli.present(["--list-modules", "--list"]), no_changes = import__.cli.present(["--no-changes", "-nc"]), refresh = import__.cli.present("--refresh") ? true : import__.cli.get({ id: "--refresh", def: false, type: ["string", "boolean"] }) }) {
  if (list_modules) {
    if (import_module.modules.length === 0) {
      console.log(`Available unit test modules: None`);
    } else {
      console.log(`Available unit test modules:`);
      for (const mod of import_module.modules) {
        console.log(` * ${mod.name}`);
      }
    }
    return true;
  }
  if (import_module.modules.length === 0) {
    console.log(`${import__.Color.red("Error")}: No unit tests defined, add unit tests using the add() function.`);
    return false;
  }
  if (interactive && !module2) {
    console.log(`${import__.Color.red("Error")}: Interactive mode is only available when a module is defined.`);
    return false;
  }
  const cache_path = new import__.Path(results);
  if (!cache_path.exists()) {
    throw new Error(`Cache directory "${results}" does not exist.`);
  } else if (!cache_path.is_dir()) {
    throw new Error(`Cache path "${results}" is not a directory.`);
  }
  if (module2 != null) {
    const mod = import_module.modules.find((m) => m.name === module2);
    if (!mod) {
      throw new Error(`Module "${module2}" was not found, the available modules are: [${import_module.modules.map((i) => i.name).join(", ")}]`);
    }
    return mod._run({
      target,
      stop_on_failure,
      stop_after,
      debug,
      interactive,
      cache: cache_path,
      all_yes,
      repeat,
      no_changes,
      refresh
    });
  }
  for (const mod of import_module.modules) {
    if (all_yes) {
      throw new Error(`The --yes option is not supported when running all unit tests, target a single module instead.`);
    }
    const proceed = await mod._run({
      target,
      stop_on_failure,
      stop_after,
      debug,
      interactive,
      cache: cache_path,
      all_yes: false,
      refresh
    });
    if (!proceed) {
      return false;
    }
  }
  return true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  perform
});
