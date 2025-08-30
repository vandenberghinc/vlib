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
  Utils: () => Utils,
  utils: () => Utils
});
module.exports = __toCommonJS(stdin_exports);
var crypto = __toESM(require("crypto"));
var import_url = require("url");
var import_path = require("path");
var import_colors = require("./colors.js");
var import_path2 = require("./path.js");
var import_source_loc = require("../logging/uni/source_loc.js");
var Utils;
(function(Utils2) {
  async function sleep(msec) {
    return new Promise((resolve) => setTimeout(resolve, msec));
  }
  Utils2.sleep = sleep;
  function debounce(delay, func) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(args), delay);
    };
  }
  Utils2.debounce = debounce;
  function format_bytes(value) {
    if (typeof value === "string") {
      value = Buffer.byteLength(value, "utf-8");
    }
    if (value > 1024 * 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
    } else if (value > 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    } else if (value > 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(2)}MB`;
    } else if (value > 1024) {
      return `${(value / 1024).toFixed(2)}KB`;
    }
    return `${Math.floor(value)}B`;
  }
  Utils2.format_bytes = format_bytes;
  function hash(data, algo = "sha256", format = "hex") {
    const hash2 = crypto.createHash(algo);
    hash2.update(data);
    if (format) {
      return hash2.digest(format);
    }
    return hash2;
  }
  Utils2.hash = hash;
  const _npm_package_version_cache = /* @__PURE__ */ new Map();
  function load_npm_package_version(package_json_path, def = "1.0.0") {
    if (_npm_package_version_cache.has(package_json_path)) {
      return _npm_package_version_cache.get(package_json_path);
    }
    const p = new import_path2.Path(package_json_path);
    if (!p.exists()) {
      throw new Error(`Version file "${p.abs().str()}" does not exist.`);
    }
    const version = p.load_sync({ type: "object" }).version ?? def;
    _npm_package_version_cache.set(package_json_path, version);
    return version;
  }
  Utils2.load_npm_package_version = load_npm_package_version;
  function __dirname(import_meta) {
    return (0, import_path.dirname)((0, import_url.fileURLToPath)(import_meta.url));
  }
  Utils2.__dirname = __dirname;
  function __filename(import_meta) {
    return (0, import_url.fileURLToPath)(import_meta.url);
  }
  Utils2.__filename = __filename;
  function safe_exit(code = 1, message) {
    const id = new import_source_loc.SourceLoc(1).abs_id;
    if (message) {
      console.log(import_colors.Color.red(">>>"), message);
    }
    console.log(`${import_colors.Color.red_bold("Warning")}: Safe exit requested from ${import_colors.Color.bold(id)}, exiting process with exit status ${import_colors.Color.bold(code.toString())}.`);
    process.exit(code);
  }
  Utils2.safe_exit = safe_exit;
  function print(...args) {
    console.log(args.join(""));
  }
  Utils2.print = print;
  function printe(...args) {
    console.error(args.join(""));
  }
  Utils2.printe = printe;
  function print_marker(...args) {
    print(import_colors.Colors.blue, ">>> ", import_colors.Colors.end, ...args);
  }
  Utils2.print_marker = print_marker;
  function print_warning(...args) {
    print(import_colors.Colors.yellow, ">>> ", import_colors.Colors.end, ...args);
  }
  Utils2.print_warning = print_warning;
  function print_error(...args) {
    printe(import_colors.Colors.red, ">>> ", import_colors.Colors.end, ...args);
  }
  Utils2.print_error = print_error;
})(Utils || (Utils = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Utils,
  utils
});
