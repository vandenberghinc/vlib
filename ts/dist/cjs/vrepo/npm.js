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
  NPM: () => NPM
});
module.exports = __toCommonJS(stdin_exports);
var import_child_process = require("child_process");
var import_crypto = __toESM(require("crypto"));
var import_vlib = require("../vlib/index.js");
class NPM {
  source;
  pkg_path;
  pkg_base;
  pkg;
  version_path;
  id;
  /** Constructor validator. */
  static validator = new import_vlib.Schema.Validator({
    throw: true,
    unknown: false,
    schema: {
      source: "string",
      pkg_path: { type: "string", required: false },
      version_path: { type: "string", required: false }
    }
  });
  /**
   * Create a new NPM instance.
   * @param source The source directory of the NPM package.
   * @param pkg_path The absolute path to the `package.json` file, defaults to `./package.json` in the source directory.
   */
  constructor({ source, pkg_path = void 0, version_path = void 0 }) {
    NPM.validator.validate(arguments[0]);
    this.source = new import_vlib.Path(source);
    this.version_path = version_path;
    this.pkg_path = pkg_path ? new import_vlib.Path(pkg_path.trim()[0] === "/" ? pkg_path : this.source.join(pkg_path)) : this.source.join("package.json");
    if (!this.pkg_path.exists()) {
      throw new Error(`NPM configuration file "${this.pkg_path.str()}" does not exist.`);
    }
    this.pkg_base = this.pkg_path.abs().base() ?? this.pkg_path;
    this.pkg = JSON.parse(this.pkg_path.load_sync());
    this.id = this.pkg.name + "@" + this.pkg.version;
  }
  // Check if the user is logged in.
  async logged_in() {
    const proc = new import_vlib.Proc();
    await proc.start({
      command: "npm",
      args: ["whoami"],
      working_directory: this.pkg_base.str(),
      interactive: false
    });
    return proc.exit_status === 0;
  }
  // Log a user in.
  async login() {
    const logged_in = await this.logged_in();
    if (logged_in === false) {
      throw new Error("No npm user is logged in, execute ($ npm login).");
    }
  }
  // Save the config.
  save() {
    this.pkg_path.save_sync(JSON.stringify(this.pkg, null, 4));
  }
  // Increment the version.
  async increment_version({ save = true } = {}) {
    let version = this.pkg.version;
    if (version === void 0) {
      version = "1.0.0";
    } else {
      const split = version.split(".").map((x) => parseInt(x));
      split[split.length - 1] += 1;
      version = split.join(".");
    }
    if (save) {
      this.pkg.version = version;
      this.save();
    }
    return version;
  }
  // Publish a package.
  async publish({ only_if_changed = false }) {
    if (only_if_changed && !await this.has_commits()) {
      return { has_changed: false, live_version: this.pkg.version };
    }
    if (this.pkg.scripts?.publish !== void 0) {
      throw new Error(`The package.json file contains a "publish" script, which is not allowed when using the NPM class to publish. Please remove the "publish" script from package.json.`);
    }
    await this.login();
    if (this.version_path) {
      const version_export = new import_vlib.Path(this.version_path);
      version_export.save_sync(`export default "${this.pkg.version}";`);
    }
    if (this.pkg.bin !== void 0) {
      const proc2 = new import_vlib.Proc();
      await proc2.start({
        command: "npm",
        args: ["link"],
        working_directory: this.pkg_base.str(),
        interactive: false
      });
      if (proc2.exit_status !== 0) {
        if (proc2.err) {
          console.log(proc2.err);
        }
        throw new Error(proc2.err);
      }
    }
    const old_version = this.pkg.version;
    await this.increment_version();
    const readme = this.source.join(`/README.md`);
    let readme_data;
    if (readme.exists()) {
      readme_data = await readme.load();
      await readme.save(readme_data.replace(/version-.s*-blue/, `badge/version-${this.pkg.version}-blue`));
    }
    const proc = new import_vlib.Proc();
    await proc.start({
      command: "npm",
      args: ["publish"],
      working_directory: this.pkg_base.str(),
      interactive: false
    });
    if (proc.exit_status !== 0) {
      this.pkg.version = old_version;
      this.save();
      if (readme_data !== void 0) {
        await readme.save(readme_data);
      }
      if (proc.err) {
        console.log(proc.err);
      }
      throw new Error(`Failed to publish pacakge ${this.pkg.name}.`);
    }
    return { has_changed: true, live_version: this.pkg.version };
  }
  // Checks whether the local package differs from the published version by comparing tarball SHA-1 checksums.
  async has_commits(log_level = -1, tmp_dir = "/tmp") {
    const pkg_path = this.pkg_path;
    if (!pkg_path.exists()) {
      throw new Error(`Configuration file ${pkg_path.str()} does not exist.`);
    }
    const pkg_data = await pkg_path.load({ encoding: "utf-8" });
    let pkg;
    try {
      pkg = JSON.parse(pkg_data);
    } catch (error) {
      throw new Error(`Error parsing ${pkg_path.str()}.`);
    }
    if (!pkg.name || !pkg.version) {
      throw new Error(`Configuration file ${pkg_path.str()} must contain both 'name' and 'version'.`);
    }
    if (log_level > 0) {
      console.log(`Packing package "${pkg.name}" version "${pkg.version}" from ${this.pkg_base} into ${tmp_dir}...`);
    }
    let npm_pack_output;
    try {
      npm_pack_output = (0, import_child_process.execSync)(`npm pack --silent ${this.pkg_base}`, { cwd: tmp_dir });
    } catch (error) {
      throw new Error("Error during npm pack execution");
    }
    const tarball_name = npm_pack_output.toString().trim().split("\n").pop();
    const tarball_path = new import_vlib.Path(tmp_dir + "/" + tarball_name);
    if (!tarball_path.exists()) {
      throw new Error(`Error: Tarball ${tarball_name} was not found at ${tarball_path.str()}`);
    }
    const tarball_buffer = await tarball_path.load({ type: "buffer" });
    const local_hash = import_crypto.default.createHash("sha1").update(tarball_buffer).digest("hex");
    if (log_level > 0) {
      console.log(`Local tarball SHA-1: ${local_hash}`);
    }
    let published_hash;
    try {
      published_hash = (0, import_child_process.execSync)(`npm view ${pkg.name}@${pkg.version} dist.shasum`, { stdio: "pipe" }).toString().trim();
      if (log_level > 0) {
        console.log(`Published tarball SHA-1: ${published_hash}`);
      }
    } catch (error) {
      return true;
    }
    return local_hash !== published_hash;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NPM
});
