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
  Path: () => Path
});
module.exports = __toCommonJS(stdin_exports);
var fs = __toESM(require("fs"));
var fs_extra = __toESM(require("fs-extra"));
var os = __toESM(require("os"));
var pathlib = __toESM(require("path"));
var diskusage = __toESM(require("diskusage"));
var readline = __toESM(require("readline"));
var import_json5 = __toESM(require("json5"));
var import_jsonc = require("../jsonc/jsonc.js");
var import_string = require("../primitives/string.js");
var import_glob_pattern = require("./glob_pattern.js");
var import_fast_glob = __toESM(require("fast-glob"));
const multi_dot_extensions = /* @__PURE__ */ new Set([
  // Compressed archives
  ".tar.gz",
  ".tar.bz2",
  ".tar.bz",
  ".tar.xz",
  ".tar.Z",
  ".tar.lz",
  ".tar.lzma",
  ".tar.zst",
  ".tar.lz4",
  ".cpio.gz",
  ".cpio.bz2",
  ".cpio.xz",
  ".iso.gz",
  ".iso.bz2",
  ".iso.xz",
  ".jar.gz",
  ".war.gz",
  ".ear.gz",
  // Source‐map files
  ".js.map",
  ".css.map",
  ".html.map",
  ".mjs.map",
  ".cjs.map",
  // Minified assets
  ".min.js",
  ".min.css",
  ".min.html",
  ".min.json",
  ".min.svg",
  // Testing/spec conventions
  ".spec.ts",
  ".spec.tsx",
  ".spec.js",
  ".spec.jsx",
  ".test.ts",
  ".test.tsx",
  ".test.js",
  ".test.jsx",
  // User scripts/styles
  ".user.js",
  ".user.css",
  // Flow-typed JS files
  ".js.flow",
  ".jsx.flow",
  // TypeScript declaration files
  ".d.ts",
  // Rails/ERB templates
  ".html.erb",
  ".js.erb",
  ".css.erb",
  ".scss.erb",
  ".sass.erb",
  ".coffee.erb",
  ".xml.erb",
  ".json.erb",
  ".yml.erb",
  ".md.erb",
  // Haml templates
  ".html.haml",
  ".js.haml",
  ".css.haml",
  // Slim templates
  ".html.slim",
  ".js.slim",
  ".css.slim",
  // Liquid templates (Jekyll, Shopify, etc.)
  ".html.liquid",
  ".md.liquid",
  ".xml.liquid",
  ".yml.liquid",
  // Laravel Blade
  ".blade.php",
  // “CSS Modules” conventions
  ".module.css",
  ".module.scss",
  ".module.sass",
  ".module.less",
  // “Global” styles conventions
  ".global.css",
  ".global.scss"
]);
const multi_dot_extensions_suffixes = new Set(Array.from(multi_dot_extensions).reduce((acc, ext) => {
  const parts = ext.split(".");
  if (parts.length < 2)
    return acc;
  const add = `.${parts[parts.length - 1]}`;
  if (!acc.includes(add))
    acc.push(add);
  return acc;
}, []));
const multi_dot_extensions_regex = new RegExp(`(${Array.from(multi_dot_extensions_suffixes).map((ext) => ext.replaceAll(".", "\\.")).join("|")})$`);
class Path {
  /** Create a PathError with a message and optional cause. */
  static _throw(message, cause) {
    throw new Path.PathError({ message, cause });
  }
  // Attributes.
  path;
  // internal file path, keep public.
  _stat;
  _full_name;
  _name;
  _extension;
  _base;
  _abs;
  /**
   * Construct a new path instance.
   * @param path The file path as a string or another Path instance.
   * @param clean Whether to clean the path by removing redundant slashes and dots.
   * @param stats Optional file system stats associated with the path.
   * @docs
   */
  constructor(path, clean = true, stats) {
    if (path == null) {
      Path._throw(`Invalid path "${path}".`);
    } else if (path instanceof Path) {
      this.path = path.path;
    } else if (typeof path !== "string") {
      Path._throw(`Invalid path "${path}". Expected a string or Path instance.`);
    } else {
      if (path.length === 0) {
        Path._throw(`Invalid path, cannot create a path from an empty string.`);
      }
      if (clean) {
        this.path = "";
        const max_i = path.length - 1;
        for (let i = 0; i < path.length; i++) {
          const c = path.charAt(i);
          if (c === "/" && (this.path.charAt(this.path.length - 1) === "/" || i == max_i)) {
            continue;
          } else if (c === "." && path.charAt(i - 1) === "/" && path.charAt(i + 1) === "/") {
            continue;
          } else {
            this.path += c;
          }
        }
      } else {
        this.path = path;
      }
    }
    if (stats !== void 0) {
      this._stat = stats;
    }
  }
  // ---------------------------------------------------------
  // Utils.
  /**
   * Trim the file path in place.
   * @docs
   */
  trim() {
    let start = 0, end = this.path.length;
    for (let i = 0; i < this.path.length; i++) {
      const c = this.path.charAt(i);
      if (c == " " || c == "	") {
        ++start;
      } else {
        break;
      }
    }
    for (let i = end - 1; i >= 0; i--) {
      const c = this.path.charAt(i);
      if (c == " " || c == "	") {
        --end;
      } else {
        break;
      }
    }
    if (start != 0 || end != this.path.length) {
      this.path = this.path.substring(start, end - start);
    }
    if (this.path.length === 0) {
      Path._throw(`Invalid path "${this.path}".`);
    }
  }
  /**
   * Cast the file path to a string.
   * @docs
   */
  toString() {
    return this.path;
  }
  /**
   * Cast the file path to a string.
   * @docs
   */
  str() {
    return this.path;
  }
  /** Cast to primitives. */
  [Symbol.toPrimitive](hint) {
    if (hint === "number") {
      return this.path.length;
    }
    return this.path;
  }
  // ---------------------------------------------------------
  // Static method.
  /**
   * Get the user's home directory path.
   * @returns {Path} A new Path instance pointing to the user's home directory.
   * @docs
   */
  static home() {
    return new Path(os.homedir());
  }
  /**
   * Get the current working directory path.
   * @returns {Path} A new Path instance pointing to the current working directory.
   * @docs
   */
  static cwd() {
    return new Path(process.cwd());
  }
  /**
   * Get the temporary directory path.
   * @returns {Path} A new Path instance pointing to the system's temporary directory.
   * @docs
   */
  static tmp() {
    return new Path(os.tmpdir());
  }
  // /**
  //  * Get the system's root directory path.
  //  * @returns {Path} A new Path instance pointing to the system's root directory.
  //  */
  // static root(): Path {
  //     // On Windows, the root is the drive letter with a trailing backslash.
  //     // On Unix-like systems, it is simply "/".
  //     return new Path(pathlib.parse(pathlib.resolve('/')).root);
  // }
  /**
   * Get the current operating system's path separator.
   * @returns {string} The path separator used by the current operating system ('/' for Unix-like, '\\' for Windows).
   * @docs
   */
  static sep() {
    return pathlib.sep;
  }
  /**
   * Find the common base path between an array of paths.
   * @param {string[]} paths - Array of path strings to analyze.
   * @returns {string|undefined} Returns a string when a common base path has been found, or undefined otherwise.
   * @docs
   */
  static find_common_base_path(paths) {
    if (!Array.isArray(paths) || paths.length === 0) {
      return "";
    }
    if (paths.length === 1) {
      return new Path(paths[0]).base()?.toString();
    }
    const separator = paths[0].includes("\\") ? "\\" : "/";
    const split_first_path = paths[0].split(separator);
    let common_length = split_first_path.length;
    for (let i = 1; i < paths.length; i++) {
      const split = paths[i].split(separator);
      const min_length = Math.min(common_length, split.length);
      let j = 0;
      while (j < min_length && split_first_path[j] === split[j]) {
        j++;
      }
      common_length = j;
      if (common_length === 0) {
        return void 0;
      }
    }
    return split_first_path.slice(0, common_length).join(separator);
  }
  /**
   * Check if a path exists.
   * @docs
   */
  static exists(path) {
    return fs.existsSync(path);
  }
  /**
   * Ensure a path exists; throw an error if not.
   * @param path Path to check.
   * @param err_prefix Optional prefix for the error message.
   * @docs
   */
  static ensure_exists_err(path, err_prefix = "") {
    path = new Path(path);
    if (!path.exists()) {
      Path._throw(`${err_prefix}Path "${path.str()}" does not exist.`);
    }
  }
  // ---------------------------------------------------------
  // Properties.
  /**
   * Get the length of the current path string.
   * @returns {number} The number of characters in the path string.
   * @docs
   */
  get length() {
    return this.path.length;
  }
  /**
   * Get the length of the current path string.
   * @returns {number} The number of characters in the path string.
   * @docs
   */
  get len() {
    return this.path.length;
  }
  /**
   * Get the file system stats for the current path.
   * @returns {fs.Stats} The file system stats object with modified time properties.
   * @throws Error if the path does not exist or cannot be accessed.
   * @docs
   */
  get stat() {
    if (this._stat !== void 0) {
      return this._stat;
    }
    try {
      this._stat = fs.statSync(this.path);
    } catch (e) {
      Path._throw(`Failed to stat "${this.path}".`, e);
    }
    if (this._stat == null) {
      Path._throw(`Path "${this.path}" does not exist or cannot be accessed.`);
    }
    return this._stat;
  }
  /**
   * Get the device identifier where the file resides.
   * @returns {number} The numeric device identifier.
   * @docs
   */
  get dev() {
    return this.stat.dev;
  }
  /**
   * Get the file system specific inode number.
   * @returns {number} The inode number of the file.
   * @docs
   */
  get ino() {
    return this.stat.ino;
  }
  /**
   * Get the file mode bits (permission and type).
   * @returns {number} The file mode bits.
   * @docs
   */
  get mode() {
    return this.stat.mode;
  }
  /**
   * Get the number of hard links to the file.
   * @returns {number} The number of hard links.
   * @docs
   */
  get nlink() {
    return this.stat.nlink;
  }
  /**
   * Get the user identifier of the file's owner.
   * @returns {number} The numeric user ID.
   * @docs
   */
  get uid() {
    return this.stat.uid;
  }
  /**
   * Get the group identifier of the file's group.
   * @returns {number} The numeric group ID.
   * @docs
   */
  get gid() {
    return this.stat.gid;
  }
  /**
   * Get the device identifier for special files.
   * @returns {number} The device identifier for special files.
   * @docs
   */
  get rdev() {
    return this.stat.rdev;
  }
  /**
   * Get the total size in bytes. For directories, calculates size recursively.
   * @returns {number} Total size in bytes.
   * @docs
   */
  get size() {
    if (this.stat.isDirectory()) {
      let calc = function(path) {
        let stat;
        try {
          stat = fs.statSync(path);
        } catch (e) {
          Path._throw(`Failed to stat "${path}".`, e);
        }
        if (stat.isFile()) {
          size += stat.size;
        } else if (stat.isDirectory()) {
          let children;
          try {
            children = fs.readdirSync(path);
          } catch (e) {
            Path._throw(`Failed to read directory "${path}".`, e);
          }
          children.forEach((file) => calc(`${path}/${file}`));
        }
      };
      let size = 0;
      calc(this.path);
      return size;
    } else {
      return this.stat.size;
    }
  }
  /**
   * Get the file system block size for I/O operations.
   * @returns {number} Block size in bytes.
   * @docs
   */
  get blksize() {
    return this.stat.blksize;
  }
  /**
   * Get the number of blocks allocated to the file.
   * @returns {number} Number of allocated blocks.
   * @docs
   */
  get blocks() {
    return this.stat.blocks;
  }
  /**
   * Get the last access time of the file (in milliseconds).
   * @returns {number} Milliseconds representing the last access time.
   * @docs
   */
  get atime() {
    return this.stat.atimeMs;
  }
  /**
   * Get the last modification time of the file (in milliseconds).
   * @returns {number} Milliseconds representing the last modification time.
   * @docs
   */
  get mtime() {
    return this.stat.mtimeMs;
  }
  /**
   * Get the last change time of the file metadata (in milliseconds).
   * @returns {number} Milliseconds representing the last change time.
   * @docs
   */
  get ctime() {
    return this.stat.ctimeMs;
  }
  /**
   * Get the creation time of the file (in milliseconds).
   * @returns {number} Milliseconds representing the file creation time.
   * @docs
   */
  get birthtime() {
    return this.stat.birthtimeMs;
  }
  /**
   * Get disk usage information for the directory.
   * @throws {Error} If the path is not a directory.
   * @returns {Promise<{available: number; free: number; total: number}>} Object containing disk space information in bytes.
   * @docs
   */
  async disk_usage() {
    if (!this.is_dir()) {
      Path._throw(`File path "${this.path}" is not a directory.`);
    }
    try {
      return await diskusage.check(this.path);
    } catch (e) {
      Path._throw(`Failed to check disk usage for "${this.path}".`, e);
    }
  }
  /**
   * Get available disk space for the directory.
   * @throws {Error} If the path is not a directory.
   * @returns {Promise<number>} Number of bytes available to the current user.
   * @docs
   */
  async available_space() {
    if (!this.is_dir()) {
      Path._throw(`File path "${this.path}" is not a directory.`);
    }
    try {
      const info = await diskusage.check(this.path);
      return info?.available;
    } catch (e) {
      Path._throw(`Failed to check available space for "${this.path}".`, e);
    }
  }
  // ---------------------------------------------------------
  // Functions.
  // Reset.
  // Should be called when the operating system's path has changed.
  // This does not reset the assigned path.
  /**
   * Equals another string or path.
   * @docs
   */
  eq(path) {
    if (path instanceof Path) {
      return this.path === path.path;
    }
    return this.path === path;
  }
  /**
   * Reset internal caches except path string.
   * @returns {this} The Path instance for chaining.
   * @docs
   */
  reset() {
    this._stat = void 0;
    this._full_name = void 0;
    this._name = void 0;
    this._extension = void 0;
    this._base = void 0;
    this._abs = void 0;
    return this;
  }
  refresh() {
    return this.reset();
  }
  /**
   * Check if the path is a file.
   * @docs
   */
  is_file() {
    return this.stat.isFile();
  }
  static is_file(path) {
    if (path instanceof Path) {
      return path.is_file();
    }
    try {
      return fs.statSync(path).isFile();
    } catch (e) {
      Path._throw(`Failed to stat "${path}".`, e);
    }
  }
  /**
   * Check if the path is a directory.
   * @docs
   */
  is_dir() {
    return this.stat.isDirectory();
  }
  /**
   * Check if the path exists
   * @docs
   */
  exists() {
    return fs.existsSync(this.path);
  }
  /**
   * Get the base path of this path, correctly handling escaped separators.
   * @param back - Number of directory levels to traverse up (default: 1).
   * @returns The parent Path instance, or undefined if at root.
   * @docs
   */
  base(back = 1) {
    const data = this.path;
    const len = data.length;
    if (back !== 1) {
      let count = 0;
      for (let i = len - 1; i >= 0; i--) {
        if (data.charAt(i) === "/" && data.charAt(i - 1) !== "\\") {
          count++;
          if (count === back) {
            return new Path(data.substring(0, i));
          }
        }
      }
      return void 0;
    }
    if (this._base !== void 0) {
      return this._base;
    }
    for (let i = len - 1; i > 0; i--) {
      if (data.charAt(i) === "/" && data.charAt(i - 1) !== "\\") {
        this._base = new Path(data.substring(0, i));
        return this._base;
      }
    }
    return void 0;
  }
  /**
   * Convert to a POSIX-style Path.
   * @docs
   */
  posix() {
    return new Path(this.path.split(pathlib.sep).join("/"), false);
  }
  /**
   * Convert `path` to a POSIX-style Path.
   * @docs
   */
  static posix(path) {
    if (path instanceof Path) {
      return new Path(path.path.split(pathlib.sep).join("/"), false);
    }
    return new Path(path.split(pathlib.sep).join("/"), false);
  }
  /**
   * Return `path` as a POSIX-style string.
   * @docs
   */
  static posix_str(path) {
    if (path instanceof Path) {
      return path.path.split(pathlib.sep).join("/");
    }
    return path.split(pathlib.sep).join("/");
  }
  /**
   * Get the full name of the path, including the file extension.
   * @param with_ext - Whether to include the file extension in the returned name (default: true).
   * @returns The full name of the path, with or without the extension.
   * @docs
   */
  full_name(with_ext = true) {
    if (with_ext && this._full_name !== void 0) {
      return this._full_name;
    }
    if (!with_ext && this._name !== void 0) {
      return this._name;
    }
    const data = this.path;
    const base_path = this.base();
    const start = base_path ? base_path.path.length + 1 : 0;
    const basename = data.substring(start);
    const last_dot = basename.lastIndexOf(".");
    if (last_dot !== -1) {
      this._extension = basename.substring(last_dot);
      if (multi_dot_extensions_suffixes.has(this._extension)) {
        const m = multi_dot_extensions_regex.exec(basename);
        if (m)
          this._extension = m[0];
      }
      this._name = basename.substring(0, basename.length - this._extension.length);
    } else {
      this._name = basename;
      this._extension = "";
    }
    this._full_name = this._name + this._extension;
    return with_ext ? this._full_name : this._name;
  }
  /**
   * Get the name of the file path without the extension.
   * @docs
   */
  name() {
    if (this._name !== void 0) {
      return this._name;
    }
    this.full_name();
    return this._name;
  }
  /**
   * Get the extension of the path, with correct multi-dot extension support.
   * @returns The file extension, including leading dot, or empty string if none.
   * @docs
   */
  extension() {
    if (this._extension !== void 0) {
      return this._extension;
    }
    this.full_name();
    return this._extension;
  }
  /**
   * Get the absolute path of the path
   * @docs
   */
  abs() {
    if (this._abs !== void 0) {
      return this._abs;
    }
    this._abs = new Path(pathlib.resolve(this.path));
    return this._abs;
  }
  static abs(path) {
    return new Path(path).abs();
  }
  /**
   * Join the path with another name or subpath
   * @docs
   */
  join(subpath, clean = true) {
    if (subpath instanceof Path) {
      return new Path(`${this.path}/${subpath.path}`, clean);
    }
    return new Path(`${this.path}/${subpath}`, clean);
  }
  /**
   * Copy the path to another location
   * @docs
   */
  async cp(destination) {
    if (destination == null) {
      Path._throw('Define parameter "destination".');
    }
    if (destination instanceof Path) {
      destination = destination.path;
    }
    try {
      await fs_extra.copy(this.path, destination);
    } catch (e) {
      Path._throw(`Failed to copy "${this.path}" to "${destination}".`, e);
    }
  }
  /**
   * Copy the path to another location synchronously.
   * @docs
   */
  cp_sync(destination) {
    if (destination == null) {
      Path._throw('Define parameter "destination".');
    }
    if (destination instanceof Path) {
      destination = destination.path;
    }
    try {
      fs_extra.copySync(this.path, destination);
    } catch (e) {
      Path._throw(`Failed to copy "${this.path}" to "${destination}".`, e);
    }
  }
  /**
   * Move the path to another location
   * @docs
   */
  async mv(destination) {
    if (destination instanceof Path) {
      destination = destination.path;
    }
    if (fs.existsSync(destination)) {
      Path._throw(`Destination path "${destination}" already exists.`);
    }
    try {
      await fs_extra.move(this.path, destination);
      this._stat = void 0;
    } catch (e) {
      Path._throw(`Failed to move "${this.path}" to "${destination}".`, e);
    }
  }
  /**
   * Delete the path
   * @docs
   */
  async del({ recursive = false } = {}) {
    if (!this.exists()) {
      return;
    }
    try {
      if (this.is_dir()) {
        await fs.promises.rm(this.path, { recursive });
      } else {
        await fs.promises.unlink(this.path);
      }
      this._stat = void 0;
    } catch (e) {
      Path._throw(`Failed to delete "${this.path}".`, e);
    }
  }
  /**
   * Delete the path synchronously.
   * @docs
   */
  del_sync({ recursive = false } = {}) {
    if (this.exists()) {
      try {
        if (this.is_dir()) {
          fs.rmSync(this.path, { recursive });
        } else {
          fs.unlinkSync(this.path);
        }
      } catch (e) {
        Path._throw(`Failed to delete "${this.path}".`, e);
      }
    }
    return this;
  }
  /**
   * Move the path to the trash directory
   * @docs
   */
  async trash() {
    const full_name = this.full_name();
    let trash;
    switch (os.platform()) {
      case "darwin":
        trash = pathlib.join(os.homedir(), ".Trash");
        break;
      case "linux":
        const xdg_data_home = process.env.XDG_DATA_HOME || pathlib.join(os.homedir(), ".local", "share");
        trash = pathlib.join(xdg_data_home, "Trash");
        break;
      default:
        Path._throw(`Unsupported platform "${os.platform()}" for trash.`);
    }
    if (trash == null) {
      Path._throw(`Unsupported platform "${os.platform()}" for trash.`);
    }
    let destination = `${trash}/${full_name}`;
    let counts = 0;
    while (fs.existsSync(destination)) {
      ++counts;
      destination = `${trash}/${full_name}-${counts}`;
    }
    await this.mv(destination);
  }
  /**
   * Create a directory
   * @param opts.recursive Whether to create parent directories if they do not exist, defaults to `false`
   *        Note that using `recursive: false` has slight performance benefits.
   * @docs
   */
  async mkdir(opts) {
    if (this.exists()) {
      return;
    }
    try {
      await fs.promises.mkdir(this.path, { recursive: opts?.recursive });
      this._stat = void 0;
    } catch (e) {
      Path._throw(`Failed to create directory "${this.path}".`, e);
    }
  }
  /**
   * Create a directory synchronously.
   * @param opts.recursive Whether to create parent directories if they do not exist, defaults to `false`
   *        Note that using `recursive: false` has slight performance benefits.
   * @docs
   */
  mkdir_sync(opts) {
    if (this.exists()) {
      return this;
    }
    try {
      fs.mkdirSync(this.path, { recursive: opts?.recursive });
    } catch (e) {
      Path._throw(`Failed to create directory "${this.path}".`, e);
    }
    return this;
  }
  /**
   * Create a file
   * @docs
   */
  async touch() {
    return this.save("");
  }
  /**
   * Get the relative path from this path to another absolute path.
   * @param child The target path to compute the relative path to.
   * @docs
   */
  relative(child) {
    if (child instanceof Path) {
      return new Path(pathlib.relative(this.path, child.path), false);
    }
    return new Path(pathlib.relative(this.path, child), false);
  }
  quote(def = '""') {
    const res = import_string.String.quote(this.path, def instanceof Path ? def.path : def);
    if (res === void 0) {
      return void 0;
    }
    if (def === "") {
      Path._throw("Default value cannot be an empty string.");
    }
    if (res === "") {
      Path._throw("Operation resulted in an empty string, which is not allowed.");
    }
    return new Path(res, false);
  }
  /**
   * Return the unquoted representation of the path.
   * @docs
   */
  unquote() {
    return new Path(import_string.String.unquote(this.path), false);
  }
  // async load<R extends Buffer = Buffer>(opts: { type: undefined | "buffer", encoding?: BufferEncoding }): Promise<R>;
  // async load<R extends boolean = boolean>(opts: { type: "boolean", encoding?: BufferEncoding }): Promise<R>;
  // async load<R extends number = number>(opts: { type: "number", encoding?: BufferEncoding }): Promise<R>;
  // async load<R extends string = string>(opts?: { type?: "string", encoding?: BufferEncoding }): Promise<R>;
  // async load<R extends any[] = any[]>(opts: { type: "array", encoding?: BufferEncoding }): Promise<R>;
  // async load<R extends Record<any, any> = Record<any, any>>(opts: { type: "object", encoding?: BufferEncoding }): Promise<R>;
  // async load<R extends any[] | Record<any, any> = any[] | Record<any, any>>(opts: { type: "json" | "json5" | "jsonc", encoding?: BufferEncoding }): Promise<R>;
  /**
   * Load the data from the path.
   * @docs
   */
  async load({ type = "string", encoding = void 0 } = {}) {
    let data;
    try {
      data = await fs.promises.readFile(this.path, encoding);
    } catch (e) {
      Path._throw(`Failed to read "${this.path}".`, e);
    }
    if (type == null || type === "buffer" || type === "undefined") {
      return data;
    } else if (type === "string") {
      return data.toString();
    } else if (type === "array" || type === "object" || type === "json") {
      return JSON.parse(typeof data === "string" ? data : data.toString());
    } else if (type === "json5") {
      return import_json5.default.parse(typeof data === "string" ? data : data.toString());
    } else if (type === "jsonc") {
      return import_jsonc.JSONC.parse(typeof data === "string" ? data : data.toString());
    } else if (type === "number") {
      return parseFloat(data.toString());
    } else if (type === "boolean") {
      const str = data.toString();
      return str === "1" || str === "true" || str === "TRUE" || str === "True";
    } else {
      Path._throw(`Invalid type "${type.toString()}".`);
    }
  }
  // load_sync<R extends Buffer = Buffer>(opts: { type: undefined | "buffer", encoding?: BufferEncoding }): R;
  // load_sync<R extends boolean = boolean>(opts: { type: "boolean", encoding?: BufferEncoding }): R;
  // load_sync<R extends number = number>(opts: { type: "number", encoding?: BufferEncoding }): R;
  // load_sync<R extends string = string>(opts?: { type?: "string", encoding?: BufferEncoding }): R;
  // load_sync<R extends any[] = any[]>(opts: { type: "array", encoding?: BufferEncoding }): R;
  // load_sync<R extends Record<string, any> = Record<string, any>>(opts: { type: "object", encoding?: BufferEncoding }): R;
  // load_sync<R extends any[] | Record<string, any> = any[] | Record<string, any>>(opts: { type: "json" | "json5" | "jsonc", encoding?: BufferEncoding }): R;
  /**
   * Load the data from the path synchronously.
   * @docs
   */
  load_sync({ type = "string", encoding = void 0 } = {}) {
    let data;
    try {
      data = fs.readFileSync(this.path, encoding);
    } catch (e) {
      Path._throw(`Failed to read "${this.path}".`, e);
    }
    if (type == null || type === "buffer" || type === "undefined") {
      return data;
    } else if (type === "string") {
      return data.toString();
    } else if (type === "array" || type === "object" || type === "json") {
      return JSON.parse(typeof data === "string" ? data : data.toString());
    } else if (type === "json5") {
      return import_json5.default.parse(typeof data === "string" ? data : data.toString());
    } else if (type === "jsonc") {
      return import_jsonc.JSONC.parse(typeof data === "string" ? data : data.toString());
    } else if (type === "number") {
      return parseFloat(data.toString());
    } else if (type === "boolean") {
      const str = data.toString();
      return str === "1" || str === "true" || str === "TRUE" || str === "True";
    } else {
      Path._throw(`Invalid type "${type.toString()}".`);
    }
  }
  /**
   * Save data to the path.
   * @docs
   */
  async save(data, opts) {
    if (opts?.type) {
      if (opts.type == null || opts.type === "buffer" || opts.type === "undefined") {
      } else if (opts.type === "string") {
      } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
        data = JSON.stringify(data);
      } else if (opts.type === "jsonc") {
        await import_jsonc.JSONC.save(this.path, data);
        return;
      } else if (opts.type === "number") {
        data = data.toString();
      } else if (opts.type === "boolean") {
        data = data.toString();
      } else {
        Path._throw(`Invalid type parameter "${opts.type.toString()}".`);
      }
    }
    try {
      await fs.promises.writeFile(this.path, data);
      this._stat = void 0;
    } catch (e) {
      Path._throw(`Failed to write "${this.path}".`, e);
    }
  }
  /**
   * Save data to the path synchronously.
   * @docs
   */
  save_sync(data, opts) {
    if (opts?.type) {
      if (opts.type == null || opts.type === "buffer" || opts.type === "undefined") {
      } else if (opts.type === "string") {
      } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
        data = JSON.stringify(data);
      } else if (opts.type === "jsonc") {
        Path._throw("JSONC is not supported in sync mode.");
      } else if (opts.type === "number") {
        data = data.toString();
      } else if (opts.type === "boolean") {
        data = data.toString();
      } else {
        Path._throw(`Invalid type parameter "${opts.type.toString()}".`);
      }
    }
    try {
      fs.writeFileSync(this.path, data);
    } catch (e) {
      Path._throw(`Failed to write "${this.path}".`, e);
    }
    return this;
  }
  /**
   * Asynchronously reads the file at this._path using a streaming interface.
   * Calls the optional `processLine` callback for each line as it is read,
   * and always returns an array of all lines once complete.
   * This approach is memory-efficient for large files while allowing
   * custom per-line processing.
   *
   * @param callback Optional callback invoked with each line and its index.
   * @returns Promise resolving to an array of all lines in the file.
   *
   * @docs
   */
  async read_lines(callback) {
    const lines = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(this.path),
      crlfDelay: Infinity
    });
    let index = 0;
    try {
      for await (const line of rl) {
        if (callback) {
          callback(line, index);
        }
        lines.push(line);
        index++;
      }
    } catch (e) {
      Path._throw(`Failed to read lines from "${this.path}".`, e);
    }
    return lines;
  }
  /**
   * Get the child paths of a directory.
   *
   * Each child path is matched against the exclude list using its absolute path.
   *
   * When a `string[]` is provided, each entry can be either an absolute path
   * or a path relative to this directory. Each entry is resolved to an
   * absolute path before matching.
   *
   * When a {@link GlobPatternList} is provided, its patterns are matched
   * directly against the absolute path of each child, so ensure the patterns
   * are written for absolute paths (e.g. `/home/user/project/node_modules`).
   *
   * @param opts Options.
   * @param opts.recursive Get all paths recursively.
   * @param opts.exclude A list of paths to exclude. When a `string[]` is provided,
   *        each entry is resolved to an absolute path and matched exactly.
   *        When a {@link GlobPatternList} is provided, its glob patterns are
   *        matched against each child's absolute path.
   * @param opts.absolute Get absolute paths instead of relative paths.
   * @param opts.string Get all paths as raw strings instead of Path objects.
   * @throws {PathError} When the path is not a directory.
   *
   * @docs
   */
  async paths({ recursive = false, absolute = true, exclude, string = false } = {}) {
    const exclude_list = exclude instanceof import_glob_pattern.GlobPatternList ? exclude : Array.isArray(exclude) && exclude.length > 0 ? new import_glob_pattern.GlobPatternList(exclude.map((e) => {
      let path = new Path(e);
      if (path.exists()) {
        path = path.abs();
      } else {
        const joined = this.join(e, false);
        if (joined.exists()) {
          path = joined.abs();
        }
      }
      return path.str();
    })) : void 0;
    if (typeof arguments[0] === "boolean") {
      recursive = arguments[0];
      absolute = true;
    }
    if (!this.is_dir()) {
      Path._throw(`Path "${this.path}" is not a directory.`);
    }
    if (!recursive) {
      let entries;
      try {
        entries = await fs.promises.readdir(this.path);
      } catch (e) {
        Path._throw(`Failed to read directory "${this.path}".`, e);
      }
      const list = [];
      entries.forEach((name) => {
        const path = this.join(name);
        if (exclude_list == null || !exclude_list.match(path.str())) {
          list.push(absolute ? string ? path.str() : path : string ? name : new Path(name, false));
        }
      });
      return list;
    }
    const files = [];
    const traverse = async (dir, relative_path) => {
      let children;
      try {
        children = await fs.promises.readdir(dir.path);
      } catch (e) {
        Path._throw(`Failed to read directory "${dir.path}".`, e);
      }
      for (const child of children) {
        const child_path = dir.join(child);
        if (exclude_list != null && exclude_list.match(child_path.str())) {
          continue;
        }
        const relative_child = absolute ? void 0 : relative_path ? relative_path.join(child) : new Path(child, false);
        files.push(absolute ? string ? child_path.str() : child_path : string ? relative_child?.str() : relative_child);
        if (child_path.is_dir()) {
          await traverse(child_path, relative_child);
        }
      }
    };
    await traverse(this, void 0);
    return files;
  }
  /**
   * Asynchronously match file paths using glob patterns.
   * Uses fast-glob when `opts.fast` is true, otherwise falls back to a native implementation.
   *
   * @param patterns
   *      A glob pattern or an array of patterns to match.
   *      By default all paths are treated as subpaths of the current path or the `cwd` option.
   * @param opts Optional settings.
   * @param opts.exclude A list of glob or regex patterns to exclude from the results.
   * @param opts.cwd Base directory for matching (string or Path). Defaults to this path.
   * @param opts.absolute Return absolute paths. Defaults to true.
   * @param opts.string Return raw string paths instead of Path objects.
   * @param opts.dot Include dotfiles. Defaults to true.
   * @param opts.only_files Match only files. Defaults to false.
   * @param opts.only_directories Match only directories. Defaults to false.
   * @param opts.unique Remove duplicate results. Defaults to true.
   * @param opts.stats Get the file stats for each matched path. Defaults to false.
   *
   * @docs
   */
  static async glob(patterns, opts) {
    const as_string = opts?.string ?? false;
    return (await (0, import_fast_glob.default)(Array.isArray(patterns) ? patterns : [patterns], {
      cwd: opts?.cwd instanceof Path ? opts?.cwd.path : opts?.cwd,
      dot: opts?.dot ?? true,
      onlyFiles: opts?.only_files ?? false,
      onlyDirectories: opts?.only_directories ?? false,
      unique: opts?.unique ?? true,
      absolute: opts?.absolute ?? true,
      stats: opts?.stats ?? false,
      // set as true to statisfy type requirements
      ignore: opts?.exclude
    })).map((p) => typeof p === "string" ? as_string ? p : new Path(p, false) : as_string ? p.path : new Path(p.path, false, p.stats));
  }
  /**
   * Synchronously match file paths using glob patterns.
   * @docs
   */
  static glob_sync(patterns, opts) {
    const as_string = opts?.string ?? false;
    return import_fast_glob.default.sync(Array.isArray(patterns) ? patterns : [patterns], {
      cwd: opts?.cwd instanceof Path ? opts?.cwd.path : opts?.cwd,
      dot: opts?.dot ?? true,
      onlyFiles: opts?.only_files ?? false,
      onlyDirectories: opts?.only_directories ?? false,
      unique: opts?.unique ?? true,
      absolute: opts?.absolute ?? true,
      stats: opts?.stats ?? false,
      // set as true to statisfy type requirements
      ignore: opts?.exclude
    }).map((p) => typeof p === "string" ? as_string ? p : new Path(p, false) : as_string ? p.path : new Path(p.path, false, p.stats));
  }
}
(function(Path2) {
  class PathError extends Error {
    /** The error code, e.g. `ENOENT`, `EACCES`. */
    code;
    /** The numeric errno value. */
    errno;
    /** The file path associated with the error. */
    path;
    /**
     * Construct a new PathError.
     * @param opts The error options.
     */
    constructor(opts) {
      super(opts.message, opts.cause != null ? { cause: opts.cause } : {});
      const cause = opts.cause;
      if (cause && typeof cause === "object") {
        if ("code" in cause)
          this.code = cause.code;
        if ("errno" in cause)
          this.errno = cause.errno;
        if ("path" in cause)
          this.path = cause.path;
      }
    }
  }
  Path2.PathError = PathError;
})(Path || (Path = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Path
});
