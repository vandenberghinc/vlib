/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

const libfs = require('fs');
const libfsextra = require('fs-extra');
const libos = require('os');
const libpath = require('path');

// ---------------------------------------------------------
// Imports.

const utils = require('../global/utils.js');

// ---------------------------------------------------------
// Path object.
// When the operating system's path changes function `reset()` should be called again.

class Path {
    constructor(path) {

        // Attributes.
        this._path = path;

        // Clean.
        this._clean();
    }

    // ---------------------------------------------------------
    // Utils.

    // Clean the path.
    _clean() {
        if (this._path == null) {
            throw Error(`Invalid path "${this._path}".`);
        }
        this._path = this._path.replace(/\/+/g, '/').replaceAll("/./","");
        if (this._path.length > 0 && this._path.charAt(this._path.length - 1) === "/") {
            this._path = this._path.substr(0, this._path.length - 1);
        }
        const start = 0, end = this._path.length;
        for (let i = 0; i < this._path.length; i++) {
            const c = this._path.charAt(i);
            if (c == " " || c == "\t") {
                ++start;
            } else {
                break;
            }
        }
        for (let i = end - 1; i >= 0; i--) {
            const c = this._path.charAt(i);
            if (c == " " || c == "\t") {
                --end;
            } else {
                break;
            }
        }
        if (start != 0 || end != this._path.length) {
            this._path = this._path.susbtr(start, end - start);
        }
        if (this._path.length === 0) {
            throw Error(`Invalid path "${this._path}".`);
        }
    }

    // to string.
    toString() {
        return this._path;
    }
    str() {
        return this._path;
    }

    // ---------------------------------------------------------
    // Properties.

    // Get stat object.
    get stat() {
        if (this._stat !== undefined) {
            return this._stat;
        }
        this._stat = utils.edit_obj_keys(
            libfs.statSync(this._path),
            [
                ["atimeMs", "atime"],
                ["mtimeMs", "mtime"],
                ["ctimeMs", "ctime"],
                ["birthtimeMs", "birthtime"],
            ],
            [
                "atime",
                "mtime",
                "ctime",
                "birthtime",
            ]
        );
        return this._stat;
    }

    // Get stat attributes.
    get dev() {
        return this.stat.dev;
    }
    get ino() {
        return this.stat.ino;
    }
    get mode() {
        return this.stat.mode;
    }
    get nlink() {
        return this.stat.nlink;
    }
    get uid() {
        return this.stat.uid;
    }
    get gid() {
        return this.stat.gid;
    }
    get rdev() {
        return this.stat.rdev;
    }
    get size() {
        return this.stat.size;
    }
    get blksize() {
        return this.stat.blksize;
    }
    get blocks() {
        return this.stat.blocks;
    }
    get atime() {
        return this.stat.atime;
    }
    get mtime() {
        return this.stat.mtime;
    }
    get ctime() {
        return this.stat.ctime;
    }
    get birthtime() {
        return this.stat.birthtime;
    }

    // ---------------------------------------------------------
    // Functions.

    // Reset.
    // Should be called when the operating system's path has changed.
    // This does not reset the assigned path.
    reset() {
        this._stat = undefined;
        this._name = undefined;
        this._extension = undefined;
        this._base = undefined;
        this._abs = undefined;
    }

    // Is directory.
    is_dir() {
        return this.stat.isDirectory();
    }

    // Exists.
    exists() {
        return libfs.existsSync(this._path);
    }

    // Get path name.
    name() {
        if (this._name !== undefined) { return this._name; }
        this._name = "";
        for (let i = this._path.length - 1; i >= 0; i--) {
            const c = this._path.charAt(i);
            if (c === "/") {
                break;
            }
            this._name += c;
        }
        this._name = this._name.reverse();
        return this._name;
    }

    // Get extension name.
    extension() {
        if (this._extension !== undefined) { return this._extension; }
        if (this._name === undefined) { this.name(); }
        this._extension = "";
        for (let i = this._name.length - 1; i >= 0; i--) {
            const c = this._name.charAt(i);
            this._extension += c;
            if (c === ".") {
                this._extension = this._extension.reverse();
                return this._extension;
            }
        }
        this._extension = "";
    }

