/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, Schema } from "../vlib/index.js";
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
    };
}
export declare namespace RepoConfig {
    /**
     * A generic scheme for generating the JSON schema for the repo configuration file.
     */
    const Schema: {
        readonly version_path: {
            readonly type: "string";
            readonly required: false;
        };
        readonly ssh: {
            readonly type: "object";
            readonly required: false;
            readonly schema: {
                readonly remotes: {
                    readonly type: "array";
                    readonly default: readonly [];
                    readonly value_schema: {
                        readonly type: "object";
                        readonly schema: {
                            readonly alias: "string";
                            readonly destination: "string";
                            readonly enabled: {
                                readonly type: "boolean";
                                readonly default: true;
                            };
                        };
                    };
                };
            };
        };
        readonly git: {
            readonly type: "object";
            readonly required: false;
            readonly schema: {
                readonly username: "string";
                readonly email: "string";
                readonly remotes: {
                    readonly type: "array";
                    readonly default: readonly [];
                    readonly value_schema: {
                        readonly type: "object";
                        readonly schema: {
                            readonly remote: "string";
                            readonly branch: "string";
                            readonly destination: "string";
                            readonly enabled: {
                                readonly type: "boolean";
                                readonly default: true;
                            };
                        };
                    };
                };
            };
        };
        readonly npm: {
            readonly type: "object";
            readonly required: false;
            readonly schema: {
                readonly links: {
                    readonly type: "object";
                    readonly required: false;
                    readonly value_scheme: {
                        readonly type: "array";
                        readonly value_scheme: "string";
                    };
                };
            };
        };
    };
}
export declare class Repo {
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
    static validator: Schema.Validator<any[] | Record<string, any>, true, {
        readonly source: "string";
        readonly git: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly ssh: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly npm: {
            readonly type: "boolean";
            readonly default: true;
        };
    }, any, any[]>;
    static find_config_path(cwd?: string): Path | undefined;
    constructor({ source, git, // git enabled.
    ssh, // ssh enabled.
    npm, }: {
        source: string;
        git?: boolean;
        ssh?: boolean;
        npm?: boolean;
    });
    init(): Promise<void>;
    assert_init(): asserts this is {
        config: RepoConfig;
    };
    save(): void;
}
