/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Path object.
// When the operating system's path changes function `reset()` should be called again.

/*  @docs:
    @chapter: Types
    @title: Path
    @desc: The path class.
*/
vlib.Path = class Path {
    constructor(path, clean = true) {

        // Assign cleaned path.
        if (path == null) {
            throw Error(`Invalid path "${path}".`);
        }
        else if (path instanceof vlib.Path) {
            this._path = path._path;
        } else {
            path = path.toString();
            if (clean && path.length > 0) {
                this._path = "";
                const max_i = path.length - 1;
                for (let i = 0; i < path.length; i++) {
                    const c = path.charAt(i);
                    if (c === "/" && (this._path.charAt(this._path.length - 1) === "/" || i == max_i)) {
                        continue;
                    }
                    else if (c === "." && path.charAt(i - 1) === "/" && path.charAt(i + 1) === "/") {
                        continue;
                    } else {
                        this._path += c;
                    }
                }
            } else {
                this._path = path;
            }
        }
    }

    // ---------------------------------------------------------
    // Utils.

    // Trim the whitespace from the start and end of the path.
    trim() {
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
    // Static functions.

    // Get the home dir.
    static home() {
        return new Path(libos.homedir());
    }

    // ---------------------------------------------------------
    // Properties.

    // Get length attributes.
    get length() {
        return this._path.length;
    }
    get len() {
        return this._path.length;
    }

    // Get stat object.
    get stat() {
        if (this._stat !== undefined) {
            return this._stat;
        }
        this._stat = vlib.utils.edit_obj_keys(
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
    /*  @docs:
        @title: Stat attributes
        @desc: Get the stat attributes.
        @funcs: 14
    */
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
        if (this.stat.isDirectory()) {
            let size = 0;
            function calc(path) {
                const stat = libfs.statSync(path);
                // size += stat.size;
                if (stat.isFile()) {
                    size += stat.size;
                } else if (stat.isDirectory()) {
                    libfs.readdirSync(path).iterate(file => calc(`${path}/${file}`));
                } else {

                }
            }
            calc(this._path);
            return size;
        } else {
            return this.stat.size;
        }
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

    // Disk usage.
    async disk_usage() {
        if (!this.is_dir()) {
            throw new Error(`File path "${this._path}" is not a directory.`);
        }
        return new Promise((resolve, reject) => {
            diskusagelib.check(this._path, (err, info) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(info);
            });
        });
    }

    // Available space.
    async available_space() {
        if (!this.is_dir()) {
            throw new Error(`File path "${this._path}" is not a directory.`);
        }
        return new Promise((resolve, reject) => {
            diskusagelib.check(this._path, (err, info) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(info.available);
            });
        });
    }

    // ---------------------------------------------------------
    // Functions.

    // Reset.
    // Should be called when the operating system's path has changed.
    // This does not reset the assigned path.
    /*  @docs:
        @title: Reset
        @desc: Reset the path attribute's except the path name.
        @note: Should be called when the operating system's path has changed.
    */
    reset() {
        this._stat = undefined;
        this._name = undefined;
        this._extension = undefined;
        this._base = undefined;
        this._abs = undefined;
        return this;
    }
    refresh() {
        this._stat = undefined;
        this._name = undefined;
        this._extension = undefined;
        this._base = undefined;
        this._abs = undefined;
        return this;
    }

    // Is directory.
    /*  @docs:
        @title: Is directory
        @desc: Check if the path is a directory.
    */
    is_dir() {
        return this.stat.isDirectory();
    }

    // Exists.
    /*  @docs:
        @title: Exists
        @desc: Check if the path exists.
    */
    exists() {
        return libfs.existsSync(this._path);
    }

    // Get path name.
    /*  @docs:
        @title: Get name
        @desc: Get the (full) name of the path.
    */
    name(with_extension = true) {
        if (with_extension === false) {
            const name = this.name();
            const ext = this.extension();
            if (!ext) {
                return name;
            }
            return name.substr(0, name.length - ext.length);
        }
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
    /*  @docs:
        @title: Get extension
        @desc: Get the extension of the path.
    */
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
    /*  @docs:
        @title: Get base
        @desc: Get the base path of the path.
        @note: Returns `null` when the path does not have a base path.
    */
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
    /*  @docs:
        @title: Get absolute
        @desc: Get the absolute path of the path.
    */
    abs() {
        if (this._abs !== undefined) { return this._abs; }
        this._abs = new Path(libpath.resolve(this._path));
        return this._abs;
    }

    // Join the path with another name / subpath.
    /*  @docs:
        @title: Join
        @desc: Join the path with another name or subpath.
    */
    join(subpath, clean = true) {
        return new Path(`${this._path}/${subpath}`, clean);
    }

    // Copy the path to another location.
    /*  @docs:
        @title: Copy
        @desc: Copy the path to another location.
        @funcs: 2
    */
    async cp(destination) {
        return new Promise(async (resolve, reject) => {
            if (destination == null) {
                return reject("Define parameter \"destination\".");
            }
            if (destination instanceof Path) {
                destination = destination._path;
            }
            // if (libfs.existsSync(destination)) {
            //     return reject("Destination path already exists.");
            // }
            // if (this.is_dir()) {
            try {
                libfsextra.copy(this._path, destination, (err) => reject(err));
            } catch (err) {
                return reject(err);
            }
            // } else {
            //     try {
            //         const data = await this.load();
            //         const dest = new Path(destination)
            //         await dest.save(data);
            //     } catch (err) {
            //         return reject(err);
            //     }
            // }
            resolve();
        })
    }
    cp_sync(destination) {
        if (destination == null) {
            throw new Error("Define parameter \"destination\".");
        }
        if (destination instanceof Path) {
            destination = destination._path;
        }
        libfsextra.copySync(this._path, destination);
    }

    // Move the path to another location.
    /*  @docs:
        @title: Move
        @desc: Move the path to another location.
    */
    async mv(destination) {
        return new Promise((resolve, reject) => {
            if (destination instanceof Path) {
                destination = destination._path;
            }
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
    /*  @docs:
        @title: Delete
        @desc: Delete the path.
        @funcs: 2
        @param:
            @name: recursive
            @descr: Delete non empty directories recursively.
    */
    async del({recursive = false} = {}) {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                if (this.is_dir()) {
                    // libfs.rmdir
                    libfs.rm(this._path, {recursive}, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                } else {
                    libfs.unlink(this._path, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            this._stat = undefined;
                            resolve();
                        }
                    });
                }
            }
        })
    }
    del_sync({recursive = false} = {}) {
        if (this.exists()) {
            if (this.is_dir()) {
                // libfs.rmdirSync(this._path, {recursive});
                libfs.rmSync(this._path, {recursive});
            } else {
                libfs.unlinkSync(this._path);
            }
        }
        return this;
    }

    // Move the path to the trash directory.
    /*  @docs:
        @title: Trash
        @desc: Move the path to the trash directory.
    */
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
    /*  @docs:
        @title: Mkdir
        @desc: Create a directory.
    */
    async mkdir() {
        return new Promise((resolve, reject) => {
            if (this.exists()) {
                return resolve();
            }
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
    mkdir_sync() {
        if (this.exists()) {
            return ;
        }
        libfs.mkdirSync(this._path, { recursive: true })
        return this;
    }

    // Create a file.
    /*  @docs:
        @title: Touch
        @desc: Create a file.
    */
    async touch() {
        return this.save("");
    }

    // Load the data from the path.
    /*  @docs:
        @title: Load
        @desc: Load the data from the path. 
        @funcs: 2
    */
    async load({type = "string", encoding = null} = {}) {
        return new Promise((resolve, reject) => {
            libfs.readFile(this._path, encoding, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    if (type == null) {
                        resolve(data);
                    } else if (type === "string") {
                        resolve(data.toString());
                    } else if (type === "array" || type === "object" || type === "json") {
                        resolve(JSON.parse(data));
                    } else if (type === "number") {
                        resolve(parseFloat(data.toString()));
                    } else if (type === "boolean") {
                        data = data.toString();
                        resolve(data = "1" || data === "true" || data === "TRUE" || data === "True");
                    } else {
                        reject(`Invalid value for parameter "type", the valid values are [undefined, boolean, number, string, array, object].`);
                    }
                }
            });
        });
    }
    load_sync({type = "string", encoding = null} = {}) {
        const data = libfs.readFileSync(this._path, encoding);
        if (type == null) {
            return data;
        } else if (type === "string") {
            return data.toString();
        } else if (type === "array" || type === "object" || type === "json") {
            return JSON.parse(data);
        } else if (type === "number") {
            return parseFloat(data.toString());
        } else if (type === "boolean") {
            data = data.toString();
            return data = "1" || data === "true" || data === "TRUE" || data === "True";
        } else {
            throw Error(`Invalid value for parameter "type", the valid values are [undefined, boolean, number, string, array, object].`);
        }
    }

    // Save data to the path.
    /*  @docs:
        @title: Save
        @desc: Save data to the path.
        @funcs: 2
    */
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
        return this;
    }

    // Get the child paths of a directory.
    // @note: throws an error when the path is not a directory.
    /*  @docs:
        @title: Paths
        @desc: Get the child paths of a directory.
        @note: throws an error when the path is not a directory.
        @funcs: 2
    */
    async paths({
        recursive = false,
        absolute = true,
        exclude = [],
    } = {}) {

        // Since previous versions had only a single boolean arg, defer to old version when passed like this.
        if (typeof arguments[0] === "boolean") {
            recursive = arguments[0];
            absolute = true;
            exclude = [];
        }

        // Initialize exclude list.
        for (let i = 0; i < exclude.length; i++) {
            let path = new vlib.Path(exclude[i]);
            if (path.exists()) {
                path = path.abs();
            } else {
                if (this.join(exclude[i], false).exists()) {
                    path = this.join(exclude[i], false).abs();
                }
            }
            exclude[i] = path.str();
        }

        // Iterate.
        return new Promise(async (resolve, reject) => {
            if (!this.is_dir()) {
                return reject(`Path "${this._path}" is not a directory.`);
            }
            if (recursive === false) {
                libfs.readdir(this._path, (err, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        const list = [];
                        files.iterate(name => {
                            const path = this.join(name);
                            if (exclude.length === 0 || !exclude.includes(path.str())) {
                                list.append(absolute ? path : name)
                            }
                        })
                        resolve(list);
                    }
                });
            } else {
                const files = [];
                const traverse = (path, relative_path) => {
                    return new Promise((resolve, reject) => {
                        libfs.readdir(path._path, async (err, children) => {
                            if (err) {
                                reject(err);
                            } else {
                                let err = null;
                                for (let i = 0; i < children.length; i++) {
                                    const child = path.join(children[i]);
                                    if (exclude.length > 0 && exclude.includes(child.str())) {
                                        continue;
                                    }
                                    const relative_child = absolute ? null : relative_path.join(children[i]);
                                    files.push(absolute
                                        ? child
                                        : relative_child
                                    );
                                    if (child.is_dir()) {
                                        try {
                                            await traverse(child, relative_child);
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
                    await traverse(this, absolute ? null : new vlib.Path(""));
                } catch (err) {
                    return reject(err);
                }
                resolve(files);
                
            }
        });
    }
    paths_sync(recursive = false) {
        if (!this.is_dir()) {
            throw Error(`Path "${this._path}" is not a directory.`);
        }
        if (recursive === false) {
            return libfs.readdirSync(this._path).map((name) => (this.join(name)));
        } else {
            const files = [];
            const traverse = (path) => {
                libfs.readdirSync(path.toString()).iterate((name) => {
                    const child = path.join(name);
                    files.push(child);
                    if (child.is_dir()) {
                        traverse(child);
                    }
                });
            }
            traverse(this);
            return files;
        }
    }

    // Truncate.
    /*  @docs:
        @title: Truncate
        @desc: Truncate the file.
    */
    async truncate(offset) {
        return new Promise(async (resolve, reject) => {
            libfs.truncate(this._path, offset, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        })
    }

    /** @docs:
     *  @title: Common Base Path
     *  @descr: Find the common base path between an array of paths.
     *  @return:
     *      @type: string | undefined
     *      @descr: Returns a string when a common base path has been found, when no common base path was found `undefined` will be returned.
     */
    static find_common_base_path(paths) {
        if (!Array.isArray(paths) || paths.length === 0) {
            return ''; // Return empty if input is invalid or empty
        }

        if (paths.length === 1) {
            return new vlib.Path(paths[0]).base(); // If only one path, return it directly
        }

        // Detect platform-specific path separators (handles both '/' and '\\')
        const separator = paths[0].includes('\\\\') ? '\\\\' : '/';

        // Split the first path into components to use as a reference
        const split_first_path = paths[0].split(separator);

        let common_length = split_first_path.length;

        // Iterate over the remaining paths
        for (let i = 1; i < paths.length; i++) {
            const split = paths[i].split(separator);
            const min_length = Math.min(common_length, split.length); // Only compare up to the shortest path

            // Compare components one by one until mismatch
            let j = 0;
            while (j < min_length && split_first_path[j] === split[j]) {
                j++;
            }

            // Update the common length up to the point of the last match
            common_length = j;

            // Early exit if no common base path
            if (common_length === 0) {
                return undefined; // No common base path
            }
        }

        // Join the common components into a path string
        return split_first_path.slice(0, common_length).join(separator);
    }
}
