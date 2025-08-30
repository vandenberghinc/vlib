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
  Config: () => Config,
  Package: () => Package
});
module.exports = __toCommonJS(stdin_exports);
var import_vlib = require("../vlib/index.js");
var import_git = require("./git.js");
var import_npm = require("./npm.js");
var import_ssh = require("./ssh.js");
const import_meta = {};
var Config;
(function(Config2) {
  Config2.Schema = {
    version_path: {
      type: "string",
      required: false
      // postprocess: (value) => {
      //     if (value) {
      //         value = value.trim();
      //         if (value.charAt(0) !== "/") {
      //             value = this.source.join(value).str();
      //         }
      //         return value;
      //     }
      // }
    },
    ssh: {
      type: "object",
      required: false,
      schema: {
        remotes: {
          type: "array",
          default: [],
          value_schema: {
            type: "object",
            schema: {
              alias: "string",
              destination: "string",
              enabled: { type: "boolean", default: true }
            }
          }
        }
      }
    },
    git: {
      type: "object",
      required: false,
      schema: {
        username: "string",
        email: "string",
        remotes: {
          type: "array",
          default: [],
          value_schema: {
            type: "object",
            schema: {
              remote: "string",
              branch: "string",
              destination: "string",
              enabled: { type: "boolean", default: true }
            }
          }
        }
      }
    },
    npm: {
      type: "object",
      required: false,
      schema: {
        path: {
          type: "string",
          required: false,
          default: "./package.json"
        },
        links: {
          type: "object",
          required: false,
          value_schema: { type: "array", value_schema: "string" }
        }
      }
    }
  };
})(Config || (Config = {}));
class Package {
  // Attributes.
  source;
  name;
  git_enabled;
  ssh_enabled;
  npm_enabled;
  config_path;
  config;
  git;
  ssh;
  npm;
  /** Constructor validator. */
  static validator = new import_vlib.Schema.Validator({
    throw: true,
    unknown: false,
    schema: {
      source: "string",
      git: { type: "boolean", default: true },
      ssh: { type: "boolean", default: true },
      npm: { type: "boolean", default: true }
    }
  });
  // Wrapper function to locate the configuration file.
  static find_config_path(cwd = process.cwd()) {
    return import_vlib.CLI.find_config_path({
      name: ["vrepo", ".vrepo"],
      extension: ["", ".json", ".jsonc"],
      up: 1,
      cwd
    });
  }
  // Constructor.
  constructor({
    source,
    git = true,
    // git enabled.
    ssh = true,
    // ssh enabled.
    npm = true
    // npm enabled.
  }) {
    Package.validator.validate(arguments[0]);
    this.git_enabled = git;
    this.ssh_enabled = ssh;
    this.npm_enabled = npm;
    const path = new import_vlib.Path(source);
    if (!path.exists()) {
      throw new Error(`Source path "${path.str()}" does not exist.`);
    }
    const found = Package.find_config_path(path.path);
    if (!found) {
      throw new Error(`Source path "${path.str()}" does not contain a "vtest.json" like configuration file.`);
    }
    this.config_path = found;
    this.source = path.base() ?? found;
    this.name = this.source.full_name();
  }
  async init() {
    if (!this.config_path.exists()) {
      this.config = {
        ssh: {
          remotes: []
        },
        git: {
          username: void 0,
          email: void 0,
          remotes: []
        },
        version_path: this.source.join(".version.js").str(),
        npm: {
          path: "./package.json",
          links: {}
        }
      };
      await this.config_path.save(JSON.stringify(this.config, null, 4));
    } else {
      try {
        this.config = await this.config_path.load({ type: "jsonc" });
      } catch (e) {
        e.message = `${this.config_path.abs().str()}: ${e.message}`;
        throw e;
      }
    }
    this.assert_init();
    import_vlib.Schema.validate(this.config, {
      error_prefix: `${this.config_path.str()}: Invalid vrepo configuration file. `,
      unknown: false,
      throw: true,
      schema: {
        ...Config.Schema,
        version_path: {
          ...Config.Schema.version_path,
          postprocess: (value) => {
            if (value) {
              value = value.trim();
              if (value.charAt(0) !== "/") {
                value = this.source.join(value).str();
              }
              return value;
            }
          }
        },
        ssh: !this.ssh_enabled ? "any" : {
          ...Config.Schema.ssh,
          required: this.ssh_enabled
        },
        git: !this.git_enabled ? "any" : {
          ...Config.Schema.git,
          required: this.git_enabled
        }
      }
    });
    this.git = !this.git_enabled ? void 0 : new import_git.Git({
      source: this.source.str(),
      username: this.config.git.username,
      email: this.config.git.email,
      version_path: this.config.version_path
    });
    this.npm = !this.npm_enabled ? void 0 : new import_npm.NPM({
      source: this.source.str(),
      pkg_path: this.config.npm?.path,
      version_path: this.config.version_path
    });
    this.ssh = !this.ssh_enabled ? void 0 : new import_ssh.SSH({
      source: this.source.str()
    });
  }
  assert_init() {
    if (!this.config) {
      throw new Error(`VRepo configuration file "${this.config_path.str()}" is not initialized.`);
    }
  }
  // Save config files.
  save() {
    this.source.join(".vrepo").save_sync(JSON.stringify(this.config, null, 4));
    if (this.npm) {
      this.npm.save();
    }
  }
}
if (process.argv.includes("--vlib-generate-schemas")) {
  const __root = import_meta.dirname.split("vlib/ts/")[0] + "/vlib/ts/";
  import_vlib.Schema.create_json_schema_sync({
    unknown: false,
    output: `${__root}assets/schemas/vrepo.json`,
    schema: Config.Schema
  });
  (0, import_vlib.log)(`Generated JSON schema 'vrepo.json' at '${__root}assets/schemas/vrepo.json'`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  Package
});
