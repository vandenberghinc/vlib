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
  Command: () => Command
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../system/colors.js");
var import_error = require("./error.js");
var import_query = require("./query.js");
var Command;
(function(Command2) {
  function init(variant, cmd2) {
    let id = void 0;
    if (variant === "id") {
      if (!cmd2.id) {
        (0, import_error.throw_error)(`Command attribute "id" is required for type command type "id".`);
      }
      id = cmd2.id instanceof import_query.Query.Or || cmd2.id instanceof import_query.Query.And ? cmd2.id : typeof cmd2.id === "string" ? new import_query.Query.Or(cmd2.id) : new import_query.Query.Or(...cmd2.id);
    } else if (variant === "main") {
      id = new import_query.Query.Or("<main>");
    } else if (variant === "index") {
      (0, import_error.throw_error)(`Command variant "index" is not supported, use "id" or "main" instead.`);
    } else {
      (0, import_error.throw_error)(`Invalid command variant "${variant.toString()}". Expected "id" or "main".`);
    }
    if (!cmd2.args) {
      cmd2.args = [];
    }
    return {
      ...cmd2,
      variant,
      id,
      args: cmd2.args.map((a) => init_cmd_arg("auto", a))
    };
  }
  Command2.init = init;
  function init_cmd_arg(variant, arg) {
    if (variant === "auto") {
      if (typeof arg.index === "number") {
        variant = "index";
      } else if (arg.id != null) {
        variant = "id";
      } else {
        (0, import_error.throw_error)(`Command argument ${import_colors.Color.object(arg)} is missing both "id" and "index" attributes, cannot determine the variant.`);
      }
    }
    let arg_name = arg.name;
    switch (variant) {
      case "main":
        arg_name = "__main__";
        break;
      case "index":
        if (arg.index == null)
          (0, import_error.throw_error)(`Required argument attribute "index" is not defined for command argument ${import_colors.Color.object(arg)}.`);
        if (!arg_name) {
          arg_name = `arg_${arg.index}`;
        }
        break;
      case "id":
        if (!arg.id)
          (0, import_error.throw_error)(`Required argument attribute "id" is not defined for command argument ${import_colors.Color.object(arg)}.`);
        if (!arg_name) {
          if (arg.id instanceof import_query.Query.And) {
            arg_name = arg.id[arg.id.length - 1];
            if (Array.isArray(arg_name)) {
              arg_name = arg_name[0];
            }
          } else {
            let child = arg.id;
            while (child && typeof child !== "string") {
              if (child instanceof import_query.Query.And) {
                child = child[child.length - 1];
              } else if (Array.isArray(child)) {
                child = child[0];
              }
            }
            if (typeof child !== "string") {
              (0, import_error.throw_error)(`Invalid command argument id "${import_query.Query.to_str(arg.id)}", could not resolve an identifier.`);
            }
            arg_name = child;
            let trim_start = 0, c;
            while ((c = arg_name.charAt(trim_start)) === "-" || c === " " || c === "	" || c === "\r" || c === "\n") {
              ++trim_start;
            }
            if (trim_start > 0) {
              arg_name = arg_name.slice(trim_start);
            }
            arg_name = arg_name.replaceAll("-", "_").trimEnd();
            if (typeof arg_name !== "string" || !arg_name) {
              (0, import_error.throw_error)(`Invalid command argument id "${import_query.Query.to_str(arg.id)}", argument ended up empty after trimming.`);
            }
          }
          if (typeof arg_name !== "string" || !arg_name) {
            (0, import_error.throw_error)(`Failed to resolve the argument name of command argument ${import_colors.Color.object(arg)}.`);
          }
        }
        break;
      default:
        (0, import_error.throw_error)(`Invalid command argument variant "${variant.toString()}". Expected "id", "main" or "index".`);
    }
    return {
      ...arg,
      variant,
      name: arg_name,
      optional: arg.optional ?? (arg.required === false || arg.def !== void 0)
    };
  }
  Command2.init_cmd_arg = init_cmd_arg;
})(Command || (Command = {}));
const cmd = {
  id: "--push",
  description: "Push the current project to one or multiple remotes.",
  examples: {
    "Push": "vrepo --push --git origin --ssh myserver,mybackupserver --del --forced"
  },
  args: [
    { id: "--source", type: "string", description: "The source path to the package, when undefined the current working directory will be used as the package." },
    { id: "--sources", type: "string[]", description: "The source paths to multiple packages, when undefined the argument --source or the current working directory will be used as the package." },
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
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Command
});
