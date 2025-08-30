/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */


// Imports.
import { Path, CLI, log, Schema } from "@vlib"
import { Git } from "./git.js";
import { NPM } from "./npm.js";
import { SSH } from "./ssh.js";

export interface Config {
    ssh: {
        remotes: {
            alias: string;
            destination: string;
            enabled: boolean;  
        }[];
    };
    git: {
        username: undefined | string; 
        email: undefined | string;
        remotes: {
            remote: string;
            branch: string;
            destination: string;
            enabled: boolean;
        }[];
    };
    version_path: string;
    npm?: {
        /**
         * The path or subpath to the `package.json` path, defaults to `./package.json`
         * The path will be treated as a subpath of the `source`, unless the `path` starts with a `/`.
         */
        path?: string;
        /** Developer links from npm link ... */
        links?: Record<string, string[]>;
    }
}
export namespace Config {
    /**
     * A generic scheme for generating the JSON schema for the repo configuration file.
     */
    export const Schema = {
        version_path: {
            type: 'string',
            required: false,
            // postprocess: (value) => {
            //     if (value) {
            //         value = value.trim();
            //         if (value.charAt(0) !== "/") {
            //             value = this.source.join(value).str();
            //         }
            //         return value;
            //     }
            // }
        },
        ssh: {
            type: "object",
            required: false,
            schema: {
                remotes: {
                    type: "array",
                    default: [],
                    value_schema: {
                        type: "object",
                        schema: {
                            alias: "string",
                            destination: "string",
                            enabled: { type: "boolean", default: true },
                        },
                    },
                },
            },
        },
        git: {
            type: "object",
            required: false,
            schema: {
                username: "string",
                email: "string",
                remotes: {
                    type: "array",
                    default: [],
                    value_schema: {
                        type: "object",
                        schema: {
                            remote: "string",
                            branch: "string",
                            destination: "string",
                            enabled: { type: "boolean", default: true },
                        },
                    },
                },
            },
        },
        npm: {
            type: 'object',
            required: false,
            schema: {
                path: {
                    type: 'string',
                    required: false,
                    default: './package.json',
                },
                links: {
                    type: 'object',
                    required: false,
                    value_schema: { type: 'array', value_schema: 'string' },
                },
            },
        }
    } as const satisfies Schema.Entries.Opts;
}

// Package class.
export class Package {

    // Attributes.
    source: Path;
    name: string;
    git_enabled: boolean;
    ssh_enabled: boolean;
    npm_enabled: boolean;
    config_path: Path;
    config?: Config;
    git?: Git;
    ssh?: SSH;
    npm?: NPM;

    /** Constructor validator. */
    static validator = new Schema.Validator({
        throw: true,
        unknown: false,
        schema: {
            source: "string",
            git: { type: "boolean", default: true },
            ssh: { type: "boolean", default: true },
            npm: { type: "boolean", default: true },
        },
    });

    // Wrapper function to locate the configuration file.
    static find_config_path(cwd: string = process.cwd()): Path | undefined {
        return CLI.find_config_path({
            name: ["vrepo", ".vrepo"],
            extension: [ "", ".json", ".jsonc" ],
            up: 1,
            cwd,
        })
    }

    // Constructor.
	constructor({
		source,
		git = true, // git enabled.
		ssh = true, // ssh enabled.
		npm = true, // npm enabled.
	}: {
        source: string,
        git?: boolean,
        ssh?: boolean,
        npm?: boolean,
    }) {

        // Verify arguments.
        Package.validator.validate(arguments[0]);

        // Attributes.
        this.git_enabled = git;
        this.ssh_enabled = ssh;
        this.npm_enabled = npm;

        const path = new Path(source);
        if (!path.exists()) {
            throw new Error(`Source path "${path.str()}" does not exist.`);
        }
        const found = Package.find_config_path(path.path); // also works on file paths.
        if (!found) {
            throw new Error(`Source path "${path.str()}" does not contain a "vtest.json" like configuration file.`);
        }
        this.config_path = found;
        this.source = path.base() ?? found;

		// Source name.
		this.name = this.source.full_name();
    }
    async init() {

        // Initialize the configuration file.
		if (!this.config_path.exists()) {
			// throw new Error(`VRepo configuration file "${this.config_path.str()}" does not exist.`);
			this.config = {
				ssh: {
					remotes: [],
				},
				git: {
					username: undefined,
					email: undefined,
					remotes: [],
				},
				version_path: this.source.join(".version.js").str(),
                npm: {
                    path: "./package.json",
                    links: {},
                },
			}
			await this.config_path.save(JSON.stringify(this.config, null, 4))
		} else {
			try {
				this.config = await this.config_path.load({type: "jsonc"}) as any;
			} catch (e: any) {
				e.message = `${this.config_path.abs().str()}: ${e.message}`;
				throw e;
			}
		}
        this.assert_init();

        // Validate the configuration file.
        Schema.validate(this.config, {
			error_prefix: `${this.config_path.str()}: Invalid vrepo configuration file. `,
            unknown: false,
            throw: true,
			schema: {
                ...Config.Schema,
                version_path: {
                    ...Config.Schema.version_path,
                    postprocess: (value) => {
                        if (value) {
                            value = value.trim();
                            if (value.charAt(0) !== "/") {
                                value = this.source.join(value).str();
                            }
                            return value;
                        }
                    }
                },
                ssh: !this.ssh_enabled ? "any" : {
                    ...Config.Schema.ssh,
					required: this.ssh_enabled,
				},
                git: !this.git_enabled ? "any" : {
                    ...Config.Schema.git,
					required: this.git_enabled,
				},
			}
		})

		// Initialize sub objects.
		this.git = !this.git_enabled ? undefined : new Git({
			source: this.source.str(),
			username: this.config.git.username!,
			email: this.config.git.email!,
			version_path: this.config.version_path,
		});
		this.npm = !this.npm_enabled ? undefined : new NPM({
			source: this.source.str(),
            pkg_path: this.config.npm?.path,
			version_path: this.config.version_path,
		});
		this.ssh = !this.ssh_enabled ? undefined : new SSH({
			source: this.source.str(),
		});
	}
    assert_init(): asserts this is { config: Config } {
        if (!this.config) {
            throw new Error(`VRepo configuration file "${this.config_path.str()}" is not initialized.`);
        }
    }

	// Save config files.
	save() {
		this.source.join(".vrepo").save_sync(JSON.stringify(this.config, null, 4));
		if (this.npm) {
			this.npm.save();
		}
	}
}

/** Generate the JSON schema's for the fields. */
if (process.argv.includes("--vlib-generate-schemas")) {
    const __root = import.meta.dirname.split("vlib/ts/")[0] + "/vlib/ts/";
    Schema.create_json_schema_sync({
        unknown: false,
        output: `${__root}assets/schemas/vrepo.json`,
        schema: Config.Schema,
    });
    log(`Generated JSON schema 'vrepo.json' at '${__root}assets/schemas/vrepo.json'`);
}