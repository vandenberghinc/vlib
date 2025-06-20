/**
 * Transform ESM files to CommonJS.
 * Workaround for tsconfig complaints when importing library subpaths in commonjs.
 */
/**
 * Recursively converts all ESM files in a directory to CommonJS.
 * Writes outputs to a parallel directory structure under `output_dir`.
 * @param opts.src Directory containing ESM files to convert.
 * @param opts.dest Directory where converted CJS files will be written.
 * @param opts.target ES target version, e.g 'es2021'.
 * @param opts.platform ES platform, 'browser' or 'node'.
 * @param opts.override When omitted an error will be thrown if the destination directory already exists.
 * @param opts.log_level The log level [0-1] to use for logging.
 */
export declare function cjs({ src, dest, target, platform, override, debug, }: {
    src: string;
    dest: string;
    platform?: 'browser' | 'node';
    target?: string;
    override?: boolean;
    debug?: number;
}): Promise<void>;
