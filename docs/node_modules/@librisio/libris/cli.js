/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

const {vlib} = require("./vinc.js")
const {Client, Config} = require("./libris.js")

// ---------------------------------------------------------
// Global constants.

const DOCUMENTATION = "https://libris.com/docs"
const CONFIG_PATHS = [
    "./libris",
    "./libris.js",
    "./docs/config",
    "./docs/config.js",
];
const CONFIG_PATHS_STR = `"./libris", "./libris.js", "./docs/config" and "./docs/config.js"`;

// ---------------------------------------------------------
// CLI.

// Load or find the configuration file.
const load_config = (path = null, source = "") => {
    if (path == null) {
        const path = CONFIG_PATHS.iterate((subpath) => {
            const path = new vlib.Path(source + subpath);
            if (path.exists()) {
                return Config.load(path);
            }
        })
        if (path == null) {
            throw Error(`Unable to find a configuration file, either specify a the path to the configuration file using argument "--config". Or create a configuration file at one of the following sub paths: ${CONFIG_PATHS_STR}.`);
        }
    }
    return Config.load(path);
}

// Create the CLI.
/*  @docs:
 *  @parse: false
 *  @lang: CLI
 *  @name: CLI
 *  @title: {{BRAND_NAME}} CLI
 *  @description: The {{BRAND_NAME}} CLI.
 *  @usage: 
 *      @CLI:
 *          $ libris --generate --config /path/to/config.json
 */
