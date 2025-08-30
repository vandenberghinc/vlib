/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import { BundleOptions, CompilerError } from "./bundle.js";
import { ImportChain } from './import_graph.js';
/**
 * Result of the bundling process.
 */
export interface InspectBundleResult {
    /** Compilation and bundling errors, if any. */
    errors: CompilerError[];
    format_errors: () => string[];
    /** Input paths. Only defined when extract_inputs is `true`. */
    inputs: string[];
    /** Retrieve the import chain of all errors. */
    import_chains: () => ImportChain[];
    format_import_chains: () => string[];
    /** Retrieve the generated meta file */
    metafile?: string;
    /** Get a formatted debug string, optionally pass a limit for the errors to show, by default no limit is set. */
    debug({ limit, filter }: {
        limit?: -1 | number;
        filter?: (error: CompilerError) => boolean;
    }): string;
}
/**
 * Inspect & debug a bundle.
 * @param options The bundle options.
 */
export declare function inspect_bundle(options: Pick<BundleOptions, 'include' | 'externals' | 'output' | 'platform' | 'format' | 'target' | 'minify' | 'tree_shaking' | 'opts'>): Promise<InspectBundleResult>;
