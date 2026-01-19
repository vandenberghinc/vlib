/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Zip utilities for nodejs.
 *
 * @warning This module is still experimental and will be subject to change in the future
 *          Especially since it needs to be security audited but for now its been created for internal use.
 */
import fs from 'fs';
import path from 'path';
import streamzip from 'node-stream-zip';
import archiver from 'archiver';
import { Path } from '../generic/path.js';
import { GlobPatternList } from '../generic/glob_pattern.js';
/**
 * Zip utilities for working with zip files.
 * @warning This is still experimental and might therefore be subject to future change.
 * @experimental
 *
 * @nav System
 * @docs
 */
export var Zip;
(function (Zip) {
    /**
     * Extract a zip file to a destination directory **safely** (Zip‑Slip protected).
     *
     * @param file - Path to the zip file to extract.
     * @param dest - Destination directory where files will be extracted.
     * @throws {Error} If the zip file doesn't exist, is corrupted, or contains path‑traversal entries.
     *
     * @docs
     */
    async function extract(file, dest) {
        const zip_path = new Path(file);
        const dest_path = new Path(dest);
        if (!zip_path.exists()) {
            throw new Error(`Zip file does not exist: ${zip_path.path}`);
        }
        // Ensure destination directory exists.
        dest_path.mkdir({ recursive: true });
        const zip = new streamzip.async({ file: zip_path.path, storeEntries: true });
        try {
            // Zip‑Slip vulnerability guard
            const entries = await zip.entries();
            const destRoot = path.resolve(dest_path.path);
            for (const entry of Object.values(entries)) {
                const target = path.resolve(destRoot, entry.name);
                if (path.relative(destRoot, target).startsWith('..') || path.isAbsolute(path.relative(destRoot, target))) {
                    throw new Error(`Illegal entry path detected in zip (path traversal): ${entry.name}`);
                }
            }
            await zip.extract(null, dest_path.path);
        }
        finally {
            await zip.close();
        }
    }
    Zip.extract = extract;
    /**
     * List all entries contained in a zip file.
     *
     * @docs
     */
    async function list(file) {
        const zip_path = new Path(file);
        if (!zip_path.exists()) {
            throw new Error(`Zip file does not exist: ${zip_path.path}`);
        }
        const zip = new streamzip.async({ file: zip_path.path, storeEntries: true });
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
        }
        finally {
            await zip.close();
        }
    }
    Zip.list = list;
    /**
     * Create a zip archive from one or more sources.
     *
     * @docs
     */
    async function create(sources, destination, options = {}) {
        // Normalize inputs.
        const source_paths = Array.isArray(sources) ? sources.map(s => new Path(s)) : [new Path(sources)];
        const dest_path = new Path(destination);
        // Validate sources.
        for (const source of source_paths) {
            if (!source.exists()) {
                throw new Error(`Source does not exist: ${source.path}`);
            }
        }
        // Prevent accidental overwrite.
        if (dest_path.exists()) {
            throw new Error(`Destination already exists: ${dest_path.path}`);
        }
        // Default options.
        const { name, level = 9, include_root = true, exclude = [], 
        // follow_symlinks = false,
        store = false, comment, on_progress, create_dest_dir = true } = options;
        // Validate compression level.
        if (level < 0 || level > 9) {
            throw new Error(`Invalid compression level: ${level}. Must be between 0 and 9.`);
        }
        // Create destination directory when requested.
        if (create_dest_dir) {
            fs.mkdirSync(path.dirname(dest_path.path), { recursive: true });
        }
        const exclude_patterns = exclude.length > 0 ? new GlobPatternList(exclude) : null;
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(dest_path.path);
            const archive = archiver('zip', {
                zlib: { level: store ? 0 : level },
                store
            });
            let processed_count = 0;
            // Stream event handlers.
            output.on('close', resolve);
            output.on('error', reject);
            archive.on('error', reject);
            archive.on('warning', reject); // Treat warnings as fatal to avoid silent corruption.
            archive.on('entry', (entry_data) => {
                processed_count++;
                if (on_progress) {
                    on_progress(entry_data.name, processed_count, undefined);
                }
            });
            if (comment) {
                // `archiver` 6 exposes setComment(); older versions rely on .comment property.
                if (typeof archive.setComment === 'function') {
                    archive.setComment(comment);
                }
                else {
                    archive.comment = comment;
                }
            }
            archive.pipe(output);
            // Add sources.
            for (const source of source_paths) {
                if (source.is_dir()) {
                    const dir_name = include_root ? source.name() : false;
                    archive.directory(source.path, name !== undefined ? name : dir_name, (entry) => {
                        // if (!follow_symlinks && entry.stats?.isSymbolicLink()) return false;
                        if (exclude_patterns?.match(entry.name))
                            return false;
                        return entry;
                    });
                }
                else {
                    if (exclude_patterns?.match(source.path))
                        continue;
                    const lstat = fs.lstatSync(source.path);
                    if (lstat.isSymbolicLink()) {
                        // if (!follow_symlinks) continue; // skip symlink entirely
                        const real = fs.realpathSync(source.path);
                        archive.file(real, { name: name || source.full_name() });
                    }
                    else {
                        archive.file(source.path, { name: name || source.full_name() });
                    }
                }
            }
            // Finalize archive.
            try {
                archive.finalize();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    Zip.create = create;
    // ----------------------------------------------------------------------------------------
    // Convenience wrappers
    /**
     * Create a zip archive from a single file.
     *
     * @docs
     */
    async function create_from_file(source_file, destination, archive_name, compression_level = 9) {
        const source = new Path(source_file);
        if (!source.exists() || source.is_dir()) {
            throw new Error(`Source must be an existing file: ${source.path}`);
        }
        await create(source, destination, {
            name: archive_name || source.full_name(),
            level: compression_level
        });
    }
    Zip.create_from_file = create_from_file;
    /**
     * Create a zip archive from a directory.
     *
     * @docs
     */
    async function create_from_directory(source_dir, destination, include_root_folder = true, compression_level = 9, exclude_patterns = []) {
        const source = new Path(source_dir);
        if (!source.exists() || !source.is_dir()) {
            throw new Error(`Source must be an existing directory: ${source.path}`);
        }
        await create(source, destination, {
            include_root: include_root_folder,
            level: compression_level,
            exclude: exclude_patterns
        });
    }
    Zip.create_from_directory = create_from_directory;
})(Zip || (Zip = {}));
export { Zip as zip };
//# sourceMappingURL=zip.js.map