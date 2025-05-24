/**
 * Transform ESM files to CommonJS.
 * Workaround for tsconfig complaints when importing library subpaths in commonjs.
 */

// Imports.
import * as fs from 'fs';
import * as pathlib from 'path';
import * as esbuild from 'esbuild';
import { logger, Utils, Path } from '../../index.js';

/**
 * Recursively converts all ESM files in a directory to CommonJS.
 * Writes outputs to a parallel directory structure under `output_dir`.
 * @param opts.src Directory containing ESM files to convert.
 * @param opts.dest Directory where converted CJS files will be written.
 * @param opts.target ES target version, e.g 'es2021'.
 * @param opts.platform ES platform, 'browser' or 'node'.
 * @param opts.override When omitted an error will be thrown if the destination directory already exists.
 * @param opts.quiet Suppress output messages.
 */
export async function cjs({
    src,
    dest,
    target,
    platform,
    override = false,
    quiet = false,
}: {
    src: string;
    dest: string;
    platform?: 'browser' | 'node';
    target?: string;
    override?: boolean;
    quiet?: boolean;
}): Promise<void> {

    // Initialize paths.
    const src_path = new Path(src);
    if (!src_path.exists()) {
        throw new Error(`Source path "${src_path.str()}" does not exist.`);
    }
    if (!src_path.is_dir()) {
        throw new Error(`Source path "${src_path.str()}" is not a directory.`);
    }
    const dest_path = new Path(dest);
    if (dest_path.exists()) {
        if (override) {
            await dest_path.del({ recursive: true });
        } else {
            throw new Error(`Destination path "${dest_path.str()}" already exists.`);
        }
    }

    // Load esm paths.
    const esm_files = await src_path.paths({ recursive: true, absolute: false });
    if (!quiet) {
        console.log(`Found ${esm_files.length} ESM files to convert from "${src_path}".`);
    }

    // Walk esm files.
    for (const esm of esm_files) {

        // Skip directories.
        const abs_esm = src_path.join(esm);
        if (abs_esm.is_dir()) { continue; }

        // Compute the corresponding output path.
        const out_path = dest_path.join(esm);
        const out_base = out_path.base();
        if (!out_base) {
            throw new Error(`Failed to resolve base path for output path "${out_path.str()}"`);
        }
        await out_base.mkdir();

        // Copy plain.
        const ext = esm.extension();
        if (ext !== '.js') {
            if (!quiet) {
                logger.marker(`Copying asset ${esm}`);
            }
            await abs_esm.cp(out_path);
            continue;
        }

        // Read the original ESM source.
        const source_code = await abs_esm.load({ type: "buffer" });

        // Transform to CommonJS.
        try {
            const result = await esbuild.transform(source_code, {
                loader: 'js',
                format: 'cjs',
                platform,
                target,
                sourcemap: false
            });
            out_path.save(result.code);
            if (!quiet) {
                logger.marker(`Transformed ${esm} [${Utils.format_bytes(Buffer.byteLength(result.code, 'utf8'))}]`);
            }
        } catch (err: any) {
            // On error, throw with context.
            throw new Error(`Failed to convert ${esm} to CJS: ${err.message || err}`);
        }
    }

    // Ensure a package.json file exists in the destination directory.
    const pkg_path = dest_path.join('package.json');
    if (!pkg_path.exists()) {
        pkg_path.save(JSON.stringify({
            type: 'commonjs',
        }));
    }
}
