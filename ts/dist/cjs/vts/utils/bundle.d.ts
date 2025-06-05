/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
interface CompilerError {
    data: string;
    file_name?: string;
    line?: number;
    column?: number;
}
/**
 * Options for bundling TypeScript code.
 */
export interface BundleOptions {
    include?: string[];
    output?: string | string[];
    entry_paths?: string[];
    error_limit?: number;
    /**
     * Target platform: 'browser' or 'node'.
     */
    platform?: 'browser' | 'node';
    /**
     * Target platform: 'ES2023' etc.
     */
    target?: string;
    /**
     * Output format based on platform.
     * - For 'browser': 'iife' or 'umd'
     * - For 'node': 'cjs' or 'esm'
     */
    format?: 'iife' | 'cjs' | 'esm';
    /**
     * Enable or disable minification.
     */
    minify?: boolean;
    /**
     * Enable or disable tree shaking.
     */
    tree_shaking?: boolean;
    /** External library names not to be included in the bundle */
    externals?: string[];
    /**
     * Enable or disable debug console statements.
     */
    debug?: string | boolean;
    /**
     * Enable or disable source map generation.
     */
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';
    extract_inputs?: boolean;
    opts?: any;
    postprocess?: undefined | ((data: string) => string | Promise<string>);
    /** Log level (default is 0) */
    log_level?: number;
    /** Analyze */
    analyze?: boolean;
}
/**
 * Result of the bundling process.
 */
export interface BundleResult {
    /**
     * Bundled JavaScript code.
     */
    code?: string;
    /**
     * Compilation and bundling errors, if any.
     */
    errors: CompilerError[];
    /**
     * Source map, if generated.
     */
    source_map?: string;
    /**
     * Debug function.
     */
    debug: () => void;
    inputs: string[];
}
export declare function bundle(options: BundleOptions): Promise<BundleResult>;
export {};
