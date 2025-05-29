/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
// Imports.
import { Path, Scheme } from "../../index.js";
import { Git } from "./git.js";
import { NPM } from "./npm.js";
import { SSH } from "./ssh.js";
// Repo class.
export class Repo {
    // Attributes.
    source;
    name;
    git_enabled;
    ssh_enabled;
    npm_enabled;
    config_path;
    config;
    git;
    ssh;
    npm;
    // Constructor.
    constructor({ source, git = true, // git enabled.
    ssh = true, // ssh enabled.
    npm = true, // npm enabled.
     }) {
        // Verify arguments.
        Scheme.verify({
            object: arguments[0],
            strict: true,
            scheme: {
                source: "string",
                git: { type: "boolean", default: true },
                ssh: { type: "boolean", default: true },
                npm: { type: "boolean", default: true },
            },
        });
        // Attributes.
        this.source = new Path(source);
        this.name = this.source.full_name();
        this.git_enabled = git;
        this.ssh_enabled = ssh;
        this.npm_enabled = npm;
        // Load the config file.
        this.config_path = this.source.join(".vrepo");
    }
    async init() {
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
            };
            await this.config_path.save(JSON.stringify(this.config, null, 4));
        }
        else {
            try {
                this.config = await this.config_path.load({ type: "jsonc" });
            }
            catch (e) {
                e.message = `${this.config_path.abs().str()}: ${e.message}`;
                throw e;
            }
        }
        this.assert_init();
        Scheme.verify({
            object: this.config,
            error_prefix: `${this.config_path.str()}: Invalid vrepo configuration file. `,
            strict: true,
            scheme: {
                version_path: {
                    type: 'string',
                    required: false,
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
                ssh: {
                    type: "object",
                    required: this.ssh_enabled,
                    scheme: {
                        remotes: {
                            type: "array",
                            default: [],
                            value_scheme: {
                                type: "object",
                                scheme: {
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
                    required: this.git_enabled,
                    scheme: {
                        username: "string",
                        email: "string",
                        remotes: {
                            type: "array",
                            default: [],
                            value_scheme: {
                                type: "object",
                                scheme: {
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
                    scheme: {
                        links: {
                            type: 'object',
                            required: false,
                            value_scheme: { type: 'array', value_scheme: 'string' },
                        },
                    },
                }
            }
        });
        // Initialize sub objects.
        this.git = !this.git_enabled ? undefined : new Git({
            source: this.source.str(),
            username: this.config.git.username,
            email: this.config.git.email,
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
    assert_init() {
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
//# sourceMappingURL=repo.js.map