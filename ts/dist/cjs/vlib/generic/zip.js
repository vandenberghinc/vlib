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
  Zip: () => Zip,
  zip: () => Zip
});
module.exports = __toCommonJS(stdin_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_node_stream_zip = __toESM(require("node-stream-zip"));
var import_archiver = __toESM(require("archiver"));
var import_path2 = require("../generic/path.js");
var import_glob_pattern = require("../generic/glob_pattern.js");
var Zip;
(function(Zip2) {
  async function extract(file, dest) {
    const zip_path = new import_path2.Path(file);
    const dest_path = new import_path2.Path(dest);
    if (!zip_path.exists()) {
      throw new Error(`Zip file does not exist: ${zip_path.path}`);
    }
    dest_path.mkdir({ recursive: true });
    const zip = new import_node_stream_zip.default.async({ file: zip_path.path, storeEntries: true });
    try {
      const entries = await zip.entries();
      const destRoot = import_path.default.resolve(dest_path.path);
      for (const entry of Object.values(entries)) {
        const target = import_path.default.resolve(destRoot, entry.name);
        if (import_path.default.relative(destRoot, target).startsWith("..") || import_path.default.isAbsolute(import_path.default.relative(destRoot, target))) {
          throw new Error(`Illegal entry path detected in zip (path traversal): ${entry.name}`);
        }
      }
      await zip.extract(null, dest_path.path);
    } finally {
      await zip.close();
    }
  }
  Zip2.extract = extract;
  async function list(file) {
    const zip_path = new import_path2.Path(file);
    if (!zip_path.exists()) {
      throw new Error(`Zip file does not exist: ${zip_path.path}`);
    }
    const zip = new import_node_stream_zip.default.async({ file: zip_path.path, storeEntries: true });
    try {
      const entries = await zip.entries();
      const entry_list = [];
      for (const entry of Object.values(entries)) {
        entry_list.push({
          name: entry.name,
          is_directory: entry.isDirectory,
          size: entry.size
        });
      }
      return entry_list;
    } finally {
      await zip.close();
    }
  }
  Zip2.list = list;
  async function create(sources, destination, options = {}) {
    const source_paths = Array.isArray(sources) ? sources.map((s) => new import_path2.Path(s)) : [new import_path2.Path(sources)];
    const dest_path = new import_path2.Path(destination);
    for (const source of source_paths) {
      if (!source.exists()) {
        throw new Error(`Source does not exist: ${source.path}`);
      }
    }
    if (dest_path.exists()) {
      throw new Error(`Destination already exists: ${dest_path.path}`);
    }
    const {
      name,
      level = 9,
      include_root = true,
      exclude = [],
      // follow_symlinks = false,
      store = false,
      comment,
      on_progress,
      create_dest_dir = true
    } = options;
    if (level < 0 || level > 9) {
      throw new Error(`Invalid compression level: ${level}. Must be between 0 and 9.`);
    }
    if (create_dest_dir) {
      import_fs.default.mkdirSync(import_path.default.dirname(dest_path.path), { recursive: true });
    }
    const exclude_patterns = exclude.length > 0 ? new import_glob_pattern.GlobPatternList(exclude) : null;
    return new Promise((resolve, reject) => {
      const output = import_fs.default.createWriteStream(dest_path.path);
      const archive = (0, import_archiver.default)("zip", {
        zlib: { level: store ? 0 : level },
        store
      });
      let processed_count = 0;
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("error", reject);
      archive.on("warning", reject);
      archive.on("entry", (entry_data) => {
        processed_count++;
        if (on_progress) {
          on_progress(entry_data.name, processed_count, void 0);
        }
      });
      if (comment) {
        if (typeof archive.setComment === "function") {
          archive.setComment(comment);
        } else {
          archive.comment = comment;
        }
      }
      archive.pipe(output);
      for (const source of source_paths) {
        if (source.is_dir()) {
          const dir_name = include_root ? source.name() : false;
          archive.directory(source.path, name !== void 0 ? name : dir_name, (entry) => {
            if (exclude_patterns?.match(entry.name))
              return false;
            return entry;
          });
        } else {
          if (exclude_patterns?.match(source.path))
            continue;
          const lstat = import_fs.default.lstatSync(source.path);
          if (lstat.isSymbolicLink()) {
            const real = import_fs.default.realpathSync(source.path);
            archive.file(real, { name: name || source.full_name() });
          } else {
            archive.file(source.path, { name: name || source.full_name() });
          }
        }
      }
      try {
        archive.finalize();
      } catch (err) {
        reject(err);
      }
    });
  }
  Zip2.create = create;
  async function create_from_file(source_file, destination, archive_name, compression_level = 9) {
    const source = new import_path2.Path(source_file);
    if (!source.exists() || source.is_dir()) {
      throw new Error(`Source must be an existing file: ${source.path}`);
    }
    await create(source, destination, {
      name: archive_name || source.full_name(),
      level: compression_level
    });
  }
  Zip2.create_from_file = create_from_file;
  async function create_from_directory(source_dir, destination, include_root_folder = true, compression_level = 9, exclude_patterns = []) {
    const source = new import_path2.Path(source_dir);
    if (!source.exists() || !source.is_dir()) {
      throw new Error(`Source must be an existing directory: ${source.path}`);
    }
    await create(source, destination, {
      include_root: include_root_folder,
      level: compression_level,
      exclude: exclude_patterns
    });
  }
  Zip2.create_from_directory = create_from_directory;
})(Zip || (Zip = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Zip,
  zip
});
