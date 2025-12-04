/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
/* eslint-disable no-use-before-define */
import { Color, Path } from "../../vlib/index.js";
import * as fs from "fs";
import * as path from "path";
/**
 * Trace imports from A to B using manual file reading and import resolution.
 */
export class ImportTracer {
    /**
     * Supported source file extensions in resolution order.
     */
    supported_exts = [
        ".ts",
        ".tsx",
        ".mts",
        ".cts",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
    ];
    /**
     * Cache: parsed imports for a given absolute file path.
     */
    parsed_imports_cache = new Map();
    /**
     * Cache: resolved specifier -> absolute path, keyed by `${importer}::${specifier}`.
     */
    resolution_cache = new Map();
    /**
     * Cache: existence checks for absolute paths.
     */
    file_exists_cache = new Map();
    /**
     * Cache: realpath resolution per absolute path (handles symlinks in node_modules like pnpm/yarn).
     */
    realpath_cache = new Map();
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
    trace(traces, import_limit = 100) {
        const results = [];
        for (const req of traces) {
            const from_abs = this.normalize_to_abs(req.from);
            // Resolve the target explicitly: allow bare npm specifiers (e.g. "@scope/pkg" or "react")
            // as well as relative/absolute paths.
            const to_abs = this.resolve_import_specifier(from_abs, req.to) ??
                this.normalize_to_abs(req.to);
            const chains = this.find_all_paths(from_abs, to_abs, import_limit);
            results.push({
                from: req.from,
                target: req.to,
                chains: chains,
                found: chains.length > 0,
            });
        }
        return results;
    }
    /**
     * Format a list of import chains.
     * Also supports the `ImportGraphPlugin` format.
     */
    format_import_chains(trace_results, indent = "", limit = -1) {
        // Get all paths for common base calculation
        const all_import_chains_paths = [];
        for (const chain of trace_results) {
            /** @warning somehow using `chain.chains.flat()` sometimes causes a recursive limit reached err */
            // all_import_chains_paths.push(path.resolve(chain.target), ...chain.chains.flat().map(c => path.resolve(c)));
            for (const c of chain.chains) {
                if (c.length > 0) {
                    all_import_chains_paths.push(...c);
                }
            }
            all_import_chains_paths.push(chain.target);
        }
        const common_base = Path.find_common_base_path(all_import_chains_paths);
        let common_base_slice;
        if (common_base) {
            common_base_slice = new Path(common_base).abs().str().length;
        }
        let limit_count = 0;
        const import_chains_formatted = [];
        for (const chain of trace_results) {
            const target = common_base_slice ? "." + path.resolve(chain.target).slice(common_base_slice) : chain.target;
            if (chain.chains.length === 0) {
                import_chains_formatted.push(`No import chain found for target "${target}"`);
                continue;
            }
            const lines = [];
            for (const c of chain.chains) {
                if (c.length === 0)
                    continue;
                if (limit !== -1 && limit_count > limit) {
                    break;
                }
                ++limit_count;
                lines.push(`${indent}${Color.gray("note")}: Import chain:` +
                    c.map(l => `\n${indent}    ${Color.italic(common_base_slice ? "." + path.resolve(l).slice(common_base_slice) : l)}`).join(Color.blue(" => ")));
            }
            const add = lines.join("\n");
            if (import_chains_formatted[import_chains_formatted.length - 1] !== add) {
                import_chains_formatted.push(lines.join("\n"));
            }
        }
        return import_chains_formatted;
    }
    // ------------------------------------------------------------------------
    // Private methods.
    /**
     * Find all import paths from `start_abs` to `goal_abs` with cycle detection and a depth limit.
     *
     * @param start_abs Absolute path of the start file.
     * @param goal_abs Absolute path of the goal file.
     * @param max_depth Maximum recursion depth (inclusive).
     * @returns A list of chains (each chain is an ordered array of absolute file paths).
     */
    find_all_paths(start_abs, goal_abs, max_depth) {
        const chains = [];
        const stack = [];
        // Cache for this trace: mark files we've already expanded to avoid re-parsing/expanding
        // the same node again (prevents infinite loops across converging cycles).
        const expanded_in_trace = new Set();
        // console.log(`Tracing imports from "${start_abs}" to "${goal_abs}"`);
        const dfs = (current_abs, depth, on_path) => {
            // console.log(`  DFS at depth ${depth}, current: "${current_abs}"`);
            // Depth guard
            if (depth > max_depth) {
                return;
            }
            // If we've already expanded this file earlier in this A→B search,
            // do not expand it again; terminate this branch as non-found.
            if (expanded_in_trace.has(current_abs)) {
                return;
            }
            stack.push(current_abs);
            on_path.add(current_abs);
            // Success: full chain A → ... → B
            if (this.paths_equal(current_abs, goal_abs)) {
                chains.push([...stack]);
                stack.pop();
                on_path.delete(current_abs);
                return;
            }
            // Mark as expanded *before* reading imports so any re-entrance short-circuits.
            expanded_in_trace.add(current_abs);
            const imports = this.get_parsed_imports(current_abs);
            for (const specifier of imports) {
                const resolved = this.resolve_import_specifier(current_abs, specifier);
                if (!resolved) {
                    continue;
                }
                // Prevent direct cycle within the active path
                if (on_path.has(resolved)) {
                    continue;
                }
                dfs(resolved, depth + 1, on_path);
            }
            stack.pop();
            on_path.delete(current_abs);
        };
        dfs(start_abs, 0, new Set());
        return chains;
    }
    /**
     * Parse and cache import specifiers from a source file.
     * Supports ESM `import`/`export ... from`, CJS `require()`, and dynamic `import()`.
     *
     * @param file_abs Absolute path of the file to parse.
     * @returns A de-duplicated array of raw specifiers found in the file.
     */
    get_parsed_imports(file_abs) {
        const key = path.normalize(file_abs);
        const cached = this.parsed_imports_cache.get(key);
        if (cached)
            return cached;
        const content = this.safe_read_file(key);
        if (content === null) {
            this.parsed_imports_cache.set(key, []);
            return [];
        }
        // Strip comments (block and line) to avoid false positives in commented code.
        const uncommented = this.strip_comments(content);
        const specifiers = new Set();
        // import ... from 'x'
        this.match_all(uncommented, /\bimport\s+[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g, specifiers);
        // import 'x' (side-effect import)
        this.match_all(uncommented, /\bimport\s*['"]([^'"]+)['"]/g, specifiers);
        // export ... from 'x'
        this.match_all(uncommented, /\bexport\s+[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g, specifiers);
        // require('x')
        this.match_all(uncommented, /(?:^|[^\w$])require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, specifiers);
        // dynamic import('x')
        this.match_all(uncommented, /(?:^|[^\w$])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g, specifiers);
        const arr = Array.from(specifiers);
        this.parsed_imports_cache.set(key, arr);
        return arr;
    }
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
    resolve_import_specifier(importer_abs, specifier) {
        const cache_key = `${importer_abs}::${specifier}`;
        const cached = this.resolution_cache.get(cache_key);
        if (cached !== undefined)
            return cached;
        let resolved = null;
        if (this.is_relative_or_absolute(specifier)) {
            // Relative or absolute path
            const base = this.is_absolute(specifier) ? path.normalize(specifier) : path.resolve(path.dirname(importer_abs), specifier);
            resolved = this.resolve_file_like(base);
        }
        else {
            // Bare specifier → Node resolution in node_modules
            resolved = this.resolve_node_package(importer_abs, specifier);
        }
        this.resolution_cache.set(cache_key, resolved);
        return resolved;
    }
    /**
     * Resolve a "file-like" path by trying exact file, extension appends, and directory index files.
     *
     * @param base_path Base path without guaranteed extension.
     * @returns Absolute file path or `null` if not resolvable.
     */
    resolve_file_like(base_path) {
        const as_file = this.try_file(base_path);
        if (as_file)
            return as_file;
        // Try with known extensions
        for (const ext of this.supported_exts) {
            const with_ext = base_path + ext;
            const found = this.try_file(with_ext);
            if (found)
                return found;
        }
        // If it's a directory, try index.*
        const as_dir = this.try_dir(base_path);
        if (as_dir) {
            for (const ext of this.supported_exts) {
                const idx = path.join(as_dir, `index${ext}`);
                const found = this.try_file(idx);
                if (found)
                    return found;
            }
        }
        return null;
    }
    /**
     * Resolve a bare Node package specifier by walking up parent directories
     * and searching in `node_modules`.
     *
     * @param importer_abs The importer file path.
     * @param specifier Bare specifier like "react" or "@scope/pkg/subpath".
     * @returns Absolute resolved file path or `null`.
     */
    resolve_node_package(importer_abs, specifier) {
        // Split package name and optional subpath
        const { pkg_name, subpath } = this.split_package_and_subpath(specifier);
        let dir = path.dirname(importer_abs);
        // Walk up towards filesystem root
        while (true) {
            const nm = path.join(dir, "node_modules");
            const pkg_root = path.join(nm, pkg_name);
            if (fs.existsSync(pkg_root)) {
                // If a subpath is given directly (e.g., @scope/pkg/something), try that first
                if (subpath.length > 0) {
                    const direct = this.resolve_file_like(path.join(pkg_root, subpath));
                    if (direct)
                        return direct;
                }
                // Otherwise read package.json to resolve entrypoints
                const entry = this.resolve_package_entry(pkg_root, subpath);
                if (entry)
                    return entry;
            }
            const parent = path.dirname(dir);
            if (parent === dir)
                break; // reached root
            dir = parent;
        }
        return null;
    }
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
    resolve_package_entry(pkg_root, subpath) {
        const pkg_json_path = path.join(pkg_root, "package.json");
        const pkg = this.read_package_json(pkg_json_path);
        // Helper to resolve a relative target inside pkg_root
        const resolve_rel = (rel) => this.resolve_file_like(path.join(pkg_root, rel));
        // 1) Try "exports" (Node modern resolution)
        if (pkg?.exports !== undefined) {
            const exp = pkg.exports;
            // Subpath mapping key must start with "./"
            const key = subpath.length > 0 ? `./${subpath}` : ".";
            const target = this.resolve_exports_target(exp, key) ?? this.resolve_exports_target(exp, "."); // fallback to root
            if (target) {
                const by_exports = typeof target === "string" ? target : this.first_string_in_export_map(target);
                if (by_exports && !by_exports.endsWith(".d.ts")) {
                    const rel = this.strip_dot_slash(by_exports);
                    const resolved = resolve_rel(rel);
                    if (resolved)
                        return resolved;
                }
            }
        }
        // 2) Try conventional fields in order
        const fields = ["module", "browser", "main"];
        for (const f of fields) {
            const v = pkg?.[f];
            if (typeof v === "string" && v.length > 0 && !v.endsWith(".d.ts")) {
                const resolved = resolve_rel(this.strip_dot_slash(v));
                if (resolved)
                    return resolved;
            }
        }
        // 3) If subpath exists, try direct subpath resolution under root
        if (subpath.length > 0) {
            const direct = this.resolve_file_like(path.join(pkg_root, subpath));
            if (direct)
                return direct;
        }
        // 4) Last resort: index.*
        for (const ext of this.supported_exts) {
            const idx = path.join(pkg_root, `index${ext}`);
            const found = this.try_file(idx);
            if (found)
                return found;
        }
        return null;
    }
    /* ----------------------------- helpers below ------------------------------ */
    /**
     * Normalize a path to an absolute normalized path and canonicalize symlinks if possible.
     * Relative inputs are resolved from `process.cwd()`.
     *
     * @param p Input path (absolute or relative).
     */
    normalize_to_abs(p) {
        const abs = this.is_absolute(p) ? p : path.resolve(process.cwd(), p);
        return this.to_canonical(abs);
    }
    /**
     * Determine if two file paths are equal after normalization and realpath canonicalization.
     *
     * @param a First path.
     * @param b Second path.
     */
    paths_equal(a, b) {
        return this.to_canonical(a) === this.to_canonical(b);
    }
    /**
     * Return true if the specifier is relative ("./", "../") or absolute (starts with "/").
     *
     * @param s The raw specifier.
     */
    is_relative_or_absolute(s) {
        return s.startsWith("./") || s.startsWith("../") || this.is_absolute(s);
    }
    /**
     * Return true if the path is absolute on this platform.
     *
     * @param p Path to check.
     */
    is_absolute(p) {
        return path.isAbsolute(p);
    }
    /**
     * Strip block comments (/* *\/) and line comments (//...) from a source string.
     * Preserves string literals so `require('x')` and `import('x')` remain matchable.
     *
     * @param src Source text.
     */
    strip_comments(src) {
        // Remove block comments
        let s = src.replace(/\/\*[\s\S]*?\*\//g, "");
        // Remove line comments
        s = s.replace(/(^|\s)\/\/.*$/gm, "$1");
        return s;
    }
    /**
     * Read a file as UTF-8 string. Returns `null` if the file doesn't exist or is not readable.
     *
     * @param abs Absolute path to read.
     */
    safe_read_file(abs) {
        try {
            return fs.readFileSync(abs, { encoding: "utf8" });
        }
        catch {
            return null;
        }
    }
    /**
     * Attempt to treat `p` as a file path and return canonical normalized path if it exists.
     *
     * @param p Path to test.
     */
    try_file(p) {
        const n = path.normalize(p);
        const cached = this.file_exists_cache.get(n);
        if (cached !== undefined) {
            return cached ? this.to_canonical(n) : null;
        }
        try {
            const stat = fs.statSync(n);
            const ok = stat.isFile();
            this.file_exists_cache.set(n, ok);
            return ok ? this.to_canonical(n) : null;
        }
        catch {
            this.file_exists_cache.set(n, false);
            return null;
        }
    }
    /**
     * Attempt to treat `p` as a directory and return normalized path if it exists.
     *
     * @param p Path to test.
     */
    try_dir(p) {
        const n = path.normalize(p);
        const cached = this.file_exists_cache.get(n);
        if (cached !== undefined) {
            return cached ? n : null;
        }
        try {
            const stat = fs.statSync(n);
            const ok = stat.isDirectory();
            this.file_exists_cache.set(n, ok);
            return ok ? n : null;
        }
        catch {
            this.file_exists_cache.set(n, false);
            return null;
        }
    }
    /**
     * Helper to collect capture group 1 of all regex matches into a set.
     *
     * @param text Input text.
     * @param rx Global regex with one capture group.
     * @param out Target set to fill.
     */
    match_all(text, rx, out) {
        let m;
        // eslint-disable-next-line no-cond-assign
        while ((m = rx.exec(text)) !== null) {
            const spec = m[1];
            if (typeof spec === "string" && spec.length > 0) {
                out.add(spec);
            }
        }
    }
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
    split_package_and_subpath(specifier) {
        if (specifier.startsWith("@")) {
            const parts = specifier.split("/");
            if (parts.length < 2) {
                return { pkg_name: specifier, subpath: "" };
            }
            const pkg_name = `${parts[0]}/${parts[1]}`;
            const subpath = parts.slice(2).join("/");
            return { pkg_name, subpath };
        }
        else {
            const [first, ...rest] = specifier.split("/");
            return { pkg_name: first, subpath: rest.join("/") };
        }
    }
    /**
     * Safely read and parse a package.json file.
     *
     * @param pkg_json_abs Absolute path to `package.json`.
     */
    read_package_json(pkg_json_abs) {
        try {
            const raw = fs.readFileSync(pkg_json_abs, { encoding: "utf8" });
            const parsed = JSON.parse(raw);
            if (this.is_package_json(parsed))
                return parsed;
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Narrow an unknown value to `PackageJson`.
     *
     * @param v Value to check.
     */
    is_package_json(v) {
        if (typeof v !== "object" || v === null)
            return false;
        // minimal guard; we accept unknown fields
        return true;
    }
    /**
     * Resolve a target from `exports` given a key (e.g., ".", "./subpath").
     * Supports string or condition maps. Picks "import" → "browser" → "default".
     *
     * @param exp The `exports` field (unknown structure).
     * @param key Subpath key to lookup.
     */
    resolve_exports_target(exp, key) {
        if (typeof exp === "string") {
            // Single target string applies only to root "."
            return key === "." ? exp : null;
        }
        if (typeof exp === "object" && exp !== null) {
            const map = exp;
            const value = map[key];
            if (typeof value === "string")
                return value;
            if (typeof value === "object" && value !== null) {
                // Conditional map
                const m = value;
                // Preference order
                const pref = ["import", "browser", "default", "module", "node"];
                for (const k of pref) {
                    const got = m[k];
                    if (typeof got === "string")
                        return got;
                }
                // Otherwise return first string-like
                for (const k of Object.keys(m)) {
                    const got = m[k];
                    if (typeof got === "string")
                        return got;
                }
                return m;
            }
        }
        return null;
    }
    /**
     * If an exports map object is returned, pick a string-like best-effort field.
     *
     * @param obj The exports conditional object.
     */
    first_string_in_export_map(obj) {
        const pref = ["import", "browser", "default", "module", "node"];
        for (const k of pref) {
            const v = obj[k];
            if (typeof v === "string")
                return v;
        }
        for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (typeof v === "string")
                return v;
        }
        return null;
    }
    /**
     * Remove a leading "./" from a relative path if present.
     *
     * @param rel Relative path string.
     */
    strip_dot_slash(rel) {
        return rel.startsWith("./") ? rel.slice(2) : rel;
    }
    /**
     * Canonicalize a path using `fs.realpathSync` when available to resolve symlinks.
     * Falls back to `path.normalize` if the realpath lookup fails (e.g., path does not exist).
     *
     * @param abs Absolute or relative path to canonicalize.
     * @returns Canonical absolute path string suitable for equality comparisons.
     */
    to_canonical(abs) {
        const n = path.normalize(abs);
        const cached = this.realpath_cache.get(n);
        if (cached)
            return cached;
        try {
            // Prefer native if available for performance
            const rp = fs.realpathSync.native?.(n) ?? fs.realpathSync(n);
            const canon = path.normalize(rp);
            this.realpath_cache.set(n, canon);
            return canon;
        }
        catch {
            // If not resolvable (e.g., target doesn't exist), use normalized path.
            this.realpath_cache.set(n, n);
            return n;
        }
    }
}
//# sourceMappingURL=trace_imports.js.map