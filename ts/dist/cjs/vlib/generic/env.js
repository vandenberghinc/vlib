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
  Env: () => Env,
  env: () => Env
});
module.exports = __toCommonJS(stdin_exports);
var import_fs = __toESM(require("fs"));
var import_dotenv = require("dotenv");
var Scheme = __toESM(require("../schema/index.m.uni.js"));
var Env;
(function(Env2) {
  Env2.map = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== void 0) {
      Env2.map.set(key, value);
    }
  }
  const loaded_dotenvs = /* @__PURE__ */ new Set();
  function from(path, opts = { refresh: false }) {
    if (loaded_dotenvs.has(path) && !opts.refresh) {
      return;
    }
    if (import_fs.default.existsSync(path)) {
      const result = (0, import_dotenv.config)({ path });
      if (result.error) {
        throw result.error;
      }
    } else {
      throw new Error(`Environment file '${path}' does not exist.`);
    }
    loaded_dotenvs.add(path);
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== void 0) {
        Env2.map.set(key, value);
      }
    }
  }
  Env2.from = from;
  Env2.import_file = from;
  function has(name) {
    return Env2.map.has(name);
  }
  Env2.has = has;
  function get(...args) {
    let name;
    let types;
    let throw_err = false;
    if (args.length === 1) {
      const param = args[0];
      if (typeof param === "string") {
        name = param;
      } else if (typeof param === "object" && param !== null) {
        name = param.name;
        types = param.type;
        throw_err = param.throw ?? false;
      } else {
        throw new Error(`Invalid argument, expected string or options object, not ${Scheme.value_type(param)}`);
      }
    } else if (args.length === 2) {
      name = args[0];
      const second = args[1];
      if (second === true) {
        throw_err = true;
      } else if (typeof second === "object" && second !== null) {
        types = second.type;
        throw_err = second.throw ?? false;
      } else {
        throw new Error(`Invalid second argument, expected boolean or options object, not ${Scheme.value_type(second)}`);
      }
    } else {
      throw new Error(`Invalid arguments length (${args.length}), expected 1 or 2.`);
    }
    if (!Env2.map.has(name)) {
      if (throw_err) {
        throw new Error(`Environment variable '${name}' is not defined.`);
      }
      return void 0;
    }
    const raw_value = Env2.map.get(name);
    if (!types) {
      return raw_value;
    }
    return parse_typed_value(raw_value, types);
  }
  Env2.get = get;
  function set(name, value) {
    const string_value = typeof value === "string" ? value : JSON.stringify(value);
    Env2.map.set(name, string_value);
    process.env[name] = string_value;
  }
  Env2.set = set;
  function parse_typed_value(value, types) {
    const try_parse = (type) => {
      switch (type) {
        case "string":
          return value;
        case "number":
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`Value '${value}' is not a valid number.`);
          }
          return num;
        case "boolean":
          const lower = value.toLowerCase();
          if (lower === "true")
            return true;
          if (lower === "false")
            return false;
          throw new Error(`Value '${value}' is not a valid boolean.`);
        case "string_array":
          return value.split(",").map((v) => v.trim());
        case "number_array":
          return value.split(",").map((v) => {
            const n = Number(v.trim());
            if (isNaN(n)) {
              throw new Error(`Element '${v}' is not a valid number.`);
            }
            return n;
          });
        case "boolean_array":
          return value.split(",").map((v) => {
            const t = v.trim().toLowerCase();
            if (t === "true")
              return true;
            if (t === "false")
              return false;
            throw new Error(`Element '${v}' is not a valid boolean.`);
          });
        case "array":
        case "object":
          try {
            return JSON.parse(value);
          } catch (err) {
            throw new Error(`Value is not a valid JSON object: ${err}`);
          }
        default:
          throw new Error(`Unsupported type '${type}'.`);
      }
    };
    if (Array.isArray(types)) {
      const errors = [];
      for (const t of types) {
        try {
          return try_parse(t);
        } catch (err) {
          errors.push(err);
        }
      }
      throw new Error(`Value '${value}' does not match any of types [${types.join(", ")}]: ${errors.map((e) => e.message).join("; ")}`);
    }
    return try_parse(types);
  }
})(Env || (Env = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Env,
  env
});
