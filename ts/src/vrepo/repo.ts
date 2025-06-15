/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */


// Imports.
import { Path, CLI, log, Schema } from "@vlib"
import { Git } from "./git.js";
import { NPM } from "./npm.js";
import { SSH } from "./ssh.js";

export interface RepoConfig {
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
        /** Developer links from npm link ... */
        links?: Record<string, string[]>;
    }
}
export namespace RepoConfig {
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
                links: {
                    type: 'object',
                    required: false,
                    value_scheme: { type: 'array', value_scheme: 'string' },
                },
            },
        }
    } as const satisfies Schema.Entries.Opts;
}

// Repo class.
export class Repo {

    // Attributes.
    source: Path;
    name: string;
    git_enabled: boolean;
    ssh_enabled: boolean;
    npm_enabled: boolean;
    config_path: Path;
    config?: RepoConfig;
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
        Repo.validator.validate(arguments[0]);

        // Attributes.
        this.git_enabled = git;
        this.ssh_enabled = ssh;
        this.npm_enabled = npm;

        const path = new Path(source);
        if (!path.exists()) {
            throw new Error(`Source path "${path.str()}" does not exist.`);
        }
        if (path.is_dir()) {
            this.source = path;
            const found = Repo.find_config_path();
            if (!found) {
                throw new Error(`Source path "${path.str()}" does not contain a "vtest.json" like configuration file.`);
            }
            this.config_path = found;
        } else {
            const b = path.base();
            if (!b) {
                throw new Error(`Source path "${path.str()}" is not a directory or does not have a base name.`);
            }
            this.source = b;
            this.config_path = path;
        }

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
                ...RepoConfig.Schema,
                version_path: {
                    ...RepoConfig.Schema.version_path,
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
                    ...RepoConfig.Schema.ssh,
					required: this.ssh_enabled,
				},
                git: !this.git_enabled ? "any" : {
                    ...RepoConfig.Schema.git,
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
			version_path: this.config.version_path,
		});
		this.ssh = !this.ssh_enabled ? undefined : new SSH({
			source: this.source.str(),
		});
	}
    assert_init(): asserts this is { config: RepoConfig } {
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
const __root = import.meta.dirname.split("vlib/ts/")[0] + "/vlib/ts/";
if (process.argv.includes("--vlib-generate-schemas")) {
    Schema.create_json_schema_sync({
        unknown: false,
        output: `${__root}assets/schemas/vrepo.json`,
        schema: RepoConfig.Schema,
    });
    log(`Generated JSON schema 'vrepo.json' at '${__root}assets/schemas/vrepo.json'`);
}