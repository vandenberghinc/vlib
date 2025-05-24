/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * The VTS plugin.
 */
export declare class Plugin {
    private config;
    constructor(config: {
        /**
         * The path to the tsconfig.json file.
         * This is used to determine the source and output files.
         */
        tsconfig: string;
        /**
         * Define the header attribute to enable the header plugin.
         */
        header?: {
            /**
             * Define the author option to automatically insert/update
             * The author and copyright header of each source file. */
            author?: string;
            /** The copyright start year. */
            start_year?: number;
        };
        /**
         * Enable the `dirname` plugin, ensuring variables such as `__dirname` and additional are accessable in ESM and CJS dist files.
         */
        dirname?: boolean;
        /**
         * Enable the `version` plugin, inserting the __version variable into the dist files.
         */
        version?: {
            /** The path to the package.json path or any another json file that has a `version:string` attributel. */
            package: string;
        };
        /**
         * Disable all vlib `^\s*debug(...)` statements.
         */
        no_debug?: boolean;
        /**
         * Fill {{key}} templates in the dist files.
         */
        templates?: {
            [key: string]: string;
        };
    });
    /**
     * Run the plugin.
     */
    run(): Promise<void>;
}
