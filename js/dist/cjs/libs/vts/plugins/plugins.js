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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Plugins: () => Plugins,
  create_plugins: () => create_plugins,
  plugins: () => Plugins
});
module.exports = __toCommonJS(stdin_exports);
var import_dirname = require("./dirname.js");
var import_fill_templates = require("./fill_templates.js");
var import_header = require("./header.js");
var import_no_debug = require("./no_debug.js");
var import_upsert_runtime_vars = require("./upsert_runtime_vars.js");
var import_version = require("./version.js");
var import_regex_replace = require("./regex_replace.js");
__reExport(stdin_exports, require("./plugin.js"), module.exports);
const Plugins = {
  Dirname: import_dirname.Dirname,
  dirname: import_dirname.Dirname,
  FillTemplates: import_fill_templates.FillTemplates,
  fill_templates: import_fill_templates.FillTemplates,
  Header: import_header.Header,
  header: import_header.Header,
  NoDebug: import_no_debug.NoDebug,
  no_debug: import_no_debug.NoDebug,
  UpsertRuntimeVars: import_upsert_runtime_vars.UpsertRuntimeVars,
  upsert_runtime_vars: import_upsert_runtime_vars.UpsertRuntimeVars,
  Version: import_version.Version,
  version: import_version.Version,
  RegexReplace: import_regex_replace.RegexReplace,
  regex_replace: import_regex_replace.RegexReplace
};
function create_plugins({ tsconfig, pkg_json, header, dirname = false, yes = false, version, no_debug = false, templates, exact_templates }) {
  if (dirname && !tsconfig) {
    throw new Error(`Plugin ${Plugins.Dirname.id} requires a tsconfig path or directory with tsconfig.json.`);
  }
  return [
    header ? new Plugins.Header({ ...header, start_year: header.year, yes }) : void 0,
    dirname ? new Plugins.dirname({ tsconfig, pkg_json }) : void 0,
    version ? new Plugins.version({ pkg_json: version ?? pkg_json }) : void 0,
    no_debug ? new Plugins.no_debug() : void 0,
    templates ? new Plugins.fill_templates({ templates, prefix: "{{", suffix: "}}" }) : void 0,
    exact_templates ? new Plugins.fill_templates({ templates: exact_templates, prefix: "", suffix: "" }) : void 0
  ];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Plugins,
  create_plugins,
  plugins,
  ...require("./plugin.js")
});
