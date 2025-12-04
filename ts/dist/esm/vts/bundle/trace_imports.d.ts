/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A request describing a single import-trace to perform.
 */
export interface TraceRequest {
    /** Absolute or relative path of the start file (file A). */
    from: string;
    /** Absolute or relative path of the target file (file B). */
    to: string;
}
/**
 * The mapping result for a given `from` file.
 */
export interface ImportChain {
    /** The (from) `to` target path that was requested. */
    from: string;
    /** The (original) `to` target path that was requested. */
    target: string;
    /**
     * All discovered import chains from `from` to `to`.
     * Each chain is an ordered list of absolute file paths (including endpoints).
     */
    chains: string[][];
    /**
     * Whether no import chain was found.
     */
    found: boolean;
}
/**
 * Trace imports from A to B using manual file reading and import resolution.
 */
export declare class ImportTracer {
    /**
     * Supported source file extensions in resolution order.
     */
    private supported_exts;
    /**
     * Cache: parsed imports for a given absolute file path.
     */
    private parsed_imports_cache;
    /**
     * Cache: resolved specifier -> absolute path, keyed by `${importer}::${specifier}`.
     */
    private resolution_cache;
    /**
     * Cache: existence checks for absolute paths.
     */
    private file_exists_cache;
    /**
     * Cache: realpath resolution per absolute path (handles symlinks in node_modules like pnpm/yarn).
     */
    private realpath_cache;
    /**
     * Trace imports for one or more (from → to) pairs, discovering all import chains
     * from file A to file B with a maximum depth of 100 and circular dependency protection.
     *
     * - Reads the actual files and re-parses imports at each hop.
     * - Resolves Node.js bare specifiers via `node_modules` (with `exports`/`module`/`browser`/`main` fallbacks).
     * - Caches parsed imports and specifier resolutions to minimize IO.
     *
     * @param traces The list of trace requests `{ from, to }`.
     * @param import_limit Optional maximum import depth (default: 100).
     * @returns A record keyed by the original `from` string, mapping to `{ to, import_chain }`.
     */
    trace(traces: TraceRequest[], import_limit?: number): ImportChain[];
    /**
     * Format a list of import chains.
     * Also supports the `ImportGraphPlugin` format.
     */
    format_import_chains(trace_results: Omit<ImportChain, "from">[], indent?: string, limit?: number): string[];
    /**
     * Find all import paths from `start_abs` to `goal_abs` with cycle detection and a depth limit.
     *
     * @param start_abs Absolute path of the start file.
     * @param goal_abs Absolute path of the goal file.
     * @param max_depth Maximum recursion depth (inclusive).
     * @returns A list of chains (each chain is an ordered array of absolute file paths).
     */
    private find_all_paths;
    /**
     * Parse and cache import specifiers from a source file.
     * Supports ESM `import`/`export ... from`, CJS `require()`, and dynamic `import()`.
     *
     * @param file_abs Absolute path of the file to parse.
     * @returns A de-duplicated array of raw specifiers found in the file.
     */
    private get_parsed_imports;
    /**
     * Resolve a raw import specifier from a given importer file to an absolute file path.
     * Handles:
     *  - relative and absolute specifiers
     *  - bare Node package specifiers with `node_modules` lookup
     *  - package.json `exports`, `module`, `browser`, `main` fallbacks
     *  - extension and directory index resolution
     *
     * @param importer_abs Absolute path of the importer file.
     * @param specifier The raw specifier as written in source.
     * @returns The resolved absolute file path, or `null` if not found.
     */
    private resolve_import_specifier;
    /**
     * Resolve a "file-like" path by trying exact file, extension appends, and directory index files.
     *
     * @param base_path Base path without guaranteed extension.
     * @returns Absolute file path or `null` if not resolvable.
     */
    private resolve_file_like;
    /**
     * Resolve a bare Node package specifier by walking up parent directories
     * and searching in `node_modules`.
     *
     * @param importer_abs The importer file path.
     * @param specifier Bare specifier like "react" or "@scope/pkg/subpath".
     * @returns Absolute resolved file path or `null`.
     */
    private resolve_node_package;
    /**
     * Choose an entry file from a package root using package.json heuristics.
     * Prefers modern `exports` (conditional "import"/"browser"/"default"), then `module`,
     * then `browser`, then `main`, then falls back to `index.*`.
     *
     * Supports subpath exports like "@pkg/subpath" → key "./subpath".
     *
     * @param pkg_root Absolute path to the package root directory.
     * @param subpath Optional subpath inside the package (without leading slash).
     * @returns Absolute resolved file path or `null`.
     */
    private resolve_package_entry;
    /**
     * Normalize a path to an absolute normalized path and canonicalize symlinks if possible.
     * Relative inputs are resolved from `process.cwd()`.
     *
     * @param p Input path (absolute or relative).
     */
    private normalize_to_abs;
    /**
     * Determine if two file paths are equal after normalization and realpath canonicalization.
     *
     * @param a First path.
     * @param b Second path.
     */
    private paths_equal;
    /**
     * Return true if the specifier is relative ("./", "../") or absolute (starts with "/").
     *
     * @param s The raw specifier.
     */
    private is_relative_or_absolute;
    /**
     * Return true if the path is absolute on this platform.
     *
     * @param p Path to check.
     */
    private is_absolute;
    /**
     * Strip block comments (/* *\/) and line comments (//...) from a source string.
     * Preserves string literals so `require('x')` and `import('x')` remain matchable.
     *
     * @param src Source text.
     */
    private strip_comments;
    /**
     * Read a file as UTF-8 string. Returns `null` if the file doesn't exist or is not readable.
     *
     * @param abs Absolute path to read.
     */
    private safe_read_file;
    /**
     * Attempt to treat `p` as a file path and return canonical normalized path if it exists.
     *
     * @param p Path to test.
     */
    private try_file;
    /**
     * Attempt to treat `p` as a directory and return normalized path if it exists.
     *
     * @param p Path to test.
     */
    private try_dir;
    /**
     * Helper to collect capture group 1 of all regex matches into a set.
     *
     * @param text Input text.
     * @param rx Global regex with one capture group.
     * @param out Target set to fill.
     */
    private match_all;
    /**
     * Split a bare specifier into package name and subpath.
     * Handles scoped packages:
     *   - "react" → { pkg_name: "react", subpath: "" }
     *   - "@scope/name" → { pkg_name: "@scope/name", subpath: "" }
     *   - "@scope/name/sub/a" → { pkg_name: "@scope/name", subpath: "sub/a" }
     *   - "pkg/sub/b" → { pkg_name: "pkg", subpath: "sub/b" }
     *
     * @param specifier Bare specifier.
     */
    private split_package_and_subpath;
    /**
     * Safely read and parse a package.json file.
     *
     * @param pkg_json_abs Absolute path to `package.json`.
     */
    private read_package_json;
    /**
     * Narrow an unknown value to `PackageJson`.
     *
     * @param v Value to check.
     */
    private is_package_json;
    /**
     * Resolve a target from `exports` given a key (e.g., ".", "./subpath").
     * Supports string or condition maps. Picks "import" → "browser" → "default".
     *
     * @param exp The `exports` field (unknown structure).
     * @param key Subpath key to lookup.
     */
    private resolve_exports_target;
    /**
     * If an exports map object is returned, pick a string-like best-effort field.
     *
     * @param obj The exports conditional object.
     */
    private first_string_in_export_map;
    /**
     * Remove a leading "./" from a relative path if present.
     *
     * @param rel Relative path string.
     */
    private strip_dot_slash;
    /**
     * Canonicalize a path using `fs.realpathSync` when available to resolve symlinks.
     * Falls back to `path.normalize` if the realpath lookup fails (e.g., path does not exist).
     *
     * @param abs Absolute or relative path to canonicalize.
     * @returns Canonical absolute path string suitable for equality comparisons.
     */
    private to_canonical;
}