    // Get the base path.
    // Returns null when the path does not have a base path.
    base(back = 1) {
        if (back === 1 && this._base !== undefined) { return this._base; }
        let count = 0, end = 0;
        for (end = this._path.length - 1; end >= 0; end--) {
            const c = this._path.charAt(end);
            if (c === "/") {
                ++count;
                if (back === count) {
                    break;
                }
            }
        }
        if (end === 0) {
            return null;
        }
        if (back === 1) {
            this._base = new Path(this._path.substr(0, end));
            return this._base;
        } else {
            return new Path(this._path.substr(0, end));
        }
    }

    // Get the absolute path.
    abs() {
        if (this._abs !== undefined) { return this._abs; }
        this._abs = new Path(libpath.resolve(this._path));
        return this._abs;
    }

    // Join the path with another name / subpath.
    join(subpath) {
        return new Path(`${this._path}/${subpath}`);
    }

    // Copy the path to another location.
    async cp(destination) {
        return new Promise(async (resolve, reject) => {
            if (libfs.existsSync(destination)) {
                return reject("Destination path already exists.");
            }
            try {
                const data = await this.load();
                const dest = new Path(destination)
                await dest.save(data);
            } catch (err) {
                return reject(err);
            }
            resolve();
        })
    }

    // Move the path to another location.
    async mv(destination) {
        return new Promise((resolve, reject) => {
            if (libfs.existsSync(destination)) {
                return reject("Destination path already exists.");
            }
            libfsextra.move(this._path, destination, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        })
    }

    // Delete the path.
    async del() {
        return new Promise((resolve, reject) => {
            libfs.unlink(this._path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        })
    }

    // Move the path to the trash directory.
    async trash() {
        return new Promise(async (resolve, reject) => {
            const name = this.name();
            let trash;
            switch (libos.platform()) {
                case 'darwin': // macOS
                    trash = libpath.join(libos.homedir(), '.Trash');
                    break;
                case 'linux':
                    // Check if the XDG_DATA_HOME environment variable is set, otherwise fallback to the default path
                    const xdgDataHome = process.env.XDG_DATA_HOME || libpath.join(libos.homedir(), '.local', 'share');
                    trash = libpath.join(xdgDataHome, 'Trash');
                    break;
                default:
                    return reject("Unsupported platform.");
            }
            if (trash == null) {
                return reject("Unsupported platform.");
            }
            let destination;
            try {
                destination = `${trash}/${name}`;
                let counts = 0;
                while (libfs.existsSync(destination)) {
                    ++counts;
                    destination = `${trash}/${name}-${counts}`
                }
                await this.mv(destination);
            } catch (err) {
                return reject(err);
            }
            resolve();
        })
    }

    // Create a directory.
    async mkdir() {
        return new Promise((resolve, reject) => {
            libfs.mkdir(this._path, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }

    // Create a file.
    async touch() {
        return this.save("");
    }

    // Load the data from the path.
    async load() {
        return new Promise((resolve, reject) => {
            libfs.readFile(this._path, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString());
                }
            });
        });
    }
    load_sync() {
        const data = libfs.readFileSync(this._path);
        return data.toString();
    }

    // Save data to the path.
    async save(data) {
        return new Promise((resolve, reject) => {
            libfs.writeFile(this._path, data, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this._stat = undefined;
                    resolve();
                }
            });
        });
    }
    save_sync(data) {
        libfs.writeFileSync(this._path, data);
    }

    // Get the child paths of a directory.
    // @note: throws an error when the path is not a directory.
    async paths(data, recursive = false) {
        return new Promise(async (resolve, reject) => {
            if (!this.is_dir()) {
                return reject(`Path "${this._path}" is not a directory.`);
            }
            if (recursive === false) {
                libfs.readdir(this._path, (err, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(files.map((name) => (this.join(name))));
                    }
                });
            } else {
                const files = [];
                const traverse = (path) => {
                    return new Promise((resolve, reject) => {
                        libfs.readdir(path, async (err, files) => {
                            if (err) {
                                reject(err);
                            } else {
                                let err = null;
                                for (let i = 0; i < files.length; i++) {
                                    const child = path.join(files[i]);
                                    files.push(child);
                                    if (child.is_dir()) {
                                        try {
                                            await traverse(child);
                                        } catch (e) {
                                            err = e;
                                            return false;
                                        }
                                    }
                                }
                                if (err === null) {
                                    resolve();
                                } else {
                                    reject(err);
                                }
                            }
                        });
                    })
                }
                try {
                    await traverse(this);
                } catch (err) {
                    return reject(err);
                }
                resolve(files);
                
            }
        });
    }

}

// ---------------------------------------------------------
// Exports.

module.exports = {Path};
