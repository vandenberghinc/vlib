/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, Scheme } from "../../index.js";
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
    static validator: Scheme.Validator<object, object, "object">;
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
