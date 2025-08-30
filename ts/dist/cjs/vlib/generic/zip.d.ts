/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 *
 * Zip utilities for nodejs.
 *
 * @warning This module is still experimental and will be subject to change in the future
 *          Especially since it needs to be security audited but for now its been created for internal use.
 */
import { Path } from '../generic/path.js';
/**
 * Zip utilities for working with zip files.
 * @warning This module might still be slightly unsafe due too its experimental and internal nature.
 *          Therfore, this module will be subject to future change.
 * @experimental
 */
export declare namespace Zip {
    /**
     * Represents a single entry in a zip archive.
     */
    interface Entry {
        /** Entry path within the archive. */
        name: string;
        /** Whether the entry represents a directory. */
        is_directory: boolean;
        /** Uncompressed size of the entry in bytes. */
        size: number;
    }
    /**
     * Extract a zip file to a destination directory **safely** (Zip‑Slip protected).
     *
     * @param file - Path to the zip file to extract.
     * @param dest - Destination directory where files will be extracted.
     * @throws {Error} If the zip file doesn't exist, is corrupted, or contains path‑traversal entries.
     */
    function extract(file: string | Path, dest: string | Path): Promise<void>;
    /**
     * List all entries contained in a zip file.
     */
    function list(file: string | Path): Promise<Entry[]>;
    /** Options for creating a zip through the {@link create} function. */
    interface CreateOpts {
        /**
         * Custom archive entry name. String for custom name, false to exclude root directory name, undefined for original name.
         */
        name?: string | false;
        /**
         * Compression level (0-9). 0 = no compression, 9 = maximum compression. Default: 9.
         */
        level?: number;
        /**
         * Include root directory when archiving a directory. Default: true.
         */
        include_root?: boolean;
        /**
         * The glob patterns to exclude from the archive.
         * @note Directory entries should be excluded as *`pattern*` since all entries are gathered first, then filtered individually later.
         */
        exclude?: string[];
        /**
         * Store without compression (faster, larger). When true, level is ignored. Default: false.
         */
        store?: boolean;
        /**
         * Optional comment to embed in zip metadata. Visible in most zip utilities.
         */
        comment?: string;
        /**
         * Progress callback called for each processed entry.
         * @param current - Name/path of the currently processed entry
         * @param processed - Number of entries processed so far
         * @param total - Total number of entries (may be undefined)
         */
        on_progress?: (current: string, processed: number, total?: number) => void;
        /**
         * Create destination directory if it doesn't exist. Default: true.
         */
        create_dest_dir?: boolean;
    }
    /**
     * Create a zip archive from one or more sources.
     */
    function create(sources: string | Path | (string | Path)[], destination: string | Path, options?: CreateOpts): Promise<void>;
    /**
     * Create a zip archive from a single file.
     */
    function create_from_file(source_file: string | Path, destination: string | Path, archive_name?: string, compression_level?: number): Promise<void>;
    /**
     * Create a zip archive from a directory.
     */
    function create_from_directory(source_dir: string | Path, destination: string | Path, include_root_folder?: boolean, compression_level?: number, exclude_patterns?: string[]): Promise<void>;
}
export { Zip as zip };
