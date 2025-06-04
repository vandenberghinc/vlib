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
var import_minimatch = require("minimatch");
var import_json5 = __toESM(require("json5"));
var import_jsonc = require("../jsonc/jsonc.js");
var import_string = require("../global/string.js");
var import_fast_glob = __toESM(require("fast-glob"));
class Path {
  // Attributes.
  path;
  // internal file path, keep public.
  _stat;
  _full_name;
  _name;
  _extension;
  _base;
  _abs;
  constructor(path, clean = true, stats) {
    if (path == null) {
      throw Error(`Invalid path "${path}".`);
    } else if (path instanceof Path) {
      this.path = path.path;
    } else if (typeof path !== "string") {
      throw Error(`Invalid path "${path}". Expected a string or Path instance.`);
    } else {
      if (path.length === 0) {
        throw Error(`Invalid path, cannot create a path from an empty string.`);
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
      throw Error(`Invalid path "${this.path}".`);
    }
  }
  /** To string. */
  toString() {
    return this.path;
  }
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
   * @static
   * @returns {Path} A new Path instance pointing to the user's home directory.
   */
  static home() {
    return new Path(os.homedir());
  }
  /**
   * Find the common base path between an array of paths.
   * @param {string[]} paths - Array of path strings to analyze.
   * @returns {string|undefined} Returns a string when a common base path has been found, or undefined otherwise.
   */
  static find_common_base_path(paths) {
    if (!Array.isArray(paths) || paths.length === 0) {
      return "";
    }
    if (paths.length === 1) {
      return new Path(paths[0]).base()?.toString();
    }
    const separator = paths[0].includes("\\\\") ? "\\\\" : "/";
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
  /** Check if a path exists. */
  static exists(path) {
    return fs.existsSync(path);
  }
  /**
   * Ensure a path exists; throw an error if not.
   * @param {string|Path} path - Path to check.
   * @param {string} [err_prefix] - Optional prefix for the error message.
   */
  static ensure_exists_err(path, err_prefix = "") {
    path = new Path(path);
    if (!path.exists()) {
      throw new Error(`${err_prefix}Path "${path.str()}" does not exist.`);
    }
  }
  // ---------------------------------------------------------
  // Properties.
  /**
   * Get the length of the current path string.
   * @readonly
   * @returns {number} The number of characters in the path string.
   */
  get length() {
    return this.path.length;
  }
  get len() {
    return this.path.length;
  }
  /**
   * Get the file system stats for the current path.
   * @readonly
   * @returns {fs.Stats} The file system stats object with modified time properties.
   * @throws Error if the path does not exist or cannot be accessed.
   */
  get stat() {
    if (this._stat !== void 0) {
      return this._stat;
    }
    this._stat = fs.statSync(this.path);
    if (this._stat == null) {
      throw new Error(`Path "${this.path}" does not exist or cannot be accessed.`);
    }
    return this._stat;
  }
  /**
   * Get the device identifier where the file resides.
   * @readonly
   * @returns {number} The numeric device identifier.
   */
  get dev() {
    return this.stat.dev;
  }
  /**
   * Get the file system specific inode number.
   * @readonly
   * @returns {number} The inode number of the file.
   */
  get ino() {
    return this.stat.ino;
  }
  /**
   * Get the file mode bits (permission and type).
   * @readonly
   * @returns {number} The file mode bits.
   */
  get mode() {
    return this.stat.mode;
  }
  /**
   * Get the number of hard links to the file.
   * @readonly
   * @returns {number} The number of hard links.
   */
  get nlink() {
    return this.stat.nlink;
  }
  /**
   * Get the user identifier of the file's owner.
   * @readonly
   * @returns {number} The numeric user ID.
   */
  get uid() {
    return this.stat.uid;
  }
  /**
   * Get the group identifier of the file's group.
   * @readonly
   * @returns {number} The numeric group ID.
   */
  get gid() {
    return this.stat.gid;
  }
  /**
   * Get the device identifier for special files.
   * @readonly
   * @returns {number} The device identifier for special files.
   */
  get rdev() {
    return this.stat.rdev;
  }
  /**
   * Get the total size in bytes. For directories, calculates size recursively.
   * @readonly
   * @returns {number} Total size in bytes.
   */
  get size() {
    if (this.stat.isDirectory()) {
      let calc = function(path) {
        const stat = fs.statSync(path);
        if (stat.isFile()) {
          size += stat.size;
        } else if (stat.isDirectory()) {
          fs.readdirSync(path).forEach((file) => calc(`${path}/${file}`));
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
   * @readonly
   * @returns {number} Block size in bytes.
   */
  get blksize() {
    return this.stat.blksize;
  }
  /**
   * Get the number of blocks allocated to the file.
   * @readonly
   * @returns {number} Number of allocated blocks.
   */
  get blocks() {
    return this.stat.blocks;
  }
  /**
   * Get the last access time of the file (in milliseconds).
   * @readonly
   * @returns {number} Milliseconds representing the last access time.
   */
  get atime() {
    return this.stat.atimeMs;
  }
  /**
   * Get the last modification time of the file (in milliseconds).
   * @readonly
   * @returns {number} Milliseconds representing the last modification time.
   */
  get mtime() {
    return this.stat.mtimeMs;
  }
  /**
   * Get the last change time of the file metadata (in milliseconds).
   * @readonly
   * @returns {number} Milliseconds representing the last change time.
   */
  get ctime() {
    return this.stat.ctimeMs;
  }
  /**
   * Get the creation time of the file (in milliseconds).
   * @readonly
   * @returns {number} Milliseconds representing the file creation time.
   */
  get birthtime() {
    return this.stat.birthtimeMs;
  }
  /**
   * Get disk usage information for the directory.
   * @async
   * @throws {Error} If the path is not a directory.
   * @returns {Promise<{available: number; free: number; total: number}>} Object containing disk space information in bytes.
   */
  async disk_usage() {
    if (!this.is_dir()) {
      throw new Error(`File path "${this.path}" is not a directory.`);
    }
    return new Promise((resolve, reject) => {
      diskusage.check(this.path, (err, info) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(info);
      });
    });
  }
  /**
   * Get available disk space for the directory.
   * @async
   * @throws {Error} If the path is not a directory.
   * @returns {Promise<number>} Number of bytes available to the current user.
   */
  async available_space() {
    if (!this.is_dir()) {
      throw new Error(`File path "${this.path}" is not a directory.`);
    }
    return new Promise((resolve, reject) => {
      diskusage.check(this.path, (err, info) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(info?.available);
      });
    });
  }
  // ---------------------------------------------------------
  // Functions.
  // Reset.
  // Should be called when the operating system's path has changed.
  // This does not reset the assigned path.
  /**
   * Equals another string or path.
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
   * {Is file}
   * Check if the path is a directory
   */
  is_file() {
    return this.stat.isFile();
  }
  /**
   * {Is directory}
   * Check if the path is a directory
   */
  is_dir() {
    return this.stat.isDirectory();
  }
  /** @docs
   *  @title Exists
   *  @desc Check if the path exists
   */
  exists() {
    return fs.existsSync(this.path);
  }
  /**
  * Get the base path of this path, correctly handling escaped separators.
  * @param back - Number of directory levels to traverse up (default: 1).
  * @returns The parent Path instance, or undefined if at root.
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
   * Get the name of the path, with correct multi-dot extension support.
   * Handles files like `.env` and extensions like `.d.ts`, `.js.map`.
   * @param with_extension - Include the extension in the returned name (default: true).
   * @returns The base name of the path, including extension if specified.
   */
  // name(with_extension: boolean = true): string {
  //     if (with_extension && this._full_name !== undefined) {
  //         return this._full_name;
  //     }
  //     if (!with_extension && this._name !== undefined) {
  //         return this._name;
  //     }
  //     const data = this.path;
  //     // Determine start after base()
  //     const base_path = this.base();
  //     const start = base_path ? base_path.path.length + 1 : 0;
  //     const basename = data.substring(start);
  //     let name_part: string;
  //     let ext_part: string;
  //     const first_dot = basename.indexOf('.');
  //     if (first_dot > 0) {
  //         // Normal: name before first dot
  //         name_part = basename.substring(0, first_dot);
  //         ext_part = basename.substring(first_dot);
  //     } else if (first_dot === 0) {
  //         // Hidden file: check for second dot
  //         const second_dot = basename.indexOf('.', 1);
  //         if (second_dot > 1) {
  //             name_part = basename.substring(0, second_dot);
  //             ext_part = basename.substring(second_dot);
  //         } else {
  //             name_part = basename;
  //             ext_part = '';
  //         }
  //     } else {
  //         // No dot
  //         name_part = basename;
  //         ext_part = '';
  //     }
  //     this._name = name_part;
  //     this._extension = ext_part;
  //     this._full_name = name_part + ext_part;
  //     return with_extension ? this._full_name : this._name;
  // }
  full_name(with_extension = true) {
    if (with_extension && this._full_name !== void 0) {
      return this._full_name;
    }
    if (!with_extension && this._name !== void 0) {
      return this._name;
    }
    const data = this.path;
    const base_path = this.base();
    const start = base_path ? base_path.path.length + 1 : 0;
    const basename = data.substring(start);
    let name_part;
    let ext_part;
    const first_dot = basename.indexOf(".");
    if (first_dot > 0) {
      name_part = basename.substring(0, first_dot);
      ext_part = basename.substring(first_dot);
    } else if (first_dot === 0) {
      const second_dot = basename.indexOf(".", 1);
      if (second_dot > 1) {
        name_part = basename.substring(0, second_dot);
        ext_part = basename.substring(second_dot);
      } else {
        name_part = basename;
        ext_part = "";
      }
    } else {
      name_part = basename;
      ext_part = "";
    }
    this._name = name_part;
    this._extension = ext_part;
    this._full_name = name_part + ext_part;
    return with_extension ? this._full_name : this._name;
  }
  // name(): string {
  //     if (this._name !== undefined) {
  //         return this._name;
  //     }
  //     this.full_name();
  //     return this._name!;
  // }
  /**
   * Get the extension of the path, with correct multi-dot extension support.
   * @returns The file extension, including leading dot, or empty string if none.
   */
  extension() {
    if (this._extension !== void 0) {
      return this._extension;
    }
    this.full_name();
    return this._extension;
  }
  /** @docs
   *  @title Get absolute
   *  @desc Get the absolute path of the path
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
  /** @docs
   *  @title Join
   *  @desc Join the path with another name or subpath
   */
  join(subpath, clean = true) {
    if (subpath instanceof Path) {
      return new Path(`${this.path}/${subpath.path}`, clean);
    }
    return new Path(`${this.path}/${subpath}`, clean);
  }
  /** @docs
   *  @title Copy
   *  @desc Copy the path to another location
   *  @funcs 2
   */
  async cp(destination) {
    return new Promise((resolve, reject) => {
      if (destination == null) {
        return reject(new Error('Define parameter "destination".'));
      }
      if (destination instanceof Path) {
        destination = destination.path;
      }
      fs_extra.copy(this.path, destination, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  cp_sync(destination) {
    if (destination == null) {
      throw new Error('Define parameter "destination".');
    }
    if (destination instanceof Path) {
      destination = destination.path;
    }
    fs_extra.copySync(this.path, destination);
  }
  /** @docs
   *  @title Move
   *  @desc Move the path to another location
   */
  async mv(destination) {
    return new Promise((resolve, reject) => {
      if (destination instanceof Path) {
        destination = destination.path;
      }
      if (fs.existsSync(destination)) {
        return reject(new Error("Destination path already exists."));
      }
      fs_extra.move(this.path, destination, (err) => {
        if (err) {
          reject(err);
        } else {
          this._stat = void 0;
          resolve();
        }
      });
    });
  }
  /** @docs
   *  @title Delete
   *  @desc Delete the path
   *  @funcs 2
   */
  async del({ recursive = false } = {}) {
    return new Promise((resolve, reject) => {
      if (this.exists()) {
        if (this.is_dir()) {
          fs.rm(this.path, { recursive }, (err) => {
            if (err) {
              reject(err);
            } else {
              this._stat = void 0;
              resolve();
            }
          });
        } else {
          fs.unlink(this.path, (err) => {
            if (err) {
              reject(err);
            } else {
              this._stat = void 0;
              resolve();
            }
          });
        }
      }
    });
  }
  del_sync({ recursive = false } = {}) {
    if (this.exists()) {
      if (this.is_dir()) {
        fs.rmSync(this.path, { recursive });
      } else {
        fs.unlinkSync(this.path);
      }
    }
    return this;
  }
  /** @docs
   *  @title Trash
   *  @desc Move the path to the trash directory
   */
  async trash() {
    return new Promise(async (resolve, reject) => {
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
          return reject(new Error("Unsupported platform."));
      }
      if (trash == null) {
        return reject(new Error("Unsupported platform."));
      }
      let destination;
      try {
        destination = `${trash}/${full_name}`;
        let counts = 0;
        while (fs.existsSync(destination)) {
          ++counts;
          destination = `${trash}/${full_name}-${counts}`;
        }
        await this.mv(destination);
      } catch (err) {
        return reject(err);
      }
      resolve();
    });
  }
  /** @docs
   *  @title Mkdir
   *  @desc Create a directory
   */
  async mkdir() {
    return new Promise((resolve, reject) => {
      if (this.exists()) {
        return resolve();
      }
      fs.mkdir(this.path, { recursive: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          this._stat = void 0;
          resolve();
        }
      });
    });
  }
  mkdir_sync() {
    if (this.exists()) {
      return this;
    }
    fs.mkdirSync(this.path, { recursive: true });
    return this;
  }
  /** @docs
   *  @title Touch
   *  @desc Create a file
   */
  async touch() {
    return this.save("");
  }
  /**
   * Relative.
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
      throw new Error("Default value cannot be an empty string.");
    }
    if (res === "") {
      throw new Error("Operation resulted in an empty string, which is not allowed.");
    }
    return new Path(res, false);
  }
  /**
   * Return the unquoted representation of the path.
   */
  unquote() {
    return new Path(import_string.String.unquote(this.path), false);
  }
  async load({ type = "string", encoding = void 0 } = {}) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.path, encoding, (err, data) => {
        if (err) {
          reject(err);
        } else {
          if (type == null || type === "buffer") {
            resolve(data);
          } else if (type === "string") {
            resolve(data.toString());
          } else if (type === "array" || type === "object" || type === "json") {
            resolve(JSON.parse(typeof data === "string" ? data : data.toString()));
          } else if (type === "json5") {
            resolve(import_json5.default.parse(typeof data === "string" ? data : data.toString()));
          } else if (type === "jsonc") {
            resolve(import_jsonc.JSONC.parse(typeof data === "string" ? data : data.toString()));
          } else if (type === "number") {
            resolve(parseFloat(data.toString()));
          } else if (type === "boolean") {
            const str = data.toString();
            resolve(str === "1" || str === "true" || str === "TRUE" || str === "True");
          } else {
            throw Error(`Invalid type "${type.toString()}".`);
          }
        }
      });
    });
  }
  load_sync({ type = "string", encoding = void 0 } = {}) {
    const data = fs.readFileSync(this.path, encoding);
    if (type == null || type === "buffer") {
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
      throw Error(`Invalid type "${type.toString()}".`);
    }
  }
  async save(data, opts) {
    if (opts?.type) {
      if (opts.type == null || opts.type === "buffer") {
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
        throw Error(`Invalid type parameter "${opts.type.toString()}".`);
      }
    }
    return new Promise((resolve, reject) => {
      fs.writeFile(this.path, data, (err) => {
        if (err) {
          reject(err);
        } else {
          this._stat = void 0;
          resolve();
        }
      });
    });
  }
  save_sync(data, opts) {
    if (opts?.type) {
      if (opts.type == null || opts.type === "buffer") {
      } else if (opts.type === "string") {
      } else if (opts.type === "array" || opts.type === "object" || opts.type === "json" || opts.type === "json5") {
        data = JSON.stringify(data);
      } else if (opts.type === "jsonc") {
        throw new Error("JSONC is not supported in sync mode.");
      } else if (opts.type === "number") {
        data = data.toString();
      } else if (opts.type === "boolean") {
        data = data.toString();
      } else {
        throw Error(`Invalid type parameter "${opts.type.toString()}".`);
      }
    }
    fs.writeFileSync(this.path, data);
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
   */
  async read_lines(callback) {
    const lines = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(this.path),
      crlfDelay: Infinity
    });
    let index = 0;
    for await (const line of rl) {
      if (callback) {
        callback(line, index);
      }
      lines.push(line);
      index++;
    }
    return lines;
  }
  async paths({ recursive = false, absolute = true, exclude, string = false } = {}) {
    const exclude_list = exclude instanceof Path.ExcludeList ? exclude : Array.isArray(exclude) ? /* @__PURE__ */ new Set() : void 0;
    if (typeof arguments[0] === "boolean") {
      recursive = arguments[0];
      absolute = true;
    }
    if (exclude_list instanceof Set && Array.isArray(exclude)) {
      for (let i = 0; i < exclude.length; i++) {
        let path = new Path(exclude[i]);
        if (path.exists()) {
          path = path.abs();
        } else {
          if (this.join(exclude[i], false).exists()) {
            path = this.join(exclude[i], false).abs();
          }
        }
        exclude_list.add(path.str());
      }
    }
    return new Promise(async (resolve, reject) => {
      if (!this.is_dir()) {
        return reject(new Error(`Path "${this.path}" is not a directory.`));
      }
      if (!recursive) {
        fs.readdir(this.path, (err, files) => {
          if (err) {
            reject(err);
          } else {
            const list = [];
            files.forEach((name) => {
              const path = this.join(name);
              if (exclude_list == null || exclude_list.size === 0 || !exclude_list.has(path.str())) {
                list.push(absolute ? string ? path.str() : path : string ? name : new Path(name, false));
              }
            });
            resolve(list);
          }
        });
      } else {
        const files = [];
        const traverse = (path, relative_path) => {
          return new Promise((resolve2, reject2) => {
            fs.readdir(path.path, async (err, children) => {
              if (err) {
                reject2(err);
              } else {
                try {
                  for (const child of children) {
                    const child_path = path.join(child);
                    if (exclude_list != null && (exclude_list.size === 0 || !exclude_list.has(path.str()))) {
                      continue;
                    }
                    const relative_child = absolute ? void 0 : relative_path ? relative_path.join(child) : new Path(child, false);
                    files.push(absolute ? string ? child_path.str() : child_path : string ? relative_child?.str() : relative_child);
                    if (child_path.is_dir()) {
                      await traverse(child_path, relative_child);
                    }
                  }
                  resolve2();
                } catch (e) {
                  reject2(e);
                }
              }
            });
          });
        };
        try {
          await traverse(this, void 0);
          resolve(files);
        } catch (err) {
          reject(err);
        }
      }
    });
  }
  /**
  * Asynchronously match file paths using glob patterns.
  * Uses fast-glob when `opts.fast` is true, otherwise falls back to a native implementation.
  *
  * @param patterns A glob pattern or an array of patterns to match.
  * @param opts Optional settings:
  *   - fast: Use fast-glob for performance.
  *   - cwd: Base directory for matching (string or Path). Defaults to this path.
  *   - absolute: Return absolute paths. Defaults to true.
  *   - string: Return raw string paths instead of Path objects.
  *   - dot: Include dotfiles. Defaults to false.
  *   - only_files: Match only files. Defaults to true.
  *   - only_directories: Match only directories. Defaults to false.
  *   - unique: Remove duplicate results. Defaults to true.
  */
  async glob(patterns, opts = {}) {
    const { fast = true, cwd = this, absolute = true, string: as_string = false, dot = false, only_files = true, only_directories = false, unique = true } = opts;
    const cwd_str = cwd instanceof Path ? cwd.path : cwd.toString();
    if (fast) {
      const fg_opts = {
        cwd: cwd_str,
        dot,
        onlyFiles: only_files,
        onlyDirectories: only_directories,
        unique,
        absolute
      };
      const entries = await (0, import_fast_glob.default)(Array.isArray(patterns) ? patterns : [patterns], fg_opts);
      return entries.map((p) => {
        if (as_string) {
          return p.path;
        }
        const _p = new Path(p.path);
        if (p.stats) {
          _p._stat = p.stats;
        }
        return _p;
      });
    }
    const mm = import_minimatch.Minimatch;
    const patterns_arr = Array.isArray(patterns) ? patterns : [patterns];
    const matched = [];
    const all_paths = await this.paths({ recursive: true, absolute: true, string: true });
    for (const pat of patterns_arr) {
      const matcher = new mm(pat, { dot });
      for (const p of all_paths) {
        const rel = pathlib.relative(cwd_str, p);
        if (matcher.match(rel)) {
          const val = absolute ? p : pathlib.relative(this.path, p);
          matched.push(as_string ? val : new Path(val, false));
        }
      }
    }
    if (unique) {
      const seen = /* @__PURE__ */ new Set();
      return matched.filter((v) => {
        const key = typeof v === "string" ? v : v.path;
        if (seen.has(key))
          return false;
        seen.add(key);
        return true;
      });
    }
    return matched;
  }
  /**
   * Synchronously match file paths using glob patterns.
   */
  glob_sync(patterns, opts = {}) {
    const { fast = true, cwd = this, absolute = true, string: as_string = false, dot = false, only_files = true, only_directories = false, unique = true } = opts;
    const cwd_str = cwd instanceof Path ? cwd.path : cwd.toString();
    if (fast) {
      const fg_opts = {
        cwd: cwd_str,
        dot,
        onlyFiles: only_files,
        onlyDirectories: only_directories,
        unique,
        absolute
      };
      const entries = import_fast_glob.default.sync(Array.isArray(patterns) ? patterns : [patterns], fg_opts);
      return entries.map((p) => {
        if (as_string) {
          return p.path;
        }
        const _p = new Path(p.path);
        if (p.stats) {
          _p._stat = p.stats;
        }
        return _p;
      });
    }
    throw new Error("Sync fallback not implemented; please use opts.fast for sync glob.");
  }
}
(function(Path2) {
  class ExcludeList {
    /** Size to keep uniform with `Set`. */
    size = 0;
    /** The internal exclude list. */
    exclude_list = [];
    /** An internal cache. */
    cache = /* @__PURE__ */ new Map();
    /** The constructor. */
    constructor(...exclude_list) {
      for (const item of exclude_list) {
        if (item instanceof RegExp) {
          this.exclude_list.push(item);
        } else {
          this.exclude_list.push(new import_minimatch.Minimatch(this.normalize(item), {
            dot: true,
            // allow matches on dot-files/dirs
            matchBase: false
          }));
        }
      }
      this.size = this.exclude_list.length;
    }
    /** Normalize a path. */
    normalize(input) {
      let normalized = pathlib.normalize(input);
      if (normalized.indexOf("\\") !== -1) {
        normalized = normalized.split(pathlib.sep).join("/");
      }
      return normalized;
    }
    /**
     * Check if a path is excluded.
     * @returns True if the path is matched by the exclude list.
     * @libris
     */
    has(input) {
      if (this.cache.has(input)) {
        return this.cache.get(input);
      }
      const normalized = this.normalize(input);
      const res = this.exclude_list.some((item) => item instanceof RegExp && item.test(normalized) || item instanceof import_minimatch.Minimatch && item.match(normalized));
      this.cache.set(input, res);
      return res;
    }
  }
  Path2.ExcludeList = ExcludeList;
})(Path || (Path = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Path
});