const CLI = new vlib.CLI({name: "libris", version: "1.1.1", commands: [

    // Generate.
    /*  @docs:
     *  @parse: false
     *  @lang: CLI
     *  @parent: CLI
     *  @title: Generate
     *  @name: --generate
     *  @description: Generate a documentation page based on your configuration.
     *  @param:
     *      @name: --source
     *      @type: string
     *      @desc: The source path to the package, the configuration file will be automatically loaded. It must reside at one of the following sub paths {{CONFIG_PATHS_STR}}.
     *      @con_required: true
     *  @param:
     *      @name: --sources
     *      @type: array
     *      @desc: The source paths of the packages, the configuration file will be automatically loaded. It must reside at one of the following sub paths {{CONFIG_PATHS_STR}}.
     *      @con_required: true
     *  @param:
     *      @name: --config
     *      @type: string
     *      @desc: The path to the configuration file.
     *      @con_required: true
     *  @param:
     *      @name: --configs
     *      @type: array
     *      @desc: The paths to the configuration files.
     *      @con_required: true
     *  @param:
     *      @name: --api-key
     *      @type: string
     *      @desc: The {{BRAND_NAME}} API key, when undefined the environment variable `LIBRIS_API_KEY` will be used.
     *      @required: false
     *  @usage: 
     *      @CLI:
     *          $ libris --generate
     *          $ libris --generate --source path/to/my/package
     *          $ libris --generate --sources path/to/my/package1,path/to/my/package2
     *          $ libris --generate --config path/to/my/package/config.json
     *          $ libris --generate --configs path/to/my/package1/config.json,path/to/my/package2/config.json
     *          $ libris --generate --api-key ...
     */
    {
        id: "--generate",
        description: "Generate a documentation page based on your configuration.",
        examples: {
            "Generate": "libris --generate",
            "Generate": "libris --generate --source path/to/my/package",
            "Generate": "libris --generate --sources path/to/my/package1,path/to/my/package2",
            "Generate": "libris --generate --config path/to/my/package/config.json",
            "Generate": "libris --generate --configs path/to/my/package1/config.json,path/to/my/package2/config.json",
            "Generate": "libris --generate --api-key ...",
        },
        args: [
            {id: "--source", type: "string", description: `The source path to the package, the configuration file will be automatically loaded. It must reside at one of the following sub paths ${CONFIG_PATHS_STR}.`},
            {id: "--sources", type: "array", description: `The source paths of the packages, the configuration file will be automatically loaded. It must reside at one of the following sub paths ${CONFIG_PATHS_STR}.`},
            {id: "--config", type: "string", description: `The path to the configuration file.`},
            {id: "--configs", type: "array", description: `The paths to the configuration files.`},
            {id: "--api-key", type: "string", description: `The Libris API key, when undefined the environment variable "LIBRIS_API_KEY" will be used.`},
        ],
        callback: async ({
            source = null,
            sources = null,
            config = null,
            configs = null,
            api_key = null,
            _command = null,
        }) => {
            
            // Load all clients based on the arguments.
            let clients = [];

            // By single config.
            if (config !== null) {
                clients.push(new Client({
                    config: load_config(config),
                    api_key: api_key,
                }));
            }

            // By configs.
            else if (configs !== null) {
                configs.iterate((config) => {
                    clients.push(new Client({
                        config: load_config(config),
                        api_key: api_key,
                    }));
                })
            }

            // By single source.
            else if (source !== null) {
                clients.push(new Client({
                    config: load_config(null, source),
                    api_key: api_key,
                }));
            }

            // By sources.
            else if (sources !== null) {
                sources.iterate((source) => {
                    clients.push(new Client({
                        config: load_config(null, source),
                        api_key: api_key,
                    }));
                })
            }

            // Invalid arguments.
            else {
                cli.error(`One of the following arguments must be defined "--source", "--sources", "--config" or "--configs".`);
                cli.docs(_command);
                process.exit(1);
            }

            // Iterate all clients.
            await clients.iterate_async_await(async (client) => {
                if (client.config.output_path == null) {
                    cli.throw_error(`Configuration file "${client.config.config_path}" does not have a defined HTML output path for the generated documentation, define configuration attribute "output_path". More information about the configuration can be found at "${DOCUMENTATION}?id=Configuration:Config".`);
                }
                try {
                    await client.generate();
                } catch (error) {
                    cli.throw_error(error);
                }
                if (Array.isArray(client.config.output_path)) {
                    vlib.print_marker(`Successfully generated the "${client.config.name}" documentation, saved the HTML to ${client.config.output_path.length} output paths.`);
                } else {
                    vlib.print_marker(`Successfully generated the "${client.config.name}" documentation, saved the HTML to "${client.config.output_path}".`);
                }
            })

        }
    },

    // List projects.
    /*  @docs:
     *  @parse: false
     *  @lang: CLI
     *  @parent: CLI
     *  @title: List Projects
     *  @name: --list-projects
     *  @description: List your account's active projects.
     *  @param:
     *      @name: --api-key
     *      @type: string
     *      @desc: The {{BRAND_NAME}} API key, when undefined the environment variable `LIBRIS_API_KEY` will be used.
     *      @required: false
     *  @usage: 
     *      @CLI:
     *          $ libris --list-projects
     */
    {
        id: "--list-projects",
        description: "List your account's active projects.",
        examples: {
            "List Projects": "libris --list-projects",
        },
        args: [
            {id: "--api-key", type: "string", description: `The Libris API key, when undefined the environment variable "LIBRIS_API_KEY" will be used.`},
        ],
        callback: async ({
            api_key = null,
        }) => {
            if (api_key != null) {
                Client.api_key = api_key;
            }
            let projects;
            try {
                projects = await Client.list_projects();
            } catch (error) {
                cli.throw_error(error);
            }
            vlib.print_marker("Projects:")
            projects.iterate((project) => {
                vlib.print(` *${project}`);
            })
        }
    },

    // Delete Project.
    /*  @docs:
     *  @parse: false
     *  @lang: CLI
     *  @parent: CLI
     *  @title: Delete Project
     *  @name: --delete-project
     *  @description: Delete one of your your account's active projects.
     *  @param:
     *      @name: --name
     *      @type: string
     *      @desc: The name of the project you want to delete.
     *      @required: true
     *  @param:
     *      @name: --api-key
     *      @type: string
     *      @desc: The {{BRAND_NAME}} API key, when undefined the environment variable `LIBRIS_API_KEY` will be used.
     *      @required: false
     *  @usage: 
     *      @CLI:
     *          $ libris --delete-project myproject
     */
    {
        id: ["--delete-project", "--del-project"],
        description: "Delete one of your your account's active projects.",
        examples: {
            "List Projects": "libris --delete-project myproject",
        },
        args: [
            {id: "--name", type: "string", description: `The name of the project you want to delete.`, required: true},
            {id: "--api-key", type: "string", description: `The Libris API key, when undefined the environment variable "LIBRIS_API_KEY" will be used.`},
        ],
        callback: async ({
            name = null,
            api_key = null,
        }) => {
            if (api_key != null) {
                Client.api_key = api_key;
            }
            let projects;
            try {
                projects = await Client.del_project(name);
            } catch (error) {
                cli.throw_error(error);
            }
            vlib.print_marker(`Successfully deleted project "${name}".`)
        }
    },

]});

// Start.
cli.start();