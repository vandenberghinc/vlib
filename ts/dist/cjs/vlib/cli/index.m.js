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
  And: () => import_query.And,
  Arg: () => import_arg.Base,
  CLI: () => import_cli.CLI,
  Command: () => import_command.Command,
  Error: () => import_error.CLIError,
  Or: () => import_query.Or,
  and: () => import_query.and,
  arg: () => import_arg.Base,
  cli: () => import_cli.cli,
  command: () => import_command.Command,
  find_config_path: () => import_utils.find_config_path,
  get: () => import_cli.get,
  or: () => import_query.or,
  present: () => import_cli.present
});
module.exports = __toCommonJS(stdin_exports);
var import_error = require("./error.js");
var import_cli = require("./cli.js");
var import_query = require("./query.js");
var import_arg = require("./arg.js");
var import_command = require("./command.js");
var import_utils = require("./utils.js");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  And,
  Arg,
  CLI,
  Command,
  Error,
  Or,
  and,
  arg,
  cli,
  command,
  find_config_path,
  get,
  or,
  present
});
