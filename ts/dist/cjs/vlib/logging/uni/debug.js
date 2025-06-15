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
  Debug: () => Debug,
  debug: () => debug
});
module.exports = __toCommonJS(stdin_exports);
var import_directives = require("./directives.js");
var import_logger = require("./logger.js");
class Debug extends import_logger.Logger {
  constructor(opts) {
    let super_opts;
    if (opts instanceof import_directives.ActiveLogLevel || typeof opts === "number") {
      super_opts = { level: opts, debug: true };
    } else if (opts) {
      super_opts = {
        ...opts,
        debug: true,
        raw: true
      };
    } else {
      throw new TypeError(`Logger constructor expects a number, ActiveLogLevel, or an object with level and debug properties, not "${opts.toString()}".`);
    }
    super(super_opts);
  }
}
const debug = new Debug({ level: 0 });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Debug,
  debug
});
