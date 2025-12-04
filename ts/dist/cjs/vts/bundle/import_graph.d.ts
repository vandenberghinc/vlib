/**
 * @author Daan van den Bergh
 * @copyright © 2025 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Debug } from '../../vlib/index.js';
import * as esbuild from 'esbuild';
/**
 * Import chain query result
 */
export interface ImportChain {
    target: string;
    chains: string[][];
    found: boolean;
}
/**
 * ImportGraphPlugin that builds import graph during resolution, works even when builds fail
 *
 * @note This does not accurately work with tracking imports across libraries.
 */
export declare class ImportGraphPlugin {
    private options;
    private graph;
    private entry_points;
    /** ESBuild plugin instance */
    readonly plugin: esbuild.Plugin;
    constructor(options?: {
        track_externals?: boolean;
        debug?: Debug;
    });
    /**
     * Parse import statements from file content
     */
    private parse_imports;
    /**
     * Resolve an import specifier to an absolute path
     */
    private resolve_import;
    /**
     * Check if a file exists
     */
    private file_exists;
    /**
     * Enhance the graph with data from esbuild's metafile
     */
    private enhance_with_metafile;
    /**
     * Ensure a node exists in the graph
     */
    private ensure_node;
    /**
     * Add an import relationship to the graph
     */
    private add_import_relation;
    /**
     * Check if a path represents an external module
     */
    private is_external;
    /**
     * Get all import chains leading to target file
     */
    get_import_chains(target_path: string): ImportChain;
    /**
     * Format a list of import chains.
     */
    format_import_chains(import_chains: ImportChain[], indent?: string, limit?: number): string[];
    /**
     * Debug: Print the current state of the import graph
     */
    debug_print(): void;
}
